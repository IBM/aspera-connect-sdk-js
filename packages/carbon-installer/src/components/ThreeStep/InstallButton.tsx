import React, { FunctionComponent } from 'react';
import { dict } from '../../language';
import { Button } from '../Button';
import * as Utils from '../../utils';

interface Props {
  isActive: boolean;
  isOutdated: boolean;
  onClick: Function;
  setState: Function;
}

export const InstallButton: FunctionComponent<Props> = ({ isActive = false, isOutdated = false, onClick, setState }) => {
  let text = isOutdated ? dict.get('upgradeConnect') : dict.get('installConnect');
  let indicatorCallback = onClick;

  const handleClick = () => {
    indicatorCallback('install');

    if (isActive && setState && Utils.NO_EXTENSION) {
      let timeoutMs = 4000;
      // Special timeout conditions for Safari (ASCN-2277)
      if (Utils.BROWSER.SAFARI) {
        if (isOutdated) {
          // Don't transition since extension is already enabled
          return;
        }

        timeoutMs = 30000;
      }

      setState('extension_install', timeoutMs);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!isActive}
    >
      {text}
    </Button>
  );
}
