const { Player, EloHistory, Match } = require('../models');

async function getPlayerEloHistory(req, res, next) {
  try {
    const { id } = req.params;
    const player = await Player.findOne({
      where: { id, group_id: req.group.id, deleted_at: null },
    });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const history = await EloHistory.findAll({
      where: { player_id: id, group_id: req.group.id },
      include: [{ model: Match, where: { group_id: req.group.id } }],
      order: [[Match, 'match_date', 'ASC'], ['id', 'ASC']],
    });

    return res.json({
      player_id: player.id,
      current_elo: player.elo,
      history,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPlayerEloHistory };
