import * as React from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {growIn} from 'sentry/styles/animations';
import {Theme} from 'sentry/utils/theme';

type Props = {radioSize?: 'small'};

type CheckedProps = Props &
  Omit<React.HTMLProps<HTMLInputElement>, 'as'> & {theme: Theme};

const checkedCss = (p: CheckedProps) => css`
  display: block;
  width: ${p.radioSize === 'small' ? '8px' : '0.875rem'};
  height: ${p.radioSize === 'small' ? '8px' : '0.875rem'};
  border-radius: 50%;
  background-color: ${p.theme.active};
  animation: 0.2s ${growIn} ease;
  opacity: ${p.disabled ? 0.4 : null};
`;

const Radio = styled('input')<Props>`
  display: flex;
  padding: 0;
  width: ${p => (p.radioSize === 'small' ? '16px' : '1.5rem')};
  height: ${p => (p.radioSize === 'small' ? '16px' : '1.5rem')};
  position: relative;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  border: 2px solid ${p => p.theme.border};
  background: none;
  appearance: none;

  /* TODO(bootstrap): Our bootstrap CSS adds this, we can remove when we remove that */
  margin: 0 !important;

  &:hover {
    border-color: ${p => p.theme.subText};
  }

  &:checked {
    border-color: ${p => p.theme.purple200};
  }

  &:focus,
  &.focus-visible {
    outline: none !important;
    border: 2px solid ${p => p.theme.purple300};
    box-shadow: 0 0 0 5px ${p => p.theme.purple100};
  }

  &:checked:after {
    content: '';
    ${p => checkedCss(p)}
  }
`;

Radio.defaultProps = {
  type: 'radio',
};

export default Radio;
