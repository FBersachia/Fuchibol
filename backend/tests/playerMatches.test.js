const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Player matches', () => {
  it('returns match list for player', async () => {
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

    await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo A', players: [p1.body.id] });

    await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo B', players: [p2.body.id] });

    const res = await request(app)
      .get(`/players/${p1.body.id}/matches`)
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.player_id).toBe(p1.body.id);
  });
});
