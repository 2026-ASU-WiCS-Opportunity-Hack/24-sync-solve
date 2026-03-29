import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { EditModeProvider } from '@/components/editor/EditModeProvider'
import { EditModeToggle } from '@/components/editor/EditModeToggle'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export default async function GlobalLayout({ children }: GlobalLayoutProps) {
  // Only super_admin can edit global pages
  let canEdit = false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    canEdit = profile?.role === 'super_admin'
  }

  return (
    <EditModeProvider canEdit={canEdit} chapterId={null}>
      <Header />
      <main
        id="main-content"
        className="to-wial-surface/45 flex-1 bg-gradient-to-b from-white via-white focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
      {canEdit && <EditModeToggle />}
    </EditModeProvider>
  )
}
