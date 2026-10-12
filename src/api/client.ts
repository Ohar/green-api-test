import type { Credentials, Envelope } from '../core/types'
import type { GreenApi } from './types'
import { POLL_TIMEOUT, RECEIVE_TIMEOUT } from '../core/constants'
import { ChatError } from '../core/helpers/errors'
import {
  canonicalChatId,
  nonEmptyString,
  record,
} from '../core/helpers/validation'
import { request } from './helpers/request'

export function createApi(
  credentials: Credentials,
  signal: AbortSignal,
): GreenApi {
  return {
    async state() {
      const data = record(await request(credentials, signal,
        'getStateInstance'))

      return nonEmptyString(data.stateInstance)
    },
    async settings() {
      return record(await request(credentials, signal, 'getSettings'))
    },
    async check(phone) {
      const data = record(await request(credentials, signal, 'checkAccount', {
        method: 'POST',
        body: { phoneNumber: Number(phone) },
      }))

      if (data.status === false) {
        const detail = data.data && typeof data.data === 'object'
          ? record(data.data)
          : {}

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

      return {
        chatId: canonicalChatId(data.chatId),
        name: typeof data.username === 'string' && data.username
          ? data.username
          : `+${phone}`,
        phone,
      }
    },
    async send(chatId, text) {
      const value = await request(credentials, signal, 'sendMessage', {
        method: 'POST',
        body: { chatId, message: text },
      })
      const data = value && typeof value === 'object'
        ? value as Record<string, unknown>
        : {}

      if (typeof data.idMessage !== 'string' || !data.idMessage) {
        throw new ChatError('Результат отправки неизвестен.', false, true)
      }

      return data.idMessage
    },
    async receive() {
      const value = await request(credentials, signal, 'receiveNotification', {
        suffix: `?receiveTimeout=${RECEIVE_TIMEOUT}`,
        timeout: POLL_TIMEOUT,
      })

      if (value === null) {
        return null
      }

      const data = record(value)

      if (!Number.isSafeInteger(data.receiptId)
        || Number(data.receiptId) < 0 || !data.body) {
        throw new ChatError('Неверный формат уведомления. Приём остановлен.')
      }

      return data as unknown as Envelope
    },
    async acknowledge(receiptId) {
      const data = record(await request(credentials, signal,
        'deleteNotification', {
          method: 'DELETE',
          suffix: `/${receiptId}`,
        }))

      if (typeof data.result !== 'boolean') {
        throw new ChatError('Не удалось подтвердить обработку уведомления.')
      }

      return data.result
    },
  }
}
