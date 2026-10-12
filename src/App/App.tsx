import { useEffect } from 'react'
import { useStore } from 'zustand'
import { ConnectionForm } from '../components/ConnectionForm'
import { ChatSidebar } from '../components/ChatSidebar'
import { ChatPanel } from '../components/ChatPanel'
import { StatusBanner } from '../components/StatusBanner'
import {
  chatStore, connect, createChat, disconnect, draft,
  resume, retry, select, send,
} from '../core/runtime'

export function App() {
  const state = useStore(chatStore)
  const selected = state.chats.find((chat) =>
    chat.chatId === state.selectedChatId)

  useEffect(() => disconnect, [])

  if (state.status === 'disconnected') {
    return (
      <ConnectionForm
        busy={state.connecting}
        error={state.connectionError}
        onConnect={connect}
      />
    )
  }

  return (
    <main
      className={`workspace ${selected ? 'workspace--chat-open' : ''}`}
    >
      <div className="workspace-status">
        <StatusBanner
          status={state.status}
          message={state.statusMessage}
          onRetry={state.connecting || state.requiresReconnect
            ? undefined : resume}
        />
      </div>
      <ChatSidebar
        chats={state.chats}
        selectedChatId={state.selectedChatId}
        creating={state.creating}
        error={state.createError}
        onCreateChat={createChat}
        onSelectChat={select}
        onDisconnect={disconnect}
      />
      <section className="conversation-area" aria-label="Переписка">
        <ChatPanel
          chat={selected ?? null}
          messages={state.messages.filter((message) =>
            message.chatId === state.selectedChatId)}
          sending={Boolean(selected && state.sending[selected.chatId])}
          disabled={state.status !== 'connected'}
          error={selected ? state.sendErrors[selected.chatId] : undefined}
          onDraftChange={draft}
          onSend={send}
          onBack={() => select(null)}
          onRetry={retry}
        />
      </section>
    </main>
  )
}
