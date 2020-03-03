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
    Utils.sendInstallAppEvent();
    indicatorCallback('install');

    if (isActive && setState && Utils.NO_EXTENSION) {
      setState('extension_install', 4000);
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
