const { Player, User } = require('../models');

async function listPlayers(_req, res, next) {
  try {
    const players = await Player.findAll({
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
    if (!name || !gender || elo === undefined) {
      return res.status(400).json({ error: 'name, gender, and elo are required' });
    }

    if (Number(elo) < 100) {
      return res.status(400).json({ error: 'elo must be at least 100' });
    }
    if (initial_elo !== undefined && Number(initial_elo) < 100) {
      return res.status(400).json({ error: 'initial_elo must be at least 100' });
    }
    if (user_id) {
      const existingUser = await User.findByPk(user_id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const player = await Player.create({
      name,
      gender,
      elo,
      initial_elo,
      is_goalkeeper: Boolean(is_goalkeeper),
      user_id: user_id || null,
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

    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (name !== undefined) player.name = name;
    if (gender !== undefined) player.gender = gender;
    if (elo !== undefined) {
      if (Number(elo) < 100) {
        return res.status(400).json({ error: 'elo must be at least 100' });
      }
      player.elo = elo;
    }
    if (initial_elo !== undefined) {
      if (Number(initial_elo) < 100) {
        return res.status(400).json({ error: 'initial_elo must be at least 100' });
      }
      player.initial_elo = initial_elo;
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
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await player.destroy();
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
