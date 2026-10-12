import type { Credentials } from '../types'
import type { GreenApi } from '../../api/types'

export interface SessionDependencies {
  apiFactory: (credentials: Credentials, signal: AbortSignal) => GreenApi
  lease: (name: string, signal: AbortSignal) => Promise<() => void>
}
