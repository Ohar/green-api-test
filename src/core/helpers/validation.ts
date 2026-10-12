import type { Credentials } from '../types'
import { MAX_MESSAGE_LENGTH } from '../constants'
import { ChatError } from './errors'

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ChatError('Сервис вернул неожиданный формат данных.')
  }

  return value as Record<string, unknown>
}

export function nonEmptyString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ChatError('Сервис вернул неполные данные.')
  }

  return value
}

export function canonicalChatId(value: unknown): string {
  const chatId = nonEmptyString(value)

  if (!/^-?[1-9]\d*$/.test(chatId)) {
    throw new ChatError('Неожиданный идентификатор Telegram-чата.')
  }

  return chatId
}

export function normalizePhone(input: string): string {
  const compact = input.trim().replace(/[\s()-]/g, '')

  if (!/^\+?[1-9]\d{5,14}$/.test(compact)) {
    throw new ChatError('Введите номер с кодом страны, например +7…')
  }

  const phone = compact.replace(/^\+/, '')

  if (!Number.isSafeInteger(Number(phone))) {
    throw new ChatError('Проверьте номер телефона.')
  }

  return phone
}

export function validateCredentials(input: Credentials): Credentials {
  let url: URL

  try {
    url = new URL(input.apiUrl.trim())
  } catch {
    throw new ChatError('Скопируйте apiUrl из кабинета GREEN-API.')
  }

  const validHost = /^(?:\d+\.)?api\.green-api\.com$/.test(url.hostname)

  if (
    !validHost || url.protocol !== 'https:' || url.port
    || url.username || url.password || url.search || url.hash
    || url.pathname !== '/'
  ) {
    throw new ChatError('Разрешён только HTTPS API-хост GREEN-API.')
  }

  const idInstance = input.idInstance.trim()
  const apiTokenInstance = input.apiTokenInstance.trim()

  if (!/^\d{1,20}$/.test(idInstance)) {
    throw new ChatError('idInstance должен содержать только цифры.')
  }

  if (!/^[a-zA-Z0-9_-]{8,256}$/.test(apiTokenInstance)) {
    throw new ChatError('Проверьте apiTokenInstance из кабинета.')
  }

  return { apiUrl: url.origin, idInstance, apiTokenInstance }
}

export function validateMessage(text: string): void {
  if (!text.trim()) {
    throw new ChatError('Введите сообщение.')
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new ChatError('Сообщение не должно превышать 4096 символов.')
  }
}
