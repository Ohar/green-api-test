import type { Credentials } from '../types'
import { ChatSession } from '../session/session'
import { createChatStore } from '../store'
import { initialState } from '../store/helpers'
import { errorMessage } from '../helpers/errors'
import { validateCredentials } from '../helpers/validation'
import { selectChat, setDraft } from '../store/actions'

export const chatStore = createChatStore()

let session: ChatSession | undefined

export async function connect(credentials: Credentials): Promise<void> {
  if (chatStore.getState().connecting) {
    return
  }

  disconnect()
  chatStore.setState({ connecting: true, connectionError: '' })

  let candidate: ChatSession | undefined

  try {
    candidate = new ChatSession(validateCredentials(credentials), chatStore)
    session = candidate

    await candidate.open()
  } catch (error) {
    if (session === candidate) {
      candidate?.stop()
      chatStore.setState({
        status: 'disconnected',
        connectionError: errorMessage(error),
      })
    }
  } finally {
    if (session === candidate) {
      chatStore.setState({ connecting: false })
    }
  }
}

export function disconnect(): void {
  const previous = session

  session = undefined

  previous?.stop()
  chatStore.setState(initialState(), true)
}

export async function resume(): Promise<void> {
  const current = session

  if (!current || chatStore.getState().connecting
    || chatStore.getState().requiresReconnect) {
    return
  }

  chatStore.setState({ connecting: true })

  try {
    await current.open()
  } catch (error) {
    if (current === session) {
      chatStore.setState({
        status: 'error', statusMessage: errorMessage(error),
      })
    }
  } finally {
    if (current === session) {
      chatStore.setState({ connecting: false })
    }
  }
}

export async function createChat(phone: string): Promise<void> {
  await session?.createChat(phone)
}

export async function send(): Promise<void> {
  const chatId = chatStore.getState().selectedChatId

  if (chatId) {
    await session?.send(chatId)
  }
}

export function select(chatId: string | null): void {
  selectChat(chatStore, chatId)
}

export function draft(text: string): void {
  const chatId = chatStore.getState().selectedChatId

  if (chatId) {
    setDraft(chatStore, chatId, text)
  }
}

export function retry(localId: string): void {
  const state = chatStore.getState()
  const message = state.messages.find((item) => item.localId === localId)
  const chat = state.chats.find((item) => item.chatId === message?.chatId)

  if (message && chat) {
    select(chat.chatId)
    draft(chat.draft ? `${chat.draft}\n${message.text}` : message.text)
  }
}
