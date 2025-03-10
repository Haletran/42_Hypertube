import { BaseModel, column, hasMany} from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Comment from './comment.js'
import Movie from './movie.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare prefered_languages: string

  @column()
  declare profile_picture: string | null

  @hasMany(() => Movie)
  declare alreadyWatched: HasMany<typeof Movie>

  @hasMany(() => Comment)
  declare comments: HasMany<typeof Comment>
}