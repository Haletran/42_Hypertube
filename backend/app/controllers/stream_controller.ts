import Redis from '@adonisjs/redis/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs/promises'
import path from 'path'

export default class StreamController {
  public async start({ request, response }) {
    const { magnet } = request.only(['magnet'])
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    await Redis.publish('torrent:start', JSON.stringify({
      streamId,
      magnet
    }))

    return response.json({
      id: streamId,
      statusUrl: `/stream/${streamId}/status`
    })
  }

  public async status({ params, response }) {
    const progress = await Redis.get(`stream:${params.id}:progress`)
    return response.json({
      status: progress ? 'processing' : 'pending',
      progress: progress || 0
    })
  }

  public async video({ params, response }: HttpContext) {
    const streamPath = path.join(
      'app/shared-data', 
      params.id,
      'Sintel',
      'Sintel.mp4'
    )

    try {
      await fs.access(streamPath)
      return response.download(streamPath)
    } catch (error) {
      return response.notFound({
        message: error.message,
        error: 'Video not ready yet',
        details: `Path: ${streamPath}`
      })
    }
  }
}