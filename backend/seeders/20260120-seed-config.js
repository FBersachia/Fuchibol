'use strict';

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM app_config WHERE id = 1;'
    );

    if (rows[0].count > 0) return;

    await queryInterface.bulkInsert('app_config', [
      {
        id: 1,
        w_elo: 1.0,
        w_genero: 5.0,
        w_social: 0.5,
        gender_tolerance: 1,
        win_delta: 100,
        draw_delta: 0,
        loss_delta: -100,
        use_social_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('app_config', { id: 1 });
  },
};
