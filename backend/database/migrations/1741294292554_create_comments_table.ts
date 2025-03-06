import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Comments extends BaseSchema {
  public async up() {
    this.schema.createTable('comments', (table) => {
      table.increments('id')
      table.integer('movie_id').unsigned().references('id').inTable('movies').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable('comments')
  }
}