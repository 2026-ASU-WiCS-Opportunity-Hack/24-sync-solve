/**
 * ElevenLabs SDK singleton — server-side only.
 *
 * Never import this in Client Components.
 * API key is read from ELEVENLABS_API_KEY (server-only env var).
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

let _client: ElevenLabsClient | null = null

export function getElevenLabsClient(): ElevenLabsClient {
  if (_client) return _client

  const apiKey = process.env['ELEVENLABS_API_KEY']
  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY is not set. Add it to your .env.local file as a server-only secret.'
    )
  }

  _client = new ElevenLabsClient({ apiKey })
  return _client
}
