import type { Credentials } from '../types'
import type { GreenApi } from '../../api/types'
import type { Messenger } from '../../messengers/types'

export interface SessionDependencies {
  apiFactory: (
    credentials: Credentials, signal: AbortSignal, messenger: Messenger,
  ) => GreenApi
  lease: (name: string, signal: AbortSignal) => Promise<() => void>
}
