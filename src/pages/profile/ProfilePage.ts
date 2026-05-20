import Block from '../../core/Block';
import { Avatar } from '../../components/Avatar';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Validator } from '../../utils/validator';
import { AuthAPI } from '../../api/AuthAPI';
import { UsersAPI } from '../../api/UsersAPI';
import Store from '../../store/Store';
import Router from '../../core/Router';
import type { User, UpdateProfileData } from '../../types';
import './profile.scss';

const BASE_URL = 'https://ya-praktikum.tech';

function userToFields(user: User): Array<{ name: string; label: string; value: string }> {
  return [
    { name: 'email', label: 'Почта', value: user.email },
    { name: 'login', label: 'Логин', value: user.login },
    { name: 'first_name', label: 'Имя', value: user.first_name },
    { name: 'second_name', label: 'Фамилия', value: user.second_name },
    { name: 'display_name', label: 'Имя в чате', value: user.display_name ?? '' },
    { name: 'phone', label: 'Телефон', value: user.phone },
  ];
}

const template = `
  <div class="profile-page">
    <aside class="profile-page__sidebar">
      <a href="/messenger" class="profile-page__back" data-link aria-label="Назад к чатам">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </aside>

    <div class="profile-page__content">
      <div class="profile-page__avatar-section">
        {{{ avatar }}}
        <h1 class="profile-page__name">{{displayName}}</h1>
      </div>

      <div class="profile-page__card">
        <div class="profile-page__section">
          <h2 class="profile-page__section-title">Данные профиля</h2>
          <dl class="profile-data">
            {{#each fields}}
            <div class="profile-data__row">
              <dt class="profile-data__label">{{label}}</dt>
              <dd class="profile-data__value">{{value}}</dd>
            </div>
            {{/each}}
          </dl>
        </div>
      </div>

      <nav class="profile-page__actions" aria-label="Действия профиля">
        <button class="profile-page__action-link" id="edit-profile-btn" type="button">Изменить данные</button>
        <button class="profile-page__action-link" id="change-password-btn" type="button">Изменить пароль</button>
        <button class="profile-page__action-link profile-page__action-link--danger" id="logout-btn" type="button">Выйти</button>
      </nav>
    </div>
  </div>

  <div class="modal" id="edit-profile-modal" hidden aria-modal="true" role="dialog" aria-labelledby="edit-title">
    <div class="modal__backdrop" id="edit-backdrop"></div>
    <div class="modal__dialog">
      <div class="modal__header">
        <h2 class="modal__title" id="edit-title">Изменить данные</h2>
        <button class="modal__close" id="edit-close" type="button" aria-label="Закрыть">&times;</button>
      </div>
      <form class="modal__form" id="edit-profile-form" novalidate>
        {{{ editEmail }}}
        {{{ editLogin }}}
        {{{ editFirstName }}}
        {{{ editSecondName }}}
        {{{ editDisplayName }}}
        {{{ editPhone }}}
        <p class="form-error" id="edit-error" hidden></p>
        <div class="modal__footer">{{{ editSubmitBtn }}}</div>
      </form>
    </div>
  </div>

  <div class="modal" id="change-password-modal" hidden aria-modal="true" role="dialog" aria-labelledby="pwd-title">
    <div class="modal__backdrop" id="pwd-backdrop"></div>
    <div class="modal__dialog">
      <div class="modal__header">
        <h2 class="modal__title" id="pwd-title">Изменить пароль</h2>
        <button class="modal__close" id="pwd-close" type="button" aria-label="Закрыть">&times;</button>
      </div>
      <form class="modal__form" id="change-password-form" novalidate>
        {{{ pwdOld }}}
        {{{ pwdNew }}}
        {{{ pwdConfirm }}}
        <p class="form-error" id="pwd-error" hidden></p>
        <div class="modal__footer">{{{ pwdSubmitBtn }}}</div>
      </form>
    </div>
  </div>
`;

export class ProfilePage extends Block {
  private _editInputs!: Record<string, Input>;
  private _pwdOld!: Input;
  private _pwdNew!: Input;
  private _pwdConfirm!: Input;

  protected init(): void {
    const user = Store.getInstance().getState().user;
    const avatarSrc = user?.avatar ? `${BASE_URL}/api/v2/resources${user.avatar}` : undefined;

    const avatar = new Avatar({
      initials: user ? `${user.first_name[0]}${user.second_name[0]}`.toUpperCase() : 'ИИ',
      src: avatarSrc,
      size: 'xl',
      editable: true,
      events: {
        click: (): void => this._handleAvatarChange(),
      },
    });

    const editEmail = new Input({ name: 'email', label: 'Почта', type: 'email', value: user?.email, validate: Validator.email });
    const editLogin = new Input({ name: 'login', label: 'Логин', value: user?.login, validate: Validator.login });
    const editFirstName = new Input({ name: 'first_name', label: 'Имя', value: user?.first_name, validate: Validator.name });
    const editSecondName = new Input({ name: 'second_name', label: 'Фамилия', value: user?.second_name, validate: Validator.name });
    const editDisplayName = new Input({ name: 'display_name', label: 'Имя в чате', value: user?.display_name ?? '', validate: Validator.displayName });
    const editPhone = new Input({ name: 'phone', label: 'Телефон', type: 'tel', value: user?.phone, validate: Validator.phone });
    const editSubmitBtn = new Button({ label: 'Сохранить', type: 'submit', variant: 'primary', fullWidth: true });

    this._pwdOld = new Input({ name: 'oldPassword', label: 'Старый пароль', type: 'password', validate: Validator.password });
    this._pwdNew = new Input({ name: 'newPassword', label: 'Новый пароль', type: 'password', validate: Validator.password });
    // Замыкание на _pwdNew — читает актуальное значение в момент валидации
    this._pwdConfirm = new Input({
      name: 'newPasswordConfirm',
      label: 'Повторите пароль',
      type: 'password',
      validate: (value: string): string | null => Validator.passwordConfirm(this._pwdNew.getValue())(value),
    });
    const pwdSubmitBtn = new Button({ label: 'Сохранить', type: 'submit', variant: 'primary', fullWidth: true });

    this._editInputs = { editEmail, editLogin, editFirstName, editSecondName, editDisplayName, editPhone };

    Object.assign(this.children, {
      avatar,
      ...this._editInputs,
      editSubmitBtn,
      pwdOld: this._pwdOld,
      pwdNew: this._pwdNew,
      pwdConfirm: this._pwdConfirm,
      pwdSubmitBtn,
    });
  }

