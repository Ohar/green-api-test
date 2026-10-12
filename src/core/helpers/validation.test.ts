import { telegram } from '../../messengers/telegram'
import { describe, expect, it } from 'vitest'
import { credentials } from '../../test/fixtures'
import {
  normalizePhone, validateCredentials, validateMessage,
} from './validation'

describe('connection boundary', () => {
  it('normalizes international phone without guessing country', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
    expect(normalizePhone('89991234567')).toBe('89991234567')
    expect(() => normalizePhone('++79991234567')).toThrow()
    expect(() => normalizePhone('+0 999 123 45 67')).toThrow()
    expect(() => normalizePhone('79991234567abc')).toThrow()
  })

  it.each([
    'http://4100.api.green-api.com',
    'https://4100.api.green-api.com.evil.test',
    'https://evil.test/4100.api.green-api.com',
    'https://user@4100.api.green-api.com',
    'https://4100.api.green-api.com:8443',
    'https://4100.api.green-api.com/token',
    'https://4100.api.green-api.com?target=evil',
  ])('rejects a credential exfiltration destination: %s', (apiUrl) => {
    expect(() => validateCredentials({ ...credentials, apiUrl })).toThrow()
  })

  it('accepts the documented host and trims copied fields', () => {
    expect(validateCredentials({
      ...credentials, apiUrl: ` ${credentials.apiUrl}/ `,
    })).toEqual(credentials)
  })

  it('rejects empty and oversized text, preserves valid text', () => {
    expect(() => validateMessage(' \n ', telegram.maxMessageLength)).toThrow()
    expect(() => validateMessage('я'.repeat(4096),
      telegram.maxMessageLength)).not.toThrow()
    expect(() => validateMessage('я'.repeat(4097),
      telegram.maxMessageLength)).toThrow()
    expect(() => validateMessage('🙂\nПривет',
      telegram.maxMessageLength)).not.toThrow()
  })
})
