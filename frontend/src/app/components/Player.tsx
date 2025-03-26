"use client";

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function Player({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (video && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(`/api/stream/${streamId}/video`);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (video) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = 'English';
          track.srclang = 'en';
          track.src = `http://localhost:3333/api/stream/${streamId}/subtitles-english-1.vtt`;
          track.default = true;
          video.appendChild(track);
          
          if (video.textTracks.length > 0) {
            video.textTracks[0].mode = 'showing';
            if (hls) {
              hls.subtitleTrack = 0;
            }
          }
        }
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

    return () => {
      hls?.destroy();
    };
  }, [streamId]);

  return (
    <video
      ref={videoRef}
      controls
      muted
      style={{ width: '100%', height: 'auto' }}
      crossOrigin="anonymous"
      onError={(e) => console.error('Video error:', e)}
    >
      {/* Fallback pour les navigateurs sans HLS.js */}
      {!Hls.isSupported() && (
        <track
          kind="subtitles"
          srcLang="en"
          label="English"
          src={`http://localhost:3333/api/stream/${streamId}/sonic.vtt`}
          default
        />
      )}
    </video>
  );
}