/**
 * ElevenLabs Speech-to-Text (Scribe v2) utility.
 *
 * Supports transcribing video/audio from a direct URL or a Buffer.
 * Uses the Scribe v2 model which supports 90+ languages, speaker diarization,
 * and video file formats (MP4, MKV, MOV, etc.).
 *
 * Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
 * SDK:  @elevenlabs/elevenlabs-js  ->  client.speechToText.convert()
 */
import { getElevenLabsClient } from '@/lib/elevenlabs/client'

export type TranscriptLanguage = string // ISO-639-1 code, e.g. 'en', 'fr'

export interface TranscribeFromUrlOptions {
  /** Direct URL to an audio or video file (NOT a YouTube watch URL). */
  sourceUrl: string
  /** Optional ISO-639-1 language code. Auto-detected if omitted. */
  languageCode?: TranscriptLanguage
  /** Remove filler words (uh, um) — Scribe v2 only. Default true. */
  removeFillWords?: boolean
}

export interface TranscribeFromBufferOptions {
  /** Raw audio/video file data */
  buffer: Buffer
  /** Original file name (used for MIME type inference) */
  fileName: string
  languageCode?: TranscriptLanguage
  removeFillWords?: boolean
}

export interface TranscriptionResult {
  /** Full transcript text */
  text: string
  /** Detected or specified language code */
  detectedLanguage?: string
  /** Word-level timestamps if available */
  words?: Array<{
    word: string
    start: number
    end: number
    type?: string
  }>
}

/** Transcribe audio/video from a direct URL using ElevenLabs Scribe v2. */
export async function transcribeFromUrl(
  options: TranscribeFromUrlOptions
): Promise<TranscriptionResult> {
  const client = getElevenLabsClient()

  const result = await client.speechToText.convert({
    modelId: 'scribe_v2',
    cloudStorageUrl: options.sourceUrl,
    languageCode: options.languageCode,
    timestampsGranularity: 'none',
    noVerbatim: options.removeFillWords ?? true,
  })

  return {
    text: result.text,
    detectedLanguage: result.languageCode ?? undefined,
    words: result.words?.map((w) => ({
      word: w.text,
      start: w.start ?? 0,
      end: w.end ?? 0,
      type: w.type,
    })),
  }
}

/** Transcribe audio/video from a raw file Buffer using ElevenLabs Scribe v2. */
export async function transcribeFromBuffer(
  options: TranscribeFromBufferOptions
): Promise<TranscriptionResult> {
  const client = getElevenLabsClient()

  const mimeType = mimeTypeFromFileName(options.fileName)
  // Convert Buffer to ArrayBuffer to satisfy the Blob constructor in Node 18+
  const arrayBuffer = options.buffer.buffer.slice(
    options.buffer.byteOffset,
    options.buffer.byteOffset + options.buffer.byteLength
  ) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: mimeType })
  const file = new File([blob], options.fileName, { type: mimeType })

  const result = await client.speechToText.convert({
    modelId: 'scribe_v2',
    file,
    languageCode: options.languageCode,
    timestampsGranularity: 'none',
    noVerbatim: options.removeFillWords ?? true,
  })

  return {
    text: result.text,
    detectedLanguage: result.languageCode ?? undefined,
    words: result.words?.map((w) => ({
      word: w.text,
      start: w.start ?? 0,
      end: w.end ?? 0,
      type: w.type,
    })),
  }
}

/** Whether a given URL looks like a direct media file (not a YouTube watch page). */
export function isDirectMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const isYouTube =
      parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')
    if (isYouTube) return false

    const path = parsed.pathname.toLowerCase()
    const mediaExtensions = [
      '.mp4',
      '.mkv',
      '.mov',
      '.avi',
      '.webm',
      '.m4v',
      '.mp3',
      '.wav',
      '.flac',
      '.ogg',
      '.m4a',
      '.aac',
    ]
    return mediaExtensions.some((ext) => path.endsWith(ext))
  } catch {
    return false
  }
}

function mimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
  }
  return mimeMap[ext] ?? 'application/octet-stream'
}
