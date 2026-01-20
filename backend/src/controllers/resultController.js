const { Match, MatchResult, Distinction } = require('../models');
const { upsertResult, replaceDistinctions, recalcAllElo } = require('../services/eloService');

function validateResultPayload(body) {
  const isDraw = Boolean(body.is_draw);
  const hasWinner = body.winning_team_id !== undefined && body.winning_team_id !== null;
  if (isDraw && hasWinner) return 'winning_team_id must be null for draw';
  if (!isDraw && !hasWinner) return 'winning_team_id is required when not draw';
  return null;
}

async function createResult(req, res, next) {
  try {
    const { id } = req.params;
    const errorMsg = validateResultPayload(req.body);
    if (errorMsg) return res.status(400).json({ error: errorMsg });

    const result = await upsertResult(id, req.body, { allowCreate: true });
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    await replaceDistinctions(id, req.body.distinctions || []);
    await recalcAllElo();

    return res.status(201).json({ match_id: Number(id), status: 'completed' });
  } catch (err) {
    return next(err);
  }
}

async function updateResult(req, res, next) {
  try {
    const { id } = req.params;
    const errorMsg = validateResultPayload(req.body);
    if (errorMsg) return res.status(400).json({ error: errorMsg });

    const result = await upsertResult(id, req.body, { allowCreate: false });
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    await replaceDistinctions(id, req.body.distinctions || []);
    await recalcAllElo();

    return res.json({ match_id: Number(id), status: 'completed' });
  } catch (err) {
    return next(err);
  }
}

async function getMatchResult(req, res, next) {
  try {
    const { id } = req.params;
    const match = await Match.findByPk(id, {
      include: [{ model: MatchResult }, { model: Distinction }],
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    return res.json({
      match_id: match.id,
      result: match.MatchResult || null,
      distinctions: match.Distinctions || [],
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createResult,
  updateResult,
  getMatchResult,
};
