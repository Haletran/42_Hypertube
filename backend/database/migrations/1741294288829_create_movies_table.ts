import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Movies extends BaseSchema {
  public async up() {
    this.schema.createTable('movies', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description')
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable('movies')
  }
}