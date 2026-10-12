import { telegram } from '../../../messengers/telegram'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '../../../api/types'
import { credentials, deferred, textEvent } from '../../../test/fixtures'
import { createChatStore } from '../../store'
import { poll } from './poll'

afterEach(() => vi.useRealTimers())

describe('notification queue', () => {
  it('blocks sends before an authorization event ACK completes', async () => {
    const store = createChatStore()
    const acknowledgement = deferred<boolean>()
    const api = {
      receive: vi.fn().mockResolvedValue({ receiptId: 1, body: {
        ...textEvent(), typeWebhook: 'stateInstanceChanged',
        stateInstance: 'notAuthorized',
      } }),
      acknowledge: vi.fn(() => acknowledgement.promise),
    } as unknown as GreenApi

    store.setState({ status: 'connected' })

    const pending = expect(poll(api, store, new AbortController().signal,
      credentials.idInstance, telegram)).rejects.toThrow('Авторизуйте')

    await vi.waitFor(() => expect(api.acknowledge).toHaveBeenCalled())
    expect(store.getState()).toMatchObject({
      status: 'error', requiresReconnect: true,
    })
    acknowledgement.reject(new Error('network'))
    await pending
    expect(api.receive).toHaveBeenCalledTimes(1)
  })

  it('handles redelivery and drains unsupported events', async () => {
    vi.useFakeTimers()

    const store = createChatStore()
    const controller = new AbortController()
    const envelope = { receiptId: 1, body: textEvent() }
    const api = {
      receive: vi.fn()
        .mockResolvedValueOnce(envelope)
        .mockResolvedValueOnce(envelope)
        .mockResolvedValueOnce({ receiptId: 2, body: {
          ...textEvent(), messageData: { typeMessage: 'imageMessage' },
        } })
        .mockImplementation(() => {
          controller.abort()

          return Promise.resolve(null)
        }),
      acknowledge: vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
    } as unknown as GreenApi
    const pending = poll(api, store, controller.signal, credentials.idInstance,
      telegram)

    await vi.runAllTimersAsync()
    await pending

    expect(store.getState().messages).toHaveLength(1)
    expect(api.acknowledge).toHaveBeenCalledTimes(3)
    expect(api.acknowledge).toHaveBeenLastCalledWith(2)
  })

  it('stops on a permanently stuck receipt', async () => {
    vi.useFakeTimers()

    const api = {
      receive: vi.fn().mockResolvedValue({ receiptId: 1, body: textEvent() }),
      acknowledge: vi.fn().mockResolvedValue(false),
    } as unknown as GreenApi
    const pending = expect(poll(api, createChatStore(),
      new AbortController().signal, credentials.idInstance, telegram))
      .rejects.toThrow('Приём остановлен')

    await vi.runAllTimersAsync()
    await pending

    expect(api.acknowledge).toHaveBeenCalledTimes(3)
  })
})
