import { describe, it, expect } from 'vitest';
import trim from './trim';

describe('trim', () => {
  it('удаляет пробелы по умолчанию', () => {
    expect(trim('  abc  ')).toBe('abc');
  });

  it('удаляет заданные символы', () => {
    expect(trim('-_-abc-_-', '_-')).toBe('abc');
  });

  it('удаляет неразрывный пробел \\xA0 по умолчанию', () => {
    expect(trim('\xA0foo')).toBe('foo');
  });

  it('не удаляет \\xA0 если в кастомных символах только обычный пробел', () => {
    expect(trim('\xA0foo', ' ')).toBe('\xA0foo');
  });

  it('удаляет только заданные символы, не трогая пробелы внутри', () => {
    expect(trim('-_-ab c -_-', '_-')).toBe('ab c ');
  });

  it('работает через Array.map без лишних аргументов', () => {
    expect(['  foo  ', '  bar  '].map((v) => trim(v))).toEqual(['foo', 'bar']);
  });

  it('возвращает пустую строку если вся строка из trim-символов', () => {
    expect(trim('---', '-')).toBe('');
  });

  it('не изменяет строку без trim-символов на концах', () => {
    expect(trim('abc', '-')).toBe('abc');
  });
});
