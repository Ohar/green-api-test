import type { ChatEvent, Contact, MessageStatus } from '../types'
import type { ChatStore } from './index'
import {
  mergeStatus, newChat, nextMessageOrder, serverKey, sortMessages,
  withLatestMessage,
} from '../helpers/messages'

export function selectChat(store: ChatStore, chatId: string | null): void {
  store.setState((state) => ({
    selectedChatId: chatId,
    chats: state.chats.map((chat) => chat.chatId === chatId
      ? { ...chat, unread: 0 }
      : chat),
  }))
}

export function setDraft(
  store: ChatStore, chatId: string, draft: string,
): void {
  store.setState((state) => ({
    chats: state.chats.map((chat) => chat.chatId === chatId
      ? { ...chat, draft }
      : chat),
  }))
}

export function addContact(store: ChatStore, contact: Contact): void {
  store.setState((state) => ({
    chats: state.chats.some((chat) => chat.chatId === contact.chatId)
      ? state.chats.map((chat) => chat.chatId === contact.chatId
        ? { ...chat, phone: contact.phone, name: contact.name || chat.name }
        : chat)
      : [...state.chats, newChat(contact)],
  }))

  selectChat(store, contact.chatId)
}

export function applyStatus(
  store: ChatStore,
  chatId: string,
  idMessage: string | undefined,
  status: MessageStatus,
): void {
  if (chatId.endsWith('@c.us')) {
    const phone = chatId.slice(0, -5)
    const chat = store.getState().chats.find((item) => item.phone === phone)

    if (!chat) {
      store.setState({
        statusMessage: 'Не удалось отправить сообщение по номеру телефона.',
      })

      return
    }

    chatId = chat.chatId
  }

  if (!idMessage) {
    if (status === 'failed' || status === 'noAccount') {
      store.setState((state) => ({
        sendErrors: {
          ...state.sendErrors,
          [chatId]: 'Telegram не смог отправить сообщение в этот чат.',
        },
      }))
    }

    return
  }

  const key = serverKey(chatId, idMessage)

  store.setState((state) => ({
    pendingStatuses: {
      ...state.pendingStatuses,
      [key]: mergeStatus(state.pendingStatuses[key] ?? 'accepted', status),
    },
    messages: state.messages.map((message) => message.chatId === chatId
      && message.idMessage === idMessage
      ? { ...message, status: mergeStatus(message.status, status) }
      : message),
  }))
}

export function applyMessage(
  store: ChatStore,
  event: Extract<ChatEvent, { kind: 'message' }>,
): void {
  store.setState((state) => {
    const message = event.message
    const key = serverKey(message.chatId, message.idMessage ?? '')
    const existing = state.messages.find((item) =>
      item.chatId === message.chatId && item.idMessage === message.idMessage)

    if (existing) {
      const messages = sortMessages(state.messages.map((item) =>
        item.localId === existing.localId
          ? { ...item, timestamp: message.timestamp,
            status: mergeStatus(item.status, message.status) }
          : item))

      return {
        messages,
        chats: state.chats.map((chat) => chat.chatId === message.chatId
          ? withLatestMessage(chat, messages) : chat),
      }
    }

    const incomingUnread = message.direction === 'incoming'
      && state.selectedChatId !== message.chatId
    const chat = state.chats.find((item) => item.chatId === message.chatId)
      ?? newChat({ chatId: message.chatId, name: event.name, phone: '' })
    const messages = sortMessages([...state.messages, {
      ...message,
      order: nextMessageOrder(state.messages),
      status: state.pendingStatuses[key] ?? message.status,
    }])
    const updated = withLatestMessage({
      ...chat,
      unread: chat.unread + (incomingUnread ? 1 : 0),
    }, messages)

    return {
      chats: [...state.chats.filter((item) => item.chatId !== chat.chatId),
        updated],
      messages,
    }
  })
}
