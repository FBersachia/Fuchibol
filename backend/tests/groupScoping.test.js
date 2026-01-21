const request = require('supertest');
const { app } = require('../src/app');
const {
  User,
  Group,
  GroupMember,
  Player,
  Match,
  Team,
  TeamPlayer,
  MatchResult,
  Court,
  EloHistory,
} = require('../src/models');
const { getAdminToken, buildAuthHeaders, getDefaultGroupId } = require('./helpers');

async function createGroupForAdmin({ name, slug }) {
  const admin = await User.findOne({ where: { email: 'admin@local.com' } });
  const group = await Group.create({ name, slug });
  await GroupMember.create({
    group_id: group.id,
    user_id: admin.id,
    role: 'admin',
  });
  return group;
}

describe('Group scoping', () => {
  it('requires X-Group-Id for group-scoped endpoints', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .get('/players')
      .set(await buildAuthHeaders(token));

    expect(res.status).toBe(400);
  });

  it('scopes players by group and enforces nickname uniqueness', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();
    const groupB = await createGroupForAdmin({ name: 'Grupo B', slug: 'grupob' });

    const createA = await request(app)
      .post('/players')
      .set(await buildAuthHeaders(token, groupA))
      .send({ name: 'Duplicado', gender: 'h', elo: 900, is_goalkeeper: false });

    expect(createA.status).toBe(201);

    const createB = await request(app)
      .post('/players')
      .set(await buildAuthHeaders(token, groupB.id))
      .send({ name: 'Duplicado', gender: 'm', elo: 900, is_goalkeeper: false });

    expect(createB.status).toBe(201);

    const dupRes = await request(app)
      .post('/players')
      .set(await buildAuthHeaders(token, groupA))
      .send({ name: 'Duplicado', gender: 'h', elo: 900, is_goalkeeper: false });

    expect(dupRes.status).toBe(409);

    const listA = await request(app)
      .get('/players')
      .set(await buildAuthHeaders(token, groupA));

    expect(listA.status).toBe(200);
    expect(listA.body.every((p) => p.group_id === groupA)).toBe(true);
  });

  it('scopes matches, teams, and results by group', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();
    const groupB = await createGroupForAdmin({ name: 'Grupo C', slug: 'grupoc' });

    const matchA = await Match.create({ match_date: '2026-01-10', group_id: groupA });
    const matchB = await Match.create({ match_date: '2026-01-11', group_id: groupB.id });

    const listA = await request(app)
      .get('/matches')
      .set(await buildAuthHeaders(token, groupA));

    expect(listA.status).toBe(200);
    const matchIds = listA.body.map((m) => m.id);
    expect(matchIds).toContain(matchA.id);
    expect(matchIds).not.toContain(matchB.id);

    const teamA = await Team.create({ match_id: matchA.id, name: 'A', group_id: groupA });
    await Team.create({ match_id: matchB.id, name: 'B', group_id: groupB.id });

    const teamsRes = await request(app)
      .get(`/teams?match_id=${matchA.id}`)
      .set(await buildAuthHeaders(token, groupA));

    expect(teamsRes.status).toBe(200);
    expect(teamsRes.body.every((t) => t.group_id === groupA)).toBe(true);

    await MatchResult.create({
      match_id: matchA.id,
      winning_team_id: teamA.id,
      is_draw: false,
      goal_diff: 1,
      group_id: groupA,
    });

    const wrongRes = await request(app)
      .get(`/matches/${matchA.id}/result`)
      .set(await buildAuthHeaders(token, groupB.id));

    expect(wrongRes.status).toBe(404);
  });

  it('enforces courts by group when creating and updating matches', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();
    const groupB = await createGroupForAdmin({ name: 'Grupo E', slug: 'grupoe' });

    const courtB = await Court.create({ name: 'Cancha B', group_id: groupB.id });

    const badCreate = await request(app)
      .post('/matches')
      .set(await buildAuthHeaders(token, groupA))
      .send({ match_date: '2026-01-20', court_id: courtB.id });

    expect(badCreate.status).toBe(404);

    const courtA = await Court.create({ name: 'Cancha A', group_id: groupA });
    const createRes = await request(app)
      .post('/matches')
      .set(await buildAuthHeaders(token, groupA))
      .send({ match_date: '2026-01-21', court_id: courtA.id });

    expect(createRes.status).toBe(201);

    const badUpdate = await request(app)
      .patch(`/matches/${createRes.body.id}`)
      .set(await buildAuthHeaders(token, groupA))
      .send({ court_id: courtB.id });

    expect(badUpdate.status).toBe(404);
  });

  it('writes team_players with group_id', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();

    const match = await Match.create({ match_date: '2026-02-01', group_id: groupA });
    const p1 = await Player.create({
      name: 'Team P1',
      gender: 'h',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });
    const p2 = await Player.create({
      name: 'Team P2',
      gender: 'm',
      elo: 920,
      initial_elo: 920,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });

    const res = await request(app)
      .post('/teams')
      .set(await buildAuthHeaders(token, groupA))
      .send({ match_id: match.id, name: 'Equipo', players: [p1.id, p2.id] });

    expect(res.status).toBe(201);

    const teamPlayers = await TeamPlayer.findAll({ where: { team_id: res.body.id } });
    expect(teamPlayers.length).toBe(2);
    expect(teamPlayers.every((tp) => tp.group_id === groupA)).toBe(true);
  });

  it('recalculates elo per group when saving results', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();
    const groupB = await createGroupForAdmin({ name: 'Grupo F', slug: 'grupof' });

    const p1 = await Player.create({
      name: 'Result A1',
      gender: 'h',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });
    const p2 = await Player.create({
      name: 'Result A2',
      gender: 'm',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });
    const pOther = await Player.create({
      name: 'Result B',
      gender: 'h',
      elo: 910,
      initial_elo: 910,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupB.id,
    });

    const match = await Match.create({ match_date: '2026-02-02', group_id: groupA });
    const teamA = await Team.create({ match_id: match.id, name: 'A', group_id: groupA });
    const teamB = await Team.create({ match_id: match.id, name: 'B', group_id: groupA });
    await TeamPlayer.bulkCreate([
      { team_id: teamA.id, player_id: p1.id, group_id: groupA },
      { team_id: teamB.id, player_id: p2.id, group_id: groupA },
    ]);

    const resultRes = await request(app)
      .post(`/matches/${match.id}/result`)
      .set(await buildAuthHeaders(token, groupA))
      .send({ winning_team_id: teamA.id, is_draw: false, goal_diff: 1 });

    expect(resultRes.status).toBe(201);

    const historiesA = await EloHistory.findAll({ where: { group_id: groupA } });
    const historiesB = await EloHistory.findAll({ where: { group_id: groupB.id } });
    const updatedOther = await Player.findByPk(pOther.id);

    expect(historiesA.length).toBeGreaterThan(0);
    expect(historiesB.length).toBe(0);
    expect(updatedOther.elo).toBe(910);
  });

  it('soft deletes players and hides them from lists', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();

    const createRes = await request(app)
      .post('/players')
      .set(await buildAuthHeaders(token, groupA))
      .send({ name: 'Borrar', gender: 'h', elo: 900, is_goalkeeper: false });

    const playerId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/players/${playerId}`)
      .set(await buildAuthHeaders(token, groupA));

    expect(deleteRes.status).toBe(204);

    const deleted = await Player.findByPk(playerId);
    expect(deleted.deleted_at).not.toBeNull();

    const listRes = await request(app)
      .get('/players')
      .set(await buildAuthHeaders(token, groupA));

    expect(listRes.status).toBe(200);
    const ids = listRes.body.map((p) => p.id);
    expect(ids).not.toContain(playerId);
  });

  it('scopes config, ranking, social, and export by group', async () => {
    const token = await getAdminToken();
    const groupA = await getDefaultGroupId();
    const groupB = await createGroupForAdmin({ name: 'Grupo D', slug: 'grupod' });

    const playerA1 = await Player.create({
      name: 'Rank A',
      gender: 'h',
      elo: 950,
      initial_elo: 950,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });
    const playerA2 = await Player.create({
      name: 'Rank A2',
      gender: 'm',
      elo: 940,
      initial_elo: 940,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupA,
    });
    const playerB1 = await Player.create({
      name: 'Rank B',
      gender: 'm',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupB.id,
    });
    const playerB2 = await Player.create({
      name: 'Rank B2',
      gender: 'h',
      elo: 910,
      initial_elo: 910,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupB.id,
    });

    const configA = await request(app)
      .put('/config')
      .set(await buildAuthHeaders(token, groupA))
      .send({ w_elo: 2.2 });

    expect(configA.status).toBe(200);

    const configB = await request(app)
      .get('/config')
      .set(await buildAuthHeaders(token, groupB.id));

    expect(configB.status).toBe(200);
    expect(Number(configB.body.w_elo)).not.toBe(2.2);

    const rankingA = await request(app)
      .get('/ranking?limit=10')
      .set(await buildAuthHeaders(token, groupA));

    expect(rankingA.status).toBe(200);
    const rankingIds = rankingA.body.ranking.map((p) => p.id);
    expect(rankingIds).not.toContain(playerB1.id);
    expect(rankingIds).not.toContain(playerB2.id);

    const matchA = await Match.create({ match_date: '2026-01-15', group_id: groupA });
    const teamA = await Team.create({ match_id: matchA.id, name: 'A', group_id: groupA });
    await TeamPlayer.bulkCreate([
      { team_id: teamA.id, player_id: playerA1.id, group_id: groupA },
      { team_id: teamA.id, player_id: playerA2.id, group_id: groupA },
    ]);

    const socialRes = await request(app)
      .get('/social-pairs?since_months=12')
      .set(await buildAuthHeaders(token, groupA));

    expect(socialRes.status).toBe(200);
    expect(Array.isArray(socialRes.body.pairs)).toBe(true);

    const exportRes = await request(app)
      .get('/export')
      .set(await buildAuthHeaders(token, groupA));

    expect(exportRes.status).toBe(200);
    expect(exportRes.text).toContain('Rank A');
    expect(exportRes.text).not.toContain('Rank B');
  });
});
