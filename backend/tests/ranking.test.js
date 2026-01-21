const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Ranking', () => {
  it('returns ranking list', async () => {
    await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'P1', gender: 'h', elo: 900 });

    await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'P2', gender: 'm', elo: 950 });

    const res = await request(app)
      .get('/ranking?limit=5')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.ranking.length).toBeGreaterThan(0);
  });
});

