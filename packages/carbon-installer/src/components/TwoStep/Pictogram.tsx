import React from 'react';
import * as Utils from '../../utils';
import styles from '../../styles/components/TwoStep/Pictogram.module.scss';

interface Props {
  step: 'one' | 'two';
};

// Map pictogram image to step
const PICTOGRAM_WITH_EXTENSION = {
  'one': 'puzzle',
  'two': 'downloadBox'
};

const PICTOGRAM_NO_EXTENSION = {
  'one': 'downloadBox',
  'two': 'puzzle'
};

const map = Utils.EXTENSION ? PICTOGRAM_WITH_EXTENSION : PICTOGRAM_NO_EXTENSION;

export const Pictogram = ({ step }: Props) => {
  return (
    <span className={styles.pictograms}>
      <svg className={styles[map[step]]}></svg>
    </span>
  );
}
