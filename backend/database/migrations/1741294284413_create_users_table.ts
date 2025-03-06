import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Users extends BaseSchema {
  public async up() {
    this.schema.createTable('users', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email').unique().notNullable()
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable('users')
  }
}
