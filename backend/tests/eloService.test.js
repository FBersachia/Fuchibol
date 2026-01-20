const { sequelize, Player, Match, Team, TeamPlayer, MatchResult, EloHistory } = require('../src/models');
const { recalcAllElo, upsertResult, replaceDistinctions } = require('../src/services/eloService');

async function seedMatch() {
  const p1 = await Player.create({ name: 'P1', gender: 'h', elo: 1000, initial_elo: 1000 });
  const p2 = await Player.create({ name: 'P2', gender: 'm', elo: 1000, initial_elo: 1000 });
  const match = await Match.create({ match_date: '2026-01-20' });
  const teamA = await Team.create({ match_id: match.id, name: 'A' });
  const teamB = await Team.create({ match_id: match.id, name: 'B' });
  await TeamPlayer.bulkCreate([
    { team_id: teamA.id, player_id: p1.id },
    { team_id: teamB.id, player_id: p2.id },
  ]);

  return { match, teamA, teamB, p1, p2 };
}

describe('eloService', () => {
  it('upserts result and recalculates elo', async () => {
    const { match, teamA } = await seedMatch();

    const res = await upsertResult(match.id, { winning_team_id: teamA.id, is_draw: false, goal_diff: 1 }, { allowCreate: true });
    expect(res.error).toBeUndefined();

    await recalcAllElo();

    const histories = await EloHistory.findAll();
    expect(histories.length).toBe(2);
  });

  it('replaces distinctions', async () => {
    const { match, p1 } = await seedMatch();
    await replaceDistinctions(match.id, [{ player_id: p1.id, type: 'mvp' }]);
  });
});
