import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your WIAL account.',
}

interface LoginPageProps {
  searchParams: Promise<{ registered?: string; password_updated?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations('auth.login')
  const params = await searchParams

  return (
    <>
      <div className="mb-6">
        <h1 className="text-wial-navy text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {params.registered === 'true' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {t('registeredMessage')}
        </div>
      )}

      {params.password_updated === 'true' && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {t('passwordUpdatedMessage')}
        </div>
      )}

      {params.error === 'unauthorized' && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {t('unauthorizedMessage')}
        </div>
      )}

      {params.error === 'auth_error' && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {t('authErrorMessage')}
        </div>
      )}

      <LoginForm />
    </>
  )
}
