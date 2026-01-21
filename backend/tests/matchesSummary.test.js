const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Matches summary', () => {
  it('returns summary counts', async () => {
    const m1 = await request(app)
      .post('/matches')
      .set(await authHeader())
      .send({ match_date: '2026-01-20' });

    await request(app)
      .post('/matches')
      .set(await authHeader())
      .send({ match_date: '2026-01-21' });

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
      .send({ match_id: m1.body.id, name: 'Equipo A', players: [p1.body.id] });

    await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: m1.body.id, name: 'Equipo B', players: [p2.body.id] });

    await request(app)
      .post(`/matches/${m1.body.id}/result`)
      .set(await authHeader())
      .send({ winning_team_id: teamA.body.id, is_draw: false, goal_diff: 1 });

    const res = await request(app)
      .get('/matches/summary')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.total_matches).toBe(2);
    expect(res.body.completed_matches).toBe(1);
    expect(res.body.pending_matches).toBe(1);
  });
});

