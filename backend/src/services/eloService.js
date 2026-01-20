const { Match, Team, Player, MatchResult, EloHistory, Distinction, sequelize } = require('../models');
const { getConfig } = require('./configService');

const DEFAULT_WIN = 1;
const DEFAULT_DRAW = 0;
const DEFAULT_LOSS = -1;
const MVP_BONUS = 100;
const MIN_ELO = 100;

function buildTeamPlayers(match) {
  const teams = match.Teams || [];
  const map = new Map();
  for (const team of teams) {
    const players = (team.Players || []).map((p) => p.id);
    map.set(team.id, players);
  }
  return map;
}

async function recalcAllElo() {
  return sequelize.transaction(async (t) => {
    const config = await getConfig();
    const winDelta = config.win_delta ?? DEFAULT_WIN;
    const drawDelta = config.draw_delta ?? DEFAULT_DRAW;
    const lossDelta = config.loss_delta ?? DEFAULT_LOSS;

    const players = await Player.findAll({ transaction: t });
    const playerElo = new Map();
    const playerStats = new Map();

    for (const p of players) {
      playerElo.set(p.id, p.initial_elo);
      playerStats.set(p.id, { wins: 0, losses: 0 });
    }

    await EloHistory.destroy({ where: {}, transaction: t });

    const matches = await Match.findAll({
      include: [
        { model: Team, include: [Player] },
        { model: MatchResult },
      ],
      order: [
        ['match_date', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction: t,
    });

    for (const match of matches) {
      if (!match.MatchResult) continue;

      const result = match.MatchResult;
      const teamPlayers = buildTeamPlayers(match);
      const teamIds = Array.from(teamPlayers.keys());
      if (teamIds.length < 2) continue;

      const winningTeamId = result.winning_team_id;
      const isDraw = result.is_draw;
      const mvpId = result.mvp_player_id;

      for (const teamId of teamIds) {
        const playersInTeam = teamPlayers.get(teamId) || [];
        for (const playerId of playersInTeam) {
          const before = playerElo.get(playerId) ?? 0;
          let delta = 0;

          if (!isDraw) {
            if (teamId === winningTeamId) delta = winDelta;
            else delta = lossDelta;
          } else {
            delta = drawDelta;
          }

          if (mvpId && playerId === mvpId) {
            delta += MVP_BONUS;
          }

          const after = Math.max(MIN_ELO, before + delta);
          playerElo.set(playerId, after);

          await EloHistory.create(
            {
              match_id: match.id,
              player_id: playerId,
              elo_before: before,
              elo_after: after,
              delta,
            },
            { transaction: t }
          );

          if (!isDraw) {
            const stats = playerStats.get(playerId);
            if (teamId === winningTeamId) stats.wins += 1;
            else stats.losses += 1;
          }
        }
      }
    }

    for (const p of players) {
      const nextElo = playerElo.get(p.id) ?? p.initial_elo;
      p.elo = nextElo;
      const stats = playerStats.get(p.id);
      p.wins = stats.wins;
      p.losses = stats.losses;
      await p.save({ transaction: t });
    }
  });
}

async function upsertResult(matchId, payload, { allowCreate }) {
  const { winning_team_id, is_draw, goal_diff, mvp_player_id } = payload;

  return sequelize.transaction(async (t) => {
    const match = await Match.findByPk(matchId, { transaction: t });
    if (!match) return { error: { status: 404, message: 'Match not found' } };

    let result = await MatchResult.findOne({ where: { match_id: matchId }, transaction: t });
    if (!result && !allowCreate) {
      return { error: { status: 404, message: 'Result not found' } };
    }
    if (result && allowCreate) {
      return { error: { status: 409, message: 'Result already exists' } };
    }

    if (!result) {
      result = await MatchResult.create(
        {
          match_id: matchId,
          winning_team_id: winning_team_id || null,
          is_draw: Boolean(is_draw),
          goal_diff: Number(goal_diff || 0),
          mvp_player_id: mvp_player_id || null,
        },
        { transaction: t }
      );
    } else {
      result.winning_team_id = winning_team_id || null;
      result.is_draw = Boolean(is_draw);
      result.goal_diff = Number(goal_diff || 0);
      result.mvp_player_id = mvp_player_id || null;
      await result.save({ transaction: t });
    }

    match.status = 'completed';
    await match.save({ transaction: t });

    return { match, result };
  });
}

async function replaceDistinctions(matchId, distinctions) {
  if (!Array.isArray(distinctions)) return;
  await Distinction.destroy({ where: { match_id: matchId } });
  if (distinctions.length === 0) return;

  const rows = distinctions.map((d) => ({
    match_id: matchId,
    player_id: d.player_id,
    type: d.type,
    notes: d.notes || null,
  }));

  await Distinction.bulkCreate(rows);
}

module.exports = { recalcAllElo, upsertResult, replaceDistinctions };
