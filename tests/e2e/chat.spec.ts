import { expect, test } from '@playwright/test'
import { connect, createChat, mockGreenApi } from './helpers/greenApi'

test('phone → send → receive; text stays safe and nothing persists',
  async ({ page }, testInfo) => {
    const api = await mockGreenApi(page)

    await connect(page)
    await createChat(page)
    await expect(page.getByLabel('Сообщение', { exact: true })).toBeVisible()
    await page.getByLabel('Сообщение', { exact: true }).fill('Привет 🙂')
    await page.getByRole('button', { name: 'Отправить', exact: true }).click()
    await expect.poll(() => api.sent.length).toBe(1)
    expect(api.sent[0]).toEqual({ chatId: '10001', message: 'Привет 🙂' })

    api.incoming('<script>alert("xss")</script> Ответ из Telegram')

    await expect(page.getByRole('log').getByText(
      '<script>alert("xss")</script> Ответ из Telegram',
      { exact: true })).toBeVisible()
    await expect.poll(() => api.queue.length).toBe(0)
    expect(await page.evaluate(() => ({
      local: localStorage.length, session: sessionStorage.length,
    }))).toEqual({ local: 0, session: 0 })

    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: /Назад/ }).click()
    }

    await page.getByRole('button', { name: 'Отключиться' }).click()
    await expect(page.getByLabel('Токен API', { exact: true })).toHaveValue('')

    const polls = api.polls()

    await page.waitForTimeout(350)
    expect(api.polls()).toBe(polls)
  })

test('only one tab consumes the queue', async ({ context, page }) => {
  await mockGreenApi(page)
  await connect(page)
  await expect(page.getByRole('heading', {
    name: 'Диалоги', exact: true,
  })).toBeVisible()

  const other = await context.newPage()

  await mockGreenApi(other)
  await connect(other)
  await expect(other.getByRole('alert')).toContainText('другой вкладке')
  await other.close()
})

test('rejects unsafe API destinations before any request', async ({ page }) => {
  await page.goto('./')
  await page.getByLabel('Адрес API').fill('https://evil.example.com')
  await page.getByLabel('ID инстанса').fill('4100000000')
  await page.getByLabel('Токен API', { exact: true }).fill('test-token-invalid')
  await page.getByRole('button', { name: 'Подключиться', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('HTTPS API-хост')
})

test('authorization loss is visible in the chat list', async ({ page }) => {
  const api = await mockGreenApi(page)

  await connect(page)
  await expect(page.getByRole('heading', {
    name: 'Диалоги', exact: true,
  })).toBeVisible()
  api.queue.push({ receiptId: 50, body: {
    typeWebhook: 'stateInstanceChanged',
    instanceData: { idInstance: 4100000000, typeInstance: 'telegram' },
    stateInstance: 'notAuthorized',
  } })
  await expect(page.getByRole('status'))
    .toContainText('Отключитесь и подключитесь заново')
  await expect(page.getByRole('status')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveCount(0)
})

test('Enter sends, Shift+Enter and composition do not',
  async ({ page }) => {
    const api = await mockGreenApi(page)

    await connect(page)
    await createChat(page)

    const composer = page.getByLabel('Сообщение', { exact: true })

    await composer.fill('Первая строка')
    await composer.press('Shift+Enter')
    await composer.press('A')
    expect(api.sent).toHaveLength(0)
    await composer.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
    expect(api.sent).toHaveLength(0)
    await composer.press('Enter')
    await expect.poll(() => api.sent.length).toBe(1)
  })
