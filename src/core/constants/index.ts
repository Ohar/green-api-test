export const MAX_MESSAGE_LENGTH = 4096

export const REQUEST_TIMEOUT = 15_000

export const RECEIVE_TIMEOUT = 30

export const POLL_TIMEOUT = 40_000

export const MAX_ACK_ATTEMPTS = 3

export const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export const REQUIRED_SETTINGS = [
  'incomingWebhook',
  'outgoingWebhook',
  'outgoingAPIMessageWebhook',
  'outgoingMessageWebhook',
  'stateWebhook',
] as const

export const INSTANCE_STATES: Record<string, string> = {
  notAuthorized: 'Авторизуйте Telegram в кабинете GREEN-API.',
  pendingPassword: 'Завершите двухфакторный вход в кабинете GREEN-API.',
  starting: 'Инстанс запускается. Повторите подключение через минуту.',
  blocked: 'Аккаунт заблокирован. Проверьте кабинет GREEN-API.',
  suspended: 'На аккаунт наложены ограничения Telegram.',
}

export const MESSAGE_EVENTS = [
  'incomingMessageReceived',
  'outgoingAPIMessageReceived',
  'outgoingMessageReceived',
]

export const SERVER_STATUSES = ['delivered', 'read', 'failed', 'noAccount']
