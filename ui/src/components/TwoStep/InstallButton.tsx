import React from 'react';
import { dict } from '../../language';
import { Button } from '../Button';
import * as Utils from '../../utils';

interface Props {
  href?: string;
  isActive: boolean;
  isOutdated: boolean;
  setState: Function;
}

export const InstallButton = ({ href, isActive = false, isOutdated = false, setState }: Props) => {
  let text = isOutdated ? dict.get('upgradeConnect') : dict.get('installConnect');

  const handleClick = () => {
    Utils.sendDownloadEvent();
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
      href={href}
      download=""
      disabled={!isActive}
    >
      {text}
    </Button>
  );
}
