import type { Chat, Contact, Message, MessageStatus } from '../types'

export function newChat(contact: Contact): Chat {
  return {
    ...contact,
    draft: '',
    unread: 0,
    lastMessage: '',
    updatedAt: 0,
  }
}

export function serverKey(chatId: string, idMessage: string): string {
  return `${chatId}:${idMessage}`
}

export function mergeStatus(current: MessageStatus, next: MessageStatus) {
  if (current === 'read' || current === 'failed' || current === 'noAccount') {
    return current
  }

  if (current === 'delivered' && next === 'accepted') {
    return current
  }

  return next
}

export function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((left, right) =>
    left.timestamp - right.timestamp || (left.order ?? 0) - (right.order ?? 0))
}

export function nextMessageOrder(messages: Message[]): number {
  return messages.reduce((max, message) => Math.max(max, message.order ?? 0), 0)
    + 1
}

export function withLatestMessage(chat: Chat, messages: Message[]): Chat {
  const latest = messages.filter((message) => message.chatId === chat.chatId)
    .at(-1)

  return latest
    ? { ...chat, lastMessage: latest.text, updatedAt: latest.timestamp }
    : chat
}
