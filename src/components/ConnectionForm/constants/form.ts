import type { Credentials } from '../../../core/types'

export const emptyCredentials: Credentials = {
  apiUrl: '',
  idInstance: '',
  apiTokenInstance: '',
}

export const connectionSteps = [
  {
    title: 'Подключите свой аккаунт',
    description: 'Используйте авторизованный Telegram-инстанс GREEN-API.',
  },
  {
    title: 'Начните диалог по номеру',
    description: 'Укажите номер собеседника с кодом страны.',
  },
  {
    title: 'Общайтесь в одном окне',
    description: 'Отправляйте текст и получайте ответы из Telegram.',
  },
]
