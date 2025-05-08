import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

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

  @column()
  declare createdAt: Date
  
  @belongsTo(() => User)
  declare user: BelongsTo <typeof User>
}