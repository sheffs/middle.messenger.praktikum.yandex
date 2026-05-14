import Block from '../../core/Block';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Validator } from '../../utils/validator';
import { AuthAPI } from '../../api/AuthAPI';
import Store from '../../store/Store';
import Router from '../../core/Router';
import './auth.scss';

const template = `
  <main class="auth-page">
    <div class="auth-page__card">
      <div class="auth-page__header">
        <div class="auth-page__logo" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="16" fill="#4E6AFF"/>
            <path d="M12 16C12 14.9 12.9 14 14 14H34C35.1 14 36 14.9 36 16V28C36 29.1 35.1 30 34 30H26L20 35V30H14C12.9 30 12 29.1 12 28V16Z" fill="white"/>
          </svg>
        </div>
        <h1 class="auth-page__title">Вход</h1>
        <p class="auth-page__subtitle">Войдите в свой аккаунт</p>
      </div>

      <form class="auth-page__form" id="login-form" novalidate>
        {{{ inputLogin }}}
        {{{ inputPassword }}}
        <p class="auth-page__form-error" id="login-error" hidden></p>
        {{{ button }}}
      </form>

      <div class="auth-page__footer">
        <p class="auth-page__footer-text">
          Нет аккаунта?
          <a href="/sign-up" class="auth-page__link" data-link>Зарегистрироваться</a>
        </p>
      </div>
    </div>
  </main>
`;

export class LoginPage extends Block {
  declare private _inputLogin: Input;
  declare private _inputPassword: Input;

  protected init(): void {
    this._inputLogin = new Input({
      name: 'login',
      label: 'Логин',
      type: 'text',
      placeholder: 'Введите логин',
      validate: Validator.login,
    });

    this._inputPassword = new Input({
      name: 'password',
      label: 'Пароль',
      type: 'password',
      placeholder: 'Введите пароль',
      validate: Validator.password,
    });

    const button = new Button({
      label: 'Войти',
      type: 'submit',
      variant: 'primary',
      fullWidth: true,
    });

    Object.assign(this.children, {
      inputLogin: this._inputLogin,
      inputPassword: this._inputPassword,
      button,
    });
  }

  public componentDidMount(): void {
    const form = this.element.querySelector<HTMLFormElement>('#login-form');
    form?.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  private _setError(message: string): void {
    const el = this.element.querySelector<HTMLParagraphElement>('#login-error');
    if (!el) {return;}
    el.textContent = message;
    el.removeAttribute('hidden');
  }

  private _clearError(): void {
    const el = this.element.querySelector<HTMLParagraphElement>('#login-error');
    if (el) {el.setAttribute('hidden', '');}
  }

  private _handleSubmit(): void {
    const isLoginValid = this._inputLogin.validate();
    const isPasswordValid = this._inputPassword.validate();

    if (!isLoginValid || !isPasswordValid) {return;}

    this._clearError();

    const data = {
      login: this._inputLogin.getValue(),
      password: this._inputPassword.getValue(),
    };

    AuthAPI.signin(data)
      .then(() => AuthAPI.getUser())
      .then((user) => {
        Store.getInstance().setState({ user });
        Router.getInstance().navigate('/messenger');
      })
      .catch((err: { reason?: string }) => {
        this._setError(err?.reason ?? 'Неверный логин или пароль');
      });
  }

  protected render(): string {
    return template;
  }
}
