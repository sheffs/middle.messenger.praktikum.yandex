// Тонкая обёртка над localStorage — в одном месте всегда знаем ключи и умеем ловить JSON-ошибки

export const KEYS = {
  USERS: 'msgr_users',
  SESSION: 'msgr_uid',
  CHATS: 'msgr_chats',
  STUB_USERS: 'msgr_stub_users',
  messages: (chatId: number) => `msgr_msgs_${chatId}`,
} as const;

export function readStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key);
}
