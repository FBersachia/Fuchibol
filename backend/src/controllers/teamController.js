const { Team, TeamPlayer, Player, Match, sequelize } = require('../models');

function uniqueIds(ids) {
  return Array.from(new Set(ids));
}

async function listTeams(req, res, next) {
  try {
    const { match_id } = req.query;
    const where = { group_id: req.group.id };
    if (match_id) where.match_id = match_id;

    const teams = await Team.findAll({ where, order: [['id', 'ASC']] });
    return res.json(teams);
  } catch (err) {
    return next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const { match_id, name, players } = req.body;
    if (!match_id || !name || !Array.isArray(players)) {
      return res.status(400).json({ error: 'match_id, name, and players are required' });
    }

    const playerIds = uniqueIds(players);
    if (playerIds.length !== players.length) {
      return res.status(400).json({ error: 'Duplicate players in team' });
    }

    const match = await Match.findOne({ where: { id: match_id, group_id: req.group.id } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const existingPlayers = await Player.findAll({
      where: { id: playerIds, group_id: req.group.id, deleted_at: null },
    });
    if (existingPlayers.length !== playerIds.length) {
      return res.status(400).json({ error: 'Invalid player ids' });
    }

    const result = await sequelize.transaction(async (t) => {
      const team = await Team.create({ match_id, name, group_id: req.group.id }, { transaction: t });
      const rows = playerIds.map((player_id) => ({
        team_id: team.id,
        player_id,
        group_id: req.group.id,
      }));
      await TeamPlayer.bulkCreate(rows, { transaction: t });
      return team;
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const { name, players } = req.body;

    const team = await Team.findOne({ where: { id, group_id: req.group.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const result = await sequelize.transaction(async (t) => {
      if (name !== undefined) team.name = name;
      await team.save({ transaction: t });

      if (Array.isArray(players)) {
        const playerIds = uniqueIds(players);
        if (playerIds.length !== players.length) {
          return { error: { status: 400, message: 'Duplicate players in team' } };
        }

        const existingPlayers = await Player.findAll({
          where: { id: playerIds, group_id: req.group.id, deleted_at: null },
          transaction: t,
        });
        if (existingPlayers.length !== playerIds.length) {
          return { error: { status: 400, message: 'Invalid player ids' } };
        }

        await TeamPlayer.destroy({ where: { team_id: team.id }, transaction: t });
        const rows = playerIds.map((player_id) => ({
          team_id: team.id,
          player_id,
          group_id: req.group.id,
        }));
        await TeamPlayer.bulkCreate(rows, { transaction: t });
      }

      return { team };
    });

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    return res.json(team);
  } catch (err) {
    return next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findOne({ where: { id, group_id: req.group.id } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await sequelize.transaction(async (t) => {
      await TeamPlayer.destroy({ where: { team_id: team.id }, transaction: t });
      await team.destroy({ transaction: t });
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
};
