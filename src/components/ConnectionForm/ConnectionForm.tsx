import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { emptyCredentials } from './constants/form'
import type { ConnectionFormProps } from './index'
import styles from './ConnectionForm.module.css'

export function ConnectionForm({
  busy,
  error,
  onConnect,
}: ConnectionFormProps) {
  const fieldId = useId()
  const [credentials, setCredentials] = useState(emptyCredentials)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy) {
      return
    }

    await onConnect(credentials)
  }

  return (
    <main className={styles.page}>
      <form
        onSubmit={handleSubmit}
        className={styles.form}
        aria-label="Подключение"
      >
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
            onChange={(event) => setCredentials({
              ...credentials,
              apiUrl: event.target.value,
            })}
          />
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
          <input
            id={`${fieldId}-token`}
            type="password"
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
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className={styles.submit} disabled={busy} type="submit">
          {busy ? 'Подключение…' : 'Подключиться'}
        </button>
      </form>
    </main>
  )
}
