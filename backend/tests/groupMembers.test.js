const request = require('supertest');
const { app } = require('../src/app');
const { Group, GroupMember, Player } = require('../src/models');
const { createTestUser, getAuthHeadersForUser, getAdminAuthHeaders, getDefaultGroupId } = require('./helpers');

describe('Group members', () => {
  it('lists members for the active group', async () => {
    const groupId = await getDefaultGroupId();
    const res = await request(app)
      .get('/groups/members')
      .set(await getAdminAuthHeaders(groupId));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBeGreaterThan(0);
  });

  it('blocks admins from leaving the group', async () => {
    const groupId = await getDefaultGroupId();
    const res = await request(app)
      .post('/groups/leave')
      .set(await getAdminAuthHeaders(groupId));

    expect(res.status).toBe(400);
  });

  it('allows members to leave and soft deletes their data', async () => {
    const groupId = await getDefaultGroupId();
    const { user } = await createTestUser({
      name: 'Member',
      email: 'member@local.com',
    });

    await GroupMember.create({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    });

    const player = await Player.create({
      name: 'Member Player',
      gender: 'h',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      user_id: user.id,
      group_id: groupId,
    });

    const res = await request(app)
      .post('/groups/leave')
      .set(await getAuthHeadersForUser(user, groupId));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const membership = await GroupMember.findOne({ where: { group_id: groupId, user_id: user.id } });
    expect(membership.deleted_at).not.toBeNull();

    const updatedPlayer = await Player.findByPk(player.id);
    expect(updatedPlayer.deleted_at).not.toBeNull();
  });

  it('transfers admin role to another member', async () => {
    const group = await Group.create({ name: 'Grupo Transfer', slug: 'grupotransfer' });
    const { user: adminUser } = await createTestUser({
      name: 'Admin Transfer',
      email: 'admin-transfer@local.com',
    });
    const { user: memberUser } = await createTestUser({
      name: 'Member Transfer',
      email: 'member-transfer@local.com',
    });

    await GroupMember.create({
      group_id: group.id,
      user_id: adminUser.id,
      role: 'admin',
    });
    await GroupMember.create({
      group_id: group.id,
      user_id: memberUser.id,
      role: 'member',
    });

    const res = await request(app)
      .post('/groups/transfer-admin')
      .set(await getAuthHeadersForUser(adminUser, group.id))
      .send({ user_id: memberUser.id });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const adminMembership = await GroupMember.findOne({
      where: { group_id: group.id, user_id: adminUser.id, deleted_at: null },
    });
    const memberMembership = await GroupMember.findOne({
      where: { group_id: group.id, user_id: memberUser.id, deleted_at: null },
    });

    expect(adminMembership.role).toBe('member');
    expect(memberMembership.role).toBe('admin');
  });
});
