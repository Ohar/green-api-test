import type { Chat } from '../../core/types'

export { ChatSidebar } from './ChatSidebar'

export interface ChatSidebarProps {
  chats: Chat[]
  selectedChatId: string | null
  creating: boolean
  error?: string
  onCreateChat: (phone: string) => Promise<void>
  onSelectChat: (chatId: string) => void
  onDisconnect: () => void
}
