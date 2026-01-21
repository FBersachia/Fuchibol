const { Op } = require('sequelize');
const { Match, Team, Player } = require('../models');

function pairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

async function getSocialPairs(req, res, next) {
  try {
    const { since_months = 12 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - Number(since_months));

    const matches = await Match.findAll({
      where: { match_date: { [Op.gte]: since }, group_id: req.group.id },
      include: [{ model: Team, include: [{ model: Player, where: { deleted_at: null }, required: false }] }],
    });

    const counts = new Map();

    for (const match of matches) {
      for (const team of match.Teams || []) {
        const teamPlayers = team.Players || [];
        for (let i = 0; i < teamPlayers.length; i += 1) {
          for (let j = i + 1; j < teamPlayers.length; j += 1) {
            const key = pairKey(teamPlayers[i].id, teamPlayers[j].id);
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        }
      }
    }

    const result = [];
    for (const [key, count] of counts.entries()) {
      const [a, b] = key.split('-').map(Number);
      result.push({ player_a: a, player_b: b, times: count });
    }

    result.sort((x, y) => y.times - x.times);

    return res.json({ since_months: Number(since_months), pairs: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSocialPairs };
