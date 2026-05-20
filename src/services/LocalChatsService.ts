import type { Chat, User } from '../types';
import { readStorage, writeStorage, KEYS } from './storage';

function getChats(): Chat[] {
  return readStorage<Chat[]>(KEYS.CHATS) ?? [];
}

function updateChat(chatId: number, patch: Partial<Chat>): void {
  writeStorage(
    KEYS.CHATS,
    getChats().map((c): Chat => (c.id === chatId ? { ...c, ...patch } : c)),
  );
}

export const LocalChatsService = {
  getChats(): Promise<Chat[]> {
    return Promise.resolve(getChats());
  },

  createChat(title: string, isGroup = false, initialMembers: number[] = []): Promise<{ id: number }> {
    const chats = getChats();
    const chat: Chat = {
      id: Date.now(),
      title,
      avatar: null,
      unread_count: 0,
      last_message: null,
      is_group: isGroup,
      members: initialMembers,
    };
    writeStorage(KEYS.CHATS, [...chats, chat]);
    return Promise.resolve({ id: chat.id });
  },

  deleteChat(chatId: number): Promise<void> {
    writeStorage(KEYS.CHATS, getChats().filter((c) => c.id !== chatId));
    return Promise.resolve();
  },

  getMembers(chatId: number): number[] {
    return getChats().find((c) => c.id === chatId)?.members ?? [];
  },

  addMember(chatId: number, userId: number): void {
    const chat = getChats().find((c) => c.id === chatId);
    if (!chat) {
      return;
    }
    const members = chat.members ?? [];
    if (!members.includes(userId)) {
      updateChat(chatId, { members: [...members, userId], is_group: true });
    }
  },

  removeMember(chatId: number, userId: number): void {
    const chat = getChats().find((c) => c.id === chatId);
    if (!chat) {
      return;
    }
    const members = (chat.members ?? []).filter((id) => id !== userId);
    updateChat(chatId, { members });
  },

  updateChatAvatar(chatId: number, avatarSrc: string): void {
    updateChat(chatId, { avatar: avatarSrc });
  },

  updateLastMessage(chatId: number, content: string, user: User): void {
    updateChat(chatId, {
      last_message: { user, time: new Date().toISOString(), content },
    });
  },
};
