import { useState, type FormEvent } from 'react'
import { Activity, CalendarDays, Heart, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthScreenProps = { configured: boolean; message: string }

export function AuthScreen({ configured, message: appMessage }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function requestSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setMessage(error ? error.message : 'Your sign-in link is on its way. Check your inbox to continue.')
    setBusy(false)
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
              <p>Add the project URL and public key in `.env.local`. Then enable email sign-in in Supabase to use this form.</p>
            </div>
          ) : (
            <form onSubmit={requestSignIn} className="sign-in-form">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <button type="submit" disabled={busy}>{busy ? 'Sending link…' : 'Continue with email'}</button>
              <p className="privacy-copy">We’ll email you a secure sign-in link. No password to remember.</p>
            </form>
          )}
          {(message || appMessage) && <p className={`form-message ${message && !message.includes('on its way') ? 'is-error' : ''}`} role="status">{message || appMessage}</p>}
        </section>
      </section>

      <footer className="auth-footer"><span>Made with care, for every cycle.</span><span>Understand <i>·</i> Track <i>·</i> Thrive</span></footer>
    </main>
  )
}
