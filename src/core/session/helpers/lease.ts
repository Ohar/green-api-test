import { ChatError } from '../../helpers/errors'

export function acquireLease(name: string, signal: AbortSignal) {
  if (!navigator.locks) {
    return Promise.reject(new ChatError(
      'Для чата нужен современный браузер с поддержкой Web Locks.',
    ))
  }

  return new Promise<() => void>((resolve, reject) => {
    const request = navigator.locks.request(name, { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          reject(new ChatError('Этот инстанс уже открыт в другой вкладке.'))

          return
        }

        if (signal.aborted) {
          reject(signal.reason)

          return
        }

        await new Promise<void>((release) => {
          const finish = () => {
            signal.removeEventListener('abort', finish)
            release()
          }

          signal.addEventListener('abort', finish, { once: true })
          resolve(finish)
        })
      })

    void request.catch(reject)
  })
}
