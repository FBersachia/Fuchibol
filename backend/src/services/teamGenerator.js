const { Op } = require('sequelize');
const { Match, Team, TeamPlayer, Player, sequelize } = require('../models');
const { getConfig } = require('./configService');

function pairKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function combinations(items, k) {
  const result = [];
  const combo = [];

  function backtrack(start) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      combo.push(items[i]);
      backtrack(i + 1);
      combo.pop();
    }
  }

  backtrack(0);
  return result;
}

function scoreTeams(teamA, teamB, weights, pairCounts) {
  const totalEloA = teamA.reduce((sum, p) => sum + p.elo, 0);
  const totalEloB = teamB.reduce((sum, p) => sum + p.elo, 0);
  const diffElo = Math.abs(totalEloA - totalEloB) / (teamA.length + teamB.length);

  const femalesA = teamA.filter((p) => p.gender === 'm').length;
  const femalesB = teamB.filter((p) => p.gender === 'm').length;
  const diffGender = Math.abs(femalesA - femalesB);

  const socialA = teamSocialScore(teamA, pairCounts);
  const socialB = teamSocialScore(teamB, pairCounts);
  const social = socialA + socialB;

  const score = (weights.w_elo * diffElo) + (weights.w_genero * diffGender) + (weights.w_social * social);

  return { score, diffElo, diffGender, social };
}

function teamSocialScore(team, pairCounts) {
  let score = 0;
  for (let i = 0; i < team.length; i += 1) {
    for (let j = i + 1; j < team.length; j += 1) {
      const key = pairKey(team[i].id, team[j].id);
      score += pairCounts.get(key) || 0;
    }
  }
  return score;
}

