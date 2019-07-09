import React from 'react';
import Constants from '../../constants';
import Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Footer.module.scss';

export const Footer = props => {
  let restart;
  let refresh;
  let separator;

  if (Utils.BROWSER.SAFARI) {
    restart = <div>{Constants.bannerStrings.tryRestarting}</div>;
  }

  if (!props.isOutdated) {
    refresh = <a className={styles.link} href="" onClick={() => { Utils.refresh() }}>{Constants.bannerStrings.refreshButton}</a>
    separator = <span className={styles.spacing}>/</span>
  }

  return (
    <div className={styles.footer}>
      <span style={{marginRight: "3px"}}>{Constants.bannerStrings.alreadyInstalled}</span>
      {refresh}
      {separator}
      <a className={styles.link} href="#" onClick={() => { Utils.troubleshoot() }}>{Constants.bannerStrings.troubleshoot}</a>
      {restart}
      <div>
          <a href="#" onClick={() => { Utils.previousVersionException() }}>{Constants.bannerStrings.previousVersion}</a>
      </div>
    </div>
  )
}
