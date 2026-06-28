import { describe, it, expect } from 'vitest';
import { Input } from './index';

describe('Input', () => {
  it('рендерит label и input с атрибутом name', () => {
    const input = new Input({ name: 'login', label: 'Логин' });
    const el = input.getContent();
    expect(el.querySelector('label')?.textContent).toBe('Логин');
    expect(el.querySelector('input')?.getAttribute('name')).toBe('login');
  });

  it('по умолчанию имеет type="text"', () => {
    const input = new Input({ name: 'login', label: 'Логин' });
    expect(input.getContent().querySelector('input')?.getAttribute('type')).toBe('text');
  });

  it('getValue возвращает текущее значение поля', () => {
    const input = new Input({ name: 'login', label: 'Логин', value: 'ivan' });
    expect(input.getValue()).toBe('ivan');
  });

  it('validate возвращает false и показывает ошибку для невалидного значения', () => {
    const input = new Input({
      name: 'login',
      label: 'Логин',
      validate: (v): string | null => (v.length === 0 ? 'Обязательное поле' : null),
    });
    expect(input.validate()).toBe(false);
    expect(input.getContent().querySelector('.input-field__error-text')?.textContent)
      .toBe('Обязательное поле');
  });

  it('validate возвращает true для валидного значения', () => {
    const input = new Input({
      name: 'login',
      label: 'Логин',
      value: 'ivan',
      validate: (v): string | null => (v.length === 0 ? 'Обязательное поле' : null),
    });
    expect(input.validate()).toBe(true);
  });
});
