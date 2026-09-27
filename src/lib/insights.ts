import { dayNumberBetween, localDateString } from './dates'
import type { DailyLog } from './types'

export function insightsFromLogs(logs: DailyLog[]) {
  const last30 = logs.filter((log) => dayNumberBetween(log.log_date, localDateString()) <= 30)
  const moodCounts = new Map<string, number>()
  const symptomCounts = new Map<string, number>()
  const energyValues: string[] = []
  const sleepValues: number[] = []
  let checkInsLast7 = 0

  for (const log of last30) {
    if (dayNumberBetween(log.log_date, localDateString()) <= 7) checkInsLast7 += 1
    if (log.mood) moodCounts.set(log.mood, (moodCounts.get(log.mood) || 0) + 1)
    for (const symptom of log.symptoms || []) {
      symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1)
    }
    if (log.energy) energyValues.push(log.energy)
    if (typeof log.sleep_hours === 'number') sleepValues.push(log.sleep_hours)
  }

  const topMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null
  const topSymptoms = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([symptom, count]) => ({ symptom, count }))
  const averageSleep = sleepValues.length
    ? Math.round((sleepValues.reduce((sum, hours) => sum + hours, 0) / sleepValues.length) * 10) / 10
    : null

  return {
    sampleSize: last30.length,
    checkInsLast7,
    topMood,
    topSymptoms,
    energyMostCommon: [...energyValues.reduce((map, value) => {
      map.set(value, (map.get(value) || 0) + 1)
      return map
    }, new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    averageSleep,
    flowDays: last30.filter((log) => log.flow_level).length,
  }
}

export function recentContextForCompanion(logs: DailyLog[]) {
  const recent = logs
    .filter((log) => dayNumberBetween(log.log_date, localDateString()) <= 14)
    .slice(0, 14)
    .map((log) => ({
      date: log.log_date,
      mood: log.mood,
      energy: log.energy,
      sleep_hours: log.sleep_hours,
      flow_level: log.flow_level,
      symptoms: log.symptoms,
    }))
  return recent
}