  protected render(): string {
    const user = Store.getInstance().getState().user;
    return this.compile(template, {
      displayName: user ? `${user.first_name} ${user.second_name}` : '',
      fields: user ? userToFields(user) : [],
    });
  }

  public componentDidMount(): void {
    this._bindModalTriggers();
    this._bindEditForm();
    this._bindPasswordForm();
    this._bindLogout();
  }

  private _handleAvatarChange(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) {return;}
      const formData = new FormData();
      formData.append('avatar', file);
      UsersAPI.updateAvatar(formData)
        .then((user) => {
          Store.getInstance().setState({ user });
        })
        .catch(() => {/* silent */});
    });
    fileInput.click();
  }

  private _bindModalTriggers(): void {
    const editModal = this.element.querySelector<HTMLElement>('#edit-profile-modal');
    const pwdModal = this.element.querySelector<HTMLElement>('#change-password-modal');

    this.element.querySelector('#edit-profile-btn')?.addEventListener('click', () => {
      editModal?.removeAttribute('hidden');
    });
    this.element.querySelector('#change-password-btn')?.addEventListener('click', () => {
      pwdModal?.removeAttribute('hidden');
    });

    this._bindModalClose('#edit-close', '#edit-backdrop', editModal);
    this._bindModalClose('#pwd-close', '#pwd-backdrop', pwdModal);
  }

  private _bindModalClose(closeId: string, backdropId: string, modal: HTMLElement | null): void {
    const close = (): void => { modal?.setAttribute('hidden', ''); };
    this.element.querySelector(closeId)?.addEventListener('click', close);
    this.element.querySelector(backdropId)?.addEventListener('click', close);
  }

  private _bindEditForm(): void {
    const form = this.element.querySelector<HTMLFormElement>('#edit-profile-form');
    form?.addEventListener('submit', (e: Event) => {
      e.preventDefault();

      const isValid = Object.values(this._editInputs).map((i) => i.validate()).every(Boolean);
      if (!isValid) {return;}

      const data: UpdateProfileData = {
        email: this._editInputs.editEmail.getValue(),
        login: this._editInputs.editLogin.getValue(),
        first_name: this._editInputs.editFirstName.getValue(),
        second_name: this._editInputs.editSecondName.getValue(),
        display_name: this._editInputs.editDisplayName.getValue(),
        phone: this._editInputs.editPhone.getValue(),
      };

      // eslint-disable-next-line no-console
      console.log('Profile form data:', data);

      UsersAPI.updateProfile(data)
        .then((user) => {
          Store.getInstance().setState({ user });
          this.element.querySelector<HTMLElement>('#edit-profile-modal')?.setAttribute('hidden', '');
        })
        .catch((err: { reason?: string }) => {
          const el = this.element.querySelector('#edit-error');
          if (el) {
            el.textContent = err?.reason ?? 'Ошибка обновления данных';
            el.removeAttribute('hidden');
          }
        });
    });
  }

  private _bindPasswordForm(): void {
    const form = this.element.querySelector<HTMLFormElement>('#change-password-form');
    form?.addEventListener('submit', (e: Event) => {
      e.preventDefault();

      const isValid = [this._pwdOld, this._pwdNew, this._pwdConfirm].map((i) => i.validate()).every(Boolean);
      if (!isValid) {return;}

      const pwdData = {
        oldPassword: this._pwdOld.getValue(),
        newPassword: this._pwdNew.getValue(),
      };

      // eslint-disable-next-line no-console
      console.log('Password form data:', pwdData);

      UsersAPI.updatePassword(pwdData)
        .then(() => {
          this.element.querySelector<HTMLElement>('#change-password-modal')?.setAttribute('hidden', '');
        })
        .catch((err: { reason?: string }) => {
          const el = this.element.querySelector('#pwd-error');
          if (el) {
            el.textContent = err?.reason ?? 'Ошибка смены пароля';
            el.removeAttribute('hidden');
          }
        });
    });
  }

  private _bindLogout(): void {
    this.element.querySelector('#logout-btn')?.addEventListener('click', () => {
      AuthAPI.logout()
        .then(() => {
          Store.getInstance().setState({ user: null, chats: [], activeChat: null });
          Router.getInstance().navigate('/');
        })
        .catch(() => {/* silent */});
    });
  }
}
