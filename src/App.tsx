import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { Workspace } from './screens/Workspace'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured)
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => {
    if (!supabase) return

    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setCheckingSession(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setCheckingSession(false)
      setAuthMessage('')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setAuthMessage(error.message)
  }, [])

  if (checkingSession) {
    return <main className="loading-screen"><img src="/sakhi-cycle-logo.png" alt="Sakhi Cycle" /><span className="loading-heart" />Getting your space ready…</main>
  }

  if (session) {
    return <Workspace session={session} onSignOut={signOut} />
  }

  return <AuthScreen configured={isSupabaseConfigured} message={authMessage} />
}
