const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Config', () => {
  it('gets and updates config', async () => {
    const getRes = await request(app)
      .get('/config')
      .set(await authHeader());

    expect(getRes.status).toBe(200);

    const updateRes = await request(app)
      .put('/config')
      .set(await authHeader())
      .send({ w_elo: 1.2, win_delta: 2, use_social_default: false });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.w_elo).toBe(1.2);
    expect(updateRes.body.win_delta).toBe(2);
  });
});

