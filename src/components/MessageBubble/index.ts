import type { Message } from '../../core/types'

export { MessageBubble } from './MessageBubble'

export interface MessageBubbleProps {
  message: Message
  onRetry?: (localId: string) => void
}
