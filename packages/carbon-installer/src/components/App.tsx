import React, { Component } from 'react';
import { dict } from '../language'
import * as Utils from '../utils';
import TwoStepBanner from './TwoStepBanner';
import ThreeStepBanner from './ThreeStepBanner';
import StatusBanner from './StatusBanner';
import styles from '../styles/components/App.module.scss';

interface State {
  banner: string;
  href?: string;
  majorVersion?: string;
  correlationId?: string;
  sdkVersion?: string;
}

const allowedBannerStates = [
  'launching',
  'running',
  'update',
  'retry',
  'extension_install',
  'download',
  'install',
  'unsupported_browser',
  'safari_mitigate',
  'previous'
];

class App extends Component<{}, State> {
  isDownloadRecent: boolean;
  isOutdated: boolean;
  href?: string;

  constructor(props: any) {
    super(props);
    this.isDownloadRecent = false;
    this.isOutdated = false;

    // When any of the below are updated, the DOM is re-rendered
    this.state = {
      banner: 'launching',
      href: undefined,
      majorVersion: undefined,
      correlationId: undefined,
      sdkVersion: undefined,
    };
  }

  componentDidMount () {
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  // Callback to allow child components to change banner state
  changeState (newState: string) {
    this.setState({
      banner: newState
    });
  }

  handleMessage(messageEvent: MessageEvent) {
    let message: string = messageEvent.data.toString();

    if (/downloadlink/.test(message)) {
      let downloadLink = message.split('=')[1];
      this.href = downloadLink;
      this.setState({
        href: downloadLink
      });
    } else if (/downloadVersion/.test(message)) {
      let ver = message.substring(message.indexOf('=') + 1);
      let majorVer = ver.replace(/\.\d+$/, '');
      this.setState({
        majorVersion: majorVer
      });
    } else if (/downloadTimestamp/.test(message)) {
      let lastDownloadTimestamp = message.substring(message.indexOf('=') + 1);
      // Detect if last download timestamp was within 5 minutes
      if ((Date.now() - Number(lastDownloadTimestamp)) < 300000) {
        this.isDownloadRecent = true;
      }
    } else if (/correlationId/.test(message)) {
      let correlationId = message.substring(message.indexOf('=') + 1);
      Utils.setCorrelationId(correlationId);
    } else if (/sdkVersion/.test(message)) {
      let sdkVersion = message.substring(message.indexOf('=') + 1);
      Utils.setSdkVersion(sdkVersion);
    }

    if (allowedBannerStates.indexOf(message) !== -1) {
      console.log(`Received event, transitioning to state: ${message}`);
      this.setState((prevState) => {
        // Unsupported browser is a terminal state
        if (prevState.banner === 'unsupported_browser' && message !== 'running') {
          return this.state;
        }

        // Handle previous state
        if (message === 'previous') {
          if (prevState.banner) {
            message = prevState.banner;
          } else { // If no previous state then reset installation experience
            if (Utils.BROWSER.SAFARI || Utils.BROWSER.IE) {
              message = 'download';
            } else {
              message = 'extension_install';
            }
          }
        }

        // Remap old states
        if (message === 'retry') {
          message = 'download';
        }

        // Skip to last step if Connect was downloaded recently
        if (message === 'download' && this.isDownloadRecent) {
          console.log('Recent downloaded detected!');
          if (Utils.BROWSER.SAFARI || Utils.BROWSER.IE) {
            message = 'extension_install';
          }
        }

        // 3 green checkmark state
        if (message === 'running' && prevState.banner === 'install' && Utils.EXTENSION) {
          console.log('Showing all checkmarks!');
          message = 'running_with_green_checkmarks';
        }

        // Handle update (outdated) state
        if (message === 'update') {
          this.isOutdated = true;
          // message = 'download';
          message = 'install';
        }

        // For 2-step banner, remap download state to install state
        if (message === 'download' && !this.useThreeStepBanner()) {
          message = 'install';
        }

        return {
          banner: message
        }
      });
    }
  }

  // Allow override for banner type
  useThreeStepBanner () {
    let threeStepOverride = localStorage.getItem('aspera-banner-override');
    return threeStepOverride === '3';
  }

  renderBanner() {
    console.log(`rendering state: ${this.state.banner}`);
    let carbonBanner;
    if (this.useThreeStepBanner()) {
      carbonBanner = <ThreeStepBanner currentState={this.state.banner} href={this.state.href} majorVersion={this.state.majorVersion} isOutdated={this.isOutdated} changeState={this.changeState.bind(this)}/>;
    } else {
      carbonBanner = <TwoStepBanner currentState={this.state.banner} href={this.state.href} majorVersion={this.state.majorVersion} isOutdated={this.isOutdated} changeState={this.changeState.bind(this)}/>;
    }

    return this.useStatusBanner() ? <StatusBanner currentState={this.state.banner}/>
      : carbonBanner;
  }

  useStatusBanner () {
    return ['launching', 'running', 'unsupported_browser', 'safari_mitigate'].indexOf(this.state.banner) > -1;
  }

  render() {
    return (
      <div lang={dict.getCurrentLanguageCode()}>
        <div className={styles.statusBanner}>
          <div className={styles.close}>
            <a href="#" onClick={() => {Utils.sendCloseEvent()}}>x</a>
          </div>
          {this.useStatusBanner() ? (<div className={styles.logo}></div>) : null}
          {this.renderBanner()}
        </div>
        <div id="indicator"></div>
      </div>
    );
  }
}

export default App;
