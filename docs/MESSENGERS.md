# WhatsApp и Telegram: режимы приложения

Актуализация от 12 октября 2026 года. По запросу пользователя основным
мессенджером стал WhatsApp. Telegram сохранён для отдельного или совместного
использования. Этот документ уточняет прежний IMPLEMENTATION_PLAN.md.

## Переключатель

В `src/config/messengers.ts` задаётся одна настройка:

```ts
export const MESSENGER_MODE: MessengerMode = 'whatsapp'
```

Допустимые значения:

| Значение | Формы на странице |
| --- | --- |
| `whatsapp` | Только WhatsApp, текущая конфигурация |
| `telegram` | Только Telegram |
| `both` | WhatsApp и Telegram одновременно |

После изменения требуется пересборка и релиз. Для временного запуска
разрешено переопределение `VITE_MESSENGER_MODE` на этапе сборки/запуска.
Оно имеет приоритет над исходной настройкой. URL-параметры и localStorage
на выбор режима не влияют. В `VITE_*` никогда не кладутся учётные данные.

Например, локально в PowerShell:

```powershell
$env:VITE_MESSENGER_MODE = 'both'
npm run dev
Remove-Item Env:VITE_MESSENGER_MODE
```

Для постоянной публикации меняйте исходный флаг. Обязательно удалите
временное переопределение до релиза, чтобы локальная и CI-сборки совпадали.

Над полями всегда показано «Инстанс WhatsApp» или «Инстанс Telegram».
В совместном режиме на широком экране две области стоят рядом, на узком —
друг под другом. Каждая область адаптирует список и переписку к своей
ширине, независимо от размеров соседней области.

## Границы состояния

`App` выбирает адаптеры и создаёт отдельный `MessengerChat` для каждого.
У каждого компонента собственный `createChatRuntime(messenger)`:

- свой Zustand store, контакты, черновики, ошибки и сообщения;
- свои введённые apiUrl/idInstance/apiTokenInstance;
- отдельные ChatSession, AbortController и последовательный polling;
- отключение сбрасывает только эту сессию и её форму;
- поздний ответ отключённой сессии не меняет другую форму.

Общих изменяемых singleton store/session нет. При добавлении мессенджера
не возвращайте их на уровень модуля. Web Lock имеет ключ apiUrl/idInstance:
две формы не могут читать одну физическую очередь даже при ошибочном вводе
одних и тех же реквизитов. Для `both` нужны два разных инстанса провайдера.

## Контракты адаптеров

Общий HTTPS-транспорт находится в `src/api`, состояние и очередь —
в `src/core`. Отличия находятся в `src/messengers/<messenger>`.

| Контракт | WhatsApp | Telegram |
| --- | --- | --- |
| Проверка номера | checkWhatsapp | checkAccount |
| Тело проверки | chatId: phone@c.us | phoneNumber: число |
| Признак существования | existsWhatsapp | exist |
| Личный chatId | phone@c.us или opaque@lid | Положительная строка цифр |
| Лимит текста | 20000 | 4096 |
| typeInstance уведомления | whatsapp | telegram |

WhatsApp использует chatId, возвращённый checkWhatsapp. Старый ответ
только с existsWhatsapp поддержан: chatId получается из проверенного
номера как phone@c.us. LID никогда не вычисляется из телефона.

Проверка контакта связывает канонический ID и телефонный alias. Входящие
события и статусы с phone@c.us попадают в уже разрешённый LID-диалог.
Если очередь пришла раньше проверки контакта, история, черновик и ранние
статусы объединяются при разрешении номера. Один idMessage в разных
не связанных диалогах не считается дубликатом.

Оба адаптера используют sendMessage и ReceiveNotification/DeleteNotification.
Текст обрабатывается из textMessage, extendedTextMessage и quotedMessage.
Группы и медиа исключены из интерфейса и подтверждаются в очереди.
Уведомление чужого инстанса или мессенджера останавливает приём до ACK.
Настройки инстанса читаются, но автоматически не перезаписываются.

## Проверки и выпуск

`npm run verify` проверяет ESLint/архитектуру, unit-тесты, TypeScript и
production-сборку. Затем собирает все три режима в .preview-builds и
запускает Playwright на desktop/mobile. В Pages попадает только dist,
собранный по исходному флагу, без тестовых вариантов.

Сценарии включают отправку/получение в обоих адаптерах, ограничения текста,
подписи форм, маршрутизацию LID/phone, защиту очереди от второй вкладки,
безопасный вывод текста, независимость ошибок, черновиков и отключения.

Fixture-тесты не подтверждают живую доставку. Приёмку WhatsApp выполняйте
с реальным авторизованным WhatsApp-инстансом и вторым своим аккаунтом:
номер → создание чата → отправка → ответ из WhatsApp → отображение ответа.

Для выпуска: закоммитьте изменения, затем `npm version minor` для новой
функции либо `npm version patch` для исправления. Существующие lifecycle,
pre-push hook и GitHub Actions публикуют тег, Pages и GitHub Release.
Подробности и восстановление после сбоя описаны в README.

## Официальные источники

Проверены при адаптации 12 октября 2026 года:

- [CheckWhatsapp](https://green-api.com/docs/api/service/CheckWhatsapp/)
- [SendMessage](https://green-api.com/docs/api/sending/SendMessage/)
- [HTTP-приём](https://green-api.com/docs/api/receiving/technology-http-api/)
- [Настройки](https://green-api.com/docs/api/account/GetSettings/)
- [LID и phone ID](https://green-api.com/docs/faq/lid-important-differences/)
- [Текстовые уведомления][text-events]
- [Статусы исходящих][status-events]

[text-events]: https://green-api.com/docs/api/receiving/notifications-format/incoming-message/TextMessage/
[status-events]: https://green-api.com/docs/api/receiving/notifications-format/outgoing-message/OutgoingMessageStatus/
