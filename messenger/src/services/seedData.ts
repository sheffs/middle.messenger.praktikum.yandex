import type { Chat, User } from '../types';
import type { ChatMessage } from '../core/WebSocketTransport';
import { readStorage, writeStorage, KEYS } from './storage';
import { STUB_USERS, ensureStubUsers } from './stubUsers';

// Версия сида — меняем когда меняется структура демо-данных
const SEED_KEY = 'msgr_seed_v3';
const SEED_CHAT_IDS = [1001, 1002, 1003, 1004, 1005];
const PEER_ID = 9999; // условный ID собеседников

function makeTime(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function buildChats(meId: number): Chat[] {
  const stub = (id: number): User => ({ id } as User);

  return [
    {
      id: 1001,
      title: 'Алексей Петров',
      avatar: null,
      unread_count: 3,
      last_message: { user: stub(PEER_ID), time: makeTime(4), content: 'Ты посмотрел новое ТЗ?' },
      is_group: false,
      members: [meId, STUB_USERS[0].id],
    },
    {
      id: 1002,
      title: 'Команда разработки',
      avatar: null,
      unread_count: 7,
      last_message: { user: stub(PEER_ID), time: makeTime(12), content: 'Стенд поднят, можно тестировать' },
      is_group: true,
      members: [meId, STUB_USERS[0].id, STUB_USERS[2].id, STUB_USERS[4].id, STUB_USERS[6].id],
    },
    {
      id: 1003,
      title: 'Мария Смирнова',
      avatar: null,
      unread_count: 0,
      last_message: { user: stub(meId), time: makeTime(60), content: 'Договорились, до завтра!' },
      is_group: false,
      members: [meId, STUB_USERS[7].id],
    },
    {
      id: 1004,
      title: 'Дизайн-команда',
      avatar: null,
      unread_count: 1,
      last_message: { user: stub(PEER_ID), time: makeTime(90), content: 'Выложила макеты в Figma' },
      is_group: true,
      members: [meId, STUB_USERS[1].id, STUB_USERS[3].id, STUB_USERS[5].id],
    },
    {
      id: 1005,
      title: 'Иван Сидоров',
      avatar: null,
      unread_count: 0,
      last_message: { user: stub(meId), time: makeTime(24 * 60), content: 'Окей, принял!' },
      is_group: false,
      members: [meId, STUB_USERS[8].id],
    },
  ];
}

type MsgSpec = { text: string; mine: boolean; minsAgo: number; read?: boolean };

function buildMessages(): Record<number, MsgSpec[]> {
  return {
    1001: [
      { text: 'Привет! Как дела с задачей?', mine: false, minsAgo: 30 },
      { text: 'Почти готово, осталось покрыть тестами', mine: true, minsAgo: 28, read: true },
      { text: 'Отлично! Много тестов?', mine: false, minsAgo: 27 },
      { text: 'Штук 15 — валидатор, роутер и Block', mine: true, minsAgo: 25, read: true },
      { text: 'Молодец 👍 Кстати, ты посмотрел новое ТЗ?', mine: false, minsAgo: 10 },
      { text: 'Там добавили раздел с WebSocket', mine: false, minsAgo: 9 },
      { text: 'Ты посмотрел новое ТЗ?', mine: false, minsAgo: 4 },
    ],
    1002: [
      { text: 'Ребята, сегодня деплой в 17:00', mine: false, minsAgo: 60 },
      { text: 'Хорошо, успею дотестировать', mine: true, minsAgo: 58, read: true },
      { text: 'Я залью фикс для мобилки', mine: false, minsAgo: 45 },
      { text: 'PR уже готов, смотрим?', mine: false, minsAgo: 40 },
      { text: 'Посмотрел, оставил комментарии', mine: true, minsAgo: 35, read: true },
      { text: 'Принял, спасибо!', mine: false, minsAgo: 30 },
      { text: 'Кстати, все задачи из спринта закрыты?', mine: false, minsAgo: 20 },
      { text: 'Кроме одной по аватарке', mine: false, minsAgo: 18 },
      { text: 'Стенд поднят, можно тестировать', mine: false, minsAgo: 12 },
    ],
    1003: [
      { text: 'Маш, можешь созвониться сегодня?', mine: true, minsAgo: 120, read: true },
      { text: 'Да, в 15:00 удобно?', mine: false, minsAgo: 115 },
      { text: 'Отлично, созваниваемся!', mine: true, minsAgo: 110, read: true },
      { text: 'Обсудили всё что хотели 😊', mine: false, minsAgo: 70 },
      { text: 'Да, продуктивно получилось!', mine: true, minsAgo: 65, read: true },
      { text: 'Если будут вопросы — пиши', mine: false, minsAgo: 62 },
      { text: 'Договорились, до завтра!', mine: true, minsAgo: 60, read: true },
    ],
    1004: [
      { text: 'Привет всем! Готова первая итерация дизайна', mine: false, minsAgo: 180 },
      { text: 'Круто, смотрим!', mine: true, minsAgo: 175, read: true },
      { text: 'Мне нравится тёмная тема 🔥', mine: false, minsAgo: 160 },
      { text: 'Да, смотрится солидно', mine: true, minsAgo: 155, read: true },
      { text: 'Выложила макеты в Figma', mine: false, minsAgo: 90 },
    ],
    1005: [
      { text: 'Вань, не забудь про ретро в пятницу', mine: false, minsAgo: 26 * 60 },
      { text: 'Записал, буду!', mine: true, minsAgo: 25 * 60, read: true },
      { text: 'Подготовь пару пунктов — что можно улучшить', mine: false, minsAgo: 24 * 60 + 30 },
      { text: 'Ок, набросаю список', mine: true, minsAgo: 24 * 60, read: true },
      { text: 'Окей, принял!', mine: true, minsAgo: 24 * 60, read: true },
    ],
  };
}

export function seedDemoData(meId: number): void {
  if (readStorage<boolean>(SEED_KEY)) {
    return;
  }

  // Удаляем устаревшие демо-чаты предыдущих версий перед повторным сидом
  const existing = (readStorage<Chat[]>(KEYS.CHATS) ?? [])
    .filter((c) => !SEED_CHAT_IDS.includes(c.id));
  writeStorage(KEYS.CHATS, [...buildChats(meId), ...existing]);

  const msgSpecs = buildMessages();
  for (const [chatIdStr, specs] of Object.entries(msgSpecs)) {
    const chatId = Number(chatIdStr);
    const messages: ChatMessage[] = specs.map((s, idx) => ({
      id: chatId * 1000 + idx,
      user_id: s.mine ? meId : PEER_ID,
      chat_id: chatId,
      type: 'message',
      time: makeTime(s.minsAgo),
      content: s.text,
      is_read: s.mine ? (s.read ?? false) : true,
    }));
    writeStorage(KEYS.messages(chatId), messages);
  }

  ensureStubUsers();
  writeStorage(SEED_KEY, true);
}
