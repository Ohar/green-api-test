import type { Credentials } from '../core/types'
import { REQUIRED_SETTINGS } from '../core/constants'

export const credentials: Credentials = {
  apiUrl: 'https://4100.api.green-api.com',
  idInstance: '4100000000',
  apiTokenInstance: 'test-token-not-a-real-secret',
}

export const settings = {
  webhookUrl: '',
  ...Object.fromEntries(REQUIRED_SETTINGS.map((key) => [key, 'yes'])),
}

export function textEvent(
  idMessage = 'message-1',
  chatId = '10001',
  text = 'Привет',
  typeWebhook = 'incomingMessageReceived',
) {
  return {
    typeWebhook,
    instanceData: {
      idInstance: Number(credentials.idInstance),
      typeInstance: 'telegram',
    },
    timestamp: 1_792_000_000,
    idMessage,
    senderData: { chatId, chatName: 'Собеседник' },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: text },
    },
  }
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })

  return { promise, resolve, reject }
}
