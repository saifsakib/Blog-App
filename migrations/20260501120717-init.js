'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: { type: Sequelize.STRING },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });

    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: { type: Sequelize.STRING },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });

    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: { type: Sequelize.STRING },
      slug: { type: Sequelize.STRING },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: { type: Sequelize.STRING },
      password: { type: Sequelize.STRING },
      profile_id: {
        type: Sequelize.UUID,
        references: { model: 'profiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });

    await queryInterface.createTable('profile-permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      profile_id: {
        type: Sequelize.UUID,
        references: { model: 'profiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.UUID,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });

    await queryInterface.createTable('permission-services', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      permission_id: {
        type: Sequelize.UUID,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      service_id: {
        type: Sequelize.UUID,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('permission-services');
    await queryInterface.dropTable('profile-permissions');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('services');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('profiles');
  },
};
