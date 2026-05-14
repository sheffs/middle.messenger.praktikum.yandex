import type { User } from '../types';
import { readStorage, writeStorage, KEYS } from './storage';

// 10 демо-пользователей для тестирования добавления в чаты
export const STUB_USERS: User[] = [
  { id: 101, first_name: 'Александр', second_name: 'Козлов',   login: 'a.kozlov',   email: 'kozlov@ya.ru',    phone: '+79001110101', display_name: 'Александр К.', avatar: null },
  { id: 102, first_name: 'Екатерина', second_name: 'Петрова',  login: 'e.petrova',  email: 'petrova@ya.ru',   phone: '+79001110102', display_name: 'Катя П.',      avatar: null },
  { id: 103, first_name: 'Дмитрий',   second_name: 'Смирнов',  login: 'd.smirnov',  email: 'smirnov@ya.ru',   phone: '+79001110103', display_name: 'Дима С.',      avatar: null },
  { id: 104, first_name: 'Анна',       second_name: 'Волкова',  login: 'a.volkova',  email: 'volkova@ya.ru',   phone: '+79001110104', display_name: 'Анна В.',      avatar: null },
  { id: 105, first_name: 'Максим',     second_name: 'Новиков',  login: 'm.novikov',  email: 'novikov@ya.ru',   phone: '+79001110105', display_name: 'Макс Н.',      avatar: null },
  { id: 106, first_name: 'Ольга',      second_name: 'Морозова', login: 'o.morozova', email: 'morozova@ya.ru',  phone: '+79001110106', display_name: 'Оля М.',       avatar: null },
  { id: 107, first_name: 'Павел',      second_name: 'Лебедев',  login: 'p.lebedev',  email: 'lebedev@ya.ru',   phone: '+79001110107', display_name: 'Паша Л.',      avatar: null },
  { id: 108, first_name: 'Мария',      second_name: 'Зайцева',  login: 'm.zaitseva', email: 'zaitseva@ya.ru',  phone: '+79001110108', display_name: 'Маша З.',      avatar: null },
  { id: 109, first_name: 'Никита',     second_name: 'Попов',    login: 'n.popov',    email: 'popov@ya.ru',     phone: '+79001110109', display_name: 'Никита П.',    avatar: null },
  { id: 110, first_name: 'Виктория',   second_name: 'Соколова', login: 'v.sokolova', email: 'sokolova@ya.ru',  phone: '+79001110110', display_name: 'Вика С.',      avatar: null },
];

export function ensureStubUsers(): void {
  if (!readStorage(KEYS.STUB_USERS)) {
    writeStorage(KEYS.STUB_USERS, STUB_USERS);
  }
}

/** Возвращает всех известных пользователей (заглушки + зарегистрированные, кроме себя) */
export function getAllKnownUsers(excludeId: number): User[] {
  const stubs = readStorage<User[]>(KEYS.STUB_USERS) ?? STUB_USERS;
  const registered = readStorage<Array<User & { password: string }>>(KEYS.USERS) ?? [];

  const regWithoutPwd: User[] = registered.map(({ password: _p, ...u }) => u);
  const all = [...stubs, ...regWithoutPwd];

  return all.filter((u) => u.id !== excludeId);
}

export function getUserById(id: number): User | undefined {
  const all = [...(readStorage<User[]>(KEYS.STUB_USERS) ?? STUB_USERS)];
  const registered = readStorage<Array<User & { password: string }>>(KEYS.USERS) ?? [];
  all.push(...registered.map(({ password: _p, ...u }) => u));
  return all.find((u) => u.id === id);
}
