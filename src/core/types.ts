export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

export type MessageStatus =
  | 'sending'
  | 'accepted'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'noAccount'
  | 'unknown'
  | 'received'

export interface Chat {
  chatId: string
  aliases?: string[]
  name: string
  phone?: string
  draft: string
  unread: number
  lastMessage: string
  updatedAt: number
}

export interface Message {
  localId: string
  idMessage?: string
  chatId: string
  direction: 'incoming' | 'outgoing'
  text: string
  timestamp: number
  order?: number
  status: MessageStatus
  error?: string
}

export interface Envelope {
  receiptId: number
  body: unknown
}

export interface Contact {
  chatId: string
  name: string
  phone: string
}

export type ChatEvent =
  | { kind: 'message', message: Message, name: string }
  | {
    kind: 'status'
    chatId: string
    idMessage?: string
    status: MessageStatus
  }
  | { kind: 'state', state: string }
  | { kind: 'quota' }
  | { kind: 'ignored' }
