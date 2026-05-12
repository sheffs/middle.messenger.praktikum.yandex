import Block from '../../core/Block';
import { Avatar } from '../../components/Avatar';
import { ChatsAPI } from '../../api/ChatsAPI';
import { LocalMessagesService } from '../../services/LocalMessagesService';
import { getAllKnownUsers, getUserById } from '../../services/stubUsers';
import Store from '../../store/Store';
import Router from '../../core/Router';
import type { Chat, User } from '../../types';
import type { ChatMessage } from '../../core/WebSocketTransport';
import './chat.scss';

// ─── Утилиты ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatTime(iso: string | undefined): string {
  if (!iso) { return ''; }
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) { return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
  return ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()] ?? '';
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function avatarInner(avatar: string | null, title: string): string {
  return avatar
    ? `<img class="avatar__img" src="${escapeHtml(avatar)}" alt="Аватар" />`
    : `<span class="avatar__initials">${escapeHtml(getInitials(title))}</span>`;
}

/** Экранирует текст и оборачивает совпадение с запросом в <mark> */
function highlightText(text: string, query: string): string {
  if (!query) {
    return escapeHtml(text);
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) {
    return escapeHtml(text);
  }
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + query.length));
  const after = escapeHtml(text.slice(idx + query.length));
  return `${before}<mark class="search-highlight">${match}</mark>${after}`;
}

// ─── Шаблоны HTML ────────────────────────────────────────────────────────────

function chatItemHTML(chat: Chat, isActive: boolean): string {
  const label = chat.is_group ? `👥 ${escapeHtml(chat.title)}` : escapeHtml(chat.title);
  return `
    <li class="chat-item${isActive ? ' chat-item--active' : ''}" data-chat-id="${chat.id}" role="button" tabindex="0">
      <div class="avatar avatar--md">${avatarInner(chat.avatar, chat.title)}</div>
      <div class="chat-item__content">
        <div class="chat-item__top">
          <span class="chat-item__name">${label}</span>
          <span class="chat-item__time">${escapeHtml(formatTime(chat.last_message?.time))}</span>
        </div>
        <div class="chat-item__bottom">
          <span class="chat-item__message">${escapeHtml(chat.last_message?.content ?? '')}</span>
          ${chat.unread_count > 0 ? `<span class="chat-item__badge">${chat.unread_count}</span>` : ''}
        </div>
      </div>
    </li>`;
}

function messageHTML(msg: ChatMessage, meId: number): string {
  const isOwn = msg.user_id === meId;
  const direction = isOwn ? 'outgoing' : 'incoming';
  let attachHtml = '';

  if (msg.attachment) {
    const { kind, src, name } = msg.attachment;
    if (kind === 'image') {
      // Открываем в лайтбоксе, не в новой вкладке
      attachHtml = `<button class="message__attachment message__img-btn" data-src="${escapeHtml(src)}" aria-label="Открыть изображение">
        <img class="message__img" src="${escapeHtml(src)}" alt="${escapeHtml(name)}" />
      </button>`;
    } else {
      attachHtml = `<div class="message__attachment message__attachment--video">
        <video class="message__video" src="${escapeHtml(src)}" controls></video>
        <span class="message__filename">${escapeHtml(name)}</span>
      </div>`;
    }
  }

  const textHtml = msg.content ? `<p class="message__text">${escapeHtml(msg.content)}</p>` : '';
  return `
    <div class="message message--${direction}" data-msg-id="${msg.id}">
      <div class="message__bubble">
        ${attachHtml}${textHtml}
        <div class="message__meta"><span class="message__time">${escapeHtml(formatTime(msg.time))}</span></div>
      </div>
    </div>`;
}

function searchMsgItemHTML(chat: Chat, msg: ChatMessage, query: string): string {
  const preview = highlightText(
    msg.content.length > 80 ? `${msg.content.slice(0, 80)}…` : msg.content,
    query,
  );
  return `
    <li class="chat-item search-result" data-chat-id="${chat.id}" data-msg-id="${msg.id}"
        role="button" tabindex="0">
      <div class="avatar avatar--md">${avatarInner(chat.avatar, chat.title)}</div>
      <div class="chat-item__content">
        <div class="chat-item__top">
          <span class="chat-item__name">${escapeHtml(chat.title)}</span>
          <span class="chat-item__time">${escapeHtml(formatTime(msg.time))}</span>
        </div>
        <div class="chat-item__bottom">
          <span class="chat-item__message">${preview}</span>
        </div>
      </div>
    </li>`;
}

function memberItemHTML(user: User, canRemove: boolean): string {
  const name = escapeHtml(user.display_name ?? `${user.first_name} ${user.second_name}`);
  const initials = escapeHtml(getInitials(`${user.first_name} ${user.second_name}`));
  return `
    <div class="member-item" data-user-id="${user.id}">
      <div class="avatar avatar--sm">${avatarInner(user.avatar, `${user.first_name} ${user.second_name}`)}<span class="avatar__initials">${initials}</span></div>
      <div class="member-item__info">
        <span class="member-item__name">${name}</span>
        <span class="member-item__login">@${escapeHtml(user.login)}</span>
      </div>
      ${canRemove ? `<button class="member-item__remove" data-user-id="${user.id}" type="button" aria-label="Удалить из чата">×</button>` : ''}
    </div>`;
}

// ─── Главный шаблон страницы ─────────────────────────────────────────────────

const template = `
  <div class="chat-page">
    <aside class="chat-page__sidebar">
      <div class="chat-page__sidebar-header">
        {{{ profileAvatar }}}
        <div class="chat-page__search">
          <svg class="chat-page__search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M15 15L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input class="chat-page__search-input" type="text" placeholder="Поиск"
                 id="chat-search" aria-label="Поиск по названию чата"/>
        </div>
        <button class="chat-page__new-chat-btn" id="new-chat-btn" type="button" aria-label="Создать чат">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <nav aria-label="Список чатов">
        <ul class="chat-page__chat-list" id="chat-list">
          <li class="chat-page__loading">Загрузка...</li>
        </ul>
      </nav>
    </aside>

    <main class="chat-page__main" id="chat-main">
      <div class="chat-page__empty">
        <div class="chat-page__empty-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M10 14C10 11.79 11.79 10 14 10H50C52.21 10 54 11.79 54 14V40C54 42.21 52.21 44 50 44H38L30 52V44H14C11.79 44 10 42.21 10 40V14Z"
                  stroke="#4E6AFF" stroke-width="2" fill="none" opacity="0.6"/>
            <circle cx="22" cy="27" r="2.5" fill="#4E6AFF" opacity="0.6"/>
            <circle cx="32" cy="27" r="2.5" fill="#4E6AFF" opacity="0.6"/>
            <circle cx="42" cy="27" r="2.5" fill="#4E6AFF" opacity="0.6"/>
          </svg>
        </div>
        <p class="chat-page__empty-text">Выберите чат</p>
        <p class="chat-page__empty-hint">или создайте новый</p>
      </div>
    </main>
  </div>

  <div class="modal" id="new-chat-modal" hidden>
    <div class="modal__backdrop" id="new-chat-backdrop"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
      <div class="modal__header">
        <h2 class="modal__title" id="new-chat-title">Создать чат</h2>
        <button class="modal__close" id="new-chat-close" type="button" aria-label="Закрыть">&times;</button>
      </div>
      <form class="modal__form" id="new-chat-form" novalidate>
        <div class="input-field">
          <label class="input-field__label" for="chat-title">Название</label>
          <input class="input-field__input" id="chat-title" name="title" type="text" placeholder="Название чата" required/>
          <span class="input-field__error-text" id="chat-title-error"></span>
        </div>
        <label class="chat-page__group-label">
          <input type="checkbox" id="is-group-check" name="is_group" /> Групповой чат
        </label>
        <div class="modal__footer">
          <button class="button button--primary button--full" type="submit">Создать</button>
        </div>
      </form>
    </div>
  </div>

  <div class="lightbox" id="lightbox" hidden>
    <div class="lightbox__backdrop" id="lightbox-backdrop"></div>
    <button class="lightbox__close" id="lightbox-close" type="button" aria-label="Закрыть">&times;</button>
    <img class="lightbox__img" id="lightbox-img" src="" alt="Изображение" />
  </div>
`;

// ─── Компонент ───────────────────────────────────────────────────────────────

