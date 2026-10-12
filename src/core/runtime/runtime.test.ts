import { describe, expect, it, vi } from 'vitest'
import { telegram } from '../../messengers/telegram'
import { whatsapp } from '../../messengers/whatsapp'
import { credentials, deferred, settings } from '../../test/fixtures'
import type { SessionDependencies } from '../session/types'
import { createChatRuntime } from './index'

describe('independent messenger sessions', () => {
  it('does not let a late connection affect a disconnected or other form',
    async () => {
      const readiness = deferred<string>()
      const signals: AbortSignal[] = []
      const dependencies: SessionDependencies = {
        lease: async () => vi.fn<() => void>(),
        apiFactory: (_credentials, signal, messenger) => {
          signals.push(signal)

          return {
            state: () => messenger.id === 'whatsapp'
              ? readiness.promise : Promise.resolve('authorized'),
            settings: async () => settings,
            check: vi.fn(),
            send: vi.fn(),
            receive: () => new Promise((resolve) => {
              signal.addEventListener('abort', () => resolve(null))
            }),
            acknowledge: vi.fn(),
          }
        },
      }
      const wa = createChatRuntime(whatsapp, dependencies)
      const tg = createChatRuntime(telegram, dependencies)
      const pending = wa.connect(credentials)

      await tg.connect({ ...credentials, idInstance: '4100000001' })
      expect(tg.chatStore.getState().status).toBe('connected')
      wa.disconnect()
      readiness.resolve('authorized')
      await pending
      expect(wa.chatStore.getState().status).toBe('disconnected')
      expect(wa.chatStore.getState().connectionError).toBe('')
      expect(tg.chatStore.getState().status).toBe('connected')
      expect(signals.map((signal) => signal.aborted)).toEqual([true, false])
      tg.disconnect()
      expect(signals.every((signal) => signal.aborted)).toBe(true)
    })
})
