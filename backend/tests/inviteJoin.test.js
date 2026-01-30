const request = require('supertest');
const { app } = require('../src/app');
const { Group, GroupInvite, GroupMember, Player, User } = require('../src/models');
const { getAdminAuthHeaders, getDefaultGroupId } = require('./helpers');

describe('Invite join flow', () => {
  it('joins a group using a general invite', async () => {
    const groupId = await getDefaultGroupId();
    const group = await Group.findByPk(groupId);

    const inviteRes = await request(app)
      .post('/invites/general')
      .set(await getAdminAuthHeaders(groupId));

    const joinRes = await request(app)
      .post(`/invites/${group.slug}/${inviteRes.body.token}/join`)
      .send({
        email: 'joiner@local.com',
        password: 'pass1234',
        nickname: 'Joiner',
        gender: 'h',
        elo: 900,
      });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.group_id).toBe(groupId);

    const user = await User.findOne({ where: { email: 'joiner@local.com' } });
    const player = await Player.findOne({ where: { group_id: groupId, user_id: user.id } });
    const membership = await GroupMember.findOne({
      where: { group_id: groupId, user_id: user.id, deleted_at: null },
    });

    expect(user).toBeTruthy();
    expect(player).toBeTruthy();
    expect(membership).toBeTruthy();
  });

  it('joins using a specific invite and links the player', async () => {
    const groupId = await getDefaultGroupId();
    const group = await Group.findByPk(groupId);

    const player = await Player.create({
      name: 'Pendiente',
      gender: 'm',
      elo: 850,
      initial_elo: 850,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupId,
    });

    const inviteRes = await request(app)
      .post('/invites/specific')
      .set(await getAdminAuthHeaders(groupId))
      .send({ player_id: player.id, regenerate: false });

    const joinRes = await request(app)
      .post(`/invites/${group.slug}/${inviteRes.body.token}/join`)
      .send({
        email: 'specific@local.com',
        password: 'pass1234',
        gender: 'm',
      });

    expect(joinRes.status).toBe(200);

    const updatedPlayer = await Player.findByPk(player.id);
    const user = await User.findOne({ where: { email: 'specific@local.com' } });
    expect(updatedPlayer.user_id).toBe(user.id);
  });

  it('rejects expired invites', async () => {
    const groupId = await getDefaultGroupId();
    const group = await Group.findByPk(groupId);

    const inviteRes = await request(app)
      .post('/invites/general')
      .set(await getAdminAuthHeaders(groupId));

    await GroupInvite.update(
      { expires_at: new Date(Date.now() - 60 * 1000) },
      { where: { id: inviteRes.body.id } }
    );

    const joinRes = await request(app)
      .post(`/invites/${group.slug}/${inviteRes.body.token}/join`)
      .send({
        email: 'expired@local.com',
        password: 'pass1234',
        nickname: 'Expired',
        gender: 'h',
      });

    expect(joinRes.status).toBe(410);
  });

  it('rejects invites that exceed max uses', async () => {
    const groupId = await getDefaultGroupId();
    const group = await Group.findByPk(groupId);

    const inviteRes = await request(app)
      .post('/invites/general')
      .set(await getAdminAuthHeaders(groupId));

    await GroupInvite.update(
      { used_count: 1, max_uses: 1 },
      { where: { id: inviteRes.body.id } }
    );

    const joinRes = await request(app)
      .post(`/invites/${group.slug}/${inviteRes.body.token}/join`)
      .send({
        email: 'used@local.com',
        password: 'pass1234',
        nickname: 'Used',
        gender: 'h',
      });

    expect(joinRes.status).toBe(400);
  });

  it('enforces the 30 player active limit', async () => {
    const groupId = await getDefaultGroupId();
    const group = await Group.findByPk(groupId);

    for (let i = 0; i < 30; i += 1) {
      await Player.create({
        name: `P${i}`,
        gender: i % 2 === 0 ? 'h' : 'm',
        elo: 900,
        initial_elo: 900,
        wins: 0,
        losses: 0,
        is_goalkeeper: false,
        group_id: groupId,
      });
    }

    const inviteRes = await request(app)
      .post('/invites/general')
      .set(await getAdminAuthHeaders(groupId));

    const joinRes = await request(app)
      .post(`/invites/${group.slug}/${inviteRes.body.token}/join`)
      .send({
        email: 'limit@local.com',
        password: 'pass1234',
        nickname: 'Limit',
        gender: 'h',
        elo: 900,
      });

    expect(joinRes.status).toBe(400);
  });
});
