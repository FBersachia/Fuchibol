const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Matches', () => {
  it('creates, lists, updates, deletes matches', async () => {
    const createRes = await request(app)
      .post('/matches')
      .set(await authHeader())
      .send({ match_date: '2026-01-20', notes: 'nota' });

    expect(createRes.status).toBe(201);
    const matchId = createRes.body.id;

    const listRes = await request(app).get('/matches').set(await authHeader());
    expect(listRes.status).toBe(200);

    const getRes = await request(app).get(`/matches/${matchId}`).set(await authHeader());
    expect(getRes.status).toBe(200);

    const updateRes = await request(app)
      .patch(`/matches/${matchId}`)
      .set(await authHeader())
      .send({ status: 'completed' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('completed');

    const deleteRes = await request(app)
      .delete(`/matches/${matchId}`)
      .set(await authHeader());

    expect(deleteRes.status).toBe(204);
  });
});

