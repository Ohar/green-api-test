import type { ConnectionStatus } from '../../../core/types'

export const statusLabels: Record<ConnectionStatus, string> = {
  disconnected: 'Подключение завершено',
  connecting: 'Подключаемся к GREEN-API…',
  connected: 'Подключено',
  reconnecting: 'Восстанавливаем получение сообщений…',
  error: 'Получение сообщений остановлено',
}
