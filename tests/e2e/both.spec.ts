import { expect, test } from '@playwright/test'
import {
  createChat, fillConnection, mockGreenApi,
} from './helpers/greenApi'

test('two forms isolate credentials, errors, chats, drafts and polling',
  async ({ page }) => {
    const waApi = await mockGreenApi(page, 'whatsapp')
    const tgApi = await mockGreenApi(page, 'telegram')
    const wa = page.getByRole('region', { name: 'WhatsApp', exact: true })
    const tg = page.getByRole('region', { name: 'Telegram', exact: true })

    await page.goto('./')
    await expect(wa.getByRole('heading', { name: 'Инстанс WhatsApp' }))
      .toBeVisible()
    await expect(tg.getByRole('heading', { name: 'Инстанс Telegram' }))
      .toBeVisible()
    await fillConnection(wa)
    await createChat(wa)
    await wa.getByLabel('Сообщение', { exact: true }).fill('Черновик WA')
    await tg.getByLabel('Адрес API (apiUrl)').fill('https://evil.example.com')
    await tg.getByLabel('ID инстанса (idInstance)').fill('4100000000')
    await tg.getByLabel('Токен API (apiTokenInstance)', { exact: true })
      .fill('test-token-telegram')
    await tg.getByRole('button', { name: 'Подключиться', exact: true }).click()
    await expect(tg.getByRole('alert')).toContainText('HTTPS API-хост')
    await expect(wa.getByLabel('Сообщение', { exact: true }))
      .toHaveValue('Черновик WA')
    await fillConnection(tg, 'telegram')
    await createChat(tg)
    await tg.getByLabel('Сообщение', { exact: true }).fill('Текст TG')
    await tg.getByRole('button', { name: 'Отправить', exact: true }).click()
    await wa.getByRole('button', { name: 'Отправить', exact: true }).click()
    await expect.poll(() => waApi.sent).toEqual([
      { chatId: '10001@lid', message: 'Черновик WA' },
    ])
    await expect.poll(() => tgApi.sent).toEqual([
      { chatId: '10001', message: 'Текст TG' },
    ])

    waApi.incoming('Ответ WA', '79991234567@c.us')
    tgApi.incoming('Ответ TG')

    await expect(wa.getByRole('log')).toContainText('Ответ WA')
    await expect(wa.getByRole('log')).not.toContainText('Ответ TG')
    await expect(tg.getByRole('log')).toContainText('Ответ TG')
    await expect(tg.getByRole('log')).not.toContainText('Ответ WA')
    await tg.getByLabel('Сообщение', { exact: true }).fill('Черновик TG')

    const back = wa.getByRole('button', { name: 'Назад к диалогам' })

    if (await back.isVisible()) {
      await back.click()
    }

    await wa.getByRole('button', { name: 'Отключиться' }).click()
    await expect(wa.getByRole('heading', { name: 'Инстанс WhatsApp' }))
      .toBeVisible()
    await expect(wa.getByLabel('Токен API (apiTokenInstance)', { exact: true }))
      .toHaveValue('')
    await expect(tg.getByLabel('Сообщение', { exact: true }))
      .toHaveValue('Черновик TG')

    const stopped = waApi.polls()
    const active = tgApi.polls()

    tgApi.incoming('TG продолжает работать', '10001', 'reply-2')

    await expect(tg.getByRole('log')).toContainText('TG продолжает работать')
    await expect.poll(() => tgApi.polls()).toBeGreaterThan(active)
    expect(waApi.polls()).toBe(stopped)
  })
