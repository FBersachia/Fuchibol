const { Match, Team, Player, MatchResult, Distinction } = require('../models');

async function getPlayerMatches(req, res, next) {
  try {
    const { id } = req.params;

    const matches = await Match.findAll({
      include: [
        {
          model: Team,
          include: [
            {
              model: Player,
              where: { id },
              required: true,
            },
            { model: Player },
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
