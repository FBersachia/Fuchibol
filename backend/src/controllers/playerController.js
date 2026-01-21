const { Player, User } = require('../models');

async function listPlayers(req, res, next) {
  try {
    const players = await Player.findAll({
      where: { group_id: req.group.id, deleted_at: null },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['name', 'ASC'], ['id', 'ASC']],
    });
    return res.json(players);
  } catch (err) {
    return next(err);
  }
}

async function createPlayer(req, res, next) {
  try {
    const { name, gender, elo, initial_elo, is_goalkeeper, user_id } = req.body;
    if (!name || elo === undefined) {
      return res.status(400).json({ error: 'name and elo are required' });
    }

    const nextElo = Number(elo);
    if (Number.isNaN(nextElo) || nextElo < 300 || nextElo > 1000) {
      return res.status(400).json({ error: 'elo must be between 300 and 1000' });
    }
    if (initial_elo !== undefined) {
      const nextInitial = Number(initial_elo);
      if (Number.isNaN(nextInitial) || nextInitial < 300 || nextInitial > 1000) {
        return res.status(400).json({ error: 'initial_elo must be between 300 and 1000' });
      }
    }

    const activeCount = await Player.count({
      where: { group_id: req.group.id, deleted_at: null },
    });
    if (activeCount >= 30) {
      return res.status(400).json({ error: 'Group player limit reached (30)' });
    }

    const existingNickname = await Player.findOne({
      where: { group_id: req.group.id, name, deleted_at: null },
    });
    if (existingNickname) {
      return res.status(409).json({ error: 'Nickname already in use for this group' });
    }

    let resolvedGender = gender;
    if (user_id) {
      const existingUser = await User.findByPk(user_id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const existingPlayer = await Player.findOne({
        where: { group_id: req.group.id, user_id, deleted_at: null },
      });
      if (existingPlayer) {
        return res.status(409).json({ error: 'User already has a player in this group' });
      }
      if (!existingUser.gender) {
        if (!gender) {
          return res.status(400).json({ error: 'gender is required for this user' });
        }
        existingUser.gender = gender;
        await existingUser.save();
      }
      resolvedGender = existingUser.gender;
    } else if (!gender) {
      return res.status(400).json({ error: 'gender is required' });
    }

    const player = await Player.create({
      name,
      gender: resolvedGender,
      elo: nextElo,
      initial_elo: initial_elo !== undefined ? Number(initial_elo) : undefined,
      is_goalkeeper: Boolean(is_goalkeeper),
      user_id: user_id || null,
      group_id: req.group.id,
    });

    return res.status(201).json(player);
  } catch (err) {
    return next(err);
  }
}

async function updatePlayer(req, res, next) {
  try {
    const { id } = req.params;
    const { name, gender, elo, initial_elo, is_goalkeeper, wins, losses, user_id } = req.body;

    const player = await Player.findOne({
      where: { id, group_id: req.group.id, deleted_at: null },
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (name !== undefined) {
      const existingNickname = await Player.findOne({
        where: { group_id: req.group.id, name, deleted_at: null },
      });
      if (existingNickname && existingNickname.id !== player.id) {
        return res.status(409).json({ error: 'Nickname already in use for this group' });
      }
      player.name = name;
    }
    if (gender !== undefined) {
      if (player.user_id) {
        if (gender !== player.gender) {
          return res.status(400).json({ error: 'gender is managed by the user profile' });
        }
      } else {
        player.gender = gender;
      }
    }
    if (elo !== undefined) {
      const nextElo = Number(elo);
      if (Number.isNaN(nextElo) || nextElo < 300 || nextElo > 1000) {
        return res.status(400).json({ error: 'elo must be between 300 and 1000' });
      }
      player.elo = nextElo;
    }
    if (initial_elo !== undefined) {
      const nextInitial = Number(initial_elo);
      if (Number.isNaN(nextInitial) || nextInitial < 300 || nextInitial > 1000) {
        return res.status(400).json({ error: 'initial_elo must be between 300 and 1000' });
      }
      player.initial_elo = nextInitial;
    }
    if (is_goalkeeper !== undefined) player.is_goalkeeper = Boolean(is_goalkeeper);
    if (wins !== undefined) player.wins = wins;
    if (losses !== undefined) player.losses = losses;
    if (user_id !== undefined) {
      if (user_id === null) {
        player.user_id = null;
      } else {
        const existingUser = await User.findByPk(user_id);
        if (!existingUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        if (!existingUser.gender) {
          return res.status(400).json({ error: 'User must have gender set' });
        }
        const existingPlayer = await Player.findOne({
          where: { group_id: req.group.id, user_id, deleted_at: null },
        });
        if (existingPlayer && existingPlayer.id !== player.id) {
          return res.status(409).json({ error: 'User already has a player in this group' });
        }
        player.gender = existingUser.gender;
        player.user_id = user_id;
      }
    }

    await player.save();

    return res.json(player);
  } catch (err) {
    return next(err);
  }
}

async function deletePlayer(req, res, next) {
  try {
    const { id } = req.params;
    const player = await Player.findOne({
      where: { id, group_id: req.group.id, deleted_at: null },
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    player.deleted_at = new Date();
    await player.save();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
