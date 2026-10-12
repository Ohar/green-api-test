import type { Contact } from '../core/types'
import type { RequestOptions } from '../api/types'

export type MessengerId = 'whatsapp' | 'telegram'

export type ApiRequest = (
  operation: string, options?: RequestOptions,
) => Promise<unknown>

export interface Messenger {
  id: MessengerId
  label: string
  maxMessageLength: number
  instanceStates: Record<string, string>
  chatId: (value: unknown) => string | null
  check: (phone: string, request: ApiRequest) => Promise<Contact>
}
