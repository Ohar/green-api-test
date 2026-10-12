import type { Credentials } from '../types'
import type { ChatStore } from '../store'
import type { GreenApi } from '../../api/types'
import type { SessionDependencies } from './types'
import type { Messenger } from '../../messengers/types'
import { DEFAULT_DEPENDENCIES } from './constants'
import { ChatError, errorMessage } from '../helpers/errors'
import { normalizePhone } from '../helpers/validation'
import { addContact } from '../store/actions'
import { assertReady } from './helpers/readiness'
import { poll } from './helpers/poll'
import { sendMessage } from './helpers/send'

export class ChatSession {
  private readonly controller = new AbortController()
  private readonly api: GreenApi
  private running = false
  private opening = false
  private release?: () => void

  constructor(
    private readonly credentials: Credentials,
    private readonly store: ChatStore,
    private readonly messenger: Messenger,
    private readonly dependencies = DEFAULT_DEPENDENCIES,
  ) {
    this.api = dependencies.apiFactory(
      credentials, this.controller.signal, messenger,
    )
  }

  async open(): Promise<void> {
    if (this.running || this.opening || this.controller.signal.aborted) {
      return
    }

    this.opening = true

    try {
      this.release = await this.dependencies.lease(
        `${this.credentials.apiUrl}:${this.credentials.idInstance}`,
        this.controller.signal,
      )

      await assertReady(this.api, this.messenger)

      this.controller.signal.throwIfAborted()
      this.store.setState({ status: 'connected', statusMessage: '' })

      this.running = true

      void this.run()
    } catch (error) {
      this.release?.()

      throw error
    } finally {
      this.opening = false
    }
  }

  stop(): void {
    this.controller.abort()
    this.release?.()
  }

  async createChat(input: string): Promise<void> {
    const signal = this.controller.signal
    const state = this.store.getState()

    if (state.creating || signal.aborted || state.status !== 'connected') {
      return
    }

    this.store.setState({ creating: true, createError: '' })

    try {
      const phone = normalizePhone(input)
      const existing = state.chats.find((chat) => chat.phone === phone)
      const contact = existing
        ? { chatId: existing.chatId, name: existing.name, phone }
        : await this.api.check(phone)

      signal.throwIfAborted()
      addContact(this.store, contact)
    } catch (error) {
      if (!signal.aborted) {
        this.store.setState({ createError: errorMessage(error) })
      }
    } finally {
      if (!signal.aborted) {
        this.store.setState({ creating: false })
      }
    }
  }

  async send(chatId: string): Promise<void> {
    if (this.controller.signal.aborted) {
      return
    }

    await sendMessage(this.store, this.api, this.controller.signal, chatId,
      this.messenger.maxMessageLength)
  }

  private async run(): Promise<void> {
    try {
      await poll(this.api, this.store, this.controller.signal,
        this.credentials.idInstance, this.messenger)
    } catch (error) {
      if (!this.controller.signal.aborted) {
        this.store.setState({
          status: 'error',
          statusMessage: error instanceof ChatError
            ? error.message
            : 'Приём остановлен. Повторите подключение.',
        })
      }
    } finally {
      this.running = false

      this.release?.()
    }
  }
}

export type { SessionDependencies }
