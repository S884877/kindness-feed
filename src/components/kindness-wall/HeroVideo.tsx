'use client'

import { useEffect, useRef, useState } from 'react'

function SpeakerOnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SpeakerOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // try to autoplay with sound — most browsers block this on a fresh
    // visit with no prior interaction, so fall back to muted autoplay and
    // let the visible toggle below turn sound on with one click.
    video.muted = false
    video.play().catch(() => {
      video.muted = true
      setMuted(true)
      video.play().catch(() => {})
    })
  }, [])

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    const next = !video.muted
    video.muted = next
    setMuted(next)
    if (!next) video.play().catch(() => {})
  }

  return (
    <>
      <video
        ref={videoRef}
        className="kw-video-fallback"
        autoPlay
        loop
        playsInline
      >
        <source src="/hero-loop.mp4" type="video/mp4" />
      </video>

      <button
        onClick={toggleMute}
        aria-label={muted ? 'unmute video' : 'mute video'}
        className="absolute bottom-5 right-5 z-10 flex items-center gap-2 active:scale-95 transition-transform"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
          padding: '10px 16px',
          borderRadius: 2,
        }}
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
        {muted ? 'unmute' : 'mute'}
      </button>
    </>
  )
}
