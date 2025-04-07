import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Movie extends BaseModel  {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare  name: string | null

    @column()
    declare timecode: string | null

    @column()
    declare already_watched: boolean | null
}