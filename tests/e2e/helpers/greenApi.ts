import type { Locator, Page } from '@playwright/test'
import type { MessengerId } from '../../../src/messengers/types'

export function fixtureFor(messenger: MessengerId) {
  return messenger === 'whatsapp'
    ? { idInstance: '1100000000', chatId: '10001@lid', label: 'WhatsApp' }
    : { idInstance: '4100000000', chatId: '10001', label: 'Telegram' }
}

export async function mockGreenApi(
  page: Page, messenger: MessengerId = 'whatsapp',
) {
  const fixture = fixtureFor(messenger)
  const queue: { receiptId: number, body: unknown }[] = []
  const sent: { chatId: string, message: string }[] = []
  const checked: unknown[] = []
  let receipt = 1
  let polls = 0

  await page.route('https://4100.api.green-api.com/**', async (route) => {
    const request = route.request()
    const parts = new URL(request.url()).pathname.split('/')
    const operation = parts[2]
    let data: unknown = null

    if (parts[1] !== `waInstance${fixture.idInstance}`) {
      await route.fallback()

      return
    }

    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })

      return
    }

    if (operation === 'getStateInstance') {
      data = { stateInstance: 'authorized' }
    }

    if (operation === 'getSettings') {
      data = {
        webhookUrl: '', incomingWebhook: 'yes', outgoingWebhook: 'yes',
        outgoingAPIMessageWebhook: 'yes', outgoingMessageWebhook: 'yes',
        stateWebhook: 'yes',
      }
    }

    if (operation === 'checkAccount' && messenger === 'telegram') {
      checked.push(request.postDataJSON())

      data = { exist: true, chatId: fixture.chatId,
        username: 'Тестовый контакт' }
    }

    if (operation === 'checkWhatsapp' && messenger === 'whatsapp') {
      checked.push(request.postDataJSON())

      data = { existsWhatsapp: true, chatId: fixture.chatId,
        username: 'Тестовый контакт' }
    }

    if (operation === 'sendMessage') {
      sent.push(request.postDataJSON() as { chatId: string, message: string })

      data = { idMessage: `sent-${sent.length}` }
    }

    if (operation === 'receiveNotification') {
      polls += 1

      data = queue[0] ?? null
    }

    if (operation === 'deleteNotification') {
      const id = Number(parts.at(-1))
      const index = queue.findIndex((item) => item.receiptId === id)

      if (index >= 0) {
        queue.splice(index, 1)
      }

      data = { result: index >= 0, reason: '' }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    })
  })

  return {
    sent,
    queue,
    checked,
    polls: () => polls,
    checks: () => checked.length,
    incoming(text: string, chatId = fixture.chatId, idMessage = 'reply-1') {
      queue.push({ receiptId: receipt++, body: {
        typeWebhook: 'incomingMessageReceived',
        instanceData: {
          idInstance: Number(fixture.idInstance), typeInstance: messenger,
        },
        timestamp: Math.floor(Date.now() / 1000),
        idMessage,
        senderData: { chatId, chatName: 'Тестовый контакт' },
        messageData: {
          typeMessage: 'textMessage', textMessageData: { textMessage: text },
        },
      } })
    },
  }
}

export async function fillConnection(
  target: Page | Locator, messenger: MessengerId = 'whatsapp',
) {
  await target.getByLabel('Адрес API (apiUrl)')
    .fill('https://4100.api.green-api.com')
  await target.getByLabel('ID инстанса (idInstance)')
    .fill(fixtureFor(messenger).idInstance)
  await target.getByLabel('Токен API (apiTokenInstance)', { exact: true })
    .fill(`test-token-${messenger}-not-a-real-secret`)
  await target.getByRole('button', {
    name: 'Подключиться', exact: true,
  }).click()
}

export async function connect(
  page: Page, messenger: MessengerId = 'whatsapp',
) {
  await page.goto('./')
  await fillConnection(page, messenger)
}

export async function createChat(target: Page | Locator) {
  await target.getByLabel('Номер телефона').fill('+7 (999) 123-45-67')
  await target.getByRole('button', { name: 'Создать чат', exact: true }).click()
}
