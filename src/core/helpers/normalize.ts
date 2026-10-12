import type { ChatEvent, MessageStatus } from '../types'
import { MESSAGE_EVENTS, SERVER_STATUSES } from '../constants'
import { ChatError } from './errors'
import { canonicalChatId, nonEmptyString, record } from './validation'

export function normalizeEvent(body: unknown, instanceId: string): ChatEvent {
  const data = record(body)
  const instance = record(data.instanceData)

  if (String(instance.idInstance) !== instanceId
    || instance.typeInstance !== 'telegram') {
    throw new ChatError('Уведомление другого инстанса. Приём остановлен.')
  }

  const type = nonEmptyString(data.typeWebhook)

  if (type === 'stateInstanceChanged') {
    return { kind: 'state', state: nonEmptyString(data.stateInstance) }
  }

  if (type === 'quotaExceeded') {
    return { kind: 'quota' }
  }

  if (type === 'outgoingMessageStatus') {
    const status = nonEmptyString(data.status)

    if (!SERVER_STATUSES.includes(status)) {
      return { kind: 'ignored' }
    }

    const chatId = nonEmptyString(data.chatId)

    if (!/^[1-9]\d*@c\.us$/.test(chatId)) {
      canonicalChatId(chatId)
    }

    return {
      kind: 'status',
      chatId,
      idMessage: typeof data.idMessage === 'string'
        ? data.idMessage : undefined,
      status: status as MessageStatus,
    }
  }

  if (!MESSAGE_EVENTS.includes(type)) {
    return { kind: 'ignored' }
  }

  const sender = record(data.senderData)
  const chatId = canonicalChatId(sender.chatId)

  if (chatId.startsWith('-')) {
    return { kind: 'ignored' }
  }

  const content = record(data.messageData)

  if (!['textMessage', 'extendedTextMessage'].includes(
    String(content.typeMessage),
  )) {
    return { kind: 'ignored' }
  }

  const text = content.typeMessage === 'textMessage'
    ? record(content.textMessageData).textMessage
    : record(content.extendedTextMessageData).text

  if (typeof text !== 'string' || typeof data.timestamp !== 'number'
    || !Number.isFinite(data.timestamp) || data.timestamp <= 0) {
    throw new ChatError('Не удалось прочитать текст уведомления.')
  }

  const idMessage = nonEmptyString(data.idMessage)
  const incoming = type === 'incomingMessageReceived'

  return {
    kind: 'message',
    name: typeof sender.chatName === 'string' && sender.chatName
      ? sender.chatName
      : chatId,
    message: {
      localId: `${chatId}:${idMessage}`,
      idMessage,
      chatId,
      direction: incoming ? 'incoming' : 'outgoing',
      text,
      timestamp: data.timestamp * 1000,
      status: incoming ? 'received' : 'accepted',
    },
  }
}
