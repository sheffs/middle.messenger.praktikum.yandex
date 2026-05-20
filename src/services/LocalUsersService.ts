import type { User, UpdateProfileData } from '../types';
import { readStorage, writeStorage, KEYS } from './storage';

interface StoredUser extends User {
  password: string;
}

function getUsers(): StoredUser[] {
  return readStorage<StoredUser[]>(KEYS.USERS) ?? [];
}

function getCurrentUserId(): number | null {
  return readStorage<number>(KEYS.SESSION);
}

function withoutPassword(user: StoredUser): User {
  const { password: _pwd, ...rest } = user;
  return rest;
}

export const LocalUsersService = {
  updateProfile(data: UpdateProfileData): Promise<User> {
    const uid = getCurrentUserId();
    if (!uid) {
      return Promise.reject({ reason: 'Не авторизован' });
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === uid);
    if (idx < 0) {
      return Promise.reject({ reason: 'Пользователь не найден' });
    }

    users[idx] = { ...users[idx], ...data };
    writeStorage(KEYS.USERS, users);

    return Promise.resolve(withoutPassword(users[idx]));
  },

  updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) {
      return Promise.reject({ reason: 'Не авторизован' });
    }

    const users = getUsers();
    const user = users.find((u) => u.id === uid);

    if (!user) {
      return Promise.reject({ reason: 'Пользователь не найден' });
    }
    if (user.password !== oldPassword) {
      return Promise.reject({ reason: 'Неверный текущий пароль' });
    }

    user.password = newPassword;
    writeStorage(KEYS.USERS, users);
    return Promise.resolve();
  },

  updateAvatar(file: File): Promise<User> {
    return new Promise((resolve, reject) => {
      const uid = getCurrentUserId();
      if (!uid) {
        reject({ reason: 'Не авторизован' });
        return;
      }

      const reader = new FileReader();

      reader.onload = (): void => {
        const users = getUsers();
        const user = users.find((u) => u.id === uid);
        if (!user) {
          reject({ reason: 'Пользователь не найден' });
          return;
        }
        user.avatar = reader.result as string;
        writeStorage(KEYS.USERS, users);
        resolve(withoutPassword(user));
      };

      reader.onerror = (): void => { reject({ reason: 'Ошибка чтения файла' }); };
      reader.readAsDataURL(file);
    });
  },

  searchUsers(login: string): Promise<User[]> {
    const results = getUsers()
      .filter((u) => u.login.toLowerCase().includes(login.toLowerCase()))
      .map(withoutPassword);
    return Promise.resolve(results);
  },
};
