import Block from "../../core/Block";
import type { BlockProps } from "../../core/Block";
import "./avatar.scss";

interface AvatarProps extends BlockProps {
  initials?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  clickable?: boolean;
}

const template = `
  <div
    class="avatar avatar--{{size}}{{#if clickable}} avatar--clickable{{/if}}{{#if editable}} avatar--editable{{/if}}"
    {{#if clickable}}role="button" tabindex="0"{{/if}}
  >
    {{#if src}}
      <img class="avatar__img" src="{{src}}" alt="Аватар" />
    {{else}}
      <span class="avatar__initials">{{initials}}</span>
    {{/if}}
    {{#if editable}}
      <div class="avatar__overlay" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
            fill="white" opacity="0.9"/>
          <path d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
            fill="white"/>
        </svg>
      </div>
    {{/if}}
  </div>
`;

export class Avatar extends Block<AvatarProps> {
  constructor(props: AvatarProps) {
    super({ size: "md", ...props });
  }

  protected render(): string {
    return template;
  }
}
