import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Brand } from '../Brand'
import { Icon } from '../Icon'
import { connectionSteps, emptyCredentials } from './constants/form'
import type { ConnectionFormProps } from './index'
import styles from './ConnectionForm.module.css'

export function ConnectionForm({
  busy,
  error,
  onConnect,
}: ConnectionFormProps) {
  const fieldId = useId()
  const [credentials, setCredentials] = useState(emptyCredentials)
  const [tokenVisible, setTokenVisible] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy) {
      return
    }

    await onConnect(credentials)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <span className={styles.headerNote}>
          <span className={styles.dot} />
          Просто текст. Просто общение.
        </span>
      </header>
      <div className={styles.layout}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>ВАШ TELEGRAM, БЕЗ ЛИШНЕГО</p>
          <h1>Разговор начинается<br />с одного сообщения<span>.</span></h1>
          <p className={styles.description}>
            Небольшое пространство для ваших диалогов.
            Подключите аккаунт и общайтесь через GREEN-API.
          </p>
          <ol className={styles.steps}>
            {connectionSteps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className={styles.sessionNote}>
            <Icon name="shield" size={21} />
            <p>
              Данные остаются только в памяти вкладки.
              После обновления страницы потребуется подключиться снова.
            </p>
          </div>
        </section>
        <section className={styles.card} aria-labelledby="connect-title">
          <span className={styles.cardIcon}>
            <Icon name="lock" size={22} />
          </span>
          <h2 id="connect-title">Подключение</h2>
          <p className={styles.cardDescription}>
            Введите данные Telegram-инстанса из{' '}
            <a
              href="https://console.green-api.com/"
              target="_blank"
              rel="noreferrer noopener"
            >
              кабинета GREEN-API
            </a>
            .
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-url`}>Адрес API</label>
              <input
                id={`${fieldId}-url`}
                type="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="https://…api.green-api.com"
                value={credentials.apiUrl}
                required
                disabled={busy}
                aria-describedby={`${fieldId}-url-help`}
                onChange={(event) => setCredentials({
                  ...credentials,
                  apiUrl: event.target.value,
                })}
              />
              <span id={`${fieldId}-url-help`} className={styles.hint}>
                Поле apiUrl в настройках вашего инстанса
              </span>
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-instance`}>ID инстанса</label>
              <input
                id={`${fieldId}-instance`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="idInstance"
                value={credentials.idInstance}
                required
                disabled={busy}
                onChange={(event) => setCredentials({
                  ...credentials,
                  idInstance: event.target.value,
                })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-token`}>Токен API</label>
              <div className={styles.password}>
                <input
                  id={`${fieldId}-token`}
                  type={tokenVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="apiTokenInstance"
                  value={credentials.apiTokenInstance}
                  required
                  disabled={busy}
                  onChange={(event) => setCredentials({
                    ...credentials,
                    apiTokenInstance: event.target.value,
                  })}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  aria-label={tokenVisible ? 'Скрыть токен' : 'Показать токен'}
                  aria-pressed={tokenVisible}
                  onClick={() => setTokenVisible(!tokenVisible)}
                >
                  <Icon name={tokenVisible ? 'eyeOff' : 'eye'} size={19} />
                </button>
              </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className={styles.submit} disabled={busy} type="submit">
              {busy ? <span className="spinner" /> : null}
              {busy ? 'Проверяем подключение…' : 'Подключиться'}
              {!busy && <Icon name="arrow" size={18} />}
            </button>
          </form>
          <p className={styles.privacy}>
            Токен используется для запросов к GREEN-API и не сохраняется
            приложением. Удалённые из очереди сообщения не восстановятся
            после перезагрузки.
          </p>
        </section>
      </div>
      <footer className={styles.footer}>
        <span>Telegram-чат · GREEN-API</span>
        <span>Текстовые сообщения, ничего лишнего</span>
      </footer>
    </main>
  )
}
