/**
 * ElevenLabs Sound Generation utility.
 *
 * Wraps the ElevenLabs sound generation API (eleven_sound_generation_v1 / v2).
 * Returns raw audio as a Node.js Buffer for upload to Supabase Storage.
 *
 * Docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
 * SDK:  @elevenlabs/elevenlabs-js  ->  client.textToSoundEffects.convert()
 */
import { getElevenLabsClient } from '@/lib/elevenlabs/client'

export interface SoundGenerationOptions {
  /** Descriptive prompt (e.g. "Calm ambient corporate background music, smooth piano"). */
  prompt: string
  /**
   * Duration in seconds — clamped to 5–30 s for background music.
   * The loop flag in the API makes the clip seamlessly loopable.
   */
  durationSeconds?: number
  /**
   * How closely to follow the prompt (0–1).
   * Higher values = more literal interpretation.
   */
  promptInfluence?: number
}

export interface SoundGenerationResult {
  /** Raw MP3 audio data as a Node.js Buffer */
  buffer: Buffer
  /** MIME type reported — always mp3 for this utility */
  mimeType: 'audio/mpeg'
  /** Approximate file size in bytes */
  sizeBytes: number
}

/**
 * Generate a background music clip using ElevenLabs Sound Generation.
 *
 * The returned buffer is a seamlessly-loopable MP3 suitable for
 * Supabase Storage upload and `<audio loop>` playback.
 */
export async function generateBackgroundMusic(
  options: SoundGenerationOptions
): Promise<SoundGenerationResult> {
  const client = getElevenLabsClient()

  const duration = Math.min(30, Math.max(5, options.durationSeconds ?? 20))

  // ElevenLabs SDK returns a ReadableStream or Blob depending on runtime.
  // We normalise to Buffer for storage upload.
  const response = await client.textToSoundEffects.convert({
    text: options.prompt,
    durationSeconds: duration,
    promptInfluence: options.promptInfluence ?? 0.4,
  })

  // The SDK resolves to a Web Streams ReadableStream<Uint8Array> in the Node runtime.
  // Use the reader directly — avoids compatibility issues with `new Response(stream)`
  // in the Next.js Node runtime where the global Response may not drain the stream.
  const stream = response as unknown as ReadableStream<Uint8Array>
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength > 0) chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  if (chunks.length === 0) {
    throw new Error('ElevenLabs returned an empty audio stream. Please try a different prompt.')
  }

  // Merge all chunks into a single Buffer
  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0)
  const merged = new Uint8Array(totalLength)
  let byteOffset = 0
  for (const chunk of chunks) {
    merged.set(chunk, byteOffset)
    byteOffset += chunk.byteLength
  }
  const buffer = Buffer.from(merged.buffer, merged.byteOffset, merged.byteLength)

  return {
    buffer,
    mimeType: 'audio/mpeg',
    sizeBytes: buffer.byteLength,
  }
}
