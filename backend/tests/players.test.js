const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Players', () => {
  it('creates, lists, updates, deletes players', async () => {
    const createRes = await request(app)
      .post('/players')
      .set(await authHeader())
      .send({ name: 'Jugador', gender: 'h', elo: 1200, is_goalkeeper: false });

    expect(createRes.status).toBe(201);
    const playerId = createRes.body.id;

    const listRes = await request(app).get('/players').set(await authHeader());
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);

    const updateRes = await request(app)
      .patch(`/players/${playerId}`)
      .set(await authHeader())
      .send({ elo: 1210, wins: 1 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.elo).toBe(1210);

    const deleteRes = await request(app)
      .delete(`/players/${playerId}`)
      .set(await authHeader());

    expect(deleteRes.status).toBe(204);
  });
});
