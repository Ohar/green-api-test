import type { GreenApi } from '../../../api/types'
import { INSTANCE_STATES, REQUIRED_SETTINGS } from '../../constants'
import { ChatError } from '../../helpers/errors'

export async function assertReady(api: GreenApi): Promise<void> {
  const state = await api.state()

  if (state !== 'authorized') {
    throw new ChatError(INSTANCE_STATES[state]
      ?? 'Инстанс не готов. Проверьте его в кабинете GREEN-API.')
  }

  const settings = await api.settings()

  if (settings.webhookUrl !== '') {
    throw new ChatError(
      'Для HTTP-приёма очистите webhookUrl в кабинете GREEN-API.',
    )
  }

  if (REQUIRED_SETTINGS.some((key) => settings[key] !== 'yes')) {
    throw new ChatError(
      'Включите входящие, исходящие, API-сообщения и статусы в кабинете.',
    )
  }
}
