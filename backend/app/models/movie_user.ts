import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Movie extends BaseModel  {
    static table = 'movie_user'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare user_id: number

    @column()
    declare movie_id: number

    @column()
    declare watched_timecode: string | null

    @column()
    declare original_timecode: string

}