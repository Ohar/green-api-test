import { telegram } from '../messengers/telegram'
import { whatsapp } from '../messengers/whatsapp'

export function selectMessengers(mode: unknown) {
  switch (mode) {
    case 'whatsapp':
      return [whatsapp]
    case 'telegram':
      return [telegram]
    case 'both':
      return [whatsapp, telegram]
    default:
      throw new Error('Messenger mode must be whatsapp, telegram or both.')
  }
}
