import { useId, useState } from 'react'
import type { FormEvent } from 'react'
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
  const [phone, setPhone] = useState('')

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (creating || !phone.trim()) {
      return
    }

    await onCreateChat(phone)
  }

  return (
    <aside className={styles.sidebar} aria-label="Диалоги">
      <div className={styles.heading}>
        <h1>Диалоги</h1>
        <button
          type="button"
          className={styles.disconnect}
          onClick={onDisconnect}
        >
          Отключиться
        </button>
      </div>
      <form
        className={styles.form}
        onSubmit={handleCreate}
        aria-label="Новый чат"
      >
        <label htmlFor={`${fieldId}-phone`}>Номер телефона</label>
        <input
          id={`${fieldId}-phone`}
          type="tel"
          autoComplete="off"
          placeholder="+7 999 123-45-67"
          maxLength={32}
          value={phone}
          required
          disabled={creating}
          onChange={(event) => setPhone(event.target.value)}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button
          type="submit"
          className={styles.create}
          disabled={creating || !phone.trim()}
        >
          {creating ? 'Проверяем номер…' : 'Создать чат'}
        </button>
      </form>
      <nav className={styles.list} aria-label="Список диалогов">
        {chats.length === 0 ? (
          <p className={styles.empty}>Нет чатов</p>
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
                  <span className={styles.chatDetails}>
                    <span className={styles.chatTop}>
                      <strong>{chat.name || chat.phone || chat.chatId}</strong>
                      <time>{formatDate(chat.updatedAt)}</time>
                    </span>
                    <span className={styles.chatBottom}>
                      <span className={styles.preview}>
                        {chat.draft ? `Черновик: ${chat.draft}`
                          : chat.lastMessage || 'Нет сообщений'}
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
    </aside>
  )
}
