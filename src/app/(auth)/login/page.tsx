import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your WIAL account.',
}

export default async function LoginPage() {
  const t = await getTranslations('auth.login')

  return (
    <>
      <div className="mb-6">
        <h1 className="text-wial-navy text-2xl font-bold">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>
      <LoginForm />
    </>
  )
}