export class ChatPage extends Block {
  private _pendingAttachment: { src: string; name: string; kind: 'image' | 'video' } | null = null;

  protected init(): void {
    const user = Store.getInstance().getState().user;
    const profileAvatar = new Avatar({
      initials: user ? `${user.first_name[0]}${user.second_name[0]}`.toUpperCase() : '??',
      src: user?.avatar ?? undefined,
      size: 'sm',
      clickable: true,
      events: { click: (): void => Router.getInstance().navigate('/profile') },
    });
    Object.assign(this.children, { profileAvatar });
  }

  public componentDidMount(): void {
    this.loadChats();
    this.bindNewChat();
    this.bindSearch();
    this.bindLightbox();
  }

  // ─── Список чатов ────────────────────────────────────────────────

  private loadChats(): void {
    ChatsAPI.getChats()
      .then((chats) => {
        Store.getInstance().setState({ chats });
        this.renderChatList(chats);
      })
      .catch(() => {
        const el = this.element.querySelector('#chat-list');
        if (el) { el.textContent = 'Не удалось загрузить чаты'; }
      });
  }

  private renderChatList(chats: Chat[]): void {
    const list = this.element.querySelector('#chat-list');
    if (!list) { return; }

    if (chats.length === 0) {
      list.innerHTML = '<li class="chat-page__loading">Нет чатов — создайте первый!</li>';
      return;
    }

    const activeId = Store.getInstance().getState().activeChat;
    list.innerHTML = chats.map((c) => chatItemHTML(c, c.id === activeId)).join('');
    list.querySelectorAll('.chat-item').forEach((item) => {
      item.addEventListener('click', () => this.openChat(Number((item as HTMLElement).dataset.chatId)));
    });
  }

  // ─── Открытие чата ───────────────────────────────────────────────

  private openChat(chatId: number): void {
    const chat = Store.getInstance().getState().chats.find((c) => c.id === chatId);
    if (!chat) { return; }

    Store.getInstance().setState({ activeChat: chatId });
    this.element.querySelectorAll('.chat-item').forEach((el) => {
      el.classList.toggle('chat-item--active', Number((el as HTMLElement).dataset.chatId) === chatId);
    });

    const main = this.element.querySelector('#chat-main');
    if (!main) { return; }

    main.innerHTML = this.buildActiveChatHTML(chat);
    this._pendingAttachment = null;

    this.renderMessages(chatId);
    this.bindSendMessage(chatId);
    this.bindDeleteChat(chatId);
    this.bindAttachButton();
    this.bindChatAvatarChange(chatId);
    this.bindInfoPanel(chatId);
  }

  private buildActiveChatHTML(chat: Chat): string {
    const typeLabel = chat.is_group
      ? `👥 Группа · ${(chat.members?.length ?? 0)} уч.`
      : 'Личный чат';

    return `
      <div class="chat-page__conversation">
        <header class="chat-page__chat-header">
          <div class="chat-page__chat-avatar-wrap">
            <div class="avatar avatar--sm" id="chat-avatar-el">${avatarInner(chat.avatar, chat.title)}</div>
            <button class="chat-page__avatar-change" id="change-chat-avatar-btn" type="button" aria-label="Сменить аватар">
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <button class="chat-page__chat-info-btn" id="toggle-info-btn" type="button" aria-expanded="false" aria-controls="info-panel">
            <span class="chat-page__chat-name">${escapeHtml(chat.title)}</span>
            <span class="chat-page__chat-subtitle">${typeLabel}</span>
          </button>
          <div class="chat-page__chat-actions">
            <button class="chat-page__action-btn chat-page__action-btn--danger" id="delete-chat-btn" type="button" aria-label="Удалить чат">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
                <path d="M3 6H5H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6L18.13 19.14C18.06 20.19 17.19 21 16.14 21H7.86C6.81 21 5.94 20.19 5.87 19.14L5 6H19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="chat-page__messages" id="messages-container" role="log" aria-live="polite"></div>

        <div class="chat-page__input-area">
          <button class="chat-page__input-btn" id="attach-btn" type="button" aria-label="Прикрепить файл">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
              <path d="M21.44 11.05L12.25 20.24C11.12 21.37 9.6 22 8 22C6.4 22 4.88 21.37 3.76 20.24C2.63 19.11 2 17.6 2 16C2 14.4 2.63 12.88 3.76 11.75L12.33 3.18C13.08 2.43 14.1 2 15.16 2C16.22 2 17.24 2.43 17.99 3.18C18.74 3.93 19.16 4.95 19.16 6.01C19.16 7.07 18.74 8.09 17.99 8.84L9.41 17.41C9.03 17.79 8.53 18 8 18C7.46 18 6.96 17.79 6.58 17.41C6.2 17.03 5.99 16.53 5.99 16C5.99 15.46 6.2 14.96 6.58 14.58L15.07 6.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="chat-page__input-wrap">
            <div class="chat-page__attach-preview" id="attach-preview" hidden></div>
            <textarea class="chat-page__message-input" id="message-input" name="message" placeholder="Сообщение..." rows="1" aria-label="Введите сообщение"></textarea>
          </div>
          <button class="chat-page__send-btn" id="send-btn" type="button" aria-label="Отправить">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <aside class="chat-page__info-panel" id="info-panel" aria-label="Информация о чате" hidden>
        <div class="info-panel__content" id="info-panel-content"></div>
      </aside>`;
  }

