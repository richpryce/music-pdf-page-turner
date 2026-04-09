'use client'

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
}

export function CameraPreview({ videoRef, isActive }: CameraPreviewProps) {
  if (!isActive) return null

  return (
    <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-600 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        aria-label="Camera feed"
      />
      <div className="absolute bottom-1 left-1 right-1 text-center">
        <span className="text-xs text-white bg-black/50 px-1 rounded">Live</span>
      </div>
    </div>
  )
}
