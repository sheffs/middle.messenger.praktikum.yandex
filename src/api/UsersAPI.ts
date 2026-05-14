import { LocalUsersService } from '../services/LocalUsersService';
import type { User, UpdateProfileData, UpdatePasswordData } from '../types';

export const UsersAPI = {
  updateProfile(data: UpdateProfileData): Promise<User> {
    return LocalUsersService.updateProfile(data);
  },

  updatePassword(data: UpdatePasswordData): Promise<void> {
    return LocalUsersService.updatePassword(data.oldPassword, data.newPassword);
  },

  updateAvatar(formData: FormData): Promise<User> {
    const file = formData.get('avatar');
    if (!(file instanceof File)) {
      return Promise.reject({ reason: 'Файл не найден' });
    }
    return LocalUsersService.updateAvatar(file);
  },

  getUserById(_id: number): Promise<User> {
    // Заглушка — локально другого пользователя не получить без сервера
    return Promise.reject({ reason: 'Функция недоступна в offline-режиме' });
  },

  searchUsers(login: string): Promise<User[]> {
    return LocalUsersService.searchUsers(login);
  },
};
