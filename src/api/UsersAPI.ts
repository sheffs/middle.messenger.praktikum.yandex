import HTTPTransport from '../core/HTTPTransport';
import type { User, UpdateProfileData, UpdatePasswordData } from '../types';

const http = new HTTPTransport('/user');

export const UsersAPI = {
  updateProfile(data: UpdateProfileData): Promise<User> {
    return http.put('/profile', { data });
  },

  updatePassword(data: UpdatePasswordData): Promise<void> {
    return http.put('/password', { data });
  },

  updateAvatar(formData: FormData): Promise<User> {
    return http.put('/profile/avatar', { data: formData });
  },

  getUserById(id: number): Promise<User> {
    return http.get(`/${id}`);
  },

  searchUsers(login: string): Promise<User[]> {
    return http.post('/search', { data: { login } });
  },
};
