export { Icon } from './Icon'

export type IconName =
  | 'arrow'
  | 'back'
  | 'check'
  | 'chevron'
  | 'close'
  | 'eye'
  | 'eyeOff'
  | 'info'
  | 'lock'
  | 'logout'
  | 'message'
  | 'plus'
  | 'send'
  | 'shield'

export interface IconProps {
  name: IconName
  size?: number
  className?: string
}
