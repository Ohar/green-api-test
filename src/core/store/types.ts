import type {
  Chat,
  ConnectionStatus,
  Message,
  MessageStatus,
} from '../types'

export interface ChatState {
  status: ConnectionStatus
  statusMessage: string
  chats: Chat[]
  messages: Message[]
  selectedChatId: string | null
  pendingStatuses: Record<string, MessageStatus>
  connecting: boolean
  requiresReconnect: boolean
  creating: boolean
  connectionError: string
  createError: string
  sendErrors: Record<string, string>
  sending: Record<string, boolean>
}
