import React from 'react';
import Constants from '../constants';
import Utils from '../utils';
import styles from '../styles/components/StatusBanner.module.scss';

let renderSafariMitigate = () => {
  return (
    <div className={styles.message}>
      <span className={`${styles.text} ${styles.mitigateText}`}>{Constants.bannerStrings.retry}</span>
      <a className={styles.retry} href="#" onClick={() => {Utils.sendSafariMitigate()}}>{Constants.bannerStrings.retryButton}</a>
      <a className={styles.troubleshootLink} href="#" onClick={() => {Utils.troubleshoot()}}>{Constants.bannerStrings.troubleshoot}</a>
    </div>
  )
}

let renderUnsupported = () => {
  let text = Constants.bannerStrings.notSupported;
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

  let text = props.currentState === 'running' ? Constants.bannerStrings.running : Constants.bannerStrings.launching;

  return (
    <div className={styles.message}>
      <span className={styles.text}>{text}</span>
    </div>
  )
};

export default StatusBanner;