  // ─── Панель информации ───────────────────────────────────────────

  private bindInfoPanel(chatId: number): void {
    const toggleBtn = this.element.querySelector('#toggle-info-btn');
    toggleBtn?.addEventListener('click', () => {
      const panel = this.element.querySelector<HTMLElement>('#info-panel');
      if (!panel) { return; }
      const isOpen = !panel.hasAttribute('hidden');
      if (isOpen) {
        panel.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        panel.removeAttribute('hidden');
        toggleBtn.setAttribute('aria-expanded', 'true');
        this.renderInfoPanel(chatId);
      }
    });
  }

  private renderInfoPanel(chatId: number): void {
    const content = this.element.querySelector('#info-panel-content');
    if (!content) { return; }

    const chat = Store.getInstance().getState().chats.find((c) => c.id === chatId);
    if (!chat) { return; }

    const meId = Store.getInstance().getState().user?.id ?? 0;
    const memberIds = ChatsAPI.getMembers(chatId);
    const members = memberIds.map((id) => getUserById(id)).filter((u): u is User => u !== undefined);

    const membersHTML = members.map((u) => memberItemHTML(u, u.id !== meId)).join('');

    const avatarHtml = avatarInner(chat.avatar, chat.title);

    content.innerHTML = `
      <div class="info-panel__header">
        <div class="avatar avatar--lg info-panel__avatar">${avatarHtml}</div>
        <h3 class="info-panel__title">${escapeHtml(chat.title)}</h3>
        <p class="info-panel__subtitle">${chat.is_group ? `Группа · ${members.length} участн.` : 'Личный чат'}</p>
      </div>

      <div class="info-panel__section">
        <h4 class="info-panel__section-title">Участники</h4>
        <div class="info-panel__members" id="members-list">
          ${membersHTML}
        </div>
      </div>

      ${chat.is_group ? `
      <div class="info-panel__section">
        <h4 class="info-panel__section-title">Добавить участника</h4>
        <div class="input-field">
          <input class="input-field__input" id="user-search-input" type="text"
                 placeholder="Имя или логин..." aria-label="Поиск пользователя"/>
        </div>
        <ul class="info-panel__search-results" id="user-search-results"></ul>
      </div>` : ''}
    `;

    this.bindMemberRemove(chatId);
    if (chat.is_group) {
      this.bindUserSearch(chatId, meId);
    }
  }

