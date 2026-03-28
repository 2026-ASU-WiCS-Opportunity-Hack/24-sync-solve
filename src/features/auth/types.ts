import type { AuthUser } from '@/types'

export type { AuthUser }

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}
