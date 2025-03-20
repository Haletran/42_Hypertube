import logging
import libtorrent as lt
import os
import json
import asyncio
import subprocess
from pathlib import Path
import redis

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

DOWNLOAD_DIR = "./data"
HLS_DIR = "./data/hls"
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')

async def convert_to_hls(input_path, output_dir, stream_id):
    """Convertir un fichier en HLS avec ffmpeg"""
    output_path = os.path.join(output_dir, "stream.m3u8")
    
    command = [
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-hls_time', '10',
        '-hls_playlist_type', 'event',
        '-hls_flags', 'independent_segments',
        '-f', 'hls',
        output_path
    ]
    
    try:
        proc = await asyncio.create_subprocess_exec(*command)
        await proc.wait()
        
        if proc.returncode == 0:
            logging.info(f"HLS généré pour {stream_id}")
            return True
        return False
        
    except Exception as e:
        logging.error(f"Erreur conversion HLS: {str(e)}")
        return False

async def handle_torrent(magnet: str, stream_id: str):
    r = redis.Redis(host=REDIS_HOST)
    try:
        download_path = os.path.join(DOWNLOAD_DIR, stream_id)
        hls_path = os.path.join(HLS_DIR, stream_id)
        Path(download_path).mkdir(parents=True, exist_ok=True)
        Path(hls_path).mkdir(parents=True, exist_ok=True)
        
        ses = lt.session()
        params = {
            'save_path': download_path,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
            'url': magnet
        }
        
        handle = ses.add_torrent(params)
        handle.set_sequential_download(True)
        
        logging.info(f"Début du téléchargement: {stream_id}")
        r.set(f'stream:{stream_id}:status', 'downloading')

        while not handle.has_metadata():
            await asyncio.sleep(0.1)

        video_file = None
        for f in handle.get_torrent_info().files():
            if f.path.endswith(('.mp4', '.mkv', '.avi')):
                print(f.path)
                video_file = os.path.join(download_path, f.path)
                break

        if not video_file:
            raise Exception("Aucun fichier vidéo trouvé dans le torrent")

        while not handle.status().is_seeding:
            status = handle.status()
            progress = int(status.progress * 100)
            
            r.setex(f'stream:{stream_id}:progress', 30, progress)
            
            if progress >= 5 and not r.exists(f'stream:{stream_id}:hls_started'):
                if os.path.exists(video_file):
                    success = await convert_to_hls(video_file, hls_path, stream_id)
                    if success:
                        r.set(f'stream:{stream_id}:hls_started', '1')
                        r.set(f'stream:{stream_id}:url', f"/hls/{stream_id}/stream.m3u8")
            
            await asyncio.sleep(1)

        await convert_to_hls(video_file, hls_path, stream_id)
        r.set(f'stream:{stream_id}:status', 'complete')
        logging.info(f"Téléchargement complet: {stream_id}")

    except Exception as e:
        logging.error(f"Erreur avec {stream_id}: {str(e)}")
        r.set(f'stream:{stream_id}:status', 'error')
        r.set(f'stream:{stream_id}:error', str(e))
    finally:
        ses.remove_torrent(handle)

async def main():
    r = redis.Redis(host=REDIS_HOST)
    pubsub = r.pubsub()
    pubsub.subscribe('torrent:start')

    logging.info("Service HLS Torrent prêt")

    while True:
        message = pubsub.get_message(ignore_subscribe_messages=True)
        if message:
            try:
                data = json.loads(message['data'])
                asyncio.create_task(
                    handle_torrent(data['magnet'], data['streamId'])
                )
                logging.info(f"Nouveau torrent: {data['streamId']}")
            except Exception as e:
                logging.error(f"Erreur message Redis: {str(e)}")
        
        await asyncio.sleep(0.1)

if __name__ == "__main__":
    Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(HLS_DIR).mkdir(parents=True, exist_ok=True)
    asyncio.run(main())