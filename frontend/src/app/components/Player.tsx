"use client";

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function Player({ streamId } : { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (video && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(`/api/stream/${streamId}/video`);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = `/api/stream/${streamId}/video`;
      video.play();
    }

    return () => {
      hls && hls.destroy();
    };
  }, [streamId]);

  return <video ref={videoRef} controls style={{ width: '100%', height: 'auto' }} />;
}
