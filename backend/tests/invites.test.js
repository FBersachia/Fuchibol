const request = require('supertest');
const { app } = require('../src/app');
const { GroupInvite, Player } = require('../src/models');
const { getAdminAuthHeaders, getDefaultGroupId } = require('./helpers');

describe('Group invites', () => {
  it('creates and regenerates general invites', async () => {
    const groupId = await getDefaultGroupId();
    const headers = await getAdminAuthHeaders(groupId);

    const first = await request(app)
      .post('/invites/general')
      .set(headers);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/invites/general')
      .set(headers);

    expect(second.status).toBe(201);

    const invites = await GroupInvite.findAll({
      where: { group_id: groupId, type: 'general' },
      order: [['id', 'ASC']],
    });

    expect(invites.length).toBeGreaterThanOrEqual(2);
    expect(invites[0].revoked_at).not.toBeNull();
  });

  it('creates and regenerates specific invites', async () => {
    const groupId = await getDefaultGroupId();
    const player = await Player.create({
      name: 'Invitado',
      gender: 'h',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupId,
    });

    const headers = await getAdminAuthHeaders(groupId);
    const first = await request(app)
      .post('/invites/specific')
      .set(headers)
      .send({ player_id: player.id, regenerate: false });

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/invites/specific')
      .set(headers)
      .send({ player_id: player.id, regenerate: true });

    expect(second.status).toBe(201);

    const invites = await GroupInvite.findAll({
      where: { group_id: groupId, type: 'specific', player_id: player.id },
      order: [['id', 'ASC']],
    });

    expect(invites.length).toBeGreaterThanOrEqual(2);
    expect(invites[0].revoked_at).not.toBeNull();
  });
});
