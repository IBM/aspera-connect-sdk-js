import React from 'react';
import { dict } from '../../language';
import Utils from '../../utils';
import styles from '../../styles/components/ThreeStep/Footer.module.scss';

export const Footer = props => {
  let restart;
  let refresh;
  let separator;

  if (Utils.BROWSER.SAFARI) {
    restart = <div>{dict.get('tryRestarting')}</div>;
  }

  if (!props.isOutdated) {
    refresh = <a className={styles.link} href="" onClick={() => { Utils.refresh() }}>{dict.get('refreshButton')}</a>
    separator = <span className={styles.spacing}>/</span>
  }

  return (
    <div className={styles.footer}>
      <span style={{marginRight: "3px"}}>{dict.get('alreadyInstalled')}</span>
      {refresh}
      {separator}
      <a className={styles.link} href="#" onClick={() => { Utils.troubleshoot() }}>{dict.get('troubleshoot')}</a>
      {restart}
      <div>
          <a href="#" onClick={() => { Utils.previousVersionException() }}>{dict.get('previousVersion')}</a>
      </div>
    </div>
  )
}
