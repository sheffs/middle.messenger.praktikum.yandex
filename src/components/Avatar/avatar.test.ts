import { describe, it, expect } from 'vitest';
import { Avatar } from './index';

describe('Avatar', () => {
  it('показывает инициалы, когда нет src', () => {
    const avatar = new Avatar({ initials: 'ИП' });
    const initials = avatar.getContent().querySelector('.avatar__initials');
    expect(initials?.textContent).toBe('ИП');
    expect(avatar.getContent().querySelector('img')).toBeNull();
  });

  it('показывает картинку, когда передан src', () => {
    const avatar = new Avatar({ src: 'https://example.com/a.png' });
    const img = avatar.getContent().querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/a.png');
    expect(avatar.getContent().querySelector('.avatar__initials')).toBeNull();
  });

  it('по умолчанию имеет размер md', () => {
    const avatar = new Avatar({ initials: 'A' });
    expect(avatar.getContent().querySelector('.avatar')?.className).toContain('avatar--md');
  });

  it('применяет переданный размер', () => {
    const avatar = new Avatar({ initials: 'A', size: 'xl' });
    expect(avatar.getContent().querySelector('.avatar')?.className).toContain('avatar--xl');
  });

  it('делает элемент кликабельным при clickable=true', () => {
    const avatar = new Avatar({ initials: 'A', clickable: true });
    const el = avatar.getContent().querySelector('.avatar');
    expect(el?.className).toContain('avatar--clickable');
    expect(el?.getAttribute('role')).toBe('button');
  });
});
