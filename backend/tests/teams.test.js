const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Teams', () => {
  it('creates, updates, deletes teams', async () => {
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

    const createRes = await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo A', players: [p1.body.id, p2.body.id] });

    expect(createRes.status).toBe(201);
    const teamId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/teams/${teamId}`)
      .set(await authHeader())
      .send({ name: 'Equipo A1' });

    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/teams/${teamId}`)
      .set(await authHeader());

    expect(deleteRes.status).toBe(204);
  });
});

