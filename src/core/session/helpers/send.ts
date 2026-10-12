import type { GreenApi } from '../../../api/types'
import type { Message } from '../../types'
import type { ChatStore } from '../../store'
import { ChatError, errorMessage } from '../../helpers/errors'
import {
  nextMessageOrder, serverKey, sortMessages, withLatestMessage,
} from '../../helpers/messages'
import { validateMessage } from '../../helpers/validation'
import { setDraft } from '../../store/actions'
import { resolveChatId } from '../../store/contacts'

export async function sendMessage(
  store: ChatStore,
  api: GreenApi,
  signal: AbortSignal,
  chatId: string,
  maxMessageLength: number,
): Promise<void> {
  const state = store.getState()
  const chat = state.chats.find((item) => item.chatId === chatId)

  if (!chat || state.sending[chatId] || state.status !== 'connected') {
    return
  }

  try {
    validateMessage(chat.draft, maxMessageLength)
  } catch (error) {
    store.setState({ sendErrors: {
      ...state.sendErrors, [chatId]: errorMessage(error),
    } })

    return
  }

  const localId = crypto.randomUUID()
  const text = chat.draft
  const message: Message = {
    localId, chatId, text,
    timestamp: Math.floor(Date.now() / 1000) * 1000,
    order: nextMessageOrder(state.messages),
    direction: 'outgoing',
    status: 'sending',
  }

  store.setState({
    messages: [...state.messages, message],
    sending: { ...state.sending, [chatId]: true },
    sendErrors: { ...state.sendErrors, [chatId]: '' },
  })
  setDraft(store, chatId, '')

  try {
    const idMessage = await api.send(chatId, text)

    signal.throwIfAborted()
    store.setState((current) => {
      const resolvedId = resolveChatId(current.chats, chatId)
      const echo = current.messages.find((item) => item.chatId === resolvedId
        && item.idMessage === idMessage)
      const status = current.pendingStatuses[serverKey(resolvedId, idMessage)]
        ?? echo?.status ?? 'accepted'
      const messages = sortMessages(current.messages
        .filter((item) => item.localId !== echo?.localId)
        .map((item) => item.localId === localId
          ? { ...item, idMessage, status,
            timestamp: echo?.timestamp ?? item.timestamp }
          : item))

      return {
        messages,
        chats: current.chats.map((item) => item.chatId === resolvedId
          ? withLatestMessage(item, messages)
          : item),
      }
    })
  } catch (error) {
    if (signal.aborted) {
      return
    }

    const unknown = !(error instanceof ChatError) || error.ambiguous
    const explanation = unknown
      ? 'Результат неизвестен. Проверьте мессенджер перед повтором.'
      : errorMessage(error)

    store.setState((current) => ({
      messages: current.messages.map((item) => item.localId === localId
        ? { ...item, status: unknown ? 'unknown' : 'failed',
          error: explanation }
        : item),
      sendErrors: {
        ...current.sendErrors,
        [resolveChatId(current.chats, chatId)]: explanation,
      },
    }))
  } finally {
    if (!signal.aborted) {
      store.setState((current) => ({
        sending: {
          ...current.sending, [resolveChatId(current.chats, chatId)]: false,
        },
      }))
    }
  }
}
