import { Fragment, useId } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { MessageBubble } from '../MessageBubble'
import { dayLabel } from './helpers/dayLabel'
import { useComposer } from './hooks/useComposer'
import { useMessageScroll } from './hooks/useMessageScroll'
import type { ChatPanelProps } from './index'
import styles from './ChatPanel.module.css'

export function ChatPanel({
  chat,
  maxMessageLength,
  messages,
  sending,
  disabled = false,
  error,
  onDraftChange,
  onSend,
  onBack,
  onRetry,
}: ChatPanelProps) {
  const fieldId = useId()
  const draft = chat?.draft || ''
  const tooLong = draft.length > maxMessageLength
  const canSend = !sending && !disabled && !tooLong && !!draft.trim()
  const {
    inputRef,
    composingRef,
    handleCompositionStart,
    handleCompositionEnd,
  } = useComposer(draft)
  const {
    scrollRef,
    handleScroll,
    scrollToBottom,
    showScrollButton,
    hasNewMessages,
  } = useMessageScroll(chat?.chatId, messages)

  async function handleSend(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!canSend) {
      return
    }

    await onSend()
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey
      && !event.nativeEvent.isComposing && !composingRef.current
      && event.nativeEvent.keyCode !== 229) {
      event.preventDefault()
      void handleSend()
    }
  }

  if (!chat) {
    return (
      <section className={styles.panel}>
        <p className={styles.empty}>Выберите чат</p>
      </section>
    )
  }

  return (
    <section className={styles.panel} aria-label="Переписка">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          aria-label="Назад к диалогам"
        >
          Назад
        </button>
        <div className={styles.contact}>
          <h2>{chat.name || chat.phone || chat.chatId}</h2>
          <p>{chat.phone || `ID: ${chat.chatId}`}</p>
        </div>
      </header>
      <div className={styles.history}>
        <a className={styles.historyJump} href={`#${fieldId}-messages`}>
          Перейти к сообщениям
        </a>
        <div
          ref={scrollRef}
          id={`${fieldId}-messages`}
          className={styles.messages}
          onScroll={handleScroll}
          role="log"
          aria-label="Сообщения"
          aria-live="polite"
          aria-relevant="additions text"
          tabIndex={-1}
        >
          {messages.length === 0 ? (
            <p className={styles.empty}>Нет сообщений</p>
          ) : messages.map((message, index) => {
            const day = dayLabel(message.timestamp,
              messages[index - 1]?.timestamp)

            return (
              <Fragment key={message.localId}>
                {day && <div className={styles.day}>{day}</div>}
                <MessageBubble message={message} onRetry={onRetry} />
              </Fragment>
            )
          })}
        </div>
        {showScrollButton && (
          <button
            className={styles.scrollButton}
            type="button"
            onClick={scrollToBottom}
          >
            {hasNewMessages ? 'Новые сообщения' : 'К последним'}
          </button>
        )}
      </div>
      <div className={styles.composer}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={handleSend} className={styles.composeForm}>
          <label htmlFor={`${fieldId}-message`} className="sr-only">
            Сообщение
          </label>
          <textarea
            ref={inputRef}
            id={`${fieldId}-message`}
            value={draft}
            placeholder="Напишите сообщение…"
            rows={1}
            aria-describedby={tooLong ? `${fieldId}-limit` : undefined}
            aria-invalid={tooLong}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
          <button
            type="submit"
            className={styles.send}
            disabled={!canSend}
            aria-label={sending ? 'Отправляем сообщение' : 'Отправить'}
            title="Отправить сообщение"
          >
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
        </form>
        {tooLong && (
          <p
            id={`${fieldId}-limit`}
            className={styles.limitError}
            role="alert"
          >
            Сократите сообщение до {maxMessageLength} символов.
          </p>
        )}
      </div>
    </section>
  )
}
