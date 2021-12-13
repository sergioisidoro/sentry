import * as React from 'react';
import styled from '@emotion/styled';

type Props = {
  forwardRef?: React.Ref<HTMLButtonElement>;
  className?: string;
  id?: string;
  name?: string;
  size?: 'sm' | 'lg';
  isActive?: boolean;
  /**
   * Toggle color is always active.
   */
  forceActiveColor?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  toggle: React.HTMLProps<HTMLButtonElement>['onClick'];
};

const Switch = ({
  forwardRef,
  size = 'sm',
  isActive,
  forceActiveColor,
  isLoading,
  isDisabled,
  toggle,
  id,
  name,
  className,
}: Props) => (
  <SwitchButton
    ref={forwardRef}
    id={id}
    name={name}
    type="button"
    className={className}
    onClick={isDisabled ? undefined : toggle}
    role="checkbox"
    aria-checked={isActive}
    isLoading={isLoading}
    isDisabled={isDisabled}
    isActive={isActive}
    size={size}
    data-test-id="switch"
  >
    <Toggle
      isDisabled={isDisabled}
      isActive={isActive}
      forceActiveColor={forceActiveColor}
      size={size}
    />
  </SwitchButton>
);

type StyleProps = Partial<Props>;

const getSize = (p: StyleProps) => (p.size === 'sm' ? 16 : 24);
const getToggleSize = (p: StyleProps) => getSize(p) - (p.size === 'sm' ? 4 : 8);
const getToggleTop = (p: StyleProps) => (p.size === 'sm' ? 1 : 2);
const getTranslateX = (p: StyleProps) =>
  p.isActive ? getToggleTop(p) + getSize(p) : getToggleTop(p);

const SwitchButton = styled('button')<StyleProps>`
  display: inline-block;
  background: none;
  padding: 0;
  border: 2px solid ${p => (p.isActive ? p.theme.purple200 : p.theme.border)};
  position: relative;
  transition: 0.15s border ease;
  cursor: ${p => (p.isLoading || p.isDisabled ? 'not-allowed' : 'pointer')};
  pointer-events: ${p => (p.isLoading || p.isDisabled ? 'none' : null)};
  height: ${getSize}px;
  width: ${p => getSize(p) * 2}px;
  border-radius: ${getSize}px;

  &:focus {
    outline: none;
  }

  &:hover {
    border: 2px solid ${p => (p.isActive ? p.theme.purple200 : p.theme.subText)};
  }

  &.focus-visible {
    box-shadow: 0 0 0 5px ${p => p.theme.purple100};
  }

  &:focus,
  &:active {
    border: 2px solid ${p => p.theme.purple300};
    box-shadow: 0 0 0 5px ${p => p.theme.purple100};
  }

  &::placeholder {
    color: ${p => p.theme.formPlaceholder};
  }

  &[disabled] {
    background: ${p => p.theme.backgroundSecondary};
    color: ${p => p.theme.gray300};
    border: 2px solid ${p => p.theme.border};
    cursor: not-allowed;

    &::placeholder {
      color: ${p => p.theme.disabled};
    }
  }
`;

const Toggle = styled('span')<StyleProps>`
  display: block;
  position: absolute;
  border-radius: 50%;
  transition: 0.25s all ease;
  top: ${getToggleTop}px;
  transform: translateX(${getTranslateX}px);
  width: ${getToggleSize}px;
  height: ${getToggleSize}px;
  background: ${p =>
    p.isActive || p.forceActiveColor ? p.theme.active : p.theme.border};
  opacity: ${p => (p.isDisabled ? 0.4 : null)};
`;

export default React.forwardRef<HTMLButtonElement, Props>((props, ref) => (
  <Switch {...props} forwardRef={ref} />
));
