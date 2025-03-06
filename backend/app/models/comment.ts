import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Movie from './movie.js'
import User from './user.js'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare content: string

  @column()
  declare movieId: number

  @column()
  declare userId: number

  @belongsTo(() => Movie)
  declare movie: BelongsTo <typeof Movie>

  @belongsTo(() => User)
  declare user: BelongsTo <typeof User>
}