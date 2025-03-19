import libtorrent as lt
import redis
import os
import json
import asyncio
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def handle_torrent(magnet: str, stream_id: str):
    try:
        ses = lt.session()
        ses.listen_on(6881, 6891)
        
        params = lt.parse_magnet_uri(magnet)
        params.save_path = f"/data/{stream_id}"
        params.storage_mode = lt.storage_mode_t.storage_mode_sparse


        handle = ses.add_torrent(params)
        handle.set_sequential_download(True)
        
        logging.info(f"Début du téléchargement: {handle.name()}")

        while not handle.has_metadata():
            await asyncio.sleep(0.1)

        r = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'))
        
        while handle.status().state != lt.torrent_status.seeding:
            status = handle.status()
            progress = int(status.progress * 100)
            
            r.setex(f'stream:{stream_id}:progress', 30, progress)
            
            if progress >= 5 and not r.exists(f'stream:{stream_id}:started'):
                r.set(f'stream:{stream_id}:started', '1')
                logging.info(f"Prêt pour le streaming: {progress}%")
                
            await asyncio.sleep(1)

        r.set(f'stream:{stream_id}:url', f"/stream/{stream_id}/{handle.name()}")
        logging.info(f"Téléchargement complet: {handle.name()}")

    except Exception as e:
        logging.error(f"Erreur avec {magnet}: {str(e)}")
        r.delete(f'stream:{stream_id}:progress')

async def main():
    r = redis.Redis(host=os.getenv('REDIS_HOST', 'redis'))
    pubsub = r.pubsub()
    pubsub.subscribe('torrent:start')

    logging.info("Service Torrent prêt")

    while True:
        message = pubsub.get_message(ignore_subscribe_messages=True)
        if message:
            try:
                data = json.loads(message['data'])
                asyncio.create_task(
                    handle_torrent(
                        data['magnet'], 
                        data['streamId']
                    )
                )
            except json.JSONDecodeError:
                logging.error("Message Redis invalide")
        
        await asyncio.sleep(0.1)


if __name__ == "__main__":
    Path("./data").mkdir(exist_ok=True)
    
    asyncio.run(main())