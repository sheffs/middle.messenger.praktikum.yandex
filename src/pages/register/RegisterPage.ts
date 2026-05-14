import Block from '../../core/Block';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Validator } from '../../utils/validator';
import { AuthAPI } from '../../api/AuthAPI';
import Store from '../../store/Store';
import Router from '../../core/Router';
import '../auth/auth.scss';

const template = `
  <main class="auth-page auth-page--register">
    <div class="auth-page__card auth-page__card--wide">
      <div class="auth-page__header">
        <div class="auth-page__logo" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="16" fill="#4E6AFF"/>
            <path d="M12 16C12 14.9 12.9 14 14 14H34C35.1 14 36 14.9 36 16V28C36 29.1 35.1 30 34 30H26L20 35V30H14C12.9 30 12 29.1 12 28V16Z" fill="white"/>
          </svg>
        </div>
        <h1 class="auth-page__title">Регистрация</h1>
        <p class="auth-page__subtitle">Создайте новый аккаунт</p>
      </div>

      <form class="auth-page__form" id="register-form" novalidate>
        <div class="auth-page__form-row">
          {{{ inputFirstName }}}
          {{{ inputSecondName }}}
        </div>
        {{{ inputLogin }}}
        {{{ inputEmail }}}
        {{{ inputPhone }}}
        {{{ inputPassword }}}
        {{{ inputPasswordConfirm }}}
        <p class="auth-page__form-error" id="register-error" hidden></p>
        {{{ button }}}
      </form>

      <div class="auth-page__footer">
        <p class="auth-page__footer-text">
          Уже есть аккаунт?
          <a href="/" class="auth-page__link" data-link>Войти</a>
        </p>
      </div>
    </div>
  </main>
`;

export class RegisterPage extends Block {
  declare private _inputs: Record<string, Input>;

  protected init(): void {
    const inputFirstName = new Input({ name: 'first_name', label: 'Имя', placeholder: 'Иван', validate: Validator.name });
    const inputSecondName = new Input({ name: 'second_name', label: 'Фамилия', placeholder: 'Иванов', validate: Validator.name });
    const inputLogin = new Input({ name: 'login', label: 'Логин', placeholder: 'ivanivanov', validate: Validator.login });
    const inputEmail = new Input({ name: 'email', label: 'Почта', type: 'email', placeholder: 'pochta@yandex.ru', validate: Validator.email });
    const inputPhone = new Input({ name: 'phone', label: 'Телефон', type: 'tel', placeholder: '+79991234567', validate: Validator.phone });
    const inputPassword = new Input({ name: 'password', label: 'Пароль', type: 'password', placeholder: 'Не менее 8 символов', validate: Validator.password });
    // Валидируем через замыкание: читаем текущее значение inputPassword в момент вызова
    const inputPasswordConfirm = new Input({
      name: 'password_confirm',
      label: 'Пароль ещё раз',
      type: 'password',
      placeholder: 'Повторите пароль',
      validate: (value: string): string | null => Validator.passwordConfirm(inputPassword.getValue())(value),
    });
    const button = new Button({ label: 'Зарегистрироваться', type: 'submit', variant: 'primary', fullWidth: true });

    this._inputs = { inputFirstName, inputSecondName, inputLogin, inputEmail, inputPhone, inputPassword, inputPasswordConfirm };
    Object.assign(this.children, { ...this._inputs, button });
  }

  public componentDidMount(): void {
    const form = this.element.querySelector<HTMLFormElement>('#register-form');
    form?.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  private _setError(message: string): void {
    const el = this.element.querySelector<HTMLParagraphElement>('#register-error');
    if (!el) {return;}
    el.textContent = message;
    el.removeAttribute('hidden');
  }

  private _handleSubmit(): void {
    const allInputs = Object.values(this._inputs);
    const isValid = allInputs.map((input) => input.validate()).every(Boolean);

    if (!isValid) {return;}

    const { inputFirstName, inputSecondName, inputLogin, inputEmail, inputPhone, inputPassword } = this._inputs;

    AuthAPI.signup({
      first_name: inputFirstName.getValue(),
      second_name: inputSecondName.getValue(),
      login: inputLogin.getValue(),
      email: inputEmail.getValue(),
      phone: inputPhone.getValue(),
      password: inputPassword.getValue(),
    })
      .then(() => AuthAPI.getUser())
      .then((user) => {
        Store.getInstance().setState({ user });
        Router.getInstance().navigate('/messenger');
      })
      .catch((err: { reason?: string }) => {
        this._setError(err?.reason ?? 'Ошибка регистрации');
      });
  }

  protected render(): string {
    return template;
  }
}
