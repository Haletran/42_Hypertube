import logging
import libtorrent as lt
import os
import json
import asyncio
import subprocess
from pathlib import Path
import aioredis
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

def detect_hardware_acceleration():
    """Détecte les capacités d'accélération matérielle disponibles"""
    try:
        if shutil.which('nvidia-smi'):
            return 'nvidia'
        if os.path.exists('/dev/dri/renderD128'):
            return 'intel'
        if os.path.exists('/dev/kfd'):
            return 'amd'
        if subprocess.check_output(['uname', '-m']).decode().strip() == 'arm64':
            return 'apple'
    except Exception:
        pass
    return 'software'

def get_ffmpeg_command(input_file, output_file, hls=False):
    """Génère la commande FFmpeg optimisée pour le hardware"""
    hw_type = detect_hardware_acceleration()
    
    base_params = {
        'nvidia': {
            'vcodec': 'h264_nvenc',
            'params': ['-preset', 'p6', '-cq', '23', '-rc-lookahead', '0']
        },
        'intel': {
            'vcodec': 'h264_qsv',
            'params': ['-global_quality', '23', '-look_ahead', '0']
        },
        'amd': {
            'vcodec': 'h264_amf',
            'params': ['-quality', 'speed', '-rc', 'cqp', '-qp_i', '23', '-qp_p', '23']
        },
        'apple': {
            'vcodec': 'h264_videotoolbox',
            'params': ['-q:v', '75']
        },
        'software': {
            'vcodec': 'libx264' if not hls else 'libx264',
            'params': ['-preset', 'fast', '-crf', '23'] if not hls else ['-preset', 'fast']
        }
    }

    config = base_params.get(hw_type, base_params['software'])
    cmd = ['ffmpeg', '-y']

    if hw_type != 'software':
        cmd += ['-hwaccel', 'auto']

    cmd += ['-i', input_file]
    
    if not hls:
        cmd += [
            '-profile:v', 'main',
            '-level', '4.0',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-c:s', 'mov_text'
            
        ]

    cmd += ['-c:v', config['vcodec']] + config['params']
    cmd += ['-c:a', 'aac', '-b:a', '128k']

    if hls:
        cmd += [
            '-hls_time', '5',
            '-hls_playlist_type', 'event',
            '-hls_flags', 'independent_segments',
            '-f', 'hls',
            '-map', '0',
            '-force_key_frames', 'expr:gte(t,n_forced*2)',
            '-max_muxing_queue_size', '1024'
        ]
    else:
        cmd += ['-f', 'mp4']

    #cmd += ['-threads', '7']
    cmd.append(output_file)
    return cmd

async def update_progress(redis_client, stream_id, progress):
    try:
        logging.info(f"Progression mise à jour pour {stream_id}: {progress}%")
        await redis_client.setex(f"progress:{stream_id}", 3600, str(progress))
    except Exception as e:
        logging.error(f"Erreur mise à jour progression: {str(e)}")

async def extract_subtitles(path, output_dir):
    extracted = []
    existing_files = set(os.listdir(output_dir))

    logging.info(f"Recherche de fichiers de sous-titres dans {path}")
    for root, _, files in os.walk(path):
        for file in files:
            if file.endswith('.srt') or file.endswith('.vtt'):
                logging.info(f"Sous-titre trouvé: {file}")
                count = 1
                vtt_path = os.path.join(output_dir, f"subtitles-original-{count}.vtt")
                while os.path.basename(vtt_path) in existing_files:
                    count += 1
                    vtt_path = os.path.join(output_dir, f"subtitles-original-{count}.vtt")
                
                if file.endswith('.srt'):
                    logging.info(f"Conversion du fichier SRT: {file} en VTT")
                    await convert_subtitle(os.path.join(root, file), vtt_path)
                else:
                    logging.info(f"Copie du fichier VTT: {file}")
                    shutil.copy(os.path.join(root, file), vtt_path)
                
                extracted.append((f"original-{count}", vtt_path))
                existing_files.add(os.path.basename(vtt_path))

    logging.info(f"Sous-titres extraits: {extracted}")
    return extracted

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
    downloaded_subs = []
    try:
        BASE_URL = "https://yts-subs.com"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
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

async def convert_to_hls(input_path, output_dir, stream_id, max_retries=3, retry_delay=5):
    output_path = os.path.join(output_dir, "stream.m3u8")
    command = get_ffmpeg_command(input_path, output_path, hls=True)
    
    attempt = 0
    while attempt < max_retries:
        attempt += 1
        logging.info(f"Tentative {attempt}/{max_retries} pour générer le HLS pour {stream_id}")
        try:
            proc = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await proc.communicate()
            if proc.returncode == 0:
                logging.info(f"HLS généré avec succès pour {stream_id}")
                return True
            else:
                logging.error(f"Erreur FFmpeg (tentative {attempt}): {stderr.decode()}")
        except Exception as e:
            logging.error(f"Erreur lors de l'exécution de FFmpeg (tentative {attempt}): {str(e)}")
        if attempt < max_retries:
            logging.info(f"Réessai dans {retry_delay} secondes...")
            await asyncio.sleep(retry_delay)
    
    logging.error(f"Échec de la conversion HLS après {max_retries} tentatives pour {stream_id}")
    return False

