import type { ConnectionStatus } from '../../core/types'

export { StatusBanner } from './StatusBanner'

export interface StatusBannerProps {
  status: ConnectionStatus
  message?: string
  onRetry?: () => void
}
