import { describe, it, expect } from 'vitest';
import { Validator } from './validator';

describe('Validator.login', () => {
  it('принимает корректный логин', () => {
    expect(Validator.login('ivanivanov')).toBeNull();
    expect(Validator.login('user-1')).toBeNull();
    expect(Validator.login('user_123')).toBeNull();
  });

  it('отклоняет пустое значение', () => {
    expect(Validator.login('')).not.toBeNull();
  });

  it('отклоняет слишком короткий логин', () => {
    expect(Validator.login('ab')).not.toBeNull();
  });

  it('отклоняет логин из одних цифр', () => {
    expect(Validator.login('12345')).not.toBeNull();
  });

  it('отклоняет логин с пробелами', () => {
    expect(Validator.login('ivan ivanov')).not.toBeNull();
  });
});

describe('Validator.password', () => {
  it('принимает корректный пароль', () => {
    expect(Validator.password('Password1')).toBeNull();
    expect(Validator.password('Qwerty123')).toBeNull();
  });

  it('отклоняет пароль без заглавной буквы', () => {
    expect(Validator.password('password1')).not.toBeNull();
  });

  it('отклоняет пароль без цифры', () => {
    expect(Validator.password('Password')).not.toBeNull();
  });

  it('отклоняет короткий пароль', () => {
    expect(Validator.password('Pass1')).not.toBeNull();
  });
});

describe('Validator.name', () => {
  it('принимает имя на кириллице', () => {
    expect(Validator.name('Иван')).toBeNull();
    expect(Validator.name('Мария-Луиза')).toBeNull();
  });

  it('принимает имя на латинице', () => {
    expect(Validator.name('Ivan')).toBeNull();
  });

  it('отклоняет имя со строчной буквы', () => {
    expect(Validator.name('иван')).not.toBeNull();
  });

  it('отклоняет пустое значение', () => {
    expect(Validator.name('')).not.toBeNull();
  });
});

describe('Validator.email', () => {
  it('принимает корректный email', () => {
    expect(Validator.email('user@example.com')).toBeNull();
    expect(Validator.email('user.name+tag@domain.ru')).toBeNull();
  });

  it('отклоняет email без @', () => {
    expect(Validator.email('userdomain.com')).not.toBeNull();
  });

  it('отклоняет email без домена', () => {
    expect(Validator.email('user@')).not.toBeNull();
  });
});

describe('Validator.phone', () => {
  it('принимает телефон с +', () => {
    expect(Validator.phone('+79991234567')).toBeNull();
  });

  it('принимает телефон без +', () => {
    expect(Validator.phone('89991234567')).toBeNull();
  });

  it('отклоняет слишком короткий номер', () => {
    expect(Validator.phone('123')).not.toBeNull();
  });
});

describe('Validator.passwordConfirm', () => {
  it('принимает совпадающие пароли', () => {
    expect(Validator.passwordConfirm('Password1')('Password1')).toBeNull();
  });

  it('отклоняет несовпадающие пароли', () => {
    expect(Validator.passwordConfirm('Password1')('Password2')).not.toBeNull();
  });

  it('отклоняет пустое значение', () => {
    expect(Validator.passwordConfirm('Password1')('')).not.toBeNull();
  });
});
