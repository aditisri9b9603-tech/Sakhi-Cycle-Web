export function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

export function formatDate(dateString: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${dateString}T12:00:00`))
}

export function dayNumberBetween(start: string, end = localDateString()) {
  const startTime = new Date(`${start}T12:00:00`).getTime()
  const endTime = new Date(`${end}T12:00:00`).getTime()
  return Math.floor((endTime - startTime) / 86_400_000)
}
