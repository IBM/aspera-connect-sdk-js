import React, { FunctionComponent } from 'react';
import * as Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Pictogram.module.scss';

interface Props {
  step: 'one' | 'two' | 'three';
}

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

const map = Utils.EXTENSION ? PICTOGRAM_WITH_EXTENSION : PICTOGRAM_NO_EXTENSION;

export const Pictogram: FunctionComponent<Props> = ({ step }) => {
  return (
    <span className={styles.pictograms}>
      <svg className={styles[map[step]]}></svg>
    </span>
  );
}
