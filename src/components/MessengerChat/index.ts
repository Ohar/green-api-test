import type { Messenger } from '../../messengers/types'

export { MessengerChat } from './MessengerChat'

export interface MessengerChatProps {
  messenger: Messenger
  showLabel: boolean
}