async def hls_conversion_task(redis_client, stream_id, video_file, hls_path, imdb_id, name):
    try:
        if os.path.exists(video_file):
            external_subs = await download_external_subs(imdb_id, name, stream_id)
            logging.info(f"Sous-titres download: {external_subs}")
            success = await convert_to_hls(video_file, hls_path, stream_id)
            if success:
                await redis_client.set(f'stream:{stream_id}:hls_started', '1')
    except Exception as e:
        logging.error(f"Erreur conversion HLS: {str(e)}")
        await redis_client.set(f'stream:{stream_id}:error', str(e))
    finally:
        await redis_client.delete(f'stream:{stream_id}:hls_processing')

async def convert_to_mp4(video_file, download_path, stream_id):
    mp4_file = os.path.join(download_path, "video.mp4")
    convert_cmd = get_ffmpeg_command(video_file, mp4_file)

    try:
        proc = await asyncio.create_subprocess_exec(
            *convert_cmd,
            stderr=asyncio.subprocess.PIPE
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            logging.error(f"Erreur FFmpeg: {stderr.decode()}")
            raise Exception(f"Échec de conversion: {stderr.decode()}")
    except Exception as e:
        logging.error(f"Échec de conversion pour {stream_id}: {str(e)}")
        raise

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

    r = await aioredis.from_url(f"redis://{REDIS_HOST}")
    
    try:
        download_path = os.path.join(DOWNLOAD_DIR, stream_id)
        hls_path = os.path.join(HLS_DIR, stream_id)
        Path(download_path).mkdir(parents=True, exist_ok=True)
        Path(hls_path).mkdir(parents=True, exist_ok=True)
        
        ses = lt.session()
        params = {
            'save_path': download_path,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
            'url': magnet,
        }
        
        handle = ses.add_torrent(params)
        handle.set_sequential_download(True)
        
        logging.info(f"Début du téléchargement: {stream_id}")
        await r.set(f'stream:{stream_id}:status', 'downloading')

        while not handle.has_metadata():
            await asyncio.sleep(0.1)

        video_file = None
        for f in handle.get_torrent_info().files():
            if f.path.endswith(('.mp4', '.mkv', '.avi')):
                video_file = os.path.join(download_path, f.path)
                break

        if not video_file:
            raise Exception("Aucun fichier vidéo trouvé dans le torrent")

        hls_task = None
        max_retries = 1800
        retries = 0

        while not handle.status().is_seeding and retries < max_retries:
            status = handle.status()
            progress = int(status.progress * 101)
            asyncio.create_task(update_progress(r, stream_id, progress))

            if progress >= 5 and not await r.exists(f'stream:{stream_id}:hls_started'):
                if not hls_task and video_file:
                    hls_task = asyncio.create_task(
                        hls_conversion_task(r, stream_id, video_file, hls_path, imdb_id, name)
                    )
            
            await asyncio.sleep(1)
            retries += 1

        if retries >= max_retries:
            logging.error(f"Timeout reached for torrent {stream_id}. Exiting loop.")

        extracted_subs = await extract_subtitles(os.path.join(download_path, handle.get_torrent_info().name()), download_path)
        logging.info(f"Sous-titres extraits: {extracted_subs}")
        
        await r.set(f'stream:{stream_id}:status', 'converting')
        await convert_to_mp4(video_file, download_path, stream_id)

        await r.set(f'stream:{stream_id}:status', 'complete')
        logging.info(f"Téléchargement complet: {stream_id}")
        if hls_task and not hls_task.done():
            hls_task.cancel()
            try:
                await asyncio.wait_for(hls_task, timeout=5)
            except asyncio.TimeoutError:
                logging.warning(f"HLS task for {stream_id} did not finish in time and was forcefully canceled.")
            except asyncio.CancelledError:
                logging.info(f"HLS task for {stream_id} was cancelled.")
            await asyncio.sleep(1)
        if os.path.exists(hls_path):
            shutil.rmtree(hls_path)
            logging.info(f"Dossier HLS supprimé pour {stream_id}")

    except Exception as e:
        logging.error(f"Erreur avec {stream_id}: {str(e)}")
        await r.set(f'stream:{stream_id}:status', 'error')
        await r.set(f'stream:{stream_id}:error', str(e))
    finally:
        ses.remove_torrent(handle)

async def main():
    r = await aioredis.from_url(f"redis://{REDIS_HOST}")
    pubsub = r.pubsub()
    await pubsub.subscribe('torrent:start')

    logging.info("Service HLS Torrent prêt")

    while True:
        message = await pubsub.get_message(ignore_subscribe_messages=True)
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