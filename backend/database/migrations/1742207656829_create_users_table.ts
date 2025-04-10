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
      table.string('reset_token').nullable()
      table.timestamp('reset_token_expires', { useTz: true }).nullable()

    })

    this.schema.createTable('movie_user', (table) => {
      table.increments('id').primary()
      table.integer('user_id').notNullable()
      table.integer('movie_id').notNullable()
      table.string('watched_timecode').nullable()
      table.string('original_timecode').notNullable()
    })
  }

  public async down () {
    this.schema.dropTable('movie_user')
    this.schema.dropTable(this.tableName)
  }
}