import { describe, it, expect } from 'vitest';
import { LocalMessagesService } from './LocalMessagesService';

describe('LocalMessagesService', () => {
  it('преобразует изображение в attachment с kind="image"', async () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const attachment = await LocalMessagesService.fileToAttachment(file);
    expect(attachment.kind).toBe('image');
    expect(attachment.name).toBe('photo.png');
    expect(attachment.src).toContain('data:');
  });

  it('определяет видео по MIME-типу', async () => {
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
    const attachment = await LocalMessagesService.fileToAttachment(file);
    expect(attachment.kind).toBe('video');
  });

  it('отклоняет файл больше 10 МБ', async () => {
    const bigFile = new File([new Uint8Array(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await expect(LocalMessagesService.fileToAttachment(bigFile)).rejects.toThrow(/слишком большой/);
  });
});
