import React, { FunctionComponent } from 'react';
import { dict } from '../language';
import * as Utils from '../utils';
import styles from '../styles/components/StatusBanner.module.scss';

let renderSafariMitigate = () => {
  return (
    <div className={styles.message}>
      <span className={`${styles.text} ${styles.mitigateText}`}>{dict.get('retry')}</span>
      <button className={styles.retry} type="button" onClick={() => {Utils.sendSafariMitigate()}}>{dict.get('retryButton')}</button>
      <button className={styles.troubleshootLink} type="button" onClick={() => {Utils.troubleshoot()}}>{dict.get('troubleshoot')}</button>
    </div>
  )
}

let renderUnsupported = () => {
  let text = dict.get('notSupported');
  let url = Utils.getTroubleshootUrl();
  text = text.replace(/<a>/, `<a href="${url}" target="_blank">`);
  let textWithLink = { __html: text };

  return (
    <div className={styles.message}>
      <span className={styles.unsupported} dangerouslySetInnerHTML={textWithLink}></span>
    </div>
  );
}

interface Props {
  currentState: string;
}

// Simple stateless component that takes a paremeter and returns markup.
const StatusBanner: FunctionComponent<Props> = ({ currentState }) => {
  if (currentState === 'safari_mitigate') {
    return (renderSafariMitigate())
  } else if (currentState === 'unsupported_browser') {
    return (renderUnsupported())
  }

  let text = currentState === 'running' ? dict.get('running') : dict.get('launching');

  return (
    <div className={styles.message}>
      <span className={styles.text}>{text}</span>
    </div>
  )
};

export default StatusBanner;
