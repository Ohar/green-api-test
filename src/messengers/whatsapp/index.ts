import type { Messenger } from '../types'
import { INSTANCE_STATES } from '../../core/constants'
import { checkWhatsapp, whatsappChatId } from './helpers'

export const whatsapp: Messenger = {
  id: 'whatsapp',
  label: 'WhatsApp',
  maxMessageLength: 20_000,
  instanceStates: {
    ...INSTANCE_STATES,
    notAuthorized: 'Авторизуйте WhatsApp в кабинете GREEN-API.',
    sleepMode: 'Откройте WhatsApp на телефоне и повторите подключение.',
    suspended: 'На аккаунт наложены ограничения WhatsApp.',
  },
  chatId: whatsappChatId,
  check: checkWhatsapp,
}
