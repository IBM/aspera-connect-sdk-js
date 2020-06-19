import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { dict } from '../language';
import {
  Checkmark,
  DownloadButton,
  Indicator,
  InstallButton,
  Pictogram
} from './ThreeStep';
import { Footer } from './Footer';
import { ExtensionInstallButton } from './ExtensionInstallButton';
import * as Utils from '../utils';
import styles from '../styles/components/ThreeStepBanner.module.scss';

interface Props {
  currentState: string;
  href?: string;
  majorVersion?: string;
  isOutdated: boolean;
  changeState: Function;
}

interface State {
  displayIndicator: boolean;
  indicatorText: 'download' | 'install';
}

class ThreeStepBanner extends Component<Props, State> {
  timer?: number;
  stateChangeTimer?: number;
  constructor (props: Props) {
    super(props);
    this.indicatorCallback = this.indicatorCallback.bind(this);
    this.setStateCallback = this.setStateCallback.bind(this);

    this.state = {
      displayIndicator: false,
      indicatorText: 'download'
    };
  }

  componentWillUnmount () {
    if (this.stateChangeTimer || this.timer) {
      clearTimeout(this.timer);
      clearTimeout(this.stateChangeTimer);
    }
  }

  // On click handler passed to child components to toggle the indicator element
  indicatorCallback(btn: 'download' | 'install') {
    if (btn === 'download' || btn === 'install') {
      this.setState({
        displayIndicator: true,
        indicatorText: btn
      });
    }
  }

  renderIndicator () {
    if (this.state.displayIndicator) {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = window.setTimeout(() => {
        this.setState({
          displayIndicator: !this.state.displayIndicator
        });
      }, 8000)

      let position: 'bottom' | 'upper' = 'bottom';
      if (Utils.BROWSER.FIREFOX || Utils.BROWSER.SAFARI) {
        position = 'upper';
      }

      // Render the indicator component outside of parent div
      return ReactDOM.createPortal(
        <Indicator position={position} button={this.state.indicatorText} key={this.state.indicatorText}/>,
        document.getElementById('indicator') as Element
      );
    }
  }

  // Pass to child components to change state after timeout or immediately
  setStateCallback (newState: string, timeout: number) {
    if (timeout) {
      if (!this.stateChangeTimer && newState) {
        this.stateChangeTimer = window.setTimeout(() => {
          if (this.props.currentState !== newState) {
            this.props.changeState(newState);
          }

          this.stateChangeTimer = undefined;
        }, timeout);
      }
    } else {
      this.props.changeState(newState);
    }
  }

  getAllButtons () {
    if (Utils.EXTENSION) {
      return [
        <ExtensionInstallButton isActive={this.props.currentState === 'extension_install'} />,
        <DownloadButton href={this.props.href} onClick={this.indicatorCallback} setState={this.setStateCallback} isActive={this.props.currentState === 'download'} />,
        <InstallButton onClick={this.indicatorCallback} isOutdated={this.props.isOutdated} setState={this.setStateCallback} isActive={this.props.currentState === 'install'} />
      ];
    } else {
      return [
        <DownloadButton href={this.props.href} onClick={this.indicatorCallback} setState={this.setStateCallback} isActive={this.props.currentState === 'download'} />,
        <InstallButton onClick={this.indicatorCallback} isOutdated={this.props.isOutdated} setState={this.setStateCallback} isActive={this.props.currentState === 'install'} />,
        <ExtensionInstallButton isActive={this.props.currentState === 'extension_install'} />
      ];
    }
  }

  render() {
    let howTo;

    let title = dict.get('bannerTitle');
    if ((Utils.isWindows() && this.props.isOutdated) || (Utils.BROWSER.SAFARI && this.props.currentState === 'install')) {
      title = dict.get('restartBanner');
    }

    if (this.props.majorVersion) {
      title = title.replace(/{.*}/, this.props.majorVersion);
    }

    let [ stepOneButton, stepTwoButton, stepThreeButton ] = this.getAllButtons();

    // Set how to gif
    if (Utils.NO_EXTENSION) {
      let fileName = Utils.BROWSER.SAFARI === true ? 'tooltip_safari.gif': 'tooltip_ie.gif';
      let image = require(`../assets/${fileName}`);

      if (Utils.BROWSER.SAFARI || (Utils.BROWSER.IE && this.props.currentState === 'extension_install')) {
        howTo = <a className={`${styles.howText} ${styles.tooltip}`}>
                  <span>{dict.get('how')}</span>
                  <span><img src={image} alt="How?" /></span>
                </a>
      }
    }

    let newText = <span className={styles.newText}>{dict.get('new')}</span>;

    Utils.sendResizeEvent();

    return (
      <div id='three-step' className={styles.banner}>
        <div className={styles.required}>{dict.get('required')}</div>
        <div className={styles.title}>{title}</div>
        <div id='step-one' className={styles.stepOne}>
          <Checkmark currentState={this.props.currentState} step='one'/>
          <div className={styles.step}>
            {Utils.EXTENSION ? (newText) : null}
            <span className={Utils.EXTENSION ? styles.stepNewText : styles.stepText}>{dict.get('stepOne')}</span>
          </div>
          <Pictogram step='one'/>
          {stepOneButton}
        </div>
        <div id='step-two' className={styles.stepContainer}>
          <Checkmark currentState={this.props.currentState} step='two'/>
          <span className={styles.step}>{dict.get('stepTwo')}</span>
          <Pictogram step='two'/>
          {stepTwoButton}
        </div>
        <div id='step-three' className={styles.stepContainer}>
          <Checkmark currentState={this.props.currentState} step='three'/>
          <div className={styles.step}>
            {Utils.BROWSER.SAFARI ? (newText) : null}
            <span className={Utils.BROWSER.SAFARI ? styles.stepNewText : styles.stepText}>{dict.get('stepThree')}</span>
          </div>
          <Pictogram step='three'/>
          {stepThreeButton}
          {howTo}
        </div>
        <Footer isOutdated={this.props.isOutdated}/>
        {this.renderIndicator()}
      </div>
    );
  }
}

export default ThreeStepBanner;
