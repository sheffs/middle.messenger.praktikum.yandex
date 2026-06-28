import type { MessageAttachment } from '../core/WebSocketTransport';

const MAX_FILE_SIZE_MB = 10;

export const LocalMessagesService = {
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
