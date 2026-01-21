const crypto = require('crypto');
const { Op } = require('sequelize');
const { GroupInvite, Group, GroupMember, Player, User } = require('../models');

const INVITE_TTL_HOURS = 4;
const GENERAL_MAX_USES = 30;

function buildInviteUrl(slug, token) {
  return `/invites/${slug}/${token}/join`;
}

function buildExpiresAt() {
  const now = new Date();
  return new Date(now.getTime() + INVITE_TTL_HOURS * 60 * 60 * 1000);
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function createGeneralInvite(req, res, next) {
  try {
    const now = new Date();
    await GroupInvite.update(
      { revoked_at: now },
      { where: { group_id: req.group.id, type: 'general', revoked_at: null } }
    );

    const invite = await GroupInvite.create({
      group_id: req.group.id,
      token: generateToken(),
      type: 'general',
      expires_at: buildExpiresAt(),
      max_uses: GENERAL_MAX_USES,
      used_count: 0,
      created_by: req.user.id,
    });

    return res.status(201).json({
      id: invite.id,
      token: invite.token,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
      used_count: invite.used_count,
      url: buildInviteUrl(req.group.slug, invite.token),
    });
  } catch (err) {
    return next(err);
  }
}

async function createSpecificInvite(req, res, next) {
  try {
    const { player_id, regenerate } = req.body;
    if (!player_id) {
      return res.status(400).json({ error: 'player_id is required' });
    }

    const player = await Player.findOne({
      where: { id: player_id, group_id: req.group.id },
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (regenerate) {
      const now = new Date();
      await GroupInvite.update(
        { revoked_at: now },
        {
          where: {
            group_id: req.group.id,
            type: 'specific',
            player_id: player.id,
            revoked_at: null,
          },
        }
      );
    }

    const invite = await GroupInvite.create({
      group_id: req.group.id,
      player_id: player.id,
      token: generateToken(),
      type: 'specific',
      expires_at: buildExpiresAt(),
      max_uses: 1,
      used_count: 0,
      created_by: req.user.id,
    });

    return res.status(201).json({
      id: invite.id,
      token: invite.token,
      expires_at: invite.expires_at,
      max_uses: invite.max_uses,
      used_count: invite.used_count,
      url: buildInviteUrl(req.group.slug, invite.token),
    });
  } catch (err) {
    return next(err);
  }
}

async function joinByInvite(req, res, next) {
  try {
    const { slug, token } = req.params;
    const { email, password, nickname, gender, elo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const invite = await GroupInvite.findOne({
      where: { token, revoked_at: null },
      include: [{ model: Group }],
    });
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (!invite.Group || invite.Group.deleted_at) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (invite.Group.slug !== slug) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const now = new Date();
    if (invite.expires_at <= now) {
      return res.status(410).json({ error: 'Invite expired' });
    }

    if (invite.used_count >= invite.max_uses) {
      return res.status(400).json({ error: 'Invite usage limit reached' });
    }

    const activePlayers = await Player.count({
      where: { group_id: invite.group_id, deleted_at: null },
    });

    let user = await User.findOne({ where: { email } });
    if (user) {
      const bcrypt = require('bcryptjs');
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!user.gender) {
        if (gender) {
          user.gender = gender;
          await user.save();
        } else if (invite.type !== 'specific') {
          return res.status(400).json({ error: 'gender is required' });
        }
      }
    } else {
      if (!gender) {
        return res.status(400).json({ error: 'gender is required' });
      }
      const bcrypt = require('bcryptjs');
      const password_hash = await bcrypt.hash(password, 10);
      user = await User.create({
        name: nickname || email,
        email,
        password_hash,
        gender,
        role: 'user',
      });
    }

    async function ensureMembership() {
      const membership = await GroupMember.findOne({
        where: { group_id: invite.group_id, user_id: user.id, deleted_at: null },
      });

      if (!membership) {
        const deletedMembership = await GroupMember.findOne({
          where: { group_id: invite.group_id, user_id: user.id, deleted_at: { [Op.ne]: null } },
        });
        if (deletedMembership) {
          await deletedMembership.update({ deleted_at: null });
        } else {
          await GroupMember.create({ group_id: invite.group_id, user_id: user.id, role: 'member' });
        }
      }
    }

    let player = null;
    if (invite.type === 'general') {
      const existingPlayer = await Player.findOne({
        where: { group_id: invite.group_id, user_id: user.id },
      });
      if (existingPlayer && !existingPlayer.deleted_at) {
        await ensureMembership();
        return res.json({
          group_id: invite.group_id,
          player_id: existingPlayer.id,
          user_id: user.id,
        });
      }

      if (!existingPlayer && !nickname) {
        return res.status(400).json({ error: 'nickname is required' });
      }

      if (activePlayers >= GENERAL_MAX_USES) {
        return res.status(400).json({ error: 'Group player limit reached (30)' });
      }

      if (!existingPlayer) {
        const existingNickname = await Player.findOne({
          where: { group_id: invite.group_id, name: nickname, deleted_at: null },
        });
        if (existingNickname) {
          return res.status(409).json({ error: 'Nickname already in use for this group' });
        }
      }

      const initialElo = elo === undefined ? 500 : Number(elo);
      if (Number.isNaN(initialElo) || initialElo < 300 || initialElo > 1000) {
        return res.status(400).json({ error: 'elo must be between 300 and 1000' });
      }

      if (existingPlayer && existingPlayer.deleted_at) {
        await existingPlayer.update({ deleted_at: null });
        player = existingPlayer;
      } else {
        player = await Player.create({
          name: nickname,
          gender: user.gender,
          elo: initialElo,
          initial_elo: initialElo,
          is_goalkeeper: false,
          wins: 0,
          losses: 0,
          user_id: user.id,
          group_id: invite.group_id,
        });
      }

      await ensureMembership();
    } else {
      player = await Player.findOne({
        where: { id: invite.player_id, group_id: invite.group_id },
      });
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (player.user_id && player.user_id !== user.id) {
        return res.status(409).json({ error: 'Player already linked to another user' });
      }

      if (player.deleted_at) {
        if (activePlayers >= GENERAL_MAX_USES) {
          return res.status(400).json({ error: 'Group player limit reached (30)' });
        }
        await player.update({ deleted_at: null });
      }

      if (!user.gender && player.gender) {
        user.gender = player.gender;
        await user.save();
      }

      if (user.gender) {
        player.gender = user.gender;
      }

      player.user_id = user.id;
      await player.save();

      await ensureMembership();
    }

    invite.used_count += 1;
    await invite.save();

    return res.json({
      group_id: invite.group_id,
      player_id: player ? player.id : null,
      user_id: user.id,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createGeneralInvite,
  createSpecificInvite,
  joinByInvite,
};
