const { sequelize, Player, Match, Team, TeamPlayer, MatchResult, EloHistory } = require('../src/models');
const { recalcAllElo, upsertResult, replaceDistinctions } = require('../src/services/eloService');
const { getDefaultGroupId } = require('./helpers');

async function seedMatch(groupId) {
  const p1 = await Player.create({
    name: 'P1',
    gender: 'h',
    elo: 1000,
    initial_elo: 1000,
    group_id: groupId,
  });
  const p2 = await Player.create({
    name: 'P2',
    gender: 'm',
    elo: 1000,
    initial_elo: 1000,
    group_id: groupId,
  });
  const match = await Match.create({ match_date: '2026-01-20', group_id: groupId });
  const teamA = await Team.create({ match_id: match.id, name: 'A', group_id: groupId });
  const teamB = await Team.create({ match_id: match.id, name: 'B', group_id: groupId });
  await TeamPlayer.bulkCreate([
    { team_id: teamA.id, player_id: p1.id, group_id: groupId },
    { team_id: teamB.id, player_id: p2.id, group_id: groupId },
  ]);

  return { match, teamA, teamB, p1, p2 };
}

describe('eloService', () => {
  it('upserts result and recalculates elo', async () => {
    const groupId = await getDefaultGroupId();
    const { match, teamA } = await seedMatch(groupId);

    const res = await upsertResult(
      match.id,
      { winning_team_id: teamA.id, is_draw: false, goal_diff: 1 },
      { allowCreate: true, groupId }
    );
    expect(res.error).toBeUndefined();

    await recalcAllElo(groupId);

    const histories = await EloHistory.findAll({ where: { group_id: groupId } });
    expect(histories.length).toBe(2);
  });

  it('replaces distinctions', async () => {
    const groupId = await getDefaultGroupId();
    const { match, p1 } = await seedMatch(groupId);
    await replaceDistinctions(match.id, [{ player_id: p1.id, type: 'mvp' }], groupId);
  });
});