  private bindMemberRemove(chatId: number): void {
    this.element.querySelectorAll('.member-item__remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const userId = Number((btn as HTMLElement).dataset.userId);
        ChatsAPI.removeMember(chatId, userId);

        const chats = Store.getInstance().getState().chats.map((c): Chat => {
          if (c.id !== chatId) { return c; }
          return { ...c, members: (c.members ?? []).filter((id) => id !== userId) };
        });
        Store.getInstance().setState({ chats });
        this.renderChatList(chats);
        this.renderInfoPanel(chatId);
      });
    });
  }

  private bindUserSearch(chatId: number, meId: number): void {
    const input = this.element.querySelector<HTMLInputElement>('#user-search-input');
    const results = this.element.querySelector('#user-search-results');
    if (!input || !results) { return; }

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      if (!query) { results.innerHTML = ''; return; }

      const currentMembers = ChatsAPI.getMembers(chatId);
      const found = getAllKnownUsers(meId).filter((u) => {
        const inChat = currentMembers.includes(u.id);
        const fullName = `${u.first_name} ${u.second_name} ${u.login}`.toLowerCase();
        return !inChat && fullName.includes(query);
      }).slice(0, 5);

      if (found.length === 0) {
        results.innerHTML = '<li class="info-panel__no-results">Не найдено</li>';
        return;
      }

      results.innerHTML = found.map((u) => {
        const name = escapeHtml(u.display_name ?? `${u.first_name} ${u.second_name}`);
        return `<li class="info-panel__search-item" data-user-id="${u.id}">
          <span>${name} <span class="info-panel__login">@${escapeHtml(u.login)}</span></span>
          <button class="info-panel__add-btn" type="button" data-user-id="${u.id}">+ Добавить</button>
        </li>`;
      }).join('');

      results.querySelectorAll('.info-panel__add-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const userId = Number((btn as HTMLElement).dataset.userId);
          ChatsAPI.addMember(chatId, userId);

          const chats = Store.getInstance().getState().chats.map((c): Chat => {
            if (c.id !== chatId) { return c; }
            return { ...c, members: [...(c.members ?? []), userId] };
          });
          Store.getInstance().setState({ chats });
          this.renderChatList(chats);

          input.value = '';
          results.innerHTML = '';
          this.renderInfoPanel(chatId);
        });
      });
    });
  }

  // ─── Сообщения ───────────────────────────────────────────────────

  private renderMessages(chatId: number): void {
    const container = this.element.querySelector('#messages-container');
    if (!container) { return; }
    const user = Store.getInstance().getState().user;
    if (!user) { return; }

    const msgs = LocalMessagesService.getMessages(chatId);
    container.innerHTML = msgs.map((m) => messageHTML(m, user.id)).join('');
    container.scrollTop = container.scrollHeight;
  }

  private bindSendMessage(chatId: number): void {
    const sendBtn = this.element.querySelector('#send-btn');
    const textarea = this.element.querySelector<HTMLTextAreaElement>('#message-input');

    const send = (): void => {
      const text = textarea?.value.trim() ?? '';
      if (!text && !this._pendingAttachment) { return; }

      const user = Store.getInstance().getState().user;
      if (!user) { return; }

      const msg = LocalMessagesService.addMessage(chatId, text, user.id, this._pendingAttachment ?? undefined);
      const preview = text || (this._pendingAttachment?.kind === 'video' ? '[видео]' : '[фото]');
      ChatsAPI.updateLastMessage(chatId, preview, user);

      this._pendingAttachment = null;
      this.clearAttachPreview();

      const container = this.element.querySelector('#messages-container');
      if (container) {
        container.insertAdjacentHTML('beforeend', messageHTML(msg, user.id));
        container.scrollTop = container.scrollHeight;
      }

      const chats = Store.getInstance().getState().chats.map((c): Chat =>
        c.id === chatId ? { ...c, last_message: { user, time: msg.time, content: preview } } : c,
      );
      Store.getInstance().setState({ chats });
      this.renderChatList(chats);

      if (textarea) { textarea.value = ''; }
    };

    sendBtn?.addEventListener('click', send);
    textarea?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  // ─── Вложения ────────────────────────────────────────────────────

  private bindAttachButton(): void {
    const btn = this.element.querySelector('#attach-btn');
    if (!btn) { return; }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';

    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) { return; }

      LocalMessagesService.fileToAttachment(file)
        .then((att) => {
          this._pendingAttachment = att;
          this.showAttachPreview(att);
        })
        .catch((err: Error) => alert(err.message));

      fileInput.value = '';
    });
  }

  private showAttachPreview(att: { kind: string; src: string; name: string }): void {
    const preview = this.element.querySelector<HTMLElement>('#attach-preview');
    if (!preview) { return; }

    const thumb = att.kind === 'image'
      ? `<img class="attach-preview__img" src="${escapeHtml(att.src)}" alt="preview" />`
      : `<svg viewBox="0 0 24 24" fill="none" width="32" height="32"><path d="M15 10L19.55 7.72C20.22 7.39 21 7.87 21 8.62V15.38C21 16.13 20.22 16.61 19.55 16.28L15 14M5 8H13C14.1 8 15 8.9 15 10V14C15 15.1 14.1 16 13 16H5C3.9 16 3 15.1 3 14V10C3 8.9 3.9 8 5 8Z" stroke="#4E6AFF" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    preview.innerHTML = `
      <div class="attach-preview__inner">
        ${thumb}
        <span class="attach-preview__name">${escapeHtml(att.name)}</span>
        <button class="attach-preview__remove" id="remove-attach" type="button" aria-label="Отменить">&times;</button>
      </div>`;
    preview.removeAttribute('hidden');

    preview.querySelector('#remove-attach')?.addEventListener('click', () => {
      this._pendingAttachment = null;
      this.clearAttachPreview();
    });
  }

  private clearAttachPreview(): void {
    const preview = this.element.querySelector<HTMLElement>('#attach-preview');
    if (preview) { preview.innerHTML = ''; preview.setAttribute('hidden', ''); }
  }

  // ─── Лайтбокс для изображений ───────────────────────────────────

  private bindLightbox(): void {
    const lightbox = this.element.querySelector<HTMLElement>('#lightbox');
    const lightboxImg = this.element.querySelector<HTMLImageElement>('#lightbox-img');
    const close = (): void => { lightbox?.setAttribute('hidden', ''); };

    this.element.querySelector('#lightbox-close')?.addEventListener('click', close);
    this.element.querySelector('#lightbox-backdrop')?.addEventListener('click', close);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox && !lightbox.hasAttribute('hidden')) { close(); }
    });

    // Делегирование — ловим клики на кнопках с data-src
    this.element.addEventListener('click', (e: MouseEvent) => {
      const btn = (e.target as Element).closest<HTMLElement>('.message__img-btn');
      if (!btn || !lightbox || !lightboxImg) { return; }
      const src = btn.dataset.src;
      if (!src) { return; }
      lightboxImg.src = src;
      lightbox.removeAttribute('hidden');
    });
  }

  // ─── Аватар чата ────────────────────────────────────────────────

  private bindChatAvatarChange(chatId: number): void {
    const btn = this.element.querySelector('#change-chat-avatar-btn');
    if (!btn) { return; }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) { return; }

      LocalMessagesService.fileToAttachment(file)
        .then((att) => {
          ChatsAPI.updateChatAvatar(chatId, att.src);
          const chats = Store.getInstance().getState().chats.map((c): Chat =>
            c.id === chatId ? { ...c, avatar: att.src } : c,
          );
          Store.getInstance().setState({ chats });
          this.renderChatList(chats);

          const el = this.element.querySelector('#chat-avatar-el');
          if (el) { el.innerHTML = `<img class="avatar__img" src="${escapeHtml(att.src)}" alt="Аватар чата" />`; }
        })
        .catch((err: Error) => alert(err.message));

      fileInput.value = '';
    });
  }

  // ─── Удаление чата ──────────────────────────────────────────────

  private bindDeleteChat(chatId: number): void {
    this.element.querySelector('#delete-chat-btn')?.addEventListener('click', () => {
      if (!confirm('Удалить чат?')) { return; }
      ChatsAPI.deleteChat(chatId)
        .then(() => {
          const chats = Store.getInstance().getState().chats.filter((c) => c.id !== chatId);
          Store.getInstance().setState({ chats, activeChat: null });
          this.renderChatList(chats);

          const main = this.element.querySelector('#chat-main');
          if (main) {
            main.innerHTML = '<div class="chat-page__empty"><p class="chat-page__empty-text">Выберите чат</p></div>';
          }
        })
        .catch(() => { /* тихо */ });
    });
  }

  // ─── Создание чата ──────────────────────────────────────────────

  private bindNewChat(): void {
    const modal = this.element.querySelector<HTMLElement>('#new-chat-modal');
    const close = (): void => { modal?.setAttribute('hidden', ''); };

    this.element.querySelector('#new-chat-btn')?.addEventListener('click', () => modal?.removeAttribute('hidden'));
    this.element.querySelector('#new-chat-close')?.addEventListener('click', close);
    this.element.querySelector('#new-chat-backdrop')?.addEventListener('click', close);

    this.element.querySelector<HTMLFormElement>('#new-chat-form')
      ?.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const titleInput = this.element.querySelector<HTMLInputElement>('#chat-title');
        const isGroupCheck = this.element.querySelector<HTMLInputElement>('#is-group-check');
        const errorEl = this.element.querySelector('#chat-title-error');
        const title = titleInput?.value.trim() ?? '';

        if (!title) {
          if (errorEl) { errorEl.textContent = 'Введите название'; }
          return;
        }

        const meId = Store.getInstance().getState().user?.id;
        const members = meId ? [meId] : [];

        ChatsAPI.createChat({ title, isGroup: isGroupCheck?.checked, members })
          .then(() => ChatsAPI.getChats())
          .then((chats) => {
            Store.getInstance().setState({ chats });
            this.renderChatList(chats);
            close();
            if (titleInput) { titleInput.value = ''; }
          })
          .catch(() => {
            if (errorEl) { errorEl.textContent = 'Не удалось создать чат'; }
          });
      });
  }

  // ─── Поиск по всем чатам и сообщениям ──────────────────────────

  private bindSearch(): void {
    const input = this.element.querySelector<HTMLInputElement>('#chat-search');
    input?.addEventListener('input', () => {
      const q = input.value.trim();
      if (!q) {
        this.renderChatList(Store.getInstance().getState().chats);
        return;
      }
      this.performSearch(q);
    });
  }

  private performSearch(rawQuery: string): void {
    const query = rawQuery.toLowerCase();
    const chats = Store.getInstance().getState().chats;

    const chatMatches = chats.filter((c) => c.title.toLowerCase().includes(query));

    const msgResults: Array<{ chat: Chat; message: ChatMessage }> = [];
    for (const chat of chats) {
      for (const msg of LocalMessagesService.getMessages(chat.id)) {
        if (msg.content.toLowerCase().includes(query)) {
          msgResults.push({ chat, message: msg });
        }
      }
    }

    this.renderSearchResults(rawQuery, chatMatches, msgResults);
  }

  private renderSearchResults(
    query: string,
    chatMatches: Chat[],
    msgResults: Array<{ chat: Chat; message: ChatMessage }>,
  ): void {
    const list = this.element.querySelector('#chat-list');
    if (!list) {
      return;
    }

    const activeId = Store.getInstance().getState().activeChat;
    let html = '';

    if (chatMatches.length > 0) {
      html += '<li class="search-section-title">Чаты</li>';
      html += chatMatches.map((c) => chatItemHTML(c, c.id === activeId)).join('');
    }

    if (msgResults.length > 0) {
      html += '<li class="search-section-title">Сообщения</li>';
      html += msgResults
        .slice(0, 25)
        .map(({ chat, message }) => searchMsgItemHTML(chat, message, query))
        .join('');
    }

    if (!html) {
      html = `<li class="chat-page__loading">По запросу «${escapeHtml(query)}» ничего не найдено</li>`;
    }

    list.innerHTML = html;

    list.querySelectorAll('.chat-item:not(.search-result)').forEach((item) => {
      item.addEventListener('click', () => {
        this.openChat(Number((item as HTMLElement).dataset.chatId));
      });
    });

    list.querySelectorAll('.search-result').forEach((item) => {
      item.addEventListener('click', () => {
        const chatId = Number((item as HTMLElement).dataset.chatId);
        const msgId = Number((item as HTMLElement).dataset.msgId);
        this.openChatAtMessage(chatId, msgId);
      });
    });
  }

  private openChatAtMessage(chatId: number, msgId: number): void {
    this.openChat(chatId);

    // Ждём один кадр — сообщения рендерятся синхронно, но DOM обновляется асинхронно
    requestAnimationFrame(() => {
      const msgEl = this.element.querySelector<HTMLElement>(`[data-msg-id="${msgId}"]`);
      if (!msgEl) {
        return;
      }
      msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msgEl.classList.add('message--found');
      setTimeout(() => msgEl.classList.remove('message--found'), 2500);
    });
  }

  protected render(): string {
    return template;
  }
}
