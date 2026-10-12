import { statusLabels } from './constants/statuses'
import type { StatusBannerProps } from './index'
import styles from './StatusBanner.module.css'

export function StatusBanner({
  status,
  message,
  onRetry,
}: StatusBannerProps) {
  if (status === 'connected' && !message) {
    return null
  }

  return (
    <div
      className={styles.banner}
      data-state={status}
      role="status"
      aria-live="polite"
    >
      <span>{message || statusLabels[status]}</span>
      {onRetry && status === 'error' && (
        <button type="button" onClick={onRetry}>
          Повторить подключение
        </button>
      )}
    </div>
  )
}
