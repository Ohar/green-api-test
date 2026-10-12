import { RETRY_DELAYS } from '../constants'

export function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted()

    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)

    signal.addEventListener('abort', abort, { once: true })
  })
}

export function retryDelay(attempt: number, serverDelay?: number) {
  const base = RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)]

  return serverDelay ?? Math.round((base ?? 30_000) * (1 + Math.random() * 0.2))
}
