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
METADATA_TIMEOUT = 60


def get_ffmpeg_command(input_file, output_file, hls=False):
    cmd = ['ffmpeg', '-y']
    
    cmd += ['-analyzeduration', '2147483647', '-probesize', '2147483647']  # Augmente la durée d'analyse et la taille de sondage au maximum pour permettre une détection précise du format, surtout pour les fichiers complexes ou endommagés
    cmd += ['-i', input_file]
    
    if not hls:
        cmd += [
            '-profile:v', 'main',  # Utilise le profil "main" pour l'encodage H.264, offrant un bon équilibre entre efficacité de compression, qualité visuelle et compatibilité avec les appareils modernes
            '-level', '4.0',  # Définit le niveau de compatibilité H.264 à 4.0, garantissant la lecture sur la plupart des appareils tout en permettant une résolution et un débit suffisants
            '-pix_fmt', 'yuv420p',  # Utilise le format de pixel YUV 4:2:0, standard de l'industrie assurant une compatibilité maximale avec les lecteurs et navigateurs
            '-c:s', 'mov_text',  # Configure le codec de sous-titres au format mov_text, format natif pour les conteneurs MP4
            '-c:v', 'libx264',  # Utilise le codec vidéo H.264 (via libx264), offrant un excellent compromis entre qualité et taille de fichier
            '-preset', 'fast',  # Sélectionne le préréglage d'encodage "fast", privilégiant la vitesse d'encodage tout en maintenant une qualité visuelle satisfaisante
            '-crf', '23',  # Définit le facteur de qualité constante à 23 (échelle de 0 à 51, où 0 est sans perte et 51 la qualité la plus basse), offrant un bon équilibre entre qualité et taille
            '-c:a', 'aac',  # Utilise le codec audio AAC, standard de l'industrie pour la compression audio numérique avec une excellente qualité à des débits modérés
            '-b:a', '128k',  # Fixe le débit audio à 128 kilobits par seconde, offrant une bonne qualité pour la plupart des contenus tout en limitant la taille du fichier
            '-f', 'mp4'  # Force explicitement le format de conteneur de sortie à MP4, garantissant la compatibilité avec la majorité des lecteurs et plateformes
        ]
    else:
        cmd += [
            '-c:v', 'libx264',  # Utilise le codec vidéo H.264 (via libx264), standard de l'industrie pour le streaming adaptatif
            '-preset', 'veryfast',  # Utilise le préréglage d'encodage "veryfast" pour accélérer considérablement le processus d'encodage, crucial pour les applications de streaming en temps réel
            '-crf', '23',  # Maintient un facteur de qualité constante de 23, garantissant une qualité visuelle satisfaisante tout en limitant le débit
            '-profile:v', 'baseline',  # Utilise le profil "baseline" de H.264, le plus compatible mais moins efficace, pour assurer la lecture sur les appareils anciens ou à faible puissance
            '-level', '3.0',  # Définit un niveau de compatibilité H.264 plus bas (3.0) pour maximiser la compatibilité avec tous les types d'appareils, y compris mobiles
            '-pix_fmt', 'yuv420p',  # Utilise le format de pixel YUV 4:2:0, assurant une compatibilité universelle pour le streaming adaptatif
            '-c:a', 'aac',  # Utilise le codec audio AAC, standard pour le streaming adaptatif offrant un bon équilibre entre qualité et débit
            '-b:a', '128k',  # Fixe le débit audio à 128 kilobits par seconde, adapté pour le streaming sur différentes conditions de réseau
            '-ac', '2',  # Configure l'audio en stéréo (2 canaux), format le plus compatible et suffisant pour la plupart des contenus
            '-hls_time', '4',  # Définit la durée de chaque segment HLS à 4 secondes, un bon compromis entre réactivité du streaming et surcharge serveur
            '-hls_list_size', '0',  # Conserve tous les segments dans la playlist (0 = illimité), permettant la lecture complète du média après le chargement
            '-hls_segment_type', 'mpegts',  # Utilise le format MPEG Transport Stream pour les segments, offrant une meilleure compatibilité et récupération d'erreur
            '-hls_playlist_type', 'event',  # Configure la playlist en mode "event", permettant d'ajouter des segments au fur et à mesure sans modifier les segments existants
            '-hls_flags', 'independent_segments',  # Garantit que chaque segment est décodable indépendamment, améliorant les performances de recherche et la récupération d'erreur
            '-f', 'hls',  # Spécifie explicitement le format de sortie HLS (HTTP Live Streaming), le standard d'Apple pour le streaming adaptatif
            '-map', '0:v:0',  # Sélectionne uniquement le premier flux vidéo du fichier source pour l'inclure dans la sortie
            '-map', '0:a:0?',  # Tente d'inclure le premier flux audio du fichier source (le '?' rend cette sélection optionnelle en cas d'absence)
            '-max_muxing_queue_size', '4096'  # Augmente la taille de la file d'attente de multiplexage pour éviter les erreurs avec les fichiers volumineux ou complexes
        ]

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



