const request = require('supertest');
const { app } = require('../src/app');
const { Group, GroupMember, GroupInvite, Player } = require('../src/models');
const {
  createTestUser,
  getAuthHeadersForUser,
  getAdminAuthHeaders,
} = require('./helpers');

describe('Groups', () => {
  it('lists groups for the current user', async () => {
    const res = await request(app)
      .get('/groups')
      .set(await getAdminAuthHeaders());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.groups)).toBe(true);
    expect(res.body.groups.length).toBeGreaterThan(0);
  });

  it('creates a group and assigns admin role', async () => {
    const { user } = await createTestUser({
      name: 'Owner',
      email: 'owner@local.com',
    });
    const headers = await getAuthHeadersForUser(user);

    const res = await request(app)
      .post('/groups')
      .set(headers)
      .send({ name: 'Grupo Nuevo', slug: 'gruponuevo' });

    expect(res.status).toBe(201);
    const membership = await GroupMember.findOne({
      where: { group_id: res.body.id, user_id: user.id, deleted_at: null },
    });
    expect(membership).toBeTruthy();
    expect(membership.role).toBe('admin');
  });

  it('rejects invalid or reserved slugs', async () => {
    const { user } = await createTestUser({
      name: 'Sluggy',
      email: 'sluggy@local.com',
    });
    const headers = await getAuthHeadersForUser(user);

    const invalidRes = await request(app)
      .post('/groups')
      .set(headers)
      .send({ name: 'Grupo', slug: 'inv@lido' });

    expect(invalidRes.status).toBe(400);

    const reservedRes = await request(app)
      .post('/groups')
      .set(headers)
      .send({ name: 'Grupo', slug: 'login' });

    expect(reservedRes.status).toBe(400);
  });

  it('updates group data for admins', async () => {
    const { user } = await createTestUser({
      name: 'Editor',
      email: 'editor@local.com',
    });
    const headers = await getAuthHeadersForUser(user);

    const createRes = await request(app)
      .post('/groups')
      .set(headers)
      .send({ name: 'Grupo Editar', slug: 'grupoeditar' });

    const groupId = createRes.body.id;
    const updateRes = await request(app)
      .patch(`/groups/${groupId}`)
      .set(await getAuthHeadersForUser(user, groupId))
      .send({ name: 'Grupo Actualizado' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Grupo Actualizado');
  });

  it('soft deletes group data on delete', async () => {
    const { user } = await createTestUser({
      name: 'Deleter',
      email: 'deleter@local.com',
    });
    const headers = await getAuthHeadersForUser(user);

    const createRes = await request(app)
      .post('/groups')
      .set(headers)
      .send({ name: 'Grupo Borrar', slug: 'grupoborrar' });
    const groupId = createRes.body.id;

    await Player.create({
      name: 'Jugador',
      gender: 'h',
      elo: 900,
      initial_elo: 900,
      wins: 0,
      losses: 0,
      is_goalkeeper: false,
      group_id: groupId,
    });

    await GroupInvite.create({
      group_id: groupId,
      token: 'token-borrar',
      type: 'general',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      max_uses: 30,
      used_count: 0,
    });

    const deleteRes = await request(app)
      .delete(`/groups/${groupId}`)
      .set(await getAuthHeadersForUser(user, groupId));

    expect(deleteRes.status).toBe(204);

    const group = await Group.findByPk(groupId);
    expect(group.deleted_at).not.toBeNull();

    const members = await GroupMember.findAll({ where: { group_id: groupId } });
    expect(members.length).toBeGreaterThan(0);
    expect(members.every((member) => member.deleted_at)).toBe(true);

    const players = await Player.findAll({ where: { group_id: groupId } });
    expect(players.every((player) => player.deleted_at)).toBe(true);

    const invites = await GroupInvite.findAll({ where: { group_id: groupId } });
    expect(invites.every((invite) => invite.revoked_at)).toBe(true);
  });
});
