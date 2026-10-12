import { Icon } from '../Icon'
import { statusLabels } from './constants/statuses'
import type { StatusBannerProps } from './index'
import styles from './StatusBanner.module.css'

export function StatusBanner({
  status,
  message,
  onRetry,
}: StatusBannerProps) {
  return (
    <div
      className={styles.banner}
      data-state={status}
      role="status"
      aria-live="polite"
    >
      {status === 'connected'
        ? <span className={styles.dot} />
        : <Icon name="info" size={15} />}
      <span>{message || statusLabels[status]}</span>
      {onRetry && status === 'error' && (
        <button type="button" onClick={onRetry}>
          Повторить подключение
        </button>
      )}
    </div>
  )
}
