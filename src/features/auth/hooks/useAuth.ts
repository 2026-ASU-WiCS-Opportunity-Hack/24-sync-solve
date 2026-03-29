'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

/**
 * Client-side auth hook.
 * For UI rendering only — never use for authorization decisions.
 * Authorization is enforced server-side via RLS and server actions.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(authUser: User | null) {
      if (!authUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      // Parallel fetch: profile + chapter roles
      const [profileResult, chapterRolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, chapter_id, full_name, avatar_url, is_suspended, membership_status')
          .eq('id', authUser.id)
          .single(),
        supabase
          .from('user_chapter_roles')
          .select('chapter_id, role')
          .eq('user_id', authUser.id)
          .eq('is_active', true),
      ])

      const profile = profileResult.data

      // Build chapterId → roles[] map
      const chapterRoles: Record<string, UserRole[]> = {}
      for (const row of chapterRolesResult.data ?? []) {
        const existing = chapterRoles[row.chapter_id] ?? []
        existing.push(row.role as UserRole)
        chapterRoles[row.chapter_id] = existing
      }

      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        role: (profile?.role ?? 'user') as UserRole,
        chapterId: profile?.chapter_id ?? null,
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        isSuspended: profile?.is_suspended ?? false,
        membershipStatus: (profile?.membership_status ?? 'none') as AuthUser['membershipStatus'],
        chapterRoles,
      })
      setIsLoading(false)
    }

    // Load initial session
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      loadUser(authUser)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
