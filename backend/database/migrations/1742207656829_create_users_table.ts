import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('username', 250).nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 180).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.string('profile_picture').nullable()
      table.string('auth_method', 50).defaultTo('local').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}