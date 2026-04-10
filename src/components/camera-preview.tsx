'use client'

import clsx from 'clsx'

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
}

export function CameraPreview({ videoRef, isActive }: CameraPreviewProps) {
  return (
    <div
      className={clsx(
        'relative w-32 h-24 rounded-lg overflow-hidden border bg-black transition-all',
        isActive
          ? 'border-gray-600 opacity-100'
          : 'border-gray-800 opacity-60',
      )}
      aria-hidden={!isActive}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={clsx(
          'absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Camera feed"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {!isActive && <span className="text-[11px] text-gray-400">Camera off</span>}
      </div>
      {isActive && (
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <span className="text-xs text-white bg-black/50 px-1 rounded">Live</span>
        </div>
      )}
    </div>
  )
}
