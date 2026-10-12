import type { Credentials } from '../../core/types'
import type { RequestOptions } from '../types'
import { REQUEST_TIMEOUT } from '../../core/constants'
import { ChatError } from '../../core/helpers/errors'
import { httpError } from './errors'

export async function request(
  credentials: Credentials,
  signal: AbortSignal,
  operation: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const { apiUrl, idInstance, apiTokenInstance } = credentials
  const base = `${apiUrl}/waInstance${idInstance}/${operation}`
  const url = `${base}/${apiTokenInstance}${options.suffix ?? ''}`
  const timeout = AbortSignal.timeout(options.timeout ?? REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      body: options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
      headers: options.body === undefined
        ? undefined
        : { 'Content-Type': 'application/json' },
      signal: AbortSignal.any([signal, timeout]),
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    })

    if (!response.ok) {
      throw httpError(response.status, response.headers.get('Retry-After'))
    }

    const text = await response.text()

    if (!text.trim()) {
      return null
    }

    try {
      return JSON.parse(text) as unknown
    } catch {
      throw new ChatError('Некорректный ответ GREEN-API.', false, true)
    }
  } catch (error) {
    signal.throwIfAborted()

    if (error instanceof ChatError) {
      throw error
    }

    throw new ChatError(
      'Нет связи с API. Проверьте сеть, apiUrl и доступ браузера (CORS).',
      true,
      true,
    )
  }
}
