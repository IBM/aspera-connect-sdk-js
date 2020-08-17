import React from 'react';
import Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Pictogram.module.scss';

// Map pictogram image to step
const PICTOGRAM_WITH_EXTENSION = {
  'one': 'puzzle',
  'two': 'downloadBox',
  'three': 'openBox'
};

const PICTOGRAM_NO_EXTENSION = {
  'one': 'downloadBox',
  'two': 'openBox',
  'three': 'puzzle'
};

export const Pictogram = props => {
  let map = PICTOGRAM_WITH_EXTENSION;
  if (!Utils.EXTENSION) {
    map = PICTOGRAM_NO_EXTENSION;
  }

  return (
    <span className={styles.pictograms}>
      <svg className={styles[map[props.step]]}></svg>
    </span>
  );
}
