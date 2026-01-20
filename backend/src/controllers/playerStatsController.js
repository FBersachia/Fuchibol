const { Player, EloHistory, Distinction } = require('../models');

async function getPlayerStats(req, res, next) {
  try {
    const { id } = req.params;
    const player = await Player.findByPk(id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const matchesPlayed = await EloHistory.count({ where: { player_id: id } });
    const mvpCount = await Distinction.count({ where: { player_id: id, type: 'mvp' } });

    const distinctions = await Distinction.findAll({ where: { player_id: id } });
    const byType = distinctions.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      player_id: player.id,
      elo: player.elo,
      wins: player.wins,
      losses: player.losses,
      matches_played: matchesPlayed,
      mvp_count: mvpCount,
      distinctions: byType,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPlayerStats };
