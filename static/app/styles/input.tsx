import {css} from '@emotion/react';

import {Theme} from 'sentry/utils/theme';

export const INPUT_PADDING = 10;

type Props = {
  disabled?: boolean;
  monospace?: boolean;
  readOnly?: boolean;
  theme: Theme;
};

const inputStyles = (props: Props) =>
  css`
    color: ${props.disabled ? props.theme.disabled : props.theme.formText};
    display: block;
    width: 100%;
    background: ${props.theme.background};
    border: 1px solid ${props.theme.border};
    border-radius: ${props.theme.borderRadius};
    box-shadow: ${props.theme.dropShadowInset};
    padding: ${INPUT_PADDING}px;
    transition: border 0.1s linear;
    resize: vertical;
    height: 40px;

    ${props.monospace ? `font-family: ${props.theme.text.familyMono}` : ''};

    ${props.readOnly
      ? css`
          cursor: default;
        `
      : ''};

    &:focus {
      outline: none;
    }

    &:hover {
      border: 1px solid ${props.theme.subText};
    }

    &:focus,
    &:active {
      border: 1px solid ${props.theme.purple300};
      box-shadow: 0 0 0 1px ${props.theme.purple300};
    }

    &::placeholder {
      color: ${props.theme.formPlaceholder};
    }

    &[disabled] {
      background: ${props.theme.backgroundSecondary};
      color: ${props.theme.gray300};
      border: 1px solid ${props.theme.border};
      cursor: not-allowed;

      &::placeholder {
        color: ${props.theme.disabled};
      }
    }

    &.focus-visible {
      box-shadow: 0 0 0 1px ${props.theme.purple300}, 0 0 0 5px ${props.theme.purple100};
    }
  `;

export {inputStyles};
