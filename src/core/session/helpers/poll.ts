import type { GreenApi } from '../../../api/types'
import type { ChatStore } from '../../store'
import { MAX_ACK_ATTEMPTS, INSTANCE_STATES } from '../../constants'
import { ChatError, errorMessage } from '../../helpers/errors'
import { normalizeEvent } from '../../helpers/normalize'
import { retryDelay, wait } from '../../helpers/timing'
import { applyMessage, applyStatus } from '../../store/actions'

export async function poll(
  api: GreenApi,
  store: ChatStore,
  signal: AbortSignal,
  instanceId: string,
): Promise<void> {
  let failures = 0
  let previousReceipt: number | undefined
  let repeats = 0

  while (!signal.aborted) {
    try {
      const envelope = await api.receive()

      signal.throwIfAborted()
      store.setState({ status: 'connected', statusMessage: '' })

      if (!envelope) {
        failures = 0
        await wait(100, signal)

        continue
      }

      repeats = envelope.receiptId === previousReceipt ? repeats + 1 : 0
      previousReceipt = envelope.receiptId

      if (repeats >= MAX_ACK_ATTEMPTS) {
        throw new ChatError(
          'Не удалось подтвердить уведомление. Приём остановлен.',
        )
      }

      const event = normalizeEvent(envelope.body, instanceId)
      let terminal: string | undefined

      if (event.kind === 'message') {
        applyMessage(store, event)
      }

      if (event.kind === 'status') {
        applyStatus(store, event.chatId, event.idMessage, event.status)
      }

      if (event.kind === 'state' && event.state !== 'authorized') {
        terminal = (INSTANCE_STATES[event.state] ?? 'Авторизация изменилась.')
          + ' Отключитесь и подключитесь заново.'
      }

      if (event.kind === 'quota') {
        terminal = 'Исчерпана квота тарифа GREEN-API. Проверьте кабинет.'
      }

      if (terminal) {
        store.setState({
          status: 'error',
          statusMessage: terminal,
          requiresReconnect: event.kind === 'state',
        })

        try {
          await api.acknowledge(envelope.receiptId)
        } catch {
          terminal += ' Подтверждение уведомления не получено.'
        }

        throw new ChatError(terminal)
      }

      const acknowledged = await api.acknowledge(envelope.receiptId)

      signal.throwIfAborted()

      if (!acknowledged) {
        await wait(1000, signal)
      }

      failures = 0
    } catch (error) {
      if (signal.aborted) {
        return
      }

      if (!(error instanceof ChatError) || !error.retryable) {
        throw error
      }

      store.setState({
        status: 'reconnecting',
        statusMessage: errorMessage(error),
      })
      await wait(retryDelay(failures, error.retryAfter), signal)

      failures += 1
    }
  }
}
