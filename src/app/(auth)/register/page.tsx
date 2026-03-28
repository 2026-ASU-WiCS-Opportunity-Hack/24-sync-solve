import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join the global WIAL community.',
}

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-wial-navy text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Join the global WIAL community</p>
      </div>
      <RegisterForm />
    </>
  )
}
