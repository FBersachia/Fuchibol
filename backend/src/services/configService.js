const { AppConfig, ConfigHistory } = require('../models');

const DEFAULTS = {
  w_elo: 1.0,
  w_genero: 5.0,
  w_social: 0.5,
  gender_tolerance: 1,
  win_delta: 100,
  draw_delta: 0,
  loss_delta: -100,
  use_social_default: true,
};

async function getConfig(groupId) {
  let config = await AppConfig.findOne({ where: { group_id: groupId } });
  if (!config) {
    config = await AppConfig.create({ ...DEFAULTS, group_id: groupId });
  }
  return config;
}

function diffChanges(before, after) {
  const changes = {};
  Object.keys(after).forEach((key) => {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  });
  return changes;
}

async function updateConfig(payload, { changedBy, groupId } = {}) {
  const config = await getConfig(groupId);
  const before = config.toJSON();

  await config.update(payload);

  const changes = diffChanges(before, config.toJSON());
  if (Object.keys(changes).length > 0) {
    await ConfigHistory.create({
      config_id: config.id,
      changed_by: changedBy || null,
      changes,
      group_id: groupId,
    });
  }

  return config;
}

async function listConfigHistory(groupId, limit = 50) {
  return ConfigHistory.findAll({
    where: { group_id: groupId },
    order: [['id', 'DESC']],
    limit,
  });
}

module.exports = { getConfig, updateConfig, listConfigHistory };