async function buildPairCounts(playerIds) {
  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const matches = await Match.findAll({
    where: { match_date: { [Op.gte]: since } },
    include: [{ model: Team, include: [Player] }],
  });

  const targetSet = new Set(playerIds);
  const pairCounts = new Map();

  for (const match of matches) {
    for (const team of match.Teams || []) {
      const teamPlayers = (team.Players || []).filter((p) => targetSet.has(p.id));
      for (let i = 0; i < teamPlayers.length; i += 1) {
        for (let j = i + 1; j < teamPlayers.length; j += 1) {
          const key = pairKey(teamPlayers[i].id, teamPlayers[j].id);
          pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  return pairCounts;
}

function hasValidGoalkeepers(teamA, teamB) {
  const gkA = teamA.filter((p) => p.is_goalkeeper).length;
  const gkB = teamB.filter((p) => p.is_goalkeeper).length;
  const totalGk = gkA + gkB;

  if (totalGk >= 2) {
    return gkA === 1 && gkB === 1;
  }

  return true;
}

function genderOk(teamA, teamB, tolerance) {
  const femalesA = teamA.filter((p) => p.gender === 'm').length;
  const femalesB = teamB.filter((p) => p.gender === 'm').length;
  return Math.abs(femalesA - femalesB) <= tolerance;
}

async function computeBestTeams(players, playerIds, options = {}) {
  const config = await getConfig();
  const weights = {
    w_elo: options.w_elo ?? config.w_elo ?? 1.0,
    w_genero: options.w_genero ?? config.w_genero ?? 5.0,
    w_social: options.w_social ?? config.w_social ?? 0.5,
  };

  const useSocial = options.use_social !== undefined ? options.use_social : config.use_social_default;
  const pairCounts = useSocial ? await buildPairCounts(playerIds) : new Map();
  const tolerance = options.gender_tolerance ?? config.gender_tolerance ?? 1;

  const half = playerIds.length / 2;
  const combos = combinations(players, half);

  let best = null;
  let bestMeta = null;
  let usedStrictGender = true;

  for (const teamA of combos) {
    const teamAIds = new Set(teamA.map((p) => p.id));
    if (teamAIds.size !== teamA.length) continue;

    const teamB = players.filter((p) => !teamAIds.has(p.id));
    if (teamB.length !== half) continue;

    if (!hasValidGoalkeepers(teamA, teamB)) continue;

    if (usedStrictGender && !genderOk(teamA, teamB, tolerance)) continue;

    const scored = scoreTeams(teamA, teamB, weights, pairCounts);

    if (!best || scored.score < bestMeta.score) {
      best = { teamA, teamB };
      bestMeta = scored;
    }
  }

  if (!best) {
    usedStrictGender = false;
    for (const teamA of combos) {
      const teamAIds = new Set(teamA.map((p) => p.id));
      const teamB = players.filter((p) => !teamAIds.has(p.id));
      if (!hasValidGoalkeepers(teamA, teamB)) continue;
      const scored = scoreTeams(teamA, teamB, weights, pairCounts);
      if (!best || scored.score < bestMeta.score) {
        best = { teamA, teamB };
        bestMeta = scored;
      }
    }
  }

  return { best, bestMeta, usedStrictGender, weights };
}

async function previewTeams(playerIds, options = {}) {
  if (!Array.isArray(playerIds) || playerIds.length < 2 || playerIds.length % 2 !== 0) {
    return { error: { status: 400, message: 'player_ids must be an even-length array' } };
  }

  const players = await Player.findAll({ where: { id: playerIds } });
  if (players.length !== playerIds.length) {
    return { error: { status: 400, message: 'Invalid player_ids' } };
  }

  const { best, bestMeta, usedStrictGender } = await computeBestTeams(players, playerIds, options);

  if (!best) {
    return { error: { status: 400, message: 'Unable to generate teams' } };
  }

  const teamAName = options.teamA_name || 'Equipo A';
  const teamBName = options.teamB_name || 'Equipo B';

  return {
    match_id: null,
    teamA: {
      id: null,
      name: teamAName,
      players: best.teamA.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
    },
    teamB: {
      id: null,
      name: teamBName,
      players: best.teamB.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
    },
    meta: {
      used_strict_gender: usedStrictGender,
      diff_elo: bestMeta.diffElo,
      diff_gender: bestMeta.diffGender,
      social_score: bestMeta.social,
      preview: true,
    },
  };
}

async function generateTeams(matchId, playerIds, options = {}) {
  if (!Array.isArray(playerIds) || playerIds.length < 2 || playerIds.length % 2 !== 0) {
    return { error: { status: 400, message: 'player_ids must be an even-length array' } };
  }

  const match = await Match.findByPk(matchId);
  if (!match) return { error: { status: 404, message: 'Match not found' } };

  const existingTeams = await Team.count({ where: { match_id: matchId } });
  if (existingTeams > 0) {
    return { error: { status: 409, message: 'Teams already exist for match' } };
  }

  const players = await Player.findAll({ where: { id: playerIds } });
  if (players.length !== playerIds.length) {
    return { error: { status: 400, message: 'Invalid player_ids' } };
  }

  const { best, bestMeta, usedStrictGender } = await computeBestTeams(players, playerIds, options);

  if (!best) {
    return { error: { status: 400, message: 'Unable to generate teams' } };
  }

  const teamAName = options.teamA_name || 'Equipo A';
  const teamBName = options.teamB_name || 'Equipo B';
  const previewOnly = Boolean(options.preview);

  if (previewOnly) {
    return {
      match_id: matchId,
      teamA: {
        id: null,
        name: teamAName,
        players: best.teamA.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
      },
      teamB: {
        id: null,
        name: teamBName,
        players: best.teamB.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
      },
      meta: {
        used_strict_gender: usedStrictGender,
        diff_elo: bestMeta.diffElo,
        diff_gender: bestMeta.diffGender,
        social_score: bestMeta.social,
        preview: true,
      },
    };
  }

  const result = await sequelize.transaction(async (t) => {
    const teamA = await Team.create({ match_id: matchId, name: teamAName }, { transaction: t });
    const teamB = await Team.create({ match_id: matchId, name: teamBName }, { transaction: t });

    const rows = [
      ...best.teamA.map((p) => ({ team_id: teamA.id, player_id: p.id })),
      ...best.teamB.map((p) => ({ team_id: teamB.id, player_id: p.id })),
    ];

    await TeamPlayer.bulkCreate(rows, { transaction: t });

    return { teamA, teamB };
  });

  return {
    match_id: matchId,
    teamA: {
      id: result.teamA.id,
      name: teamAName,
      players: best.teamA.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
    },
    teamB: {
      id: result.teamB.id,
      name: teamBName,
      players: best.teamB.map((p) => ({ id: p.id, name: p.name, elo: p.elo })),
    },
    meta: {
      used_strict_gender: usedStrictGender,
      diff_elo: bestMeta.diffElo,
      diff_gender: bestMeta.diffGender,
      social_score: bestMeta.social,
      preview: false,
    },
  };
}

module.exports = { generateTeams, previewTeams };
