import { telegram } from '../../messengers/telegram'
import { describe, expect, it } from 'vitest'
import { credentials, textEvent } from '../../test/fixtures'
import { normalizeEvent } from './normalize'

describe('Telegram event contracts', () => {
  it('routes text by sender chat and keeps unix timestamps', () => {
    const event = normalizeEvent(textEvent(), credentials.idInstance, telegram)

    expect(event).toMatchObject({
      kind: 'message',
      message: {
        chatId: '10001', text: 'Привет', direction: 'incoming',
        timestamp: 1_792_000_000_000,
      },
    })
  })

  it('supports extended text and classifies outgoing API echo', () => {
    const input = {
      ...textEvent('42', '20002', '', 'outgoingAPIMessageReceived'),
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'Ссылка https://example.com' },
      },
    }

    expect(normalizeEvent(input, credentials.idInstance,
      telegram)).toMatchObject({
      kind: 'message',
      message: { direction: 'outgoing', text: 'Ссылка https://example.com' },
    })
  })

  it('accepts noAccount without message id and with phone alias', () => {
    const input = {
      ...textEvent(),
      idMessage: undefined,
      typeWebhook: 'outgoingMessageStatus',
      chatId: '79991234567@c.us',
      status: 'noAccount',
    }

    expect(normalizeEvent(input, credentials.idInstance,
      telegram)).toMatchObject({
      kind: 'status', status: 'noAccount', chatId: '79991234567@c.us',
    })
  })

  it('skips groups and media without pretending they are text', () => {
    expect(normalizeEvent(textEvent('1', '-123'), credentials.idInstance,
      telegram))
      .toEqual({ kind: 'ignored' })
    expect(normalizeEvent({
      ...textEvent(), messageData: { typeMessage: 'imageMessage' },
    }, credentials.idInstance, telegram)).toEqual({ kind: 'ignored' })
  })

  it('rejects another instance before acknowledging', () => {
    expect(() => normalizeEvent(textEvent(), 'different', telegram)).toThrow()
  })
})
