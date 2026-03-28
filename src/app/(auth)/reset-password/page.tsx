import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set New Password',
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Set a new password</h1>
      <p className="mb-6 text-sm text-gray-500">Enter and confirm your new password below.</p>
      <ResetPasswordForm />
    </>
  )
}
