import type { ApiRequest } from '../types'
import { ChatError } from '../../core/helpers/errors'
import { nonEmptyString, record } from '../../core/helpers/validation'

export function telegramChatId(value: unknown): string | null {
  const id = nonEmptyString(value)

  return /^[1-9]\d*$/.test(id) ? id : null
}

export async function checkTelegram(phone: string, request: ApiRequest) {
  const data = record(await request('checkAccount', {
    method: 'POST', body: { phoneNumber: Number(phone) },
  }))

  if (data.status === false) {
    const detail = data.data && typeof data.data === 'object'
      ? record(data.data) : {}

    if (detail.reason === 'rate_limit_exceeded') {
      throw new ChatError(
        'Проверки номеров ограничены Telegram. Повторите позже.',
      )
    }

    throw new ChatError('Проверка номера недоступна. Повторите позже.')
  }

  if (data.exist !== true) {
    throw new ChatError(
      'Аккаунт не найден по номеру или номер скрыт приватностью.',
    )
  }

  const chatId = telegramChatId(data.chatId)

  if (!chatId) {
    throw new ChatError('Неожиданный идентификатор Telegram-чата.')
  }

  return {
    chatId, phone,
    name: typeof data.username === 'string' && data.username
      ? data.username : `+${phone}`,
  }
}
