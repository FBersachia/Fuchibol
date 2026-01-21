const { Match, Team, Player, MatchResult, Distinction, Court } = require('../models');
const { generateTeams, previewTeams } = require('../services/teamGenerator');

async function listMatches(req, res, next) {
  try {
    const matches = await Match.findAll({
      where: { group_id: req.group.id },
      order: [['match_date', 'DESC'], ['id', 'DESC']],
    });
    return res.json(matches);
  } catch (err) {
    return next(err);
  }
}

async function getMatch(req, res, next) {
  try {
    const { id } = req.params;
    const match = await Match.findOne({
      where: { id, group_id: req.group.id },
      include: [
        {
          model: Team,
          include: [{ model: Player, where: { group_id: req.group.id, deleted_at: null }, required: false }],
        },
        { model: MatchResult },
        { model: Distinction, where: { group_id: req.group.id }, required: false },
        { model: Court, where: { group_id: req.group.id }, required: false },
      ],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    return res.json(match);
  } catch (err) {
    return next(err);
  }
}

async function createMatch(req, res, next) {
  try {
    const { match_date, notes, court_id } = req.body;
    if (!match_date) {
      return res.status(400).json({ error: 'match_date is required' });
    }

    if (court_id) {
      const court = await Court.findOne({ where: { id: court_id, group_id: req.group.id } });
      if (!court) return res.status(404).json({ error: 'Court not found' });
    }

    const match = await Match.create({
      match_date,
      notes: notes || null,
      court_id: court_id || null,
      group_id: req.group.id,
    });
    return res.status(201).json(match);
  } catch (err) {
    return next(err);
  }
}

async function updateMatch(req, res, next) {
  try {
    const { id } = req.params;
    const { match_date, notes, status, court_id } = req.body;

    const match = await Match.findOne({ where: { id, group_id: req.group.id } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match_date !== undefined) match.match_date = match_date;
    if (notes !== undefined) match.notes = notes;
    if (status !== undefined) match.status = status;
    if (court_id !== undefined) {
      if (court_id === null) {
        match.court_id = null;
      } else {
        const court = await Court.findOne({ where: { id: court_id, group_id: req.group.id } });
        if (!court) return res.status(404).json({ error: 'Court not found' });
        match.court_id = court_id;
      }
    }

    await match.save();
    return res.json(match);
  } catch (err) {
    return next(err);
  }
}

async function deleteMatch(req, res, next) {
  try {
    const { id } = req.params;
    const match = await Match.findOne({ where: { id, group_id: req.group.id } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await match.destroy();
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function generateTeamsForMatch(req, res, next) {
  try {
    const { id } = req.params;
    const { player_ids, use_social, weights, team_names, preview } = req.body;

    const result = preview
      ? await previewTeams(req.group.id, player_ids, {
          use_social,
          w_elo: weights?.w_elo,
          w_genero: weights?.w_genero,
          w_social: weights?.w_social,
          teamA_name: team_names?.teamA,
          teamB_name: team_names?.teamB,
        })
      : await generateTeams(req.group.id, Number(id), player_ids, {
          use_social,
          w_elo: weights?.w_elo,
          w_genero: weights?.w_genero,
          w_social: weights?.w_social,
          teamA_name: team_names?.teamA,
          teamB_name: team_names?.teamB,
        });

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

async function previewTeamsForMatch(req, res, next) {
  try {
    const { player_ids, use_social, weights, team_names } = req.body;

    const result = await previewTeams(req.group.id, player_ids, {
      use_social,
      w_elo: weights?.w_elo,
      w_genero: weights?.w_genero,
      w_social: weights?.w_social,
      teamA_name: team_names?.teamA,
      teamB_name: team_names?.teamB,
    });

    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  generateTeamsForMatch,
  previewTeamsForMatch,
};
