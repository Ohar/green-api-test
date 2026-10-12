import type { Message } from '../../../core/types'

export const messageStatusLabels: Record<Message['status'], string> = {
  sending: 'Отправляется',
  accepted: 'Принято сервисом',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
  noAccount: 'Получатель недоступен',
  unknown: 'Результат неизвестен',
  received: 'Получено',
}

export const messageTime = new Intl.DateTimeFormat('ru', {
  hour: '2-digit',
  minute: '2-digit',
})
