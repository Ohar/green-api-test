import { telegram } from '../messengers/telegram'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { credentials } from '../test/fixtures'
import { createApi } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('GREEN-API transport', () => {
  it('sends numeric phone and uses safe fetch options', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      exist: true, chatId: '10001', username: 'Чат',
    })))

    vi.stubGlobal('fetch', fetch)

    const api = createApi(credentials, new AbortController().signal, telegram)

    await expect(api.check('79991234567')).resolves.toMatchObject({
      chatId: '10001', phone: '79991234567',
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/checkAccount/'),
      expect.objectContaining({
        body: '{"phoneNumber":79991234567}',
        credentials: 'omit', redirect: 'error', cache: 'no-store',
        referrerPolicy: 'no-referrer',
      }))
  })

  it('accepts empty and null notification responses', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(''))
      .mockResolvedValueOnce(new Response('null')))

    const api = createApi(credentials, new AbortController().signal, telegram)

    await expect(api.receive()).resolves.toBeNull()
    await expect(api.receive()).resolves.toBeNull()
  })

  it('treats a malformed send success as an unknown result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null')))

    const api = createApi(credentials, new AbortController().signal, telegram)

    await expect(api.send('10001', 'Привет')).rejects.toMatchObject({
      ambiguous: true,
    })
  })

  it('does not leak upstream errors containing a token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(
      `Failed URL with secret ${credentials.apiTokenInstance}`,
    )))

    const api = createApi(credentials, new AbortController().signal, telegram)

    await expect(api.state()).rejects.not.toThrow(credentials.apiTokenInstance)
  })

  it('checks the body when HTTP 200 contains a business error', async () => {
    const response = { status: false, data: { reason: 'rate_limit_exceeded' } }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response)),
    ))

    const api = createApi(credentials, new AbortController().signal, telegram)

    await expect(api.check('79991234567'))
      .rejects.toThrow('ограничены Telegram')
  })
})
