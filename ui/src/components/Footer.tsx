import React, { FunctionComponent } from 'react';
import { dict } from '../language';
import * as Utils from '../utils';
import styles from '../styles/components/Footer.module.scss';

interface Props {
  isOutdated: boolean;
}

export const Footer: FunctionComponent<Props> = ({ isOutdated }) => {
  let restart;
  let refresh;
  let separator;

  if (Utils.BROWSER.SAFARI) {
    let message = dict.get('tryRestarting');
    if (isOutdated) {
      message = dict.get('restartFooter');
    }

    restart = <div>{message}</div>;
  } else if (Utils.isWindows() && isOutdated) {
    restart = <div>{dict.get('restartFooter')}</div>;
  }

  if (!isOutdated) {
    refresh = <button className={styles.link} type="button" onClick={() => { Utils.sendRefreshEvent() }}>{dict.get('refreshButton')}</button>
    separator = <span className={styles.spacing}>/</span>
  }

  return (
    <div className={styles.footer}>
      <span style={{marginRight: "3px"}}>{dict.get('alreadyInstalled')}</span>
      {refresh}
      {separator}
      <button className={styles.link} type="button" onClick={() => { Utils.troubleshoot() }}>{dict.get('troubleshoot')}</button>
      {restart}
    </div>
  )
}
