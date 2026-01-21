const { Op } = require('sequelize');
const { Player, Match, MatchResult, EloHistory } = require('../models');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values) {
  return values.map(csvEscape).join(',');
}

function buildDateFilter(query) {
  const where = {};
  if (query.start_date) {
    where[Op.gte] = query.start_date;
  }
  if (query.end_date) {
    where[Op.lte] = query.end_date;
  }
  return Object.keys(where).length ? { match_date: where } : {};
}

async function exportData(req, res, next) {
  try {
    const matchWhere = buildDateFilter(req.query);

    const players = await Player.findAll({
      where: { group_id: req.group.id, deleted_at: null },
      order: [['id', 'ASC']],
    });
    const matches = await Match.findAll({
      where: { ...matchWhere, group_id: req.group.id },
      include: [{ model: MatchResult }],
      order: [['match_date', 'ASC'], ['id', 'ASC']],
    });
    const eloHistory = await EloHistory.findAll({
      where: { group_id: req.group.id },
      include: [
        {
          model: Match,
          where: { ...matchWhere, group_id: req.group.id },
          required: Object.keys(matchWhere).length > 0,
        },
      ],
      order: [[Match, 'match_date', 'ASC'], ['id', 'ASC']],
    });

    const lines = [];

    lines.push('[players]');
    lines.push(toCsvRow(['id', 'name', 'gender', 'elo', 'initial_elo', 'is_goalkeeper', 'wins', 'losses']));
    for (const p of players) {
      lines.push(toCsvRow([
        p.id,
        p.name,
        p.gender,
        p.elo,
        p.initial_elo,
        p.is_goalkeeper,
        p.wins,
        p.losses,
      ]));
    }

    lines.push('');
    lines.push('[matches]');
    lines.push(toCsvRow(['id', 'match_date', 'status', 'notes']));
    for (const m of matches) {
      lines.push(toCsvRow([
        m.id,
        m.match_date,
        m.status,
        m.notes,
      ]));
    }

    lines.push('');
    lines.push('[results]');
    lines.push(toCsvRow(['match_id', 'winning_team_id', 'is_draw', 'goal_diff', 'mvp_player_id']));
    for (const m of matches) {
      const r = m.MatchResult;
      if (!r) continue;
      lines.push(toCsvRow([
        m.id,
        r.winning_team_id,
        r.is_draw,
        r.goal_diff,
        r.mvp_player_id,
      ]));
    }

    lines.push('');
    lines.push('[elo_history]');
    lines.push(toCsvRow(['match_id', 'player_id', 'elo_before', 'elo_after', 'delta']));
    for (const h of eloHistory) {
      lines.push(toCsvRow([
        h.match_id,
        h.player_id,
        h.elo_before,
        h.elo_after,
        h.delta,
      ]));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fuchibol-export.csv"');
    return res.send(lines.join('\n'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { exportData };
