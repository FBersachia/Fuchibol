const { Match, Team, TeamPlayer, Player, MatchResult, Distinction, Court, sequelize } = require('../models');
const { generateTeams, previewTeams } = require('../services/teamGenerator');
const { recalcAllElo } = require('../services/eloService');

function normalizeIds(value) {
  if (!Array.isArray(value)) return null;
  const ids = value.map((id) => Number(id));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return null;
  return ids;
}

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

async function createPlayedMatch(req, res, next) {
  try {
    const { match_date, court_id, team_a_player_ids, team_b_player_ids, winning_team } = req.body;
    if (!match_date) {
      return res.status(400).json({ error: 'match_date is required' });
    }
    if (!court_id) {
      return res.status(400).json({ error: 'court_id is required' });
    }

    const teamAIds = normalizeIds(team_a_player_ids);
    const teamBIds = normalizeIds(team_b_player_ids);
    if (!teamAIds || !teamBIds) {
      return res.status(400).json({ error: 'team_a_player_ids and team_b_player_ids are required' });
    }
    if (teamAIds.length === 0 || teamBIds.length === 0) {
      return res.status(400).json({ error: 'Teams must have at least one player' });
    }
    if (new Set(teamAIds).size !== teamAIds.length || new Set(teamBIds).size !== teamBIds.length) {
      return res.status(400).json({ error: 'Duplicate players in team' });
    }
    if (teamAIds.length !== teamBIds.length) {
      return res.status(400).json({ error: 'Teams must have the same number of players' });
    }
    const combined = new Set([...teamAIds, ...teamBIds]);
    if (combined.size !== teamAIds.length + teamBIds.length) {
      return res.status(400).json({ error: 'Players cannot be in both teams' });
    }
    if (winning_team !== 'A' && winning_team !== 'B') {
      return res.status(400).json({ error: 'winning_team must be A or B' });
    }

    const court = await Court.findOne({ where: { id: court_id, group_id: req.group.id } });
    if (!court) return res.status(404).json({ error: 'Court not found' });

    const allPlayerIds = Array.from(combined);
    const existingPlayers = await Player.findAll({
      where: { id: allPlayerIds, group_id: req.group.id, deleted_at: null },
    });
    if (existingPlayers.length !== allPlayerIds.length) {
      return res.status(400).json({ error: 'Invalid player ids' });
    }

    const result = await sequelize.transaction(async (t) => {
      const match = await Match.create(
        {
          match_date,
          court_id,
          status: 'completed',
          group_id: req.group.id,
        },
        { transaction: t }
      );

      const teamA = await Team.create(
        { match_id: match.id, name: 'Equipo A', group_id: req.group.id },
        { transaction: t }
      );
      const teamB = await Team.create(
        { match_id: match.id, name: 'Equipo B', group_id: req.group.id },
        { transaction: t }
      );

      const rows = [
        ...teamAIds.map((player_id) => ({ team_id: teamA.id, player_id, group_id: req.group.id })),
        ...teamBIds.map((player_id) => ({ team_id: teamB.id, player_id, group_id: req.group.id })),
      ];
      await TeamPlayer.bulkCreate(rows, { transaction: t });

      const winningTeamId = winning_team === 'A' ? teamA.id : teamB.id;
      await MatchResult.create(
        {
          match_id: match.id,
          winning_team_id: winningTeamId,
          is_draw: false,
          goal_diff: 0,
          group_id: req.group.id,
        },
        { transaction: t }
      );

      return { match, teamA, teamB };
    });

    await recalcAllElo(req.group.id);

    return res.status(201).json({
      match_id: result.match.id,
      team_a_id: result.teamA.id,
      team_b_id: result.teamB.id,
      status: 'completed',
    });
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
  createPlayedMatch,
};
