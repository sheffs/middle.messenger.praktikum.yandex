# Messenger

Учебный проект — SPA-мессенджер на TypeScript без готовых UI-фреймворков.

Ссылка на проект: [messanger-test.netlify.app](https://messanger-test.netlify.app/)

---

## Технологии

- TypeScript 5 — строгая типизация (`strict`, `noImplicitAny`, `strictNullChecks`)
- Vite 7 — сборщик и dev-сервер
- Handlebars 4 — шаблонизатор
- SCSS — стили по методологии BEM
- ESLint + Stylelint — линтинг JS/TS и CSS
- Vitest — юнит-тесты

## Запуск

```bash
# Установить зависимости (Node.js >= 22)
npm install

# Dev-сервер (порт 3000)
npm run dev

# Собрать и запустить production-сборку (порт 3000)
npm run start
```

Приложение работает с реальным бэкендом — [`ya-praktikum.tech/api/v2`](https://ya-praktikum.tech/api/v2/swagger/).
Для работы требуется активная сессия (вход или регистрация).

## Команды

| Команда | Что делает |
|---------|-----------|
| `npm run build` | Сборка в `dist/` |
| `npm run lint` | ESLint + Stylelint (все проверки) |
| `npm run lint:js` | Только ESLint |
| `npm run lint:style` | Только Stylelint |
| `npm run lint:fix` | Автоисправление ESLint + Stylelint |
| `npm run test` | Юнит-тесты |
| `npm run test:coverage` | Тесты с покрытием |

## Тестирование

Юнит-тесты написаны на **Vitest** (окружение `happy-dom`) и лежат рядом с тестируемыми
модулями (`*.test.ts`), а не в отдельной папке. Покрыты:

- **роутер** — `src/core/Router.test.ts`;
- **модуль отправки запросов** — `src/core/HTTPTransport.test.ts`;
- **WebSocket-транспорт** — `src/core/WebSocketTransport.test.ts`;
- **компоненты** — `src/components/{Button,Avatar,Input}/*.test.ts`;
- **ядро и утилиты** — `Block`, `EventBus`, `Store`, `LocalMessagesService`, валидаторы, сортировка.

```bash
npm run test            # запуск всех тестов
npm run test:coverage   # отчёт о покрытии
```

Перед каждым коммитом **Husky** запускает `lint-staged` (ESLint + Stylelint на изменённых
файлах) и полный прогон тестов — см. `.husky/pre-commit`.

## Страницы

| Маршрут | Описание |
|---------|----------|
| `/` | Вход |
| `/sign-up` | Регистрация |
| `/messenger` | Чаты |
| `/profile` | Профиль |
| `*` | 404 |
| `/500` | 500 |

## API

Все запросы идут на `https://ya-praktikum.tech/api/v2`. Сессия поддерживается через cookie `authCookie`.

| Модуль | Методы |
|--------|--------|
| **AuthAPI** | `signIn`, `signUp`, `signOut`, `getUser` |
| **ChatsAPI** | `getChats`, `createChat`, `deleteChat`, `getMembers`, `addUsers`, `removeUsers`, `updateAvatar`, `getNewMessagesCount`, `getChatToken` |
| **UsersAPI** | `updateProfile`, `updateAvatar`, `updatePassword`, `searchUsers` |

Сообщения передаются через **WebSocket** (`wss://ya-praktikum.tech/ws/chats/{userId}/{chatId}/{token}`): поддерживаются отправка текста, загрузка истории (offset-пагинация) и ping/pong.

## Архитектура

Собственная компонентная система без React/Vue:

- **Block** — базовый класс компонентов, Handlebars-шаблоны, реактивные props через Proxy
- **EventBus** — издатель/подписчик для lifecycle-событий компонентов
- **Router** — History API, guard-функции для защищённых маршрутов
- **Store** — глобальное состояние (singleton) с подпиской на изменения
- **HTTPTransport** — обёртка над XMLHttpRequest с поддержкой JSON и FormData
- **WebSocketTransport** — обёртка над WebSocket с автоматическим ping

```
src/
├── api/          — методы для работы с REST API (Auth, Chats, Users)
├── components/   — переиспользуемые UI-компоненты (Input, Button, Avatar)
├── core/         — Block, EventBus, Router, HTTPTransport, WebSocketTransport
├── pages/        — страницы приложения
├── types/        — общие TypeScript-типы
└── utils/        — валидация и утилиты
```

## Утилиты

- **`validator`** — набор валидаторов для полей форм (логин, email, пароль, телефон и др.)

## Seed-скрипт

Для заполнения тестовыми данными (чаты + история сообщений):

```bash
node scripts/seed.mjs <логин> <пароль>
```

Скрипт создаёт трёх тестовых пользователей и три чата с сообщениями от разных участников.

## Деплой

Ветка для продакшн-деплоя — **`deploy`**, Netlify читает её автоматически.
`netlify.toml` уже настроен: `npm run build` → папка `dist/`.
