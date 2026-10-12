import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApi } from '../../api/client'
import { normalizeEvent } from '../../core/helpers/normalize'
import { validateMessage } from '../../core/helpers/validation'
import { credentials, textEvent } from '../../test/fixtures'
import { whatsapp } from './index'

afterEach(() => vi.unstubAllGlobals())

function event(chatId = '10001@lid') {
  return {
    ...textEvent('reply-1', chatId),
    instanceData: {
      idInstance: Number(credentials.idInstance), typeInstance: 'whatsapp',
    },
  }
}

describe('WhatsApp contracts', () => {
  it.each([
    [{ existsWhatsapp: true, chatId: '10001@lid' }, '10001@lid'],
    [{ existsWhatsapp: true }, '79991234567@c.us'],
  ])('resolves a number with current and legacy API replies', async (
    response, chatId,
  ) => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response)),
    )

    vi.stubGlobal('fetch', fetch)

    const api = createApi(credentials, new AbortController().signal, whatsapp)

    await expect(api.check('79991234567')).resolves.toMatchObject({
      chatId, phone: '79991234567',
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/checkWhatsapp/'),
      expect.objectContaining({
        method: 'POST', body: '{"chatId":"79991234567@c.us"}',
        credentials: 'omit', redirect: 'error',
      }),
    )
  })

  it.each([
    { existsWhatsapp: false },
    { existsWhatsapp: true, chatId: '1203630000@g.us' },
    { exist: true, chatId: '10001' },
  ])('rejects absent accounts and incompatible replies', async (response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response)),
    ))

    const api = createApi(credentials, new AbortController().signal, whatsapp)

    await expect(api.check('79991234567')).rejects.toThrow()
  })

  it.each(['10001@lid', '79991234567@c.us'])(
    'receives private text with %s', (chatId) => {
      expect(normalizeEvent(event(chatId), credentials.idInstance, whatsapp))
        .toMatchObject({ kind: 'message', message: { chatId, text: 'Привет' } })
    },
  )

  it.each(['1203630000@g.us', 'status@broadcast', '10001', '-10001'])(
    'skips unsupported chat %s', (chatId) => {
      expect(normalizeEvent(event(chatId), credentials.idInstance, whatsapp))
        .toEqual({ kind: 'ignored' })
    },
  )

  it('does not accept another messenger on the same instance ID', () => {
    expect(() => normalizeEvent(textEvent(), credentials.idInstance, whatsapp))
      .toThrow('другого инстанса')
  })

  it('supports text replies with a quote and ignores images', () => {
    expect(normalizeEvent({
      ...event(),
      messageData: {
        typeMessage: 'quotedMessage', extendedTextMessageData: { text: 'Да' },
      },
    }, credentials.idInstance, whatsapp))
      .toMatchObject({ kind: 'message', message: { text: 'Да' } })
    expect(normalizeEvent({
      ...event(), messageData: { typeMessage: 'imageMessage' },
    }, credentials.idInstance, whatsapp)).toEqual({ kind: 'ignored' })
  })

  it('distinguishes sent from accepted and handles account suspension', () => {
    const status = {
      ...event(), typeWebhook: 'outgoingMessageStatus', chatId: '10001@lid',
    }

    expect(normalizeEvent({ ...status, status: 'sent' },
      credentials.idInstance, whatsapp))
      .toMatchObject({ kind: 'status', status: 'sent' })
    expect(normalizeEvent({ ...status, status: 'suspended' },
      credentials.idInstance, whatsapp))
      .toEqual({ kind: 'state', state: 'suspended' })
  })

  it('uses the WhatsApp text limit', () => {
    expect(() => validateMessage('я'.repeat(20000), whatsapp.maxMessageLength))
      .not.toThrow()
    expect(() => validateMessage('я'.repeat(20001), whatsapp.maxMessageLength))
      .toThrow('20000')
  })
})
