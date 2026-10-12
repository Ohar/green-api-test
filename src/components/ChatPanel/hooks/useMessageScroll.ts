import { useLayoutEffect, useRef, useState } from 'react'
import type { Message } from '../../../core/types'
import { bottomThreshold } from '../constants/layout'

export function useMessageScroll(chatId: string | undefined,
  messages: Message[]) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastChat = useRef(chatId)
  const stickToBottom = useRef(true)
  const [atBottom, setAtBottom] = useState(true)
  const [seenCount, setSeenCount] = useState(messages.length)
  const lastMessageId = messages.at(-1)?.localId
  const lastDirection = messages.at(-1)?.direction
  const lastTail = useRef(lastMessageId)
  const count = messages.length

  useLayoutEffect(() => {
    const list = scrollRef.current
    const changedChat = chatId !== lastChat.current
    const justSent = lastDirection === 'outgoing'
      && lastTail.current !== lastMessageId

    if (list && (stickToBottom.current || changedChat || justSent)) {
      list.scrollTop = list.scrollHeight
    }

    lastChat.current = chatId
    lastTail.current = lastMessageId
  }, [chatId, lastMessageId, count, lastDirection])

  function handleScroll() {
    const list = scrollRef.current

    if (!list) {
      return
    }

    const nearBottom = list.scrollHeight - list.scrollTop
      - list.clientHeight < bottomThreshold

    stickToBottom.current = nearBottom
    setAtBottom(nearBottom)

    if (nearBottom) {
      setSeenCount(count)
    }
  }

  function scrollToBottom() {
    const list = scrollRef.current

    if (list) {
      list.scrollTop = list.scrollHeight
    }

    stickToBottom.current = true
    setAtBottom(true)
    setSeenCount(count)
  }

  return {
    scrollRef,
    handleScroll,
    scrollToBottom,
    showScrollButton: !atBottom && count > 0,
    hasNewMessages: count > seenCount,
  }
}
