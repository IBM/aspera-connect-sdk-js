import React, { FunctionComponent } from 'react';
import * as Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Checkmark.module.scss';

interface Props {
  currentState: string;
  step: 'one' | 'two' | 'three';
}

// Read as: step one has a green checkmark when state=install and browser=any
const MAP: any = {
  'extension_install': {
    'one': ['noExtensions'],
    'two': ['noExtensions']
  },
  'download': {
    'one': ['extension']
  },
  'install': {
    'one': ['both'],
    'two': ['extension']
  }
};

export const Checkmark: FunctionComponent<Props> = ({ currentState, step }) => {
  let visible = false;
  let browserUsesExtensions = Utils.EXTENSION === true ? 'extension' : 'noExtensions';
  if (MAP[currentState] && MAP[currentState][step]) {
    if (MAP[currentState][step][0] === browserUsesExtensions || MAP[currentState][step][0] === 'both') {
      visible = true;
    }
  }

  // Show all checkmarks if this state is reached
  if (currentState === 'running_with_green_checkmarks') {
    visible = true;
  }

  return (
    <span className={visible ? styles.visible : styles.hidden}></span>
  );
}
