import React from 'react';
import Constants from '../../constants';
import Utils from '../../utils';
import styles from '../../styles/components/shared/Button.module.scss';

export const InstallButton = ({ isActive = false, isOutdated = false, onClick, setState }) => {
  let text = isOutdated ? Constants.bannerStrings.upgradeConnect : Constants.bannerStrings.installConnect;
  let indicatorCallback = onClick;
  
  return (
    <div className={isActive ? styles.active : styles.notActive}>
      <a className={isActive ? styles.filled : styles.notFilled} onClick={() => {
        Utils.sendInstallAppEvent();
        indicatorCallback('install');

        if (isActive && setState && Utils.NO_EXTENSION) {
          setState('extension_install', 4000);
        }
      }}>{text}</a>
    </div>
  );
}
