"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function Player({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    let hls: Hls | null = null;

    async function loadSubtitles() {
      if (!video) return;
      let originalTrackNumber = 1;
      let otherTrackNumber = 1;
      let consecutiveErrors = 0;
      const MAX_ERRORS = 3;
      let defaultTrackSet = false;

      while (consecutiveErrors < MAX_ERRORS) {
      const originalUrl = `http://localhost:3000/api/stream/${streamId}/subtitles-original-${originalTrackNumber}.vtt`;
      try {
        const originalResponse = await fetch(originalUrl, { method: 'HEAD' });
        if (originalResponse.ok) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = `Original ${originalTrackNumber}`;
        track.srclang = 'original';
        track.src = originalUrl;
        if (!defaultTrackSet) {
          track.default = true;
          defaultTrackSet = true;
        }
        video.appendChild(track);
        originalTrackNumber++;
        consecutiveErrors = 0;
        continue;
        }
      } catch (error) {
        console.error(`Error checking original subtitle for track ${originalTrackNumber}:`, error);
      }

      const enUrl = `http://localhost:3000/api/stream/${streamId}/subtitles-english-${otherTrackNumber}.vtt`;
      try {
        const enResponse = await fetch(enUrl, { method: 'HEAD' });
        if (enResponse.ok) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = `English ${otherTrackNumber}`;
        track.srclang = 'en';
        track.src = enUrl;
        if (!defaultTrackSet) {
          track.default = true;
          defaultTrackSet = true;
        }
        video.appendChild(track);
        otherTrackNumber++;
        consecutiveErrors = 0;
        continue;
        }
      } catch (error) {
        console.error(`Error checking English subtitle for track ${otherTrackNumber}:`, error);
      }

      const frUrl = `http://localhost:3000/api/stream/${streamId}/subtitles-french-${otherTrackNumber}.vtt`;
      try {
        const frResponse = await fetch(frUrl, { method: 'HEAD' });
        if (frResponse.ok) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = `French ${otherTrackNumber}`;
        track.srclang = 'fr';
        track.src = frUrl;
        if (!defaultTrackSet) {
          track.default = true;
          defaultTrackSet = true;
        }
        video.appendChild(track);
        otherTrackNumber++;
        consecutiveErrors = 0;
        } else {
        consecutiveErrors++;
        otherTrackNumber++;
        }
      } catch (error) {
        console.error(`Error checking French subtitle for track ${otherTrackNumber}:`, error);
        consecutiveErrors++;
        otherTrackNumber++;
      }
      }
    }

    async function checkAndPlayMp4() {
      const statusUrl = `http://localhost:3000/api/stream/${streamId}/status`;
      const mp4Url = `/api/stream/${streamId}/video.mp4`;
    
      try {
        const statusResponse = await fetch(statusUrl);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.progress === "100" && statusData.status === "complete") {
            const response = await fetch(mp4Url, { method: 'HEAD' });
            if (response.ok && video) {
              video.src = mp4Url;
              await loadSubtitles();
              return true;
            }
          }
        }
      } catch (error) {
        console.error("Error checking MP4 file or status:", error);
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

  return (
    <div className="relative">
      {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
      )}
      <video
      ref={videoRef}
      controls
      className="w-full"
      onLoadedData={() => {
        setIsLoading(false);
        videoRef.current?.play().catch(err => console.error("Autoplay failed:", err));
      }}
      onPlaying={() => setIsLoading(false)}
      autoPlay
      />
    </div>
  );
}
