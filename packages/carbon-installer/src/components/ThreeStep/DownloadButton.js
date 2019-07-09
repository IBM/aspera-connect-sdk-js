import React from 'react';
import Constants from '../../constants';
import Utils from '../../utils';
import styles from '../../styles/components/shared/Button.module.scss';

export const DownloadButton = ({ href, isActive = false, onClick, setState }) => {
  let indicatorCallback = onClick;

  return (
    <div className={isActive ? styles.active : styles.notActive}>
      <a className={isActive ? styles.filled : styles.notFilled} href={href} download="" onClick={() => {
        Utils.sendDownloadEvent();
        indicatorCallback('download');

        if (isActive && setState) {
          setState('install', 10000);
        }
      }}>{Constants.bannerStrings.downloadApp}</a>
    </div>
  );
}
