import { shortDate, shortTime } from '../constants/formats'

export function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()

  if (!Number.isFinite(date.getTime())) {
    return ''
  }

  return date.toDateString() === today.toDateString()
    ? shortTime.format(date)
    : shortDate.format(date)
}
