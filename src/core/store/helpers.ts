import type { ChatState } from './types'

export function initialState(): ChatState {
  return {
    status: 'disconnected',
    statusMessage: '',
    chats: [],
    messages: [],
    selectedChatId: null,
    pendingStatuses: {},
    connecting: false,
    requiresReconnect: false,
    creating: false,
    connectionError: '',
    createError: '',
    sendErrors: {},
    sending: {},
  }
}
