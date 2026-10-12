import { ChatError } from '../../core/helpers/errors'

export function httpError(status: number, retryAfter: string | null) {
  if (status === 401 || status === 403) {
    return new ChatError('Проверьте idInstance и apiTokenInstance.')
  }

  if (status === 466) {
    return new ChatError('Исчерпана квота тарифа GREEN-API.')
  }

  if (status === 469) {
    return new ChatError('Сервис ограничил запросы. Повторите позже.')
  }

  if (status === 429) {
    const seconds = retryAfter === null ? NaN : Number(retryAfter)
    const delay = Number.isFinite(seconds) && seconds >= 0
      ? seconds * 1000
      : undefined

    return new ChatError('Слишком много запросов. Ожидаем…', true,
      false, delay)
  }

  if (status >= 500) {
    return new ChatError('GREEN-API временно недоступен.', true, true)
  }

  return new ChatError('Запрос отклонён. Проверьте данные и настройки.')
}
