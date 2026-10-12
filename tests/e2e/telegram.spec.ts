import { expect, test } from '@playwright/test'
import { connect, createChat, mockGreenApi } from './helpers/greenApi'

test('Telegram-only build keeps its API and text limit', async ({ page }) => {
  const api = await mockGreenApi(page, 'telegram')

  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Инстанс Telegram' }))
    .toBeVisible()
  await expect(page.getByRole('region', { name: 'WhatsApp' })).toHaveCount(0)
  await connect(page, 'telegram')
  await createChat(page)
  expect(api.checked).toEqual([{ phoneNumber: 79991234567 }])

  const input = page.getByLabel('Сообщение', { exact: true })
  const send = page.getByRole('button', { name: 'Отправить', exact: true })

  await input.fill('я'.repeat(4097))
  await expect(send).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('4096')
  await input.fill('Из Telegram')
  await send.click()
  await expect.poll(() => api.sent).toEqual([
    { chatId: '10001', message: 'Из Telegram' },
  ])

  api.incoming('Ответ Telegram')

  await expect(page.getByRole('log')).toContainText('Ответ Telegram')
  await expect.poll(() => api.queue.length).toBe(0)
})
