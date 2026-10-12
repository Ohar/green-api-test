import { describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '../../api/types'
import { whatsapp } from '../../messengers/whatsapp'
import { credentials, deferred, textEvent } from '../../test/fixtures'
import { normalizeEvent } from '../helpers/normalize'
import { sendMessage } from '../session/helpers/send'
import { createChatStore } from './index'
import { addContact, applyMessage, applyStatus, setDraft } from './actions'

function message(chatId: string, idMessage = '1') {
  const event = normalizeEvent({
    ...textEvent(idMessage, chatId, 'Ответ', 'outgoingAPIMessageReceived'),
    instanceData: {
      idInstance: Number(credentials.idInstance), typeInstance: 'whatsapp',
    },
  }, credentials.idInstance, whatsapp)

  if (event.kind !== 'message') {
    throw new Error('Expected text fixture')
  }

  return event
}

const contact = {
  chatId: '10001@lid', phone: '79991234567', name: 'Контакт',
}

describe('WhatsApp phone and LID aliases', () => {
  it('reconciles an in-flight send when its chat resolves to LID', async () => {
    const store = createChatStore()
    const response = deferred<string>()
    const api = { send: vi.fn(() => response.promise) } as unknown as GreenApi
    const phoneId = '79991234567@c.us'

    applyMessage(store, message(phoneId, 'old-message'))
    store.setState({ status: 'connected' })
    setDraft(store, phoneId, 'Ответ')

    const pending = sendMessage(store, api, new AbortController().signal,
      phoneId, whatsapp.maxMessageLength)

    addContact(store, contact)
    expect(store.getState().sending[contact.chatId]).toBe(true)
    await sendMessage(store, api, new AbortController().signal,
      contact.chatId, whatsapp.maxMessageLength)
    applyMessage(store, message(contact.chatId, 'new-message'))
    response.resolve('new-message')
    await pending
    expect(api.send).toHaveBeenCalledTimes(1)
    expect(store.getState().sending[contact.chatId]).toBe(false)
    expect(store.getState().messages).toHaveLength(2)
    expect(store.getState().messages.every((item) =>
      item.chatId === contact.chatId)).toBe(true)
  })

  it('routes phone echoes and statuses into the resolved LID chat', () => {
    const store = createChatStore()

    addContact(store, contact)
    applyStatus(store, '79991234567@c.us', '1', 'read')
    applyMessage(store, message('79991234567@c.us'))
    applyMessage(store, message('10001@lid'))
    applyStatus(store, '10001@lid', '1', 'sent')
    expect(store.getState().chats).toHaveLength(1)
    expect(store.getState().messages).toHaveLength(1)
    expect(store.getState().messages[0]).toMatchObject({
      chatId: '10001@lid', status: 'read',
    })
  })

  it('keeps a phone status received before the chat exists', () => {
    const store = createChatStore()

    applyStatus(store, '79991234567@c.us', '1', 'delivered')
    addContact(store, contact)
    applyMessage(store, message('10001@lid'))
    expect(store.getState().messages[0]?.status).toBe('delivered')
  })

  it('merges backlog, drafts and statuses when a number resolves later', () => {
    const store = createChatStore()

    applyMessage(store, message('79991234567@c.us'))
    applyMessage(store, message('10001@lid'))
    setDraft(store, '79991234567@c.us', 'Черновик')
    applyStatus(store, '79991234567@c.us', '1', 'read')
    addContact(store, contact)
    expect(store.getState().chats).toHaveLength(1)
    expect(store.getState().chats[0]).toMatchObject({
      chatId: '10001@lid', draft: 'Черновик', unread: 0,
    })
    expect(store.getState().messages).toHaveLength(1)
    expect(store.getState().messages[0]?.status).toBe('read')
    expect(store.getState().selectedChatId).toBe('10001@lid')
  })

  it('does not merge unrelated people with the same message ID', () => {
    const store = createChatStore()

    applyMessage(store, message('79990000000@c.us'))
    applyMessage(store, message('79991234567@c.us'))
    addContact(store, contact)
    expect(store.getState().chats).toHaveLength(2)
    expect(store.getState().messages).toHaveLength(2)
  })
})
