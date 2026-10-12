import type { Messenger } from '../types'
import { INSTANCE_STATES } from '../../core/constants'
import { checkTelegram, telegramChatId } from './helpers'

export const telegram: Messenger = {
  id: 'telegram',
  label: 'Telegram',
  maxMessageLength: 4096,
  instanceStates: {
    ...INSTANCE_STATES,
    notAuthorized: 'Авторизуйте Telegram в кабинете GREEN-API.',
    pendingPassword: 'Завершите двухфакторный вход в кабинете GREEN-API.',
    suspended: 'На аккаунт наложены ограничения Telegram.',
  },
  chatId: telegramChatId,
  check: checkTelegram,
}
