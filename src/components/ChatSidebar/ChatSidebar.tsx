import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Avatar } from '../Avatar'
import { Brand } from '../Brand'
import { Icon } from '../Icon'
import { formatDate } from './helpers/formatDate'
import type { ChatSidebarProps } from './index'
import styles from './ChatSidebar.module.css'

export function ChatSidebar({
  chats,
  selectedChatId,
  creating,
  error,
  onCreateChat,
  onSelectChat,
  onDisconnect,
}: ChatSidebarProps) {
  const fieldId = useId()
  const phoneInput = useRef<HTMLInputElement>(null)
  const [phone, setPhone] = useState('')
  const [formOpen, setFormOpen] = useState(chats.length === 0)

  useEffect(() => {
    if (formOpen) {
      phoneInput.current?.focus()
    }
  }, [formOpen])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (creating || !phone.trim()) {
      return
    }

    await onCreateChat(phone)
  }

  return (
    <aside className={styles.sidebar} aria-label="Диалоги">
      <header className={styles.brand}>
        <Brand compact />
      </header>
      <div className={styles.heading}>
        <div>
          <h1>Диалоги</h1>
          <span className={styles.count}>{chats.length}</span>
        </div>
        <button
          type="button"
          className={styles.newChat}
          onClick={() => setFormOpen(!formOpen)}
          aria-label={formOpen ? 'Закрыть новый чат' : 'Новый чат'}
          aria-expanded={formOpen}
          aria-controls={`${fieldId}-form`}
          title="Новый чат"
        >
          <Icon name={formOpen ? 'close' : 'plus'} size={19} />
        </button>
      </div>
      {formOpen && (
        <form
          id={`${fieldId}-form`}
          className={styles.form}
          onSubmit={handleCreate}
          aria-label="Новый чат"
        >
          <label htmlFor={`${fieldId}-phone`}>Номер телефона</label>
          <input
            ref={phoneInput}
            id={`${fieldId}-phone`}
            type="tel"
            autoComplete="off"
            placeholder="+7 999 123-45-67"
            maxLength={32}
            value={phone}
            required
            disabled={creating}
            aria-describedby={`${fieldId}-hint`}
            onChange={(event) => setPhone(event.target.value)}
          />
          <p id={`${fieldId}-hint`} className={styles.hint}>
            Международный номер с кодом страны
          </p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button
            type="submit"
            className={styles.create}
            disabled={creating || !phone.trim()}
          >
            {creating ? <span className="spinner" /> : <Icon name="plus" />}
            {creating ? 'Проверяем номер…' : 'Создать чат'}
          </button>
        </form>
      )}
      <nav className={styles.list} aria-label="Список диалогов">
        {chats.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Icon name="message" size={26} />
            </span>
            <h2>Здесь будут ваши диалоги</h2>
            <p>
              Создайте первый чат по номеру телефона.
              Входящие сообщения появятся здесь автоматически.
            </p>
          </div>
        ) : (
          <ul>
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <button
                  type="button"
                  className={styles.chat}
                  aria-current={selectedChatId === chat.chatId}
                  onClick={() => onSelectChat(chat.chatId)}
                >
                  <Avatar label={chat.name || chat.phone || chat.chatId} />
                  <span className={styles.chatDetails}>
                    <span className={styles.chatTop}>
                      <strong>{chat.name || chat.phone || chat.chatId}</strong>
                      <time>{formatDate(chat.updatedAt)}</time>
                    </span>
                    <span className={styles.chatBottom}>
                      <span className={styles.preview}>
                        {chat.draft ? `Черновик: ${chat.draft}`
                          : chat.lastMessage || 'Пока нет сообщений'}
                      </span>
                      {chat.unread > 0 && (
                        <span
                          className={styles.unread}
                          aria-label={`Непрочитанных: ${chat.unread}`}
                        >
                          {chat.unread > 99 ? '99+' : chat.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <footer className={styles.footer}>
        <div className={styles.session}>
          <span className={styles.sessionDot} />
          <span>Локальная сессия</span>
        </div>
        <button
          type="button"
          className={styles.disconnect}
          onClick={onDisconnect}
          title="Отключиться и очистить данные этой вкладки"
        >
          <Icon name="logout" size={18} />
          <span>Отключиться</span>
        </button>
        <p>История хранится до обновления страницы.</p>
      </footer>
    </aside>
  )
}
