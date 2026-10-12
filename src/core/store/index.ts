import { createStore } from 'zustand/vanilla'
import { initialState } from './helpers'

export function createChatStore() {
  return createStore(initialState)
}

export type ChatStore = ReturnType<typeof createChatStore>
