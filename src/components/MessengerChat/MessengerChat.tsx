import { useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { ConnectionForm } from '../ConnectionForm'
import { ChatSidebar } from '../ChatSidebar'
import { ChatPanel } from '../ChatPanel'
import { StatusBanner } from '../StatusBanner'
import { createChatRuntime } from '../../core/runtime'
import type { MessengerChatProps } from './index'

export function MessengerChat({ messenger, showLabel }: MessengerChatProps) {
  const [runtime] = useState(() => createChatRuntime(messenger))
  const {
    chatStore, connect, createChat, disconnect, draft,
    resume, retry, select, send,
  } = runtime
  const state = useStore(chatStore)
  const selected = state.chats.find((chat) =>
    chat.chatId === state.selectedChatId)

  useEffect(() => disconnect, [disconnect])

  if (state.status === 'disconnected') {
    return (
      <ConnectionForm
        messengerLabel={messenger.label}
        busy={state.connecting}
        error={state.connectionError}
        onConnect={connect}
      />
    )
  }

  return (
    <>
      {showLabel && <h1 className="messenger-title">{messenger.label}</h1>}
      <div
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
            maxMessageLength={messenger.maxMessageLength}
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
      </div>
    </>
  )
}
