import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('username').notNullable()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('profile_picture').notNullable().defaultTo('/pictures/netflix_default.jpg')
      table.string('language').notNullable().defaultTo('en')
      table.string('auth_method').notNullable().defaultTo('local')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}