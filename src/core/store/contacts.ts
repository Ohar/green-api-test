import type { Chat, Contact, MessageStatus } from '../types'
import type { ChatState } from './types'
import {
  mergeStatus, newChat, sortMessages, withLatestMessage,
} from '../helpers/messages'

export function resolveChatId(chats: Chat[], id: string): string {
  const phone = id.endsWith('@c.us') ? id.slice(0, -5) : undefined

  return chats.find((chat) => chat.chatId === id)?.chatId
    ?? chats.find((chat) => chat.aliases?.includes(id)
      || (phone && chat.phone === phone))?.chatId
    ?? id
}

export function mergeContact(state: ChatState, contact: Contact) {
  const phoneId = `${contact.phone}@c.us`
  const matches = state.chats.filter((chat) =>
    [contact.chatId, phoneId].some((id) =>
      chat.chatId === id || chat.aliases?.includes(id))
    || chat.phone === contact.phone)
  const ids = new Set([
    contact.chatId, phoneId,
    ...matches.flatMap((chat) => [chat.chatId, ...chat.aliases ?? []]),
  ])
  const previous = matches.find((chat) => chat.chatId === contact.chatId)
    ?? matches[0] ?? newChat(contact)
  const pendingStatuses: Record<string, MessageStatus> = {}

  for (const [key, status] of Object.entries(state.pendingStatuses)) {
    const separator = key.indexOf(':')
    const chatId = key.slice(0, separator)
    const resolvedKey = ids.has(chatId)
      ? `${contact.chatId}${key.slice(separator)}` : key

    pendingStatuses[resolvedKey] = mergeStatus(
      pendingStatuses[resolvedKey] ?? 'accepted', status,
    )
  }

  const messages = sortMessages(state.messages.map((message) =>
    ids.has(message.chatId) ? { ...message, chatId: contact.chatId } : message))
    .filter((message, index, all) => !message.idMessage
      || all.findIndex((other) => other.chatId === message.chatId
        && other.idMessage === message.idMessage) === index)
    .map((message) => ({
      ...message,
      status: mergeStatus(message.status,
        pendingStatuses[`${message.chatId}:${message.idMessage}`]
          ?? message.status),
    }))
  const chat = withLatestMessage({
    ...previous,
    ...contact,
    aliases: [...ids].filter((id) => id !== contact.chatId),
    draft: matches.map((item) => item.draft).filter(Boolean).join('\n'),
    unread: 0,
  }, messages)

  return {
    chats: [...state.chats.filter((item) => !matches.includes(item)), chat],
    messages,
    pendingStatuses,
    selectedChatId: contact.chatId,
    sending: {
      ...Object.fromEntries(Object.entries(state.sending)
        .filter(([id]) => !ids.has(id))),
      [contact.chatId]: [...ids].some((id) => state.sending[id]),
    },
    sendErrors: {
      ...Object.fromEntries(Object.entries(state.sendErrors)
        .filter(([id]) => !ids.has(id))),
      [contact.chatId]: [...ids].map((id) => state.sendErrors[id])
        .find(Boolean) ?? '',
    },
  }
}