async def is_file_readable(file_path):
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-show_entries', 'format=duration',  # Extrait uniquement la durée du fichier pour vérifier sa lisibilité
        '-of', 'default=noprint_wrappers=1:nokey=1',  # Format de sortie simplifié sans en-têtes ni noms de clés
        file_path
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        return proc.returncode == 0 and bool(stdout.strip())
    except Exception as e:
        logging.error(f"Erreur lors de la vérification du fichier {file_path}: {e}")
        return False



async def convert_to_hls(input_path, output_dir, stream_id):
    output_path = os.path.join(output_dir, "stream.m3u8")
    command = get_ffmpeg_command(input_path, output_path, hls=True)
    
    try:
        proc = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        error_output = stderr.decode()
        
        if proc.returncode == 0:
            logging.info(f"HLS généré avec succès pour {stream_id}")
            return True
        elif "moov atom not found" in error_output:
            logging.warning(f"Moov atom non trouvé pour {stream_id} - fichier partiellement téléchargé")
            return False
        else:
            logging.error(f"Erreur FFmpeg : {error_output}")
            return False
    except Exception as e:
        logging.error(f"Erreur lors de l'exécution de FFmpeg : {str(e)}")
        return False



async def hls_conversion_task(redis_client, stream_id, video_file, hls_path, imdb_id, name):
    try:
        if not os.path.exists(video_file):
            logging.info(f"Fichier {video_file} n'existe pas encore")
            return False
            
        if not await is_file_readable(video_file):
            logging.info(f"Fichier {video_file} pas encore lisible (moov atom probablement manquant)")
            return False
            
        external_subs = await download_external_subs(imdb_id, name, stream_id)
        logging.info(f"Sous-titres download: {external_subs}")
        
        success = await convert_to_hls(video_file, hls_path, stream_id)
        if success:
            await redis_client.set(f'stream:{stream_id}:hls_started', '1')
            logging.info(f"Conversion HLS réussie pour {stream_id}")
            return True
        
        logging.info(f"Conversion HLS échouée pour {stream_id}, sera retentée plus tard")
        return False
    except Exception as e:
        logging.error(f"Erreur conversion HLS: {str(e)}")
        return False
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

        metadata_start_time = asyncio.get_event_loop().time()
        while not handle.has_metadata():
            if asyncio.get_event_loop().time() - metadata_start_time > METADATA_TIMEOUT:
                raise Exception(f"Timeout: Metadata non récupérée pour {stream_id} après {METADATA_TIMEOUT} secondes")
            await asyncio.sleep(0.1)

        torrent_info = handle.get_torrent_info()
        folder_name = os.path.join(download_path, torrent_info.name())
        logging.info(f"Nom du dossier/fichier principal du torrent: {folder_name}")
        video_file = None
        for f in handle.get_torrent_info().files():
            if f.path.endswith(('.mp4', '.mkv', '.avi')):
                video_file = os.path.join(download_path, f.path)
                logging.info(f"Fichier vidéo principal identifié: {video_file} (chemin relatif dans le torrent: {f.path})")
                break
        if not video_file:
            raise Exception("Aucun fichier vidéo trouvé dans le torrent")

        hls_task = None
        hls_retry_interval = 5
        last_hls_attempt = 0
        
        while not handle.status().is_seeding:
            status = handle.status()
            progress = int(status.progress * 100)
            asyncio.create_task(update_progress(r, stream_id, progress))
            current_time = asyncio.get_event_loop().time()
            if not await r.exists(f'stream:{stream_id}:hls_started') and current_time - last_hls_attempt >= hls_retry_interval:
                if hls_task and hls_task.done():
                    try:
                        hls_success = hls_task.result()
                        if not hls_success:
                            hls_task = None
                    except Exception:
                        hls_task = None
                if not hls_task and progress >= 5:
                    if not await is_file_readable(video_file):
                        logging.info(f"Fichier {video_file} pas encore lisible (moov atom probablement manquant), attente du téléchargement complet.")
                        if progress < 100:
                            await asyncio.sleep(1)
                            continue

                    logging.info(f"Tentative de conversion HLS à {progress}% pour {stream_id}")
                    last_hls_attempt = current_time
                    hls_task = asyncio.create_task(
                        hls_conversion_task(r, stream_id, video_file, hls_path, imdb_id, name)
                    )

            await asyncio.sleep(1)
        
        extracted_subs = await extract_subtitles(os.path.join(download_path, handle.get_torrent_info().name()), download_path)
        logging.info(f"Sous-titres extraits: {extracted_subs}")
        
        await r.set(f'stream:{stream_id}:status', 'converting')
        await convert_to_mp4(video_file, download_path, stream_id)

        await r.set(f'stream:{stream_id}:status', 'complete')
        await update_progress(r, stream_id, 101)
        if os.path.exists(folder_name):
            shutil.rmtree(folder_name)
            logging.info(f"Dossier de téléchargement supprimé pour {stream_id}")
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