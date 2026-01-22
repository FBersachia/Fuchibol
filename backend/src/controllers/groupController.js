const { Op } = require('sequelize');
const { Group, GroupMember, GroupInvite, Player, AppConfig, User } = require('../models');

const RESERVED_SLUGS = new Set([
  'admin',
  'login',
  'logout',
  'signup',
  'register',
  'auth',
  'api',
  'health',
  'status',
  'me',
  'users',
  'user',
  'groups',
  'group',
  'matches',
  'match',
  'players',
  'player',
  'teams',
  'team',
  'config',
  'ranking',
  'social',
  'export',
  'courts',
  'court',
  'invite',
  'invitations',
]);

const PREMIUM_ADMIN_EMAILS = new Set(
  [
    'fbersachia@gmail.com',
    ...(process.env.PREMIUM_ADMIN_EMAILS || '').split(','),
  ]
    .map((email) => String(email).trim().toLowerCase())
    .filter(Boolean)
);

const PREMIUM_ADMIN_USER_IDS = new Set(
  (process.env.PREMIUM_ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
);

function isValidSlug(slug) {
  if (!slug) return false;
  if (slug.length > 40) return false;
  if (!/^[a-z0-9]+$/.test(slug)) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);
}

async function canManageMultipleGroups(userId) {
  if (PREMIUM_ADMIN_USER_IDS.has(Number(userId))) return true;
  const user = await User.findByPk(userId, { attributes: ['email'] });
  if (!user?.email) return false;
  return PREMIUM_ADMIN_EMAILS.has(String(user.email).trim().toLowerCase());
}

async function listGroups(req, res, next) {
  try {
    const allowMultipleGroups = await canManageMultipleGroups(req.user.id);
    const memberships = await GroupMember.findAll({
      where: { user_id: req.user.id, deleted_at: null },
      include: [{ model: Group, where: { deleted_at: null } }],
      order: [['id', 'ASC']],
    });

    const groups = memberships.map((m) => ({
      id: m.Group.id,
      name: m.Group.name,
      slug: m.Group.slug,
      role: m.role,
    }));

    return res.json({ groups, allow_multiple_groups: allowMultipleGroups });
  } catch (err) {
    return next(err);
  }
}

async function createGroup(req, res, next) {
  try {
    const { name, slug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const baseSlug =
      slug !== undefined && slug !== null && String(slug).trim() !== '' ? String(slug) : slugify(name);
    const normalizedSlug = baseSlug.trim().toLowerCase();
    if (!isValidSlug(normalizedSlug)) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const allowMultipleGroups = await canManageMultipleGroups(req.user.id);
    if (!allowMultipleGroups) {
      const existingAdmin = await GroupMember.findOne({
        where: { user_id: req.user.id, role: 'admin', deleted_at: null },
        include: [{ model: Group, where: { deleted_at: null } }],
      });
      if (existingAdmin) {
        return res.status(400).json({ error: 'User already manages a group' });
      }
    }

    const existingGroup = await Group.findOne({ where: { slug: normalizedSlug } });
    if (existingGroup) {
      return res.status(409).json({ error: 'Slug already in use' });
    }

    const group = await Group.create({ name, slug: normalizedSlug });
    await GroupMember.create({ group_id: group.id, user_id: req.user.id, role: 'admin' });
    await AppConfig.create({
      group_id: group.id,
      w_elo: 1.0,
      w_genero: 5.0,
      w_social: 0.5,
      gender_tolerance: 1,
      win_delta: 100,
      draw_delta: 0,
      loss_delta: -100,
      use_social_default: true,
    });

    return res.status(201).json({ id: group.id, name: group.name, slug: group.slug });
  } catch (err) {
    return next(err);
  }
}

async function updateGroup(req, res, next) {
  try {
    const { id } = req.params;
    if (Number(id) !== req.group.id) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const { name, slug } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) {
      const normalizedSlug = String(slug).trim().toLowerCase();
      if (!isValidSlug(normalizedSlug)) {
        return res.status(400).json({ error: 'Invalid slug' });
      }
      const existingGroup = await Group.findOne({
        where: { slug: normalizedSlug, id: { [Op.ne]: req.group.id } },
      });
      if (existingGroup) {
        return res.status(409).json({ error: 'Slug already in use' });
      }
      updates.slug = normalizedSlug;
    }

    const group = await Group.findByPk(req.group.id);
    if (!group || group.deleted_at) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await group.update(updates);

    return res.json({ id: group.id, name: group.name, slug: group.slug });
  } catch (err) {
    return next(err);
  }
}

async function deleteGroup(req, res, next) {
  try {
    const { id } = req.params;
    if (Number(id) !== req.group.id) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = await Group.findByPk(req.group.id);
    if (!group || group.deleted_at) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const now = new Date();
    await group.update({ deleted_at: now });

    await GroupMember.update({ deleted_at: now }, { where: { group_id: req.group.id, deleted_at: null } });
    await Player.update({ deleted_at: now }, { where: { group_id: req.group.id, deleted_at: null } });
    await GroupInvite.update({ revoked_at: now }, { where: { group_id: req.group.id, revoked_at: null } });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function listMembers(req, res, next) {
  try {
    const members = await GroupMember.findAll({
      where: { group_id: req.group.id, deleted_at: null },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'gender'] }],
      order: [['id', 'ASC']],
    });

    const result = members.map((m) => ({
      id: m.id,
      role: m.role,
      user: m.User,
    }));

    return res.json({ members: result });
  } catch (err) {
    return next(err);
  }
}

async function leaveGroup(req, res, next) {
  try {
    if (req.groupMember.role === 'admin') {
      return res.status(400).json({ error: 'Admin must transfer ownership before leaving' });
    }

    const now = new Date();
    await GroupMember.update(
      { deleted_at: now },
      { where: { group_id: req.group.id, user_id: req.user.id, deleted_at: null } }
    );
    await Player.update(
      { deleted_at: now },
      { where: { group_id: req.group.id, user_id: req.user.id, deleted_at: null } }
    );

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

async function transferAdmin(req, res, next) {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const member = await GroupMember.findOne({
      where: { group_id: req.group.id, user_id, deleted_at: null },
    });
    if (!member) {
      return res.status(404).json({ error: 'User is not a member of this group' });
    }

    if (member.role === 'admin') {
      return res.status(400).json({ error: 'User is already admin' });
    }

    await GroupMember.update(
      { role: 'member' },
      { where: { group_id: req.group.id, role: 'admin', deleted_at: null } }
    );
    await member.update({ role: 'admin' });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  listMembers,
  leaveGroup,
  transferAdmin,
};
