import { useLayoutEffect, useRef } from 'react'
import { maxComposerHeight } from '../constants/layout'

export function useComposer(draft: string) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)

  useLayoutEffect(() => {
    const input = inputRef.current

    if (input) {
      input.style.height = '0px'
      input.style.height = `${Math.min(input.scrollHeight,
        maxComposerHeight)}px`
    }
  }, [draft])

  function handleCompositionStart() {
    composingRef.current = true
  }

  function handleCompositionEnd() {
    composingRef.current = false
  }

  return {
    inputRef,
    composingRef,
    handleCompositionStart,
    handleCompositionEnd,
  }
}
