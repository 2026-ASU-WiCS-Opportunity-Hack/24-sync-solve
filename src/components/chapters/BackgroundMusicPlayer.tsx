'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, X } from 'lucide-react'

interface BackgroundMusicPlayerProps {
  src: string
  prompt: string
  chapterSlug: string
}

/**
 * Ambient background music player.
 *
 * Autoplay trick: browsers block autoplay of audible audio, but allow
 * muted audio. We start muted, call play() (which succeeds), then
 * immediately unmute and fade the volume in — so the music starts
 * playing automatically without any user interaction.
 *
 * UI: a tiny floating pill in the bottom-right corner with just a
 * dismiss (×) button. No play/pause — it just plays.
 */
export function BackgroundMusicPlayer({ src, prompt, chapterSlug }: BackgroundMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true

  useEffect(() => {
    const storageKey = `chapter-music-dismissed-${chapterSlug}`
    try {
      if (sessionStorage.getItem(storageKey) === 'true') {
        setIsDismissed(true)
        return
      }
    } catch {
      /* ignore */
    }

    const audio = audioRef.current
    if (!audio) return

    let fadeTimer: ReturnType<typeof setInterval> | null = null

    function fadeIn() {
      if (!audio) return
      audio.muted = false
      audio.volume = 0
      let vol = 0
      const TARGET = 0.22
      fadeTimer = setInterval(() => {
        vol = Math.min(vol + 0.015, TARGET)
        audio!.volume = vol
        if (vol >= TARGET) {
          if (fadeTimer) clearInterval(fadeTimer)
          fadeTimer = null
          setIsPlaying(true)
        }
      }, 80)
    }

    function startOnInteraction() {
      removeListeners()
      if (!audio) return
      audio.muted = true
      audio.volume = 0
      audio
        .play()
        .then(fadeIn)
        .catch(() => {
          /* give up silently */
        })
    }

    function removeListeners() {
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('scroll', startOnInteraction)
      document.removeEventListener('keydown', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }

    // Attempt 1: muted autoplay (always succeeds in modern browsers)
    audio.muted = true
    audio.volume = 0
    audio
      .play()
      .then(fadeIn)
      .catch(() => {
        // Attempt 2: wait for first user gesture anywhere on the page
        document.addEventListener('click', startOnInteraction, { once: true })
        document.addEventListener('scroll', startOnInteraction, { once: true })
        document.addEventListener('keydown', startOnInteraction, { once: true })
        document.addEventListener('touchstart', startOnInteraction, { once: true })
      })

    return () => {
      if (fadeTimer) {
        clearInterval(fadeTimer)
        fadeTimer = null
      }
      removeListeners()
      audio.pause()
      audio.muted = true
      audio.volume = 0
    }
  }, [chapterSlug])

  function handleDismiss() {
    const audio = audioRef.current
    if (audio) {
      // Fade out before stopping
      const timer = setInterval(() => {
        if (!audio) {
          clearInterval(timer)
          return
        }
        audio.volume = Math.max(0, audio.volume - 0.04)
        if (audio.volume <= 0) {
          clearInterval(timer)
          audio.pause()
        }
      }, 60)
    }
    setIsDismissed(true)
    try {
      sessionStorage.setItem(`chapter-music-dismissed-${chapterSlug}`, 'true')
    } catch {
      /* ignore */
    }
  }

  if (isDismissed) return null

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={src} loop preload="auto" aria-hidden="true" />

      {/* Minimal floating indicator — no play/pause, just dismiss */}
      <div
        role="region"
        aria-label="Chapter background music playing"
        className="fixed inset-e-5 bottom-5 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 shadow-lg backdrop-blur-sm"
      >
        <div className="relative flex items-center justify-center">
          {isPlaying && !reducedMotion && (
            <span
              className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-white/20"
              aria-hidden="true"
            />
          )}
          <Music size={12} className="relative text-white/50" aria-hidden="true" />
        </div>

        <span className="text-[10px] font-medium text-white/45" aria-hidden="true">
          Ambient
        </span>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Stop background music"
          className="flex h-4 w-4 items-center justify-center rounded-full text-white/35 transition-colors hover:text-white/75 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        >
          <X size={10} aria-hidden="true" />
        </button>
      </div>

      <p className="sr-only">Background ambient music is playing: {prompt}</p>
    </>
  )
}
