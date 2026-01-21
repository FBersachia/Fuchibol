const { Match, Team, Player, MatchResult, Distinction } = require('../models');

async function getPlayerMatches(req, res, next) {
  try {
    const { id } = req.params;

    const matches = await Match.findAll({
      where: { group_id: req.group.id },
      include: [
        {
          model: Team,
          include: [
            {
              model: Player,
              where: { id, group_id: req.group.id, deleted_at: null },
              required: true,
            },
            { model: Player, where: { group_id: req.group.id, deleted_at: null }, required: false },
          ],
        },
        { model: MatchResult },
        { model: Distinction },
      ],
      order: [['match_date', 'DESC'], ['id', 'DESC']],
    });

    return res.json({ player_id: Number(id), matches });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getPlayerMatches };
