"use client";

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function Player({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    let hls: Hls | null = null;

    async function loadSubtitles() {
      if (!video) return;
      let trackNumber = 1;
      let consecutiveErrors = 0;
      const MAX_ERRORS = 3;
      let defaultTrackSet = false;

      while (consecutiveErrors < MAX_ERRORS) {
        const enUrl = `http://localhost:3000/api/stream/${streamId}/subtitles-english-${trackNumber}.vtt`;
        try {
          const enResponse = await fetch(enUrl, { method: 'HEAD' });
          if (enResponse.ok) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = `English ${trackNumber}`;
            track.srclang = 'en';
            track.src = enUrl;
            if (!defaultTrackSet) {
              track.default = true;
              defaultTrackSet = true;
            }
            video.appendChild(track);
            trackNumber++;
            consecutiveErrors = 0;
          } else {
            const frUrl = `http://localhost:3000/api/stream/${streamId}/subtitles-french-${trackNumber}.vtt`;
            const frResponse = await fetch(frUrl, { method: 'HEAD' });
            if (frResponse.ok) {
              const track = document.createElement('track');
              track.kind = 'subtitles';
              track.label = `French ${trackNumber}`;
              track.srclang = 'fr';
              track.src = frUrl;
              if (!defaultTrackSet) {
                track.default = true;
                defaultTrackSet = true;
              }
              video.appendChild(track);
              trackNumber++;
              consecutiveErrors = 0;
            } else {
              consecutiveErrors++;
              trackNumber++;
            }
          }
        } catch (error) {
          console.error(`Error checking subtitle for track ${trackNumber}:`, error);
          consecutiveErrors++;
          trackNumber++;
        }
      }
    }

    async function checkAndPlayMp4() {
      const mp4Url = `/api/stream/${streamId}/video.mp4`;
      try {
        const response = await fetch(mp4Url, { method: 'HEAD' });
        if (response.ok && video) {
          video.src = mp4Url;
          await loadSubtitles();
          return true;
        }
      } catch (error) {
        console.error("Error checking MP4 file:", error);
      }
      return false;
    }

    async function setupHls() {
      if (video && Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(`/api/stream/${streamId}/video`);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          await loadSubtitles();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS error:", data);
            hls?.destroy();
          }
        });
      } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = `/api/stream/${streamId}/video`;
      }
    }

    (async () => {
      const mp4Available = await checkAndPlayMp4();
      if (!mp4Available) {
        setupHls();
      }
    })();

    return () => {
      hls?.destroy();
    };
  }, [streamId]);

  return <video ref={videoRef} controls />;
}
