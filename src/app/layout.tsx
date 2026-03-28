import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | WIAL',
    default: 'World Institute for Action Learning',
  },
  description:
    'WIAL certifies Action Learning coaches across 20+ countries, empowering organizations to solve complex challenges.',
  keywords: ['Action Learning', 'WIAL', 'leadership development', 'coaching', 'certification'],
  authors: [{ name: 'WIAL' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'WIAL — World Institute for Action Learning',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const messages = await getMessages()

  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="text-wial-navy flex min-h-full flex-col bg-white font-sans antialiased">
        {/* Skip to content — first focusable element, required for a11y */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  )
}
