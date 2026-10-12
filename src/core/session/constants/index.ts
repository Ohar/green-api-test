import { createApi } from '../../../api/client'
import { acquireLease } from '../helpers/lease'
import type { SessionDependencies } from '../types'

export const DEFAULT_DEPENDENCIES: SessionDependencies = {
  apiFactory: createApi,
  lease: acquireLease,
}
