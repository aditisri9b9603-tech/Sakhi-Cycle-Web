import { addDays, dayNumberBetween, localDateString } from './dates'
import type { CycleSettings, DailyLog } from './types'

export function cycleSnapshot(cycle: CycleSettings | null) {
  const configured = Boolean(cycle?.last_period_start && cycle.average_cycle_length)
  const start = cycle?.last_period_start
  const averageLength = cycle?.average_cycle_length || 28
  const periodLength = cycle?.average_period_length || 5
  const elapsed = start ? Math.max(0, dayNumberBetween(start)) : 0
  const cycleDay = start ? (elapsed % averageLength) + 1 : null
  const nextStart = start ? addDays(start, (Math.floor(elapsed / averageLength) + 1) * averageLength) : null
  const daysToNext = nextStart ? Math.max(0, dayNumberBetween(localDateString(), nextStart)) : null
  const phase = cycleDay && cycle
    ? cycleDay <= periodLength
      ? 'Period days'
      : cycleDay <= Math.round(averageLength * 0.55)
        ? 'Follicular phase'
        : 'Luteal phase'
    : 'Your cycle, your pace'

  return { configured, averageLength, periodLength, cycleDay, nextStart, daysToNext, phase }
}

export function dayKind(date: string, cycle: CycleSettings | null, log: DailyLog | undefined) {
  const recorded = Boolean(log?.flow_level)
  const cycleLength = cycle?.average_cycle_length || 28
  const periodLength = cycle?.average_period_length || 5
  const elapsed = cycle?.last_period_start ? dayNumberBetween(cycle.last_period_start, date) : null
  const position = elapsed === null ? null : ((elapsed % cycleLength) + cycleLength) % cycleLength
  const estimated = !recorded && position !== null && position < periodLength
  return { recorded, estimated, period: recorded || estimated }
}
