import { LocalChatsService } from '../services/LocalChatsService';
import type { Chat, User } from '../types';

export const ChatsAPI = {
  getChats(): Promise<Chat[]> {
    return LocalChatsService.getChats();
  },

  createChat(data: { title: string; isGroup?: boolean; members?: number[] }): Promise<{ id: number }> {
    return LocalChatsService.createChat(data.title, data.isGroup, data.members);
  },

  deleteChat(chatId: number): Promise<void> {
    return LocalChatsService.deleteChat(chatId);
  },

  getMembers(chatId: number): number[] {
    return LocalChatsService.getMembers(chatId);
  },

  addMember(chatId: number, userId: number): void {
    LocalChatsService.addMember(chatId, userId);
  },

  removeMember(chatId: number, userId: number): void {
    LocalChatsService.removeMember(chatId, userId);
  },

  updateChatAvatar(chatId: number, avatarSrc: string): void {
    LocalChatsService.updateChatAvatar(chatId, avatarSrc);
  },

  updateLastMessage(chatId: number, content: string, user: User): void {
    LocalChatsService.updateLastMessage(chatId, content, user);
  },

  // Заглушки для совместимости с интерфейсом реального API
  addUsers(_data: { users: number[]; chatId: number }): Promise<void> {
    return Promise.resolve();
  },

  removeUsers(_data: { users: number[]; chatId: number }): Promise<void> {
    return Promise.resolve();
  },

  getChatToken(_chatId: number): Promise<{ token: string }> {
    return Promise.resolve({ token: 'local' });
  },
};
