const { Court } = require('../models');

async function listCourts(_req, res, next) {
  try {
    const courts = await Court.findAll({ order: [['id', 'ASC']] });
    return res.json(courts);
  } catch (err) {
    return next(err);
  }
}

async function createCourt(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const court = await Court.create({ name });
    return res.status(201).json(court);
  } catch (err) {
    return next(err);
  }
}

async function updateCourt(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    if (name !== undefined) court.name = name;
    await court.save();

    return res.json(court);
  } catch (err) {
    return next(err);
  }
}

async function deleteCourt(req, res, next) {
  try {
    const { id } = req.params;
    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    await court.destroy();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCourts,
  createCourt,
  updateCourt,
  deleteCourt,
};
