const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Team generation', () => {
  it('generates teams for a match', async () => {
    const matchRes = await request(app)
      .post('/matches')
      .set(await authHeader())
      .send({ match_date: '2026-01-20' });

    const matchId = matchRes.body.id;

    const players = [];
    for (let i = 0; i < 6; i += 1) {
      const gender = i % 2 === 0 ? 'h' : 'm';
      const res = await request(app)
        .post('/players')
        .set(await authHeader())
        .send({ name: `P${i}`, gender, elo: 1000 + i, is_goalkeeper: i === 0 });
      players.push(res.body.id);
    }

    const genRes = await request(app)
      .post(`/matches/${matchId}/generate-teams`)
      .set(await authHeader())
      .send({ player_ids: players, use_social: false });

    expect(genRes.status).toBe(201);
    expect(genRes.body.teamA.players.length).toBe(3);
    expect(genRes.body.teamB.players.length).toBe(3);
  });
});
