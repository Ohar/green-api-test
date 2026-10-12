import { MESSENGER_MODE } from './messengers'
import { selectMessengers } from './helpers'

export const ENABLED_MESSENGERS = selectMessengers(
  import.meta.env.VITE_MESSENGER_MODE ?? MESSENGER_MODE,
)
