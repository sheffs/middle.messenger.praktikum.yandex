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

Приложение работает полностью локально — данные хранятся в `localStorage` браузера. Серверный API не требуется.

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

## Страницы

| Маршрут | Описание |
|---------|----------|
| `/` | Вход |
| `/sign-up` | Регистрация |
| `/messenger` | Чаты |
| `/profile` | Профиль |
| `*` | 404 |
| `/500` | 500 |

## Архитектура

Собственная компонентная система без React/Vue:

- **Block** — базовый класс компонентов, Handlebars-шаблоны, реактивные props через Proxy
- **EventBus** — издатель/подписчик для lifecycle-событий компонентов
- **Router** — History API, guard-функции для защищённых маршрутов
- **Store** — глобальное состояние (singleton) с подпиской на изменения

Данные (пользователи, чаты, сообщения) хранятся в `localStorage`. Код разбит на слои:

```
src/
├── api/          — интерфейс к данным (фасад над сервисами)
├── components/   — переиспользуемые UI-компоненты (Input, Button, Avatar)
├── core/         — Block, EventBus, Router, HTTPTransport, WebSocketTransport
├── pages/        — страницы приложения
├── services/     — бизнес-логика и работа с localStorage
├── store/        — глобальное состояние
├── types/        — общие TypeScript-типы
└── utils/        — валидация и утилиты
```

## Деплой

Ветка для продакшн-деплоя — **`deploy`**, Netlify читает её автоматически.
`netlify.toml` уже настроен: `npm run build` → папка `dist/`.
