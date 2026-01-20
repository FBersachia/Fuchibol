const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Results', () => {
  it('creates and updates results', async () => {
    const matchRes = await request(app)
      .post('/matches')
      .set(await authHeader())
      .send({ match_date: '2026-01-20' });

    const matchId = matchRes.body.id;

    const p1 = await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'P1', gender: 'h', elo: 1000 });

    const p2 = await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'P2', gender: 'm', elo: 1000 });

    const teamA = await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo A', players: [p1.body.id] });

    const teamB = await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo B', players: [p2.body.id] });

    const createRes = await request(app)
      .post(`/matches/${matchId}/result`)
      .set(await authHeader())
      .send({ winning_team_id: teamA.body.id, is_draw: false, goal_diff: 1, mvp_player_id: p1.body.id });

    expect(createRes.status).toBe(201);

    const updateRes = await request(app)
      .patch(`/matches/${matchId}/result`)
      .set(await authHeader())
      .send({ winning_team_id: teamB.body.id, is_draw: false, goal_diff: 2, mvp_player_id: p2.body.id });

    expect(updateRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/matches/${matchId}/result`)
      .set(await authHeader());

    expect(getRes.status).toBe(200);
    expect(getRes.body.match_id).toBe(matchId);
  });
});
