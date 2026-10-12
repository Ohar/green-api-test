import type { Chat, Message } from '../../core/types'

export { ChatPanel } from './ChatPanel'

export interface ChatPanelProps {
  chat: Chat | null
  messages: Message[]
  sending: boolean
  disabled?: boolean
  error?: string
  onDraftChange: (text: string) => void
  onSend: () => Promise<void>
  onBack: () => void
  onRetry?: (localId: string) => void
}
