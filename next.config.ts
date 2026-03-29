import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isDev = process.env.NODE_ENV === 'development'
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@heroui/react', 'lucide-react'],
  },
  serverExternalPackages: ['@xenova/transformers'],
  turbopack: {
    root: projectRoot,
  },

  async headers() {
    // 'unsafe-eval' is required by Next.js dev tooling (HMR, Turbopack) but must
    // not be present in production — it opens the door to code injection attacks.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com"
      : "script-src 'self' 'unsafe-inline' https://js.stripe.com"

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://img.youtube.com",
              "media-src 'self' https://*.supabase.co https://*.supabase.in",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.stripe.com wss://*.supabase.co",
              'frame-src https://js.stripe.com https://hooks.stripe.com',
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  images: {
    // Supabase Storage is served via Cloudflare CDN which already handles
    // format negotiation and edge caching. Next.js's image optimization proxy
    // is disabled because DNS resolves Supabase hostnames via NAT64 IPv6
    // (64:ff9b:: prefix), which Next.js's SSRF protection incorrectly treats
    // as private IPs and rejects with a 400 error.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // YouTube video thumbnails (auto-derived from video URLs)
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}

export default withNextIntl(nextConfig)
