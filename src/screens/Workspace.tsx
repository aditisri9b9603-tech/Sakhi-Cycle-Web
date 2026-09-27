import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Activity, ArrowRight, CalendarDays, Check, ChevronRight, CircleHelp, Heart, Home, LogOut, Menu, Moon, Plus, ShieldCheck, Sparkles, Sun, X } from 'lucide-react'
import { addDays, dayNumberBetween, formatDate, localDateString } from '../lib/dates'
import { supabase } from '../lib/supabase'

type Page = 'overview' | 'cycle' | 'daily-log'
type CycleSettings = {
  user_id: string
  average_cycle_length: number | null
  average_period_length: number | null
  last_period_start: string | null
  tracking_enabled: boolean
}
type DailyLog = {
  id: string
  log_date: string
  flow_level: 'spotting' | 'light' | 'medium' | 'heavy' | null
  symptoms: string[]
  mood: 'great' | 'good' | 'okay' | 'low' | 'awful' | null
  notes: string | null
}

const moods: { value: NonNullable<DailyLog['mood']>; label: string; face: string }[] = [
  { value: 'great', label: 'Great', face: '☺' },
  { value: 'good', label: 'Good', face: '☻' },
  { value: 'okay', label: 'Okay', face: '😐' },
  { value: 'low', label: 'Low', face: '☹' },
  { value: 'awful', label: 'Rough', face: '☹' },
]
const symptomOptions = ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Cravings', 'Backache']

