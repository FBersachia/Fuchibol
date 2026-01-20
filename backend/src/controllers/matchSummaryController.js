const { Op } = require('sequelize');
const { Match, Player, MatchResult } = require('../models');

function buildDateFilter(query) {
  const where = {};
  if (query.start_date) {
    where[Op.gte] = query.start_date;
  }
  if (query.end_date) {
    where[Op.lte] = query.end_date;
  }
  if (query.since_months) {
    const since = new Date();
    since.setMonth(since.getMonth() - Number(query.since_months));
    where[Op.gte] = since;
  }
  return Object.keys(where).length ? { match_date: where } : {};
}

async function getMatchesSummary(req, res, next) {
  try {
    const where = buildDateFilter(req.query);

    const totalMatches = await Match.count({ where });
    const completedMatches = await Match.count({ where: { ...where, status: 'completed' } });
    const pendingMatches = await Match.count({ where: { ...where, status: 'pending' } });
    const totalPlayers = await Player.count();
    const totalResults = await MatchResult.count();

    return res.json({
      filters: req.query,
      total_matches: totalMatches,
      completed_matches: completedMatches,
      pending_matches: pendingMatches,
      total_players: totalPlayers,
      total_results: totalResults,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMatchesSummary };
