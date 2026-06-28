export type ValidateRule = (value: string) => string | null;

const RULES = {
  login: /^(?!\d+$)[a-zA-Z0-9_-]{3,20}$/,
  password: /^(?=.*[A-Z])(?=.*\d).{8,40}$/,
  name: /^[A-ZА-ЯЁ][a-zA-ZА-ЯЁа-яёA-Za-z-]*$/,
  email: /^[\w.+-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?\d{10,15}$/,
} as const;

function makeRequired(label: string): ValidateRule {
  return (value) => (value.trim() ? null : `${label} обязательно`);
}

// Сигнатура валидаторов задаётся один раз через ValidateRule — типы аргумента
// и результата не дублируются в каждом методе.
interface ValidatorMap {
  login: ValidateRule;
  password: ValidateRule;
  name: ValidateRule;
  email: ValidateRule;
  phone: ValidateRule;
  displayName: ValidateRule;
  passwordConfirm: (original: string) => ValidateRule;
}

export const Validator: ValidatorMap = {
  login: (value) => {
    const required = makeRequired('Логин')(value);
    if (required) {return required;}
    if (!RULES.login.test(value)) {
      return 'От 3 до 20 символов: латиница, цифры, «-» и «_»; не может состоять только из цифр';
    }
    return null;
  },

  password: (value) => {
    const required = makeRequired('Пароль')(value);
    if (required) {return required;}
    if (!RULES.password.test(value)) {
      return 'От 8 до 40 символов, минимум одна заглавная буква и одна цифра';
    }
    return null;
  },

  name: (value) => {
    const required = makeRequired('Поле')(value);
    if (required) {return required;}
    if (!RULES.name.test(value)) {
      return 'Только латиница или кириллица, первая буква заглавная, допустим «-»';
    }
    return null;
  },

  email: (value) => {
    const required = makeRequired('Почта')(value);
    if (required) {return required;}
    if (!RULES.email.test(value)) {
      return 'Некорректный адрес электронной почты';
    }
    return null;
  },

  phone: (value) => {
    const required = makeRequired('Телефон')(value);
    if (required) {return required;}
    if (!RULES.phone.test(value)) {
      return 'От 10 до 15 цифр, допустим «+» в начале';
    }
    return null;
  },

  displayName: (value) => {
    if (!value.trim()) {return null;}
    if (value.trim().length < 2 || value.trim().length > 30) {
      return 'От 2 до 30 символов';
    }
    return null;
  },

  passwordConfirm: (original) => (value) => {
    if (!value.trim()) {return 'Повторите пароль';}
    if (value !== original) {return 'Пароли не совпадают';}
    return null;
  },
};
