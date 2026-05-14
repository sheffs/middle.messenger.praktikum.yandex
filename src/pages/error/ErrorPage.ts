import Block from '../../core/Block';
import type { BlockProps } from '../../core/Block';
import './error-page.scss';

interface ErrorPageProps extends BlockProps {
  code: string;
  message: string;
}

const template = `
  <main class="error-page">
    <div class="error-page__content">
      <h1 class="error-page__code">{{code}}</h1>
      <p class="error-page__message">{{message}}</p>
      <a href="/" class="error-page__link" data-link>
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
          <path d="M19 10H1M1 10L10 1M1 10L10 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Вернуться на главную
      </a>
    </div>
  </main>
`;

export class ErrorPage extends Block<ErrorPageProps> {
  constructor(props: Partial<ErrorPageProps> = {}) {
    super({
      code: props.code ?? '404',
      message: props.message ?? 'Страница не найдена',
    });
  }

  protected render(): string {
    return template;
  }
}
