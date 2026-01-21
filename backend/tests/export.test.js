const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Export', () => {
  it('returns csv export', async () => {
    const res = await request(app)
      .get('/export')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('[players]');
  });
});

