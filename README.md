# АСКИНВЕСТ

Русскоязычный сайт услуг и коммерческой недвижимости с закрытым кабинетом CRM, диалогами и рассылками. Отдельный проект (не SHARENTA).

Стек: Next.js (App Router) + TypeScript, PostgreSQL + Drizzle, локальное/S3 object storage, фоновый worker.

## Быстрый старт

```bash
# PostgreSQL должен быть доступен по DATABASE_URL
cp .env.example .env
# заполните DATABASE_URL, SESSION_SECRET, OWNER_EMAIL, OWNER_PASSWORD
npm install
npm run db:migrate
npm run seed:owner
# опционально демо-контент (только локально):
ALLOW_DEMO_SEED=true npm run seed:demo

# терминал 1
npm run dev
# терминал 2
npm run worker
```

Учётные данные владельца задаются только через `OWNER_EMAIL` / `OWNER_PASSWORD` в окружении (в код не вшиваются).

Приёмка: задайте те же переменные и выполните `npm run acceptance` при запущенных `dev` + `worker`.

## Маршруты

**Публичные:** `/`, `/services`, `/services/[slug]`, `/properties`, `/properties/[slug]`, `/contacts`

**Кабинет:** `/admin/login`, `/admin/properties`, `/admin/services`, редакторы, `/admin/leads`, `/admin/inbox`, `/admin/contacts`, `/admin/campaigns`, `/admin/staff`, `/admin/settings`

**API каналов:**  
`POST /api/channels/{telegram|max|whatsapp|test}/webhook` (подпись обязательна)  
`GET /api/channels/test/start?code=MARKER` — только при `ENABLE_TEST_CHANNEL=true` (в production ещё `TEST_CHANNEL_SECRET`)

## Каналы

Без credentials канала форма сообщит, что канал недоступен. Локально можно включить тестовый адаптер (`ENABLE_TEST_CHANNEL=true`). Статус — `/admin/settings`.

| Канал | Переменные | Вебхук |
|---|---|---|
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` | `POST /api/channels/telegram/webhook` (+ secret header) |
| MAX | `MAX_BOT_TOKEN`, `MAX_BOT_LINK`, `MAX_WEBHOOK_SECRET` | `POST /api/channels/max/webhook` |
| WhatsApp | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_NUMBER`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | verify `GET` + `POST /api/channels/whatsapp/webhook` |
| Test | `ENABLE_TEST_CHANNEL`, `TEST_CHANNEL_SECRET` | только для локальной проверки |

Перед боем сверьте актуальные требования провайдера, правила исходящих и шаблоны согласий. Боевые массовые рассылки в разработке не запускаются.

## Резервное копирование

```bash
pg_dump "$DATABASE_URL" > backup.sql
tar -czf media.tgz storage/uploads
# восстановление
psql "$DATABASE_URL" < backup.sql
tar -xzf media.tgz
```

## Скрипты

| Команда | Назначение |
|---|---|
| `npm run dev` | веб |
| `npm run worker` | очередь автоответов и рассылок |
| `npm run db:migrate` | миграции |
| `npm run seed:owner` | первый владелец (из env) |
| `npm run seed:demo` | демо (только с `ALLOW_DEMO_SEED=true`) |
| `npm run acceptance` | локальная приёмка API |
| `npm run build` | production-сборка + migrate |
