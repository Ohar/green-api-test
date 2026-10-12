import type { ApiRequest } from '../types'
import { ChatError } from '../../core/helpers/errors'
import { nonEmptyString, record } from '../../core/helpers/validation'

export function whatsappChatId(value: unknown): string | null {
  const id = nonEmptyString(value)

  return /^[1-9]\d*@(c\.us|lid)$/.test(id) ? id : null
}

export async function checkWhatsapp(phone: string, request: ApiRequest) {
  const data = record(await request('checkWhatsapp', {
    method: 'POST', body: { chatId: `${phone}@c.us` },
  }))

  if (data.existsWhatsapp !== true) {
    throw new ChatError('На этом номере не найден аккаунт WhatsApp.')
  }

  // Older instances return only existsWhatsapp, without a canonical ID.
  const chatId = whatsappChatId(data.chatId ?? `${phone}@c.us`)

  if (!chatId) {
    throw new ChatError('Неожиданный идентификатор WhatsApp-чата.')
  }

  return {
    chatId, phone,
    name: typeof data.username === 'string' && data.username
      ? data.username : `+${phone}`,
  }
}
