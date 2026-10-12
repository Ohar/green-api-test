import { Icon } from '../Icon'
import type { BrandProps } from './index'
import styles from './Brand.module.css'

export function Brand({ compact = false }: BrandProps) {
  return (
    <div className={styles.brand}>
      <span className={styles.symbol}>
        <Icon name="message" size={25} />
      </span>
      <span className={styles.wordmark}>
        <strong>Telegram-чат</strong>
        <span>{compact ? 'GREEN-API' : 'РАБОТАЕТ С GREEN-API'}</span>
      </span>
    </div>
  )
}
