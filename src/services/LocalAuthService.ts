import type { User, SigninData, SignupData } from '../types';
import { readStorage, writeStorage, removeStorage, KEYS } from './storage';

// Локальный аналог бэкенда — данные хранятся в localStorage
// Пароль для простоты хранится в открытом виде (курсовой проект без сервера)

interface StoredUser extends User {
  password: string;
}

function getUsers(): StoredUser[] {
  return readStorage<StoredUser[]>(KEYS.USERS) ?? [];
}

function saveUsers(users: StoredUser[]): void {
  writeStorage(KEYS.USERS, users);
}

function getCurrentUserId(): number | null {
  return readStorage<number>(KEYS.SESSION);
}

export const LocalAuthService = {
  signup(data: SignupData): Promise<{ id: number }> {
    const users = getUsers();

    if (users.some((u) => u.login === data.login)) {
      return Promise.reject({ reason: 'Пользователь с таким логином уже существует' });
    }

    if (users.some((u) => u.email === data.email)) {
      return Promise.reject({ reason: 'Email уже используется' });
    }

    const user: StoredUser = {
      id: Date.now(),
      first_name: data.first_name,
      second_name: data.second_name,
      login: data.login,
      email: data.email,
      phone: data.phone,
      display_name: data.first_name,
      avatar: null,
      password: data.password,
    };

    saveUsers([...users, user]);
    writeStorage(KEYS.SESSION, user.id);

    return Promise.resolve({ id: user.id });
  },

  signin(data: SigninData): Promise<void> {
    const found = getUsers().find(
      (u) => u.login === data.login && u.password === data.password,
    );

    if (!found) {
      return Promise.reject({ reason: 'Неверный логин или пароль' });
    }

    writeStorage(KEYS.SESSION, found.id);
    return Promise.resolve();
  },

  getUser(): Promise<User> {
    const uid = getCurrentUserId();
    if (!uid) {
      return Promise.reject({ reason: 'Не авторизован' });
    }

    const found = getUsers().find((u) => u.id === uid);
    if (!found) {
      removeStorage(KEYS.SESSION);
      return Promise.reject({ reason: 'Сессия устарела' });
    }

    // Не отдаём пароль наружу
    const { password: _pwd, ...user } = found;
    return Promise.resolve(user);
  },

  logout(): Promise<void> {
    removeStorage(KEYS.SESSION);
    return Promise.resolve();
  },
};
