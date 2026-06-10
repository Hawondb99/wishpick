import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { LanguageProvider } from './LanguageContext'
import Home from './pages/Home'
import Auth from './pages/Auth'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#FAFAF9', flexDirection: 'column', gap: '12px'
    }}>
      <div style={{ fontSize: '40px' }}>🎁</div>
      <div style={{ fontSize: '14px', color: '#9CA3AF', fontFamily: 'sans-serif' }}>WishPick</div>
    </div>
  )

  return (
    <LanguageProvider>
      {session ? <Home session={session} /> : <Auth />}
    </LanguageProvider>
  )
}