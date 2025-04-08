"use client"

import { use, useEffect, useRef, useState } from "react"
import Hls from "hls.js"

type SubtitleTrack = {
  kind: string
  label: string
  srclang: string
  src: string
  default?: boolean
}

export default function Player({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    const loadVideo = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const mp4Available = await checkAndPlayMp4()
        if (!mp4Available) {
          await setupHls()
        }
      } catch (err) {
        console.error("Failed to load video:", err)
        setError("Failed to load video. Please try again later.")
        setIsLoading(false)
      }
    }

    loadVideo()
    return cleanup
  }, [streamId])

  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video) return
      localStorage.setItem(`${streamId}-time`, video.currentTime.toString())
    }, 10000)

    return () => clearInterval(interval)
  }, [streamId])


  const checkAndPlayMp4 = async (): Promise<boolean> => {
    const video = videoRef.current
    if (!video) return false

    const statusUrl = `http://localhost:3000/api/stream/${streamId}/status`
    const mp4Url = `/api/stream/${streamId}/video.mp4`

    try {
      const statusResponse = await fetch(statusUrl)
      if (!statusResponse.ok) return false

      const statusData = await statusResponse.json()
      if (statusData.progress === "100" && statusData.status === "complete") {
        const response = await fetch(mp4Url, { method: "HEAD" })
        if (response.ok) {
          video.src = mp4Url
          await loadSubtitles()
          return true
        }
      }
    } catch (error) {
      console.error("Error checking MP4 file or status:", error)
    }
    return false
  }

  const setupHls = async (): Promise<void> => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      cleanup()

      hlsRef.current = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
      })

      hlsRef.current.loadSource(`/api/stream/${streamId}/video`)
      hlsRef.current.attachMedia(video)

      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, async () => {
        await loadSubtitles()
        try {
          await video.play()
        } catch (err) {
          console.warn("Autoplay prevented:", err)
        }
      })

      hlsRef.current.on(Hls.Events.ERROR, (data: any) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data)
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Trying to recover network error...")
              hlsRef.current?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Trying to recover media error...")
              hlsRef.current?.recoverMediaError()
              break
            default:
              cleanup()
              setError("Video playback error. Please try again later.")
              break
          }
        }
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = `/api/stream/${streamId}/video`
      await loadSubtitles()
    } else {
      setError("Your browser doesn't support HLS playback.")
    }
  }

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }

  const loadSubtitles = async (): Promise<void> => {
    const video = videoRef.current
    if (!video) return

    while (video.firstChild) {
      video.removeChild(video.firstChild)
    }

    const subtitleTypes = [
      { type: "original", lang: "original" },
      { type: "english", lang: "en" },
      { type: "french", lang: "fr" },
    ]

    let defaultTrackSet = false
    const tracksToAdd: SubtitleTrack[] = []

    for (const { type, lang } of subtitleTypes) {
      let trackNumber = 1
      let consecutiveErrors = 0
      const MAX_ERRORS = 3

      while (consecutiveErrors < MAX_ERRORS) {
        const url = `http://localhost:3000/api/stream/${streamId}/subtitles-${type}-${trackNumber}.vtt`

        try {
          const response = await fetch(url, { method: "HEAD" })

          if (response.ok) {
            tracksToAdd.push({
              kind: "subtitles",
              label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${trackNumber}`,
              srclang: lang,
              src: url,
            })
            trackNumber++
            consecutiveErrors = 0
          } else {
            consecutiveErrors++
            trackNumber++
          }
        } catch (error) {
          console.error(`Error checking ${type} subtitle for track ${trackNumber}:`, error)
          consecutiveErrors++
          trackNumber++
        }
      }
    }

    tracksToAdd.forEach((trackData, index) => {
      const track = document.createElement("track")
      track.kind = trackData.kind
      track.label = trackData.label
      track.srclang = trackData.srclang
      track.src = trackData.src

      if (!defaultTrackSet) {
        track.default = true
        defaultTrackSet = true
      }

      video.appendChild(track)
    })

    return Promise.resolve()
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-white/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="text-white mt-4 text-sm">Loading video...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-white text-center p-4 max-w-md">
            <p className="text-red-500 font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                setupHls()
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        onLoadedData={() => {
          const video = videoRef.current;
          if (!video) return;

          const savedTime = localStorage.getItem(`${streamId}-time`);
          video.currentTime = savedTime ? parseFloat(savedTime) : 0;
          
          if (!savedTime) {
           video.play().catch(err => console.error("Autoplay failed:", err));
          }
        }}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setError("Video playback error. Please try again later.")
        }}
        autoPlay
        playsInline
      />
    </div>
  )
}

