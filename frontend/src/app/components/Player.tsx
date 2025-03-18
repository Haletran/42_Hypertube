import { useEffect, useRef, useState } from 'react'

export default function Player({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/stream/${streamId}/status`)
        const { progress, url } = await res.json()
        
        setProgress(progress)
        
        if (url && videoRef.current) {
          videoRef.current.src = url
          videoRef.current.play()
        }
      } catch (error) {
        console.error('Error checking stream status:', error)
      }
    }
 
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [streamId])

  return (
    <div>
      <video 
        ref={videoRef} 
        controls 
        style={{ width: '100%', height: 'auto' }}
      />
      <div>Progression : {progress}%</div>
    </div>
  )
}