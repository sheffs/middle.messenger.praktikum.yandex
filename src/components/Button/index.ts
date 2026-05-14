import Block from '../../core/Block';
import type { BlockProps } from '../../core/Block';
import './button.scss';

interface ButtonProps extends BlockProps {
  label: string;
  type?: 'submit' | 'button' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
}

const template = `
  <button
    class="button button--{{variant}}{{#if fullWidth}} button--full{{/if}}"
    type="{{type}}"
    {{#if disabled}}disabled{{/if}}
  >
    {{label}}
  </button>
`;

export class Button extends Block<ButtonProps> {
  constructor(props: ButtonProps) {
    super({
      type: 'button',
      variant: 'primary',
      ...props,
    });
  }

  protected render(): string {
    return template;
  }
}