export function Workspace({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const user = session.user
  const [page, setPage] = useState<Page>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [cycle, setCycle] = useState<CycleSettings | null>(null)
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const today = localDateString()

  async function loadWorkspace() {
    if (!supabase) return
    setLoading(true)
    setError('')
    const [profileResult, cycleResult, logsResult] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
      supabase.from('cycle_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(8),
    ])
    const issue = profileResult.error || cycleResult.error || logsResult.error
    if (issue) setError(issue.message)
    setDisplayName(profileResult.data?.display_name?.trim() || user.email?.split('@')[0] || 'friend')
    setCycle(cycleResult.data as CycleSettings | null)
    const logs = (logsResult.data || []) as DailyLog[]
    setRecentLogs(logs)
    setTodayLog(logs.find((log) => log.log_date === today) || null)
    setLoading(false)
  }

  useEffect(() => { void loadWorkspace() }, [user.id])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  function goTo(nextPage: Page) {
    setPage(nextPage)
    setNotice('')
    setError('')
    setMobileNavOpen(false)
  }

  async function saveCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const formData = new FormData(event.currentTarget)
    const cycleLength = Number(formData.get('cycleLength'))
    const periodLength = Number(formData.get('periodLength'))
    const periodStart = String(formData.get('periodStart') || '')
    setError('')
    setNotice('')
    const { error: saveError } = await supabase.from('cycle_settings').upsert({
      user_id: user.id,
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
      last_period_start: periodStart || null,
      tracking_enabled: true,
    }, { onConflict: 'user_id' })
    if (saveError) setError(saveError.message)
    else {
      setNotice('Your cycle details are saved privately.')
      await loadWorkspace()
    }
  }

  async function saveDailyLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    const formData = new FormData(event.currentTarget)
    const symptoms = formData.getAll('symptoms').map(String)
    setError('')
    setNotice('')
    const { error: saveError } = await supabase.from('daily_logs').upsert({
      user_id: user.id,
      log_date: today,
      flow_level: String(formData.get('flow') || '') || null,
      mood: String(formData.get('mood') || '') || null,
      symptoms,
      notes: String(formData.get('notes') || '').trim() || null,
    }, { onConflict: 'user_id,log_date' })
    if (saveError) setError(saveError.message)
    else {
      setNotice('Your check-in is saved. Thank you for taking a moment for yourself.')
      await loadWorkspace()
    }
  }

  const navItems: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'cycle', label: 'My cycle', icon: CalendarDays },
    { id: 'daily-log', label: 'Daily check-in', icon: Heart },
  ]

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="sidebar-brand" href="#overview" onClick={() => goTo('overview')} aria-label="Sakhi Cycle overview"><img src="/sakhi-cycle-logo.png" alt="Sakhi Cycle" /></a>
        <div className="side-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => goTo(id)}><Icon size={18} /><span>{label}</span>{page === id && <ChevronRight size={16} className="nav-chevron" />}</button>
          ))}
        </nav>
        <div className="sidebar-prompt"><div className="prompt-icon"><Sparkles size={17} /></div><strong>A gentle reminder</strong><p>Your cycle is one part of your wellbeing. Be kind to yourself today.</p></div>
        <div className="sidebar-bottom"><span className="user-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="user-details"><strong>{displayName}</strong><small>Personal space</small></span><button className="icon-button signout-button" title="Sign out" onClick={onSignOut}><LogOut size={17} /></button></div>
      </aside>

      {mobileNavOpen && <button className="nav-backdrop" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-panel">
        <header className="workspace-header">
          <button className="mobile-menu icon-button" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="header-title"><span>{greeting}, {displayName}</span><h1>{page === 'overview' ? 'Your cycle space' : page === 'cycle' ? 'My cycle' : 'Daily check-in'}</h1></div>
          <div className="header-date"><CalendarDays size={17} /><span>{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span></div>
        </header>

        <div className="workspace-content">
          {notice && <div className="notice-banner" role="status"><Check size={17} />{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {error && <div className="error-banner" role="alert"><CircleHelp size={17} />{error}</div>}
          {loading ? <div className="content-loading"><span className="loading-heart" />Loading your private space…</div> : (
            <>
              {page === 'overview' && <OverviewPage displayName={displayName} cycle={cycle} todayLog={todayLog} recentLogs={recentLogs} goTo={goTo} />}
              {page === 'cycle' && <CyclePage cycle={cycle} onSubmit={saveCycle} />}
              {page === 'daily-log' && <DailyLogPage todayLog={todayLog} onSubmit={saveDailyLog} />}
            </>
          )}
        </div>
        <footer className="workspace-footer"><ShieldCheck size={15} /> Your cycle details are private and visible only to you.</footer>
      </main>
    </div>
  )
}

function OverviewPage({ displayName, cycle, todayLog, recentLogs, goTo }: {
  displayName: string; cycle: CycleSettings | null; todayLog: DailyLog | null; recentLogs: DailyLog[]; goTo: (page: Page) => void
}) {
  const configured = Boolean(cycle?.last_period_start && cycle.average_cycle_length)
  const start = cycle?.last_period_start
  const averageLength = cycle?.average_cycle_length || 28
  const elapsed = start ? Math.max(0, dayNumberBetween(start)) : 0
  const cycleDay = start ? elapsed % averageLength + 1 : null
  const nextStart = start ? addDays(start, (Math.floor(elapsed / averageLength) + 1) * averageLength) : null
  const daysToNext = nextStart ? Math.max(0, dayNumberBetween(localDateString(), nextStart)) : null
  const phase = cycleDay && cycle
    ? cycleDay <= (cycle.average_period_length || 5) ? 'Period days' : cycleDay <= Math.round(averageLength * 0.55) ? 'Follicular phase' : 'Luteal phase'
    : 'Your cycle, your pace'

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <div className="welcome-copy"><p className="eyebrow"><Sparkles size={15} /> YOUR PERSONAL CYCLE COMPANION</p><h2>Make space for <em>you,</em> {displayName}.</h2><p>Small check-ins can help you notice what feels good and what you may need.</p></div>
        <div className="welcome-flower" aria-hidden="true"><span>✿</span><Heart size={30} fill="currentColor" /></div>
      </section>

      <div className="dashboard-grid">
        <section className="card cycle-summary-card">
          <div className="card-heading"><div><p className="eyebrow">CYCLE SNAPSHOT</p><h3>{configured ? phase : 'Your cycle starts here'}</h3></div><span className="soft-icon"><CalendarDays size={19} /></span></div>
          {configured ? <>
            <div className="cycle-number-row"><div className="cycle-number">{cycleDay}<small>day</small></div><div className="cycle-summary-copy"><strong>{daysToNext === 0 ? 'Period may start today' : `About ${daysToNext} days to your next period`}</strong><span>Estimated from your typical cycle length.</span></div></div>
            <div className="cycle-progress"><div className="cycle-progress-fill" style={{ width: `${Math.max(6, Math.min(100, (cycleDay! / averageLength) * 100))}%` }} /></div>
            <div className="cycle-legend"><span>Cycle day 1</span><span>{averageLength} days</span></div>
            <div className="estimate-note"><CircleHelp size={14} /> Cycle dates are estimates and can vary. This is not a medical prediction.</div>
          </> : <>
            <p className="card-description">Add a few cycle details to get a personal estimate. You can change them anytime.</p>
            <button className="text-action" onClick={() => goTo('cycle')}>Set up my cycle <ArrowRight size={16} /></button>
          </>}
          {configured && nextStart && <div className="next-period-row"><span>Estimated next period</span><strong>{formatDate(nextStart, { month: 'long', day: 'numeric' })}</strong></div>}
        </section>

        <section className="card checkin-card">
          <div className="card-heading"><div><p className="eyebrow">TODAY, AT YOUR PACE</p><h3>{todayLog ? 'You checked in today' : 'How are you feeling?'}</h3></div><span className="soft-icon pink"><Heart size={19} /></span></div>
          {todayLog ? <div className="saved-checkin"><span className="saved-checkmark"><Check size={18} /></span><div><strong>Thank you for checking in</strong><p>{todayLog.mood ? `Mood: ${moods.find((mood) => mood.value === todayLog.mood)?.label || todayLog.mood}` : 'Your daily note is saved.'}</p></div></div> : <>
            <p className="card-description">A small moment to notice what your body might need today.</p>
            <div className="mood-row" aria-label="Mood check in preview">{moods.slice(0, 5).map((mood) => <span key={mood.value} title={mood.label}>{mood.face}</span>)}</div>
          </>}
          <button className="secondary-action full-width" onClick={() => goTo('daily-log')}>{todayLog ? 'Edit today’s check-in' : 'Start daily check-in'} <ArrowRight size={16} /></button>
        </section>

        <section className="card recent-card">
          <div className="card-heading"><div><p className="eyebrow">YOUR RECENT NOTES</p><h3>A little look back</h3></div><span className="soft-icon gold"><Activity size={19} /></span></div>
          {recentLogs.length ? <div className="recent-list">{recentLogs.slice(0, 4).map((log) => <div className="recent-item" key={log.id}><span className="recent-date">{formatDate(log.log_date, { month: 'short', day: 'numeric' })}</span><span className="recent-detail">{log.mood ? moods.find((mood) => mood.value === log.mood)?.label : 'Check-in'}{log.flow_level ? ` · ${log.flow_level} flow` : ''}{log.symptoms?.length ? ` · ${log.symptoms.length} ${log.symptoms.length === 1 ? 'symptom' : 'symptoms'}` : ''}</span><ChevronRight size={16} /></div>)}</div> : <p className="card-description">Your check-ins will appear here, helping you notice patterns over time.</p>}
          <button className="text-action" onClick={() => goTo('daily-log')}>Add today’s note <ArrowRight size={16} /></button>
        </section>

        <section className="care-card"><div className="care-sun"><Sun size={20} /></div><p className="eyebrow">A MOMENT FOR YOU</p><h3>Rest is productive, too.</h3><p>Listen to what your body is asking for. Your pace is the right pace.</p><div className="care-moon"><Moon size={18} /></div></section>
      </div>
    </div>
  )
}

function CyclePage({ cycle, onSubmit }: { cycle: CycleSettings | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="form-page">
      <section className="page-intro"><span className="large-icon"><CalendarDays size={22} /></span><div><p className="eyebrow">YOUR PERSONAL BASELINE</p><h2>Let’s get to know your cycle.</h2><p>These details help us create a gentle estimate. Your cycle is unique, and changing details is always okay.</p></div></section>
      <form className="card data-form" onSubmit={onSubmit}>
        <div className="form-field"><label htmlFor="periodStart">When did your last period start?</label><span className="field-hint">Choose the first day of your most recent period.</span><input id="periodStart" name="periodStart" type="date" max={localDateString()} defaultValue={cycle?.last_period_start || ''} required /></div>
        <div className="form-field"><label htmlFor="cycleLength">How many days is your cycle, usually?</label><span className="field-hint">Count from the first day of one period to the first day of the next.</span><div className="input-with-suffix"><input id="cycleLength" name="cycleLength" type="number" min="15" max="60" defaultValue={cycle?.average_cycle_length || 28} required /><span>days</span></div></div>
        <div className="form-field"><label htmlFor="periodLength">How many days does your period usually last?</label><span className="field-hint">A rough average is enough.</span><div className="input-with-suffix"><input id="periodLength" name="periodLength" type="number" min="1" max="15" defaultValue={cycle?.average_period_length || 5} required /><span>days</span></div></div>
        <div className="privacy-inline"><ShieldCheck size={17} /><span>These details are private to your account. You can update or remove them whenever you like.</span></div>
        <button className="primary-action" type="submit">Save my cycle details <ArrowRight size={17} /></button>
      </form>
    </div>
  )
}

function DailyLogPage({ todayLog, onSubmit }: { todayLog: DailyLog | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="form-page daily-form-page">
      <section className="page-intro"><span className="large-icon warm"><Heart size={22} /></span><div><p className="eyebrow">A GENTLE CHECK-IN · {formatDate(localDateString(), { weekday: 'long', month: 'long', day: 'numeric' })}</p><h2>How are you feeling today?</h2><p>No right or wrong answers. This is a private space to notice and record what’s going on for you.</p></div></section>
      <form className="card data-form daily-form" onSubmit={onSubmit}>
        <fieldset className="form-field"><legend>What’s your mood like?</legend><div className="mood-options">{moods.map((mood) => <label key={mood.value} className="mood-option"><input type="radio" name="mood" value={mood.value} defaultChecked={todayLog?.mood === mood.value} /><span className="mood-face">{mood.face}</span><span>{mood.label}</span></label>)}</div></fieldset>
        <fieldset className="form-field"><legend>Any flow today?</legend><div className="choice-row">{[
          { value: '', label: 'None' }, { value: 'spotting', label: 'Spotting' }, { value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' }, { value: 'heavy', label: 'Heavy' },
        ].map((item) => <label className="pill-choice" key={item.value}><input type="radio" name="flow" value={item.value} defaultChecked={(todayLog?.flow_level || '') === item.value} /><span>{item.label}</span></label>)}</div></fieldset>
        <fieldset className="form-field"><legend>Anything you noticed in your body?</legend><p className="field-hint">Select any that feel true today.</p><div className="symptom-grid">{symptomOptions.map((symptom) => <label className="symptom-choice" key={symptom}><input type="checkbox" name="symptoms" value={symptom} defaultChecked={todayLog?.symptoms?.includes(symptom)} /><span className="custom-check"><Check size={13} /></span>{symptom}</label>)}</div></fieldset>
        <div className="form-field"><label htmlFor="notes">Anything else you’d like to remember?</label><span className="field-hint">Optional. Your notes are private.</span><textarea id="notes" name="notes" rows={4} maxLength={2000} defaultValue={todayLog?.notes || ''} placeholder="A thought, a feeling, or something that helped today…" /></div>
        <div className="privacy-inline"><ShieldCheck size={17} /><span>Your check-in is saved privately to your account.</span></div>
        <button className="primary-action" type="submit"><Plus size={17} /> Save today’s check-in</button>
      </form>
    </div>
  )
}
