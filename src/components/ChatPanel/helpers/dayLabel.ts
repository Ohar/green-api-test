import { messageDate } from '../constants/layout'

export function dayLabel(timestamp: number, previous?: number) {
  const date = new Date(timestamp)
  const today = new Date()

  if (previous && new Date(previous).toDateString() === date.toDateString()) {
    return null
  }

  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня'
  }

  return messageDate.format(date)
}
