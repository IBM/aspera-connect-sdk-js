import React from 'react';
import { dict } from '../language';
import Utils from '../utils';
import styles from '../styles/components/StatusBanner.module.scss';

let renderSafariMitigate = () => {
  return (
    <div className={styles.message}>
      <span className={`${styles.text} ${styles.mitigateText}`}>{dict.get('retry')}</span>
      <a className={styles.retry} href="#" onClick={() => {Utils.sendSafariMitigate()}}>{dict.get('retryButton')}</a>
      <a className={styles.troubleshootLink} href="#" onClick={() => {Utils.troubleshoot()}}>{dict.get('troubleshoot')}</a>
    </div>
  )
}

let renderUnsupported = () => {
  let text = dict.get('notSupported');
  text = text.replace(/<a>/, `<a  href="https://test-connect.asperasoft.com" target="_blank">`);
  text = { __html: text };

  return (
    <div className={styles.message}>
      <span className={styles.unsupported} dangerouslySetInnerHTML={text}></span>
    </div>
  );
}

// Simple stateless component that takes a paremeter and returns markup.
const StatusBanner = props => {
  if (props.currentState === 'safari_mitigate') {
    return (renderSafariMitigate())
  } else if (props.currentState === 'unsupported_browser') {
    return (renderUnsupported())
  }

  let text = props.currentState === 'running' ? dict.get('running') : dict.get('running');

  return (
    <div className={styles.message}>
      <span className={styles.text}>{text}</span>
    </div>
  )
};

export default StatusBanner;
