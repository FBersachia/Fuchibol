const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Player stats', () => {
  it('returns wins/losses and mvp count', async () => {
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

    const teamA = await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo A', players: [p1.body.id] });

    const teamB = await request(app)
      .post('/teams')
      .set(await authHeader())
      .send({ match_id: matchId, name: 'Equipo B', players: [p2.body.id] });

    await request(app)
      .post(`/matches/${matchId}/result`)
      .set(await authHeader())
      .send({
        winning_team_id: teamA.body.id,
        is_draw: false,
        goal_diff: 1,
        mvp_player_id: p1.body.id,
        distinctions: [{ player_id: p1.body.id, type: 'mvp' }],
      });

    const statsWinner = await request(app)
      .get(`/players/${p1.body.id}/stats`)
      .set(await authHeader());

    expect(statsWinner.status).toBe(200);
    expect(statsWinner.body.wins).toBe(1);
    expect(statsWinner.body.losses).toBe(0);
    expect(statsWinner.body.mvp_count).toBe(1);

    const statsLoser = await request(app)
      .get(`/players/${p2.body.id}/stats`)
      .set(await authHeader());

    expect(statsLoser.status).toBe(200);
    expect(statsLoser.body.wins).toBe(0);
    expect(statsLoser.body.losses).toBe(1);
  });
});

