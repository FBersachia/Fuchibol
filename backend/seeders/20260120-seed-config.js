'use strict';

module.exports = {
  async up(queryInterface) {
    const [groupRows] = await queryInterface.sequelize.query(
      "SELECT id FROM groups WHERE slug = 'fuchiboloculto';"
    );
    if (groupRows.length === 0) return;

    const groupId = groupRows[0].id;
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM app_config WHERE group_id = :groupId;',
      { replacements: { groupId } }
    );

    if (rows[0].count > 0) return;

    await queryInterface.bulkInsert('app_config', [
      {
        w_elo: 1.0,
        w_genero: 5.0,
        w_social: 0.5,
        gender_tolerance: 1,
        win_delta: 100,
        draw_delta: 0,
        loss_delta: -100,
        use_social_default: true,
        group_id: groupId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    const [groupRows] = await queryInterface.sequelize.query(
      "SELECT id FROM groups WHERE slug = 'fuchiboloculto';"
    );
    if (groupRows.length === 0) return;
    await queryInterface.bulkDelete('app_config', { group_id: groupRows[0].id });
  },
};
