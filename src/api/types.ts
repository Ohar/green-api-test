import type { Contact, Envelope } from '../core/types'

export interface GreenApi {
  state(): Promise<string>
  settings(): Promise<Record<string, unknown>>
  check(phone: string): Promise<Contact>
  send(chatId: string, text: string): Promise<string>
  receive(): Promise<Envelope | null>
  acknowledge(receiptId: number): Promise<boolean>
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  suffix?: string
  timeout?: number
}
