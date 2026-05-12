import type { ChatMessage, MessageAttachment } from '../core/WebSocketTransport';
import { readStorage, writeStorage, KEYS } from './storage';

const MAX_FILE_SIZE_MB = 10;

function getMessages(chatId: number): ChatMessage[] {
  return readStorage<ChatMessage[]>(KEYS.messages(chatId)) ?? [];
}

export const LocalMessagesService = {
  getMessages(chatId: number): ChatMessage[] {
    return getMessages(chatId);
  },

  addMessage(chatId: number, content: string, userId: number, attachment?: MessageAttachment): ChatMessage {
    const msg: ChatMessage = {
      id: Date.now(),
      user_id: userId,
      chat_id: chatId,
      type: 'message',
      time: new Date().toISOString(),
      content,
      is_read: false,
      attachment,
    };

    writeStorage(KEYS.messages(chatId), [...getMessages(chatId), msg]);
    return msg;
  },

  /** Конвертирует файл в base64 и возвращает attachment-объект */
  fileToAttachment(file: File): Promise<MessageAttachment> {
    return new Promise((resolve, reject) => {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        reject(new Error(`Файл слишком большой (макс. ${MAX_FILE_SIZE_MB} МБ)`));
        return;
      }

      const kind: MessageAttachment['kind'] = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();

      reader.onload = (): void => {
        resolve({ kind, src: reader.result as string, name: file.name });
      };
      reader.onerror = (): void => { reject(new Error('Ошибка чтения файла')); };
      reader.readAsDataURL(file);
    });
  },
};
