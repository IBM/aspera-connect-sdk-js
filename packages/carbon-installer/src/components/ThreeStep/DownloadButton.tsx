import React, { FunctionComponent } from 'react';
import { dict } from '../../language';
import { Button } from '../Button';
import * as Utils from '../../utils';

interface Props {
  href?: string;
  isActive: boolean;
  onClick: Function;
  setState: Function;
}

export const DownloadButton: FunctionComponent<Props> = ({ href, isActive = false, onClick, setState }) => {
  let text = dict.get('downloadApp');
  let indicatorCallback = onClick;

  const handleClick = () => {
    Utils.sendDownloadEvent();
    indicatorCallback('download');

    if (isActive && setState) {
      setState('install', 10000);
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
