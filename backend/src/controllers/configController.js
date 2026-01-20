const { getConfig, updateConfig, listConfigHistory } = require('../services/configService');

function parseNumber(value, field) {
  if (value === undefined) return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) throw new Error(`Invalid ${field}`);
  return num;
}

async function getAppConfig(_req, res, next) {
  try {
    const config = await getConfig();
    return res.json(config);
  } catch (err) {
    return next(err);
  }
}

async function updateAppConfig(req, res, next) {
  try {
    const payload = {};

    if (req.body.w_elo !== undefined) payload.w_elo = parseNumber(req.body.w_elo, 'w_elo');
    if (req.body.w_genero !== undefined) payload.w_genero = parseNumber(req.body.w_genero, 'w_genero');
    if (req.body.w_social !== undefined) payload.w_social = parseNumber(req.body.w_social, 'w_social');
    if (req.body.gender_tolerance !== undefined) payload.gender_tolerance = parseNumber(req.body.gender_tolerance, 'gender_tolerance');
    if (req.body.win_delta !== undefined) payload.win_delta = parseNumber(req.body.win_delta, 'win_delta');
    if (req.body.draw_delta !== undefined) payload.draw_delta = parseNumber(req.body.draw_delta, 'draw_delta');
    if (req.body.loss_delta !== undefined) payload.loss_delta = parseNumber(req.body.loss_delta, 'loss_delta');
    if (req.body.use_social_default !== undefined) payload.use_social_default = Boolean(req.body.use_social_default);

    const config = await updateConfig(payload, { changedBy: req.user?.id });
    return res.json(config);
  } catch (err) {
    if (err.message.startsWith('Invalid')) {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
}

async function getConfigHistory(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = await listConfigHistory(limit);
    return res.json({ limit, history });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAppConfig, updateAppConfig, getConfigHistory };
