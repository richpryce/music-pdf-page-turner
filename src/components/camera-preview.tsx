'use client'

import clsx from 'clsx'

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
  compact?: boolean
}

export function CameraPreview({ videoRef, isActive, compact = false }: CameraPreviewProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl border bg-black/80 shadow-2xl backdrop-blur-md transition-all',
        compact ? 'w-28 h-20 border-white/15' : 'w-40 h-28 border-white/10',
        !isActive && 'opacity-80',
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={clsx(
          'absolute inset-0 h-full w-full object-cover scale-x-[-1] transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Camera feed"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/70">
        {!isActive && <span>Camera off</span>}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/80">
        <span>{isActive ? 'Live' : 'Preview'}</span>
        <span className={clsx('h-2 w-2 rounded-full', isActive ? 'bg-emerald-400' : 'bg-white/30')} />
      </div>
    </div>
  )
}
