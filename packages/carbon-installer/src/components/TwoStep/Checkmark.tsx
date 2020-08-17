import React from 'react';
import styles from '../../styles/components/TwoStep/Checkmark.module.scss';

interface Props {
  isVisible: boolean;
};

export const Checkmark = ({ isVisible }: Props) => {
  return (
    <span className={isVisible ? styles.visible : styles.hidden}></span>
  );
}
