import { useState, type FormEvent } from 'react'
import { Activity, CalendarDays, Heart, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthScreenProps = { configured: boolean; message: string }

export function AuthScreen({ configured, message: appMessage }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null)

  async function requestGoogleSignIn() {
    if (!supabase || busy) return
    setBusy(true)
    setAuthMethod('google')
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setMessage(error.message)
      setBusy(false)
      setAuthMethod(null)
    }
  }

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setAuthMethod('email')
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setMessage(error ? error.message : 'Your sign-in link is on its way. Check your inbox to continue.')
    setBusy(false)
    setAuthMethod(null)
  }

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <a className="brand" href="#home" aria-label="Sakhi Cycle home"><img src="/sakhi-cycle-logo.png" alt="Sakhi Cycle" /></a>
        <span className="topbar-note"><ShieldCheck size={16} /> Your cycle data stays private</span>
      </header>

      <section className="auth-hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} /> Your wellness, understood</p>
          <h1>A little more in tune with <em>you.</em></h1>
          <p className="intro">A calm, private place to understand your cycle, notice patterns, and care for yourself at every stage.</p>
          <div className="pillars">
            <span><Activity size={17} /> Understand</span>
            <span><CalendarDays size={17} /> Track</span>
            <span><Heart size={17} /> Thrive</span>
          </div>
        </div>

        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <div className="card-mark"><Heart size={21} fill="currentColor" /></div>
          <p className="eyebrow">Welcome to your space</p>
          <h2 id="sign-in-title">Start with care.</h2>
          {!configured ? (
            <div className="setup-note">
              <strong>Connect your Supabase project</strong>
              <p>Add your Supabase URL and publishable key, then enable Google and email sign-in in Supabase to use these options.</p>
            </div>
          ) : (
            <>
              <button className="google-sign-in" type="button" onClick={requestGoogleSignIn} disabled={busy}>
                <GoogleMark />
                {busy && authMethod === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
              </button>
              <div className="auth-divider"><span>or use email</span></div>
              <form onSubmit={requestSignIn} className="sign-in-form">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
                <button type="submit" disabled={busy}>{busy && authMethod === 'email' ? 'Sending link…' : 'Continue with email'}</button>
                <p className="privacy-copy">We’ll email you a secure sign-in link. No password to remember.</p>
              </form>
            </>
          )}
          {(message || appMessage) && <p className={`form-message ${message && !message.includes('on its way') ? 'is-error' : ''}`} role="status">{message || appMessage}</p>}
        </section>
      </section>

      <footer className="auth-footer"><span>Made with care, for every cycle.</span><span>Understand <i>·</i> Track <i>·</i> Thrive</span></footer>
    </main>
  )
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.94c4.47-4.13 7.12-10.22 7.12-17.59Z"/><path fill="#FBBC05" d="M10.53 28.41A14.4 14.4 0 0 1 9.75 24c0-1.53.27-3.01.75-4.41l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.85.92 7.5 2.56 10.6l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.86l-7.65-5.94c-2.13 1.43-4.85 2.27-8.27 2.27-6.26 0-11.57-4.23-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
}
