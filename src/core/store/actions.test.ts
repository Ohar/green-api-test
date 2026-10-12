import { describe, expect, it } from 'vitest'
import { credentials, textEvent } from '../../test/fixtures'
import { normalizeEvent } from '../helpers/normalize'
import { createChatStore } from './index'
import { addContact, applyMessage, applyStatus } from './actions'

describe('message identity and status reconciliation', () => {
  it('updates backlog preview and caches a resolved incoming contact', () => {
    const store = createChatStore()

    for (const [index, text] of ['Первое', 'Последнее'].entries()) {
      const event = normalizeEvent({
        ...textEvent(String(index), '10001', text),
        timestamp: 1_792_000_000 + index,
      }, credentials.idInstance)

      if (event.kind === 'message') {
        applyMessage(store, event)
      }
    }

    addContact(store, { chatId: '10001', name: 'Чат', phone: '79991234567' })
    expect(store.getState().chats).toHaveLength(1)
    expect(store.getState().chats[0]).toMatchObject({
      lastMessage: 'Последнее', phone: '79991234567',
      updatedAt: 1_792_000_001_000,
    })
  })

  it('deduplicates redelivery but keeps same id in another chat', () => {
    const store = createChatStore()

    for (const chatId of ['10001', '10001', '20002']) {
      const event = normalizeEvent(textEvent('same', chatId),
        credentials.idInstance)

      if (event.kind === 'message') {
        applyMessage(store, event)
      }
    }

    expect(store.getState().messages).toHaveLength(2)
    expect(store.getState().chats.map((chat) => chat.unread)).toEqual([1, 1])
  })

  it('keeps early read status and never lowers it to delivered', () => {
    const store = createChatStore()

    applyStatus(store, '10001', '1', 'read')

    const event = normalizeEvent(textEvent('1', '10001', 'Привет',
      'outgoingAPIMessageReceived'), credentials.idInstance)

    if (event.kind === 'message') {
      applyMessage(store, event)
    }

    applyStatus(store, '10001', '1', 'delivered')

    expect(store.getState().messages[0]?.status).toBe('read')
  })
})
