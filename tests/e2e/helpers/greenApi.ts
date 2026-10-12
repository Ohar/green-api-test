import type { Page } from '@playwright/test'

export async function mockGreenApi(page: Page) {
  const queue: { receiptId: number, body: unknown }[] = []
  const sent: { chatId: string, message: string }[] = []
  let receipt = 1
  let polls = 0
  let checks = 0

  await page.route('https://4100.api.green-api.com/**', async (route) => {
    const request = route.request()
    const operation = new URL(request.url()).pathname.split('/')[2]
    let data: unknown = null

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

    if (operation === 'checkAccount') {
      checks += 1

      data = { exist: true, chatId: '10001', username: 'Тестовый контакт' }
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
      const id = Number(new URL(request.url()).pathname.split('/').at(-1))
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
    polls: () => polls,
    checks: () => checks,
    incoming(text: string, chatId = '10001', idMessage = 'reply-1') {
      queue.push({ receiptId: receipt++, body: {
        typeWebhook: 'incomingMessageReceived',
        instanceData: { idInstance: 4100000000, typeInstance: 'telegram' },
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

export async function connect(page: Page) {
  await page.goto('./')
  await page.getByLabel('Адрес API').fill('https://4100.api.green-api.com')
  await page.getByLabel('ID инстанса').fill('4100000000')
  await page.getByLabel('Токен API', { exact: true })
    .fill('test-token-not-a-real-secret')
  await page.getByRole('button', { name: 'Подключиться', exact: true }).click()
}

export async function createChat(page: Page) {
  await page.getByLabel('Номер телефона').fill('+7 (999) 123-45-67')
  await page.getByRole('button', { name: 'Создать чат', exact: true }).click()
}
