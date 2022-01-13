import React, { FunctionComponent } from 'react';
import styles from '../styles/components/Button.module.scss';

export const Button: FunctionComponent<any> = (
  {
    children,
    disabled,
    href,
    ...other
  }
) => {
  let className = disabled ? styles.notActive : styles.active;

  const commonProps = {
    className
  };
  let otherProps = {
    ...other
  }

  return (
    <div {...commonProps}>
      <a {...otherProps} href={href}>
        {children}
      </a>
    </div>
  );
}
