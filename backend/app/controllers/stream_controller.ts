import Redis from '@adonisjs/redis/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'

export default class StreamController {
  public async start({ request, response, auth }: HttpContext) {
    const { magnet, streamId } = request.only(['magnet', 'streamId'])

    try {
      const check = await auth.check();
      if (!check) {
          throw new Error('unauthorized');
      }
      await Redis.publish('torrent:start', JSON.stringify({
        streamId,
        magnet
      }))
  
      return response.json({
        id: streamId,
        statusUrl: `/stream/${streamId}/status`
      })
    } catch (error) {
      return response.status(500).json({
        error: 'Error starting download'
      })
    }
  }

  public async status({ params, response, auth }: HttpContext) {
    const streamId = params.id;
    
    try {
      const check = await auth.check();
      if (!check) {
          throw new Error('unauthorized');
      }
      const status = {
      progress: await Redis.get(`progress:${streamId}`),
      status: await Redis.get(`stream:${streamId}:status`)
    };
    return response.json(status);
    } catch (error) {
      return response.status(500).json({
        error: 'Error fetching stream status'
      });
    }
  }

  public async getAllStreams({ response, auth }: HttpContext) {
    try {
      const check = await auth.check();
      if (!check) {
        throw new Error('unauthorized');
      }
      const keys = await Redis.keys('stream:*:status');
      
      const streamIds = keys.map(key => {
        const parts = key.split(':');
        return parts.length > 1 ? parts[1] : null;
      }).filter(id => id !== null);
      
      const streams = await Promise.all(
        streamIds.map(async (id) => {
          return {
            id,
            progress: await Redis.get(`progress:${id}`),
            status: await Redis.get(`stream:${id}:status`),
          };
        })
      );
      
      return response.json({ streams });
    } catch (error) {
      return response.status(500).json({
        error: 'Error fetching all streams'
      });
    }
  }

  public async videomp4({ params, response, request }: HttpContext) {
    const dataDir = process.env.DATA_DIR || '/back/data';
    const mp4Path = path.join(dataDir, params.id, 'video.mp4');
    try {
      // const check = await auth.check();
      // if (!check) {
      //     throw new Error('unauthorized');
      // }
      await fs.access(mp4Path);
      const stats = await fs.stat(mp4Path);
      const fileSize = stats.size;

      const range = request.header('range');
      if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      
      response.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      response.header('Accept-Ranges', 'bytes');
      response.header('Content-Length', chunkSize.toString());
      response.header('Content-Type', 'video/mp4');
      response.status(206);
      
      const fileStream = createReadStream(mp4Path, { start, end });
        return response.stream(fileStream);
      }

      response.header('Content-Type', 'video/mp4');
      response.header('Content-Length', fileSize.toString());
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
    const dataDir = process.env.DATA_DIR || '/back/data';
    const streamPath = path.join(dataDir, 'hls', params.id, 'stream.m3u8');

    try {
      // const check = await auth.check();
      // if (!check) {
      //     throw new Error('unauthorized');
      // }
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

  public async isAvailable({ params, response, auth }: HttpContext) {
    const dataDir = process.env.DATA_DIR || '/back/data';
    const mp4Path = path.join(dataDir, params.id, 'video.mp4');
    const hlsPath = path.join(dataDir, 'hls', params.id, 'stream.m3u8');
    
    try {
      const check = await auth.check();
      if (!check) {
          throw new Error('unauthorized');
      }
      const mp4Exists = await fs.access(mp4Path).then(() => true).catch(() => false);
      const hlsExists = await fs.access(hlsPath).then(() => true).catch(() => false);

      if (mp4Exists ||  hlsExists) {
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
    } catch (error) {
      return response.notFound({
        error: 'Video not ready yet',
      });
    }
  }

  public async videoSegment({ params, response }: HttpContext) {
    const dataDir = process.env.DATA_DIR || '/back/data';
    const segmentPath = path.join(dataDir, 'hls', params.streamId, `${params.segment}.ts`);

    try {
      // const check = await auth.check();
      // if (!check) {
      //     throw new Error('unauthorized');
      // }
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
    const dataDir = process.env.DATA_DIR || '/back/data';
    const subtitlesPath = path.join(dataDir, 'hls', params.streamId, 'subtlist-en.m3u8');
  
    try {
      // const check = await auth.check();
      // if (!check) {
      //     throw new Error('unauthorized');
      // }
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
    const dataDir = process.env.DATA_DIR || '/back/data';
    const vttPath = path.join(dataDir, params.streamId, params.file);
  
    try {
      // const check = await auth.check();
      // if (!check) {
      //     throw new Error('unauthorized');
      // }
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

  public async subtitlesList({ params, response, auth }: HttpContext) {
    const dataDir = process.env.DATA_DIR || '/back/data';
    const subtitlesDir = path.join(dataDir, params.streamId);
    
    try {
      const check = await auth.check();
      if (!check) {
          throw new Error('unauthorized');
      }
      await fs.access(subtitlesDir); 
      const files = await fs.readdir(subtitlesDir);
      const subtitlesArray = files.filter(file => file.endsWith('.vtt'));
  
      return response.json({ subtitles: subtitlesArray });
    } catch (error) {
      return response.notFound({
        error: 'Subtitles directory not found',
      });
    }
  }


  public async getTorrentsList({ params, response, auth }: HttpContext) {
    const title = params.title;

    if (!title) {
      return response.badRequest({ error: 'Movie title is required' });
    }
    const providersMap: Record<string, string> = {
      '1337x': `http://torrent-search:3001/api/1337x/${title}`,
      'torlock': `http://torrent-search:3001/api/torlock/${title}`,
      'piratebay': `http://torrent-search:3001/api/piratebay/${title}`,
      'rarbg': `http://torrent-search:3001/api/rarbg/${title}`,
      'bitsearch': `http://torrent-search:3001/api/bitsearch/${title}`,
      'glodls': `http://torrent-search:3001/api/glodls/${title}`,
      'torrentproject': `http://torrent-search:3001/api/torrentproject/${title}`,
    };

    const results: Record<string, any[]> = {};

    const check = await auth.check();
    if (!check) {
        throw new Error('unauthorized');
    }
    await Promise.all(
      Object.entries(providersMap).map(async ([provider, url]) => {
        try {
          const apiResponse = await fetch(url);

          if (apiResponse.ok) {
            const data = await apiResponse.json();
            results[provider] = Array.isArray(data) ? data : [data];
            console.log(`Fetched ${provider} data:`, results[provider]);
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
  