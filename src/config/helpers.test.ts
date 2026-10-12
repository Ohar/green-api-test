import { describe, expect, it } from 'vitest'
import { selectMessengers } from './helpers'
import { MESSENGER_MODE } from './messengers'

describe('messenger feature flag', () => {
  it('uses a supported source flag', () => {
    expect(() => selectMessengers(MESSENGER_MODE)).not.toThrow()
  })

  it.each([
    ['whatsapp', ['whatsapp']],
    ['telegram', ['telegram']],
    ['both', ['whatsapp', 'telegram']],
  ])('enables %s', (mode, expected) => {
    expect(selectMessengers(mode).map((messenger) => messenger.id))
      .toEqual(expected)
  })

  it('fails fast on a misspelled build override', () => {
    expect(() => selectMessengers('whatapp')).toThrow('Messenger mode')
  })
})
