import HTTPTransport from '../core/HTTPTransport';
import type { Chat, ChatMember, ChatUsersData } from '../types';

const http = new HTTPTransport('/chats');

export const ChatsAPI = {
  getChats(): Promise<Chat[]> {
    return http.get('');
  },

  createChat(data: { title: string }): Promise<{ id: number }> {
    return http.post('', { data });
  },

  deleteChat(chatId: number): Promise<void> {
    return http.delete('', { data: { chatId } });
  },

  getMembers(chatId: number): Promise<ChatMember[]> {
    return http.get(`/${chatId}/users`);
  },

  addUsers(data: ChatUsersData): Promise<void> {
    return http.put('/users', { data });
  },

  removeUsers(data: ChatUsersData): Promise<void> {
    return http.delete('/users', { data });
  },

  updateAvatar(formData: FormData): Promise<Chat> {
    return http.put('/avatar', { data: formData });
  },

  getNewMessagesCount(chatId: number): Promise<{ unread_count: number }> {
    return http.get(`/new/${chatId}`);
  },

  getChatToken(chatId: number): Promise<{ token: string }> {
    return http.post(`/token/${chatId}`);
  },
};
