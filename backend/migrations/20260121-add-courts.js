'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('courts', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addColumn('matches', 'court_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'courts', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('matches', 'court_id');
    await queryInterface.dropTable('courts');
  },
};
