import Redis from '@adonisjs/redis/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'

export default class StreamController {
  public async start({ request, response }: HttpContext) {
    const { magnet } = request.only(['magnet'])
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    await Redis.publish('torrent:start', JSON.stringify({
      streamId,
      magnet
    }))

    return response.json({
      id: streamId,
      statusUrl: `/stream/${streamId}/status`
    })
  }

  public async status({ params, response }: HttpContext) {
    const progress = await Redis.get(`stream:${params.id}:progress`)
    return response.json({
      status: progress ? 'processing' : 'pending',
      progress: progress || 0
    })
  }

  public async video({ params, response }: HttpContext) {
    const streamPath = path.join('data', 'hls', params.id, 'stream.m3u8');

    try {
      await fs.access(streamPath); 

      response.header('Content-Type', 'application/vnd.apple.mpegurl');
      response.header('Cache-Control', 'no-cache');
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Accept-Ranges', 'bytes');
      
      return response.stream(createReadStream(streamPath)); 
    } catch (error) {
      return response.notFound({
        error: 'Video not ready yet',
        progress: await Redis.get(`stream:${params.id}:progress`) || 0,
      });
    }
  }

  public async videoSegment({ params, response }: HttpContext) {
    const segmentPath = path.join('data', 'hls', params.streamId, `${params.segment}.ts`);

    try {
      await fs.access(segmentPath);
      response.header('Content-Type', 'video/MP2T');
      response.header('Cache-Control', 'no-cache');
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Accept-Ranges', 'bytes');
      return response.stream(createReadStream(segmentPath));
    } catch (error) {
      return response.notFound({
        real_error: error,
        error: `Segment not found: ${params.segment}`,
      });
    }
  }
}
  