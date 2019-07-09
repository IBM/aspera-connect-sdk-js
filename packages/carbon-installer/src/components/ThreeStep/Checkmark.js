import React from 'react';
import Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Checkmark.module.scss';

// Map checkmark visibility to banner state, browser type, and step
const MAP = {
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

export const Checkmark = props => {
  let visible = false;
  let browserUsesExtensions = Utils.EXTENSION === true ? 'extension' : 'noExtensions';
  if (MAP[props.currentState] && MAP[props.currentState][props.step]) {
    if (MAP[props.currentState][props.step][0] === browserUsesExtensions || MAP[props.currentState][props.step][0] === 'both') {
      visible = true;
    }
  }

  // Show all checkmarks if this state is reached
  if (props.currentState === 'running_with_green_checkmarks') {
    visible = true;
  }

  return (
    <span className={visible ? styles.visible : styles.hidden}></span>
  );
}
