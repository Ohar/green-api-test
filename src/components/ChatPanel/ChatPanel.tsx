import { Fragment, useId } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { MAX_MESSAGE_LENGTH } from '../../core/constants'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'
import { MessageBubble } from '../MessageBubble'
import { dayLabel } from './helpers/dayLabel'
import { useComposer } from './hooks/useComposer'
import { useMessageScroll } from './hooks/useMessageScroll'
import type { ChatPanelProps } from './index'
import styles from './ChatPanel.module.css'

export function ChatPanel({
  chat,
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
  const tooLong = draft.length > MAX_MESSAGE_LENGTH
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
      <section className={styles.welcome}>
        <span className={styles.welcomeIcon}>
          <Icon name="message" size={42} />
        </span>
        <p className={styles.eyebrow}>НАЧНИТЕ С «ПРИВЕТ»</p>
        <h2>Место для ваших разговоров</h2>
        <p className={styles.welcomeText}>
          Выберите диалог слева или создайте новый чат
          по номеру телефона собеседника.
        </p>
        <span className={styles.welcomeNote}>
          <Icon name="lock" size={14} />
          Сообщения хранятся только в этой сессии
        </span>
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
          <Icon name="back" />
        </button>
        <Avatar label={chat.name || chat.phone || chat.chatId} />
        <div className={styles.contact}>
          <h2>{chat.name || chat.phone || chat.chatId}</h2>
          <p>{chat.phone || `ID: ${chat.chatId}`} · Telegram</p>
        </div>
        <span className={styles.headerBadge}>Личный чат</span>
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
          <p className={styles.historyNote}>
            Здесь отображаются сообщения, полученные в этой сессии
          </p>
          {messages.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="message" size={30} />
              <h3>Начните разговор</h3>
              <p>Напишите первое сообщение собеседнику.</p>
            </div>
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
            <Icon name="chevron" size={16} />
          </button>
        )}
      </div>
      <footer className={styles.composer}>
        {error && <p className="form-error" role="alert">{error}</p>}
        {disabled && (
          <p className={styles.disabledNote} role="status">
            Отправка доступна после восстановления подключения.
            Черновик можно продолжать редактировать.
          </p>
        )}
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
            aria-describedby={`${fieldId}-help`}
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
            {sending ? <span className="spinner" />
              : <Icon name="send" size={20} />}
          </button>
        </form>
        <div id={`${fieldId}-help`} className={styles.composerHelp}>
          <span>Enter — отправить · Shift + Enter — новая строка</span>
          <span data-invalid={tooLong}>
            {draft.length} / {MAX_MESSAGE_LENGTH}
          </span>
        </div>
        {tooLong && (
          <p className={styles.limitError} role="alert">
            Сократите сообщение до {MAX_MESSAGE_LENGTH} символов.
          </p>
        )}
      </footer>
    </section>
  )
}
