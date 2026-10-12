import type { ChatEvent, MessageStatus } from '../types'
import type { Messenger } from '../../messengers/types'
import { MESSAGE_EVENTS, SERVER_STATUSES } from '../constants'
import { ChatError } from './errors'
import { nonEmptyString, record } from './validation'

export function normalizeEvent(
  body: unknown, instanceId: string, messenger: Messenger,
): ChatEvent {
  const data = record(body)
  const instance = record(data.instanceData)

  if (String(instance.idInstance) !== instanceId
    || instance.typeInstance !== messenger.id) {
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

    if (status === 'suspended' || status === 'yellowCard') {
      return { kind: 'state', state: 'suspended' }
    }

    if (!SERVER_STATUSES.includes(status)) {
      return { kind: 'ignored' }
    }

    const chatId = nonEmptyString(data.chatId)

    if (!/^[1-9]\d*@c\.us$/.test(chatId) && !messenger.chatId(chatId)) {
      return { kind: 'ignored' }
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
  const chatId = messenger.chatId(sender.chatId)

  if (!chatId) {
    return { kind: 'ignored' }
  }

  const content = record(data.messageData)

  if (!['textMessage', 'extendedTextMessage', 'quotedMessage'].includes(
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
    name: [sender.chatName, sender.senderContactName, sender.senderName]
      .find((value): value is string => typeof value === 'string' && !!value)
      ?? chatId,
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
