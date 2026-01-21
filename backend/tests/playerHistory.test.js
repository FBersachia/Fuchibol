const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Player Elo history', () => {
  it('returns elo history', async () => {
    const playerRes = await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'P1', gender: 'h', elo: 1000 });

    const playerId = playerRes.body.id;

    const res = await request(app)
      .get(`/players/${playerId}/elo-history`)
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.player_id).toBe(playerId);
  });
});

