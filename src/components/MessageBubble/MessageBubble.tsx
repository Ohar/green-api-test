import { messageStatusLabels, messageTime } from './constants/statuses'
import type { MessageBubbleProps } from './index'
import styles from './MessageBubble.module.css'

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing'
  const failed = ['failed', 'noAccount', 'unknown'].includes(message.status)
  const date = new Date(message.timestamp)

  return (
    <article
      className={styles.message}
      data-direction={message.direction}
      aria-label={outgoing ? 'Исходящее сообщение' : 'Входящее сообщение'}
    >
      <div className={styles.bubble} data-failed={failed}>
        <p className={styles.text}>{message.text}</p>
        <div className={styles.meta}>
          <time dateTime={date.toISOString()} title={date.toLocaleString('ru')}>
            {messageTime.format(date)}
          </time>
          {outgoing && (
            <span className={styles.status} data-state={message.status}>
              {messageStatusLabels[message.status]}
            </span>
          )}
        </div>
      </div>
      {failed && (
        <div className={styles.failure} role="status">
          <p>
            {message.status === 'unknown'
              ? 'Перед повтором проверьте мессенджер: возможен дубль.'
              : message.error || 'Не удалось отправить сообщение.'}
          </p>
          {onRetry && (
            <button type="button" onClick={() => onRetry(message.localId)}>
              Вставить повторно
            </button>
          )}
        </div>
      )}
    </article>
  )
}
