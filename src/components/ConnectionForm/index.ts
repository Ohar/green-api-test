import type { Credentials } from '../../core/types'

export { ConnectionForm } from './ConnectionForm'

export interface ConnectionFormProps {
  busy: boolean
  error?: string
  onConnect: (credentials: Credentials) => Promise<void>
}
