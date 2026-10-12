export class ChatError extends Error {
  readonly retryable: boolean
  readonly ambiguous: boolean
  readonly retryAfter?: number

  constructor(
    message: string,
    retryable = false,
    ambiguous = false,
    retryAfter?: number,
  ) {
    super(message)

    this.name = 'ChatError'
    this.retryable = retryable
    this.ambiguous = ambiguous
    this.retryAfter = retryAfter
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ChatError) {
    return error.message
  }

  return 'Не удалось выполнить действие. Попробуйте ещё раз.'
}

export function isAborted(signal: AbortSignal): void {
  signal.throwIfAborted()
}
