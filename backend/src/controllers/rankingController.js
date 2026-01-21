const { Player, Distinction } = require('../models');

async function getRanking(req, res, next) {
  try {
    const { limit = 20 } = req.query;
    const players = await Player.findAll({
      where: { group_id: req.group.id, deleted_at: null },
      order: [['elo', 'DESC'], ['id', 'ASC']],
      limit: Number(limit),
    });

    const playerIds = players.map((p) => p.id);
    const distinctions = await Distinction.findAll({
      where: { player_id: playerIds, group_id: req.group.id },
    });

    const byPlayer = distinctions.reduce((acc, item) => {
      acc[item.player_id] = acc[item.player_id] || {};
      acc[item.player_id][item.type] = (acc[item.player_id][item.type] || 0) + 1;
      return acc;
    }, {});

    const ranking = players.map((p) => ({
      id: p.id,
      name: p.name,
      elo: p.elo,
      wins: p.wins,
      losses: p.losses,
      distinctions: byPlayer[p.id] || {},
    }));

    return res.json({ limit: Number(limit), ranking });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getRanking };
