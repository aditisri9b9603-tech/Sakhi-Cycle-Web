export type Page =
  | 'overview'
  | 'calendar'
  | 'cycle'
  | 'daily-log'
  | 'insights'
  | 'learn'
  | 'companion'
  | 'sharing'
  | 'community'
  | 'settings'

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'
export type Mood = 'great' | 'good' | 'okay' | 'low' | 'awful'
export type Energy = 'low' | 'okay' | 'good' | 'high'

export type Profile = {
  id: string
  display_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type CycleSettings = {
  user_id: string
  average_cycle_length: number | null
  average_period_length: number | null
  last_period_start: string | null
  tracking_enabled: boolean
}

export type DailyLog = {
  id: string
  user_id: string
  log_date: string
  flow_level: FlowLevel | null
  symptoms: string[]
  mood: Mood | null
  energy: Energy | null
  sleep_hours: number | null
  notes: string | null
}

export type ShareLink = {
  id: string
  owner_id: string
  recipient_email: string
  recipient_user_id: string | null
  status: 'pending' | 'active' | 'revoked'
  share_cycle_estimates: boolean
  share_mood_summary: boolean
  share_symptom_summary: boolean
  share_flow_summary: boolean
  consent_acknowledged_at: string
  created_at: string
}

export type SharedSnapshot = {
  share_id: string
  owner_label: string
  share_cycle_estimates: boolean
  share_mood_summary: boolean
  share_symptom_summary: boolean
  share_flow_summary: boolean
  average_cycle_length: number | null
  average_period_length: number | null
  last_period_start: string | null
  mood_counts: Record<string, number> | null
  top_symptoms: { symptom: string; count: number }[] | null
  flow_days_last_30: number | null
}

export type CommunityPost = {
  id: string
  author_id: string
  author_label: string
  title: string
  body: string
  created_at: string
}

export type CommunityComment = {
  id: string
  post_id: string
  author_id: string
  author_label: string
  body: string
  created_at: string
}

export type CompanionMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const moods: { value: Mood; label: string; face: string }[] = [
  { value: 'great', label: 'Great', face: '☺' },
  { value: 'good', label: 'Good', face: '☻' },
  { value: 'okay', label: 'Okay', face: '😐' },
  { value: 'low', label: 'Low', face: '☹' },
  { value: 'awful', label: 'Rough', face: '☹' },
]

export const energyOptions: { value: Energy; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'okay', label: 'Okay' },
  { value: 'good', label: 'Good' },
  { value: 'high', label: 'High' },
]

export const symptomOptions = [
  'Cramps',
  'Headache',
  'Bloating',
  'Tender breasts',
  'Fatigue',
  'Acne',
  'Cravings',
  'Backache',
]
