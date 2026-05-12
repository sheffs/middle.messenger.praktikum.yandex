import Block from '../../core/Block';
import type { BlockProps } from '../../core/Block';
import type { ValidateRule } from '../../utils/validator';
import './input.scss';

interface InputProps extends BlockProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  validate?: ValidateRule;
  readonly?: boolean;
}

const template = `
  <div class="input-field">
    <label class="input-field__label" for="{{name}}">{{label}}</label>
    <input
      class="input-field__input"
      id="{{name}}"
      name="{{name}}"
      type="{{type}}"
      placeholder="{{placeholder}}"
      {{#if value}}value="{{value}}"{{/if}}
      {{#if readonly}}readonly{{/if}}
    />
    <span class="input-field__error-text"></span>
  </div>
`;

export class Input extends Block<InputProps> {
  constructor(props: InputProps) {
    super({
      type: 'text',
      ...props,
      events: {
        focusout: (e: Event) => {
          if ((e.target as HTMLElement).tagName === 'INPUT') {
            this._validateAndShow();
          }
        },
        focusin: (e: Event) => {
          if ((e.target as HTMLElement).tagName === 'INPUT') {
            this._clearError();
          }
        },
      },
    });
  }

  private _getWrapper(): HTMLElement | null {
    return this.getContent().querySelector<HTMLElement>('.input-field');
  }

  private _getErrorEl(): HTMLElement | null {
    return this.getContent().querySelector<HTMLElement>('.input-field__error-text');
  }

  /** Обновляет ошибку напрямую в DOM — без ре-рендера, значение поля не теряется */
  private _showError(message: string): void {
    const wrapper = this._getWrapper();
    const errorEl = this._getErrorEl();
    wrapper?.classList.toggle('input-field--error', !!message);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  private _clearError(): void {
    this._showError('');
  }

  private _validateAndShow(): void {
    const rule = this.props.validate;
    if (!rule) {return;}
    const error = rule(this.getValue());
    this._showError(error ?? '');
  }

  public getValue(): string {
    const input = this.getContent().querySelector<HTMLInputElement>('input');
    return input?.value ?? '';
  }

  /** Валидирует и показывает ошибку. Возвращает true если поле валидно. */
  public validate(): boolean {
    const rule = this.props.validate;
    if (!rule) {return true;}
    const error = rule(this.getValue());
    this._showError(error ?? '');
    return error === null;
  }

  protected render(): string {
    return template;
  }
}
