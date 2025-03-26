import logging
import libtorrent as lt
import os
import json
import asyncio
import subprocess
from pathlib import Path
from ffprobe import FFProbe
import redis
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import re
import base64
from io import BytesIO
import shutil
import tempfile
import zipfile

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

DOWNLOAD_DIR = "./data"
HLS_DIR = "./data/hls"
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')

async def extract_subtitles(video_path, output_dir, stream_id):
    """Extraire les sous-titres intégrés avec ffmpeg"""
    downloaded = []
    try:
        metadata = FFProbe(video_path)
        subs = [stream for stream in metadata.streams if stream.is_subtitle()]
        
        extracted = []
        for i, sub in enumerate(subs):
            lang = sub.tags.get('language', 'und')
            sub_ext = sub.codec_name
            sub_path = os.path.join(output_dir, f"subtitles-{lang}-original.{sub_ext}")
            
            command = [
                'ffmpeg',
                '-i', video_path,
                '-map', f'0:s:{i}',
                '-c', 'srt',
                sub_path
            ]
            
            proc = await asyncio.create_subprocess_exec(*command)
            await proc.wait()
            
            if proc.returncode == 0:
                if sub_ext != 'webvtt':
                    vtt_path = os.path.join(output_dir, f"subtitles-{lang}-original.vtt")
                    await convert_subtitle(sub_path, vtt_path)
                    extracted.append((lang, vtt_path))
                else:
                    extracted.append((lang, sub_path))
            
        return extracted
    except Exception as e:
        logging.error(f"Erreur extraction sous-titres: {str(e)}")
        return []

async def convert_subtitle(input_path, output_path):
    """Convertir un sous-titre en VTT"""
    command = [
        'ffmpeg',
        '-i', input_path,
        '-c', 'webvtt',
        output_path
    ]
    proc = await asyncio.create_subprocess_exec(*command)
    await proc.wait()
    return proc.returncode == 0

async def download_external_subs(imdb_id, title, stream_id):
    """Télécharger des sous-titres depuis yts-subs.com avec curl et extraction automatique"""
    downloaded_subs = []
    try:
        BASE_URL = "https://yts-subs.com"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        movie_url = f"{BASE_URL}/movie-imdb/tt{imdb_id}"
        session = requests.Session()
        response = session.get(movie_url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        count = 1
        for row in soup.select('table.other-subs tbody tr'):
            lang = row.select_one('.sub-lang').text.strip().lower()
            if lang not in ['english', 'french']:
                continue

            detail_link = row.select_one('a[href^="/subtitles/"]')['href']
            detail_url = f"{BASE_URL}{detail_link}"
            detail_resp = session.get(detail_url, headers=headers)
            detail_soup = BeautifulSoup(detail_resp.text, 'html.parser')
            
            download_btn = detail_soup.select_one('#btn-download-subtitle')
            if not download_btn:
                continue
            
            download_url = base64.b64decode(download_btn['data-link']).decode('utf-8')
            
            save_dir = f"./data/{stream_id}/"
            os.makedirs(save_dir, exist_ok=True)
            temp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(temp_dir, f"subtitles-{lang}-{count}.zip")
            
            curl_cmd = ["curl", "-L", "-o", zip_path, download_url]
            subprocess.run(curl_cmd, check=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            srt_files = [f for f in os.listdir(temp_dir) if f.lower().endswith('.srt')]
            if srt_files:
                srt_path = os.path.join(temp_dir, srt_files[0])
                vtt_path = os.path.join(save_dir, f"subtitles-{lang}-{count}.vtt")
                
                await convert_subtitle(srt_path, vtt_path)
                downloaded_subs.append((lang, vtt_path))
                count += 1
                
                logging.info(f"Sous-titres convertis et enregistrés: {vtt_path}")
            
            shutil.rmtree(temp_dir)
        
        return downloaded_subs
    except Exception as e:
        logging.error(f"Erreur téléchargement sous-titres: {str(e)}")
        return []

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
        '-master_pl_name', 'master.m3u8',
        '-var_stream_map', 'v:0,a:0',
        '-hls_subtitle_path', os.path.join(output_dir, 'subs'),
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
    response = requests.get(
        f"https://api.themoviedb.org/3/movie/{stream_id}/external_ids",
        params={"api_key": os.getenv('NEXT_PUBLIC_TMDB_API_KEY')}
    )
    imdb_id = response.json().get('imdb_id', '').replace('tt', '')
    name = response.json().get('original_title')
    logging.info(f"IMDB ID trouvé: {imdb_id}")
    if not imdb_id:
        logging.error(f"IMDB ID non trouvé pour TMDB ID {stream_id}")
        return

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
                    extracted_subs = await extract_subtitles(video_file, hls_path, stream_id)
                    external_subs = await download_external_subs(imdb_id, name, stream_id)
                    
                    all_subs = extracted_subs + external_subs
                    logging.info(f"Sous-titres extraits: {all_subs}")
                    for lang, sub_path in all_subs:
                        r.sadd(f'stream:{stream_id}:subtitles', f"/hls/{stream_id}/{os.path.basename(sub_path)}")
                    
                    success = await convert_to_hls(video_file, hls_path, stream_id)
                    if success:
                        r.set(f'stream:{stream_id}:hls_started', '1')
                        r.set(f'stream:{stream_id}:url', f"/hls/{stream_id}/stream.m3u8")
            
            await asyncio.sleep(1)

        mp4_file = os.path.join(download_path, "video.mp4")
        if not video_file.endswith('.mp4'):
            logging.info(f"Converting {video_file} to MP4")
            convert_cmd = [
                'ffmpeg',
                '-i', video_file,
                '-c:v', 'copy',
                '-c:a', 'copy',
                mp4_file
            ]
            proc = await asyncio.create_subprocess_exec(*convert_cmd)
            await proc.wait()
        else:
            shutil.copy2(video_file, mp4_file)

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
                logging.info(f"Message Redis: {data}")
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