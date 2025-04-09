import Redis from '@adonisjs/redis/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { request } from 'http'
import { ALL } from 'dns'

export default class StreamController {
  public async start({ request, response }: HttpContext) {
    const { magnet, streamId } = request.only(['magnet', 'streamId'])

    // let magnet = "magnet:?xt=urn:btih:79816060ea56d56f2a2148cd45705511079f9bca&dn=TPB.AFK.2013.720p.h264-SimonKlose&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969"
    // let streamId = "50275"
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
    const streamId = params.id;
    
    const status = {
      progress: await Redis.get(`progress:${streamId}`),
      // hls_started: await Redis.get(`stream:${streamId}:hls_started`),
      // hls_processing: await Redis.get(`stream:${streamId}:hls_processing`),
      // url: await Redis.get(`stream:${streamId}:url`),
      // subtitles: await Redis.smembers(`stream:${streamId}:subtitles`),
      status: await Redis.get(`stream:${streamId}:status`)
    };
  
    return response.json(status);
  }

  public async videomp4({ params, response }: HttpContext) {
    const mp4Path = path.join('data', params.id, 'video.mp4');
    try {
      await fs.access(mp4Path);

      response.header('Content-Type', 'video/mp4');
      response.header('Cache-Control', 'no-cache');
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Accept-Ranges', 'bytes');
      
      return response.stream(createReadStream(mp4Path));
    }
    catch (error) {
      return response.notFound({
        real_error: error,
        error: 'Video not ready yet',
        progress: await Redis.get(`stream:${params.id}:progress`) || 0,
      });
    }
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

  public async isAvailable({ params, response }: HttpContext) {
    const mp4Path = path.join('data', params.id, 'video.mp4');
    const hlsPath = path.join('data', 'hls', params.id, 'stream.m3u8');
    
    try {
      const mp4Exists = await fs.access(mp4Path).then(() => true).catch(() => false);
      const hlsExists = await fs.access(hlsPath).then(() => true).catch(() => false);

      if (mp4Exists && hlsExists) {
        return response.json({ message: 'Video is available' });
      } else {
        return response.notFound({
          error: 'Video not ready yet',
          missing: {
            mp4: !mp4Exists,
            hls: !hlsExists,
          },
        });
      }

      return response.json({ message: 'Video is available' });
    } catch (error) {
      return response.notFound({
        error: 'Video not ready yet',
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

  public async subtitles({ params, response }: HttpContext) {
    const subtitlesPath = path.join('data', 'hls', params.streamId, 'subtlist-en.m3u8');
  
    try {
      await fs.access(subtitlesPath); 
  
      response.header('Content-Type', 'application/vnd.apple.mpegurl');
      response.header('Cache-Control', 'no-cache');
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Accept-Ranges', 'bytes');
      
      return response.stream(createReadStream(subtitlesPath));
    } catch (error) {
      return response.notFound({
        error: 'Subtitles not found',
      });
    }
  }

  public async subtitlesFile({ params, response }: HttpContext) {

    const vttPath = path.join('data', params.streamId, params.file);
  
    try {
      await fs.access(vttPath);
      response.header('Content-Type', 'text/vtt');
      response.header('Cache-Control', 'no-cache');
      response.header('Access-Control-Allow-Origin', '*');
      return response.download(vttPath);
    } catch (error) {
      return response.notFound({
        error: 'Subtitle file not found',
      });
    }
  }
  
  public async getTorrentsList({ params, response }: HttpContext) {
    const title = params.title;

    if (!title) {
      return response.badRequest({ error: 'Movie title is required' });
    }

    const providersMap: Record<string, string> = {
      '1337x': `https://itorrentsearch.vercel.app/api/1337x/${title}`,
      'yts': `https://itorrentsearch.vercel.app/api/yts/${title}`,
      'eztv': `https://itorrentsearch.vercel.app/api/eztv/${title}`,
      'tgx': `https://itorrentsearch.vercel.app/api/tgx/${title}`,
      'torlock': `https://itorrentsearch.vercel.app/api/torlock/${title}`,
      'piratebay': `https://itorrentsearch.vercel.app/api/piratebay/${title}`,
      'nyaasi': `https://itorrentsearch.vercel.app/api/nyaasi/${title}`,
      'rarbg': `https://itorrentsearch.vercel.app/api/rarbg/${title}`,
      'kickass': `https://itorrentsearch.vercel.app/api/kickass/${title}`,
      'bitsearch': `https://itorrentsearch.vercel.app/api/bitsearch/${title}`,
      'glodls': `https://itorrentsearch.vercel.app/api/glodls/${title}`,
      'limetorrent': `https://itorrentsearch.vercel.app/api/limetorrent/${title}`,
      'torrentfunk': `https://itorrentsearch.vercel.app/api/torrentfunk/${title}`,
      'torrentproject': `https://itorrentsearch.vercel.app/api/torrentproject/${title}`,
    };

    const results: Record<string, any[]> = {};

    await Promise.all(
      Object.entries(providersMap).map(async ([provider, url]) => {
        try {
          const apiResponse = await fetch(url);

          if (apiResponse.ok) {
            const data = await apiResponse.json();
            results[provider] = Array.isArray(data) ? data : [data];
          } else {
            results[provider] = [{ error: `Failed with status ${apiResponse.status}` }];
          }
        } catch (error) {
          results[provider] = [{ error: error.message }];
        }
      })
    );
    return response.json(results);
  }
}
  