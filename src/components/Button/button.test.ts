import { describe, it, expect } from 'vitest';
import { Button } from './index';

describe('Button', () => {
  it('рендерит переданный текст', () => {
    const button = new Button({ label: 'Войти' });
    expect(button.getContent().textContent?.trim()).toBe('Войти');
  });

  it('по умолчанию имеет type="button" и variant primary', () => {
    const button = new Button({ label: 'OK' });
    const el = button.getContent().querySelector('button');
    expect(el?.getAttribute('type')).toBe('button');
    expect(el?.className).toContain('button--primary');
  });

  it('применяет переданные type и variant', () => {
    const button = new Button({ label: 'Удалить', type: 'submit', variant: 'danger' });
    const el = button.getContent().querySelector('button');
    expect(el?.getAttribute('type')).toBe('submit');
    expect(el?.className).toContain('button--danger');
  });

  it('добавляет модификатор full при fullWidth', () => {
    const button = new Button({ label: 'OK', fullWidth: true });
    expect(button.getContent().querySelector('button')?.className).toContain('button--full');
  });

  it('ставит атрибут disabled при disabled=true', () => {
    const button = new Button({ label: 'OK', disabled: true });
    expect(button.getContent().querySelector('button')?.hasAttribute('disabled')).toBe(true);
  });

  it('экранирует HTML в тексте (защита от XSS)', () => {
    const button = new Button({ label: '<img src=x onerror=alert(1)>' });
    expect(button.getContent().querySelector('img')).toBeNull();
    expect(button.getContent().textContent).toContain('<img');
  });
});
