import { telegram } from '../../../messengers/telegram'
import { describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '../../../api/types'
import { credentials, deferred, textEvent } from '../../../test/fixtures'
import { ChatError } from '../../helpers/errors'
import { normalizeEvent } from '../../helpers/normalize'
import { createChatStore } from '../../store'
import {
  addContact, applyMessage, applyStatus, setDraft,
} from '../../store/actions'
import { sendMessage } from './send'

describe('send races', () => {
  it.each(['early', 'late'])('%s echo keeps a fast reply after the send',
    async (timing) => {
      const store = createChatStore()
      const response = deferred<string>()
      const api = { send: () => response.promise } as unknown as GreenApi
      const controller = new AbortController()
      const clock = vi.spyOn(Date, 'now').mockReturnValue(1_792_000_000_900)

      addContact(store, { chatId: '10001', name: 'Чат', phone: '79991234567' })
      store.setState({ status: 'connected' })
      setDraft(store, '10001', 'Вопрос')

      const pending = sendMessage(store, api, controller.signal, '10001',
        telegram.maxMessageLength)

      clock.mockRestore()

      if (timing === 'late') {
        response.resolve('server-1')
        await pending
      }

      for (const [id, text, type] of [
        ['server-1', 'Вопрос', 'outgoingAPIMessageReceived'],
        ['reply-1', 'Ответ', 'incomingMessageReceived'],
      ]) {
        const event = normalizeEvent(textEvent(id, '10001', text, type),
          credentials.idInstance, telegram)

        if (event.kind === 'message') {
          applyMessage(store, event)
        }
      }

      response.resolve('server-1')
      await pending

      expect(store.getState().messages.map((item) => item.text))
        .toEqual(['Вопрос', 'Ответ'])
      expect(store.getState().messages[0]?.timestamp).toBe(1_792_000_000_000)
      expect(store.getState().chats[0]?.lastMessage).toBe('Ответ')
    })

  it('merges early echo/read and preserves a newer draft', async () => {
    const store = createChatStore()
    const response = deferred<string>()
    const api = { send: vi.fn(() => response.promise) } as unknown as GreenApi
    const controller = new AbortController()

    addContact(store, { chatId: '10001', name: 'Чат', phone: '79991234567' })
    store.setState({ status: 'connected' })
    setDraft(store, '10001', 'Тест')

    const pending = sendMessage(store, api, controller.signal, '10001',
      telegram.maxMessageLength)

    await sendMessage(store, api, controller.signal, '10001',
      telegram.maxMessageLength)
    setDraft(store, '10001', 'Следующий текст')
    applyStatus(store, '10001', 'server-1', 'read')

    const echo = normalizeEvent(textEvent('server-1', '10001', 'Тест',
      'outgoingAPIMessageReceived'), credentials.idInstance, telegram)

    if (echo.kind === 'message') {
      applyMessage(store, echo)
    }

    response.resolve('server-1')
    await pending

    expect(api.send).toHaveBeenCalledTimes(1)
    expect(store.getState().messages).toHaveLength(1)
    expect(store.getState().messages[0]?.status).toBe('read')
    expect(store.getState().chats[0]?.draft).toBe('Следующий текст')
  })

  it('does not retry a send with an ambiguous network result', async () => {
    const store = createChatStore()
    const api = {
      send: vi.fn().mockRejectedValue(new ChatError('Сеть', true, true)),
    } as unknown as GreenApi

    addContact(store, { chatId: '1', name: 'Чат', phone: '79991234567' })
    store.setState({ status: 'connected' })
    setDraft(store, '1', 'Сохранить')
    await sendMessage(store, api, new AbortController().signal, '1',
      telegram.maxMessageLength)

    expect(api.send).toHaveBeenCalledTimes(1)
    expect(store.getState().messages[0]).toMatchObject({
      text: 'Сохранить', status: 'unknown',
    })
  })

  it('does not mutate cleared state after disconnect', async () => {
    const store = createChatStore()
    const response = deferred<string>()
    const api = { send: () => response.promise } as unknown as GreenApi
    const controller = new AbortController()

    addContact(store, { chatId: '1', name: 'Чат', phone: '79991234567' })
    store.setState({ status: 'connected' })
    setDraft(store, '1', 'Текст')

    const pending = sendMessage(store, api, controller.signal, '1',
      telegram.maxMessageLength)

    controller.abort()
    store.setState({ messages: [], chats: [] })
    response.resolve('late')
    await pending

    expect(store.getState().messages).toEqual([])
  })
})
