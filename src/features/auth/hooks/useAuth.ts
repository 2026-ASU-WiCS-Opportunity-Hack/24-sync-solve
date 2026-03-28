'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/types'
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, chapter_id, full_name, avatar_url')
        .eq('id', authUser.id)
        .single()

      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        role: profile?.role ?? 'public',
        chapterId: profile?.chapter_id ?? null,
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
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
