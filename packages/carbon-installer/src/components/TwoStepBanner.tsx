import React, { Component } from 'react';
import { dict } from '../language';
import {
  Checkmark,
  InstallButton,
  Pictogram
} from './TwoStep';
import { Footer } from './Footer';
import { ExtensionInstallButton } from './ExtensionInstallButton';
import * as Utils from '../utils';
import styles from '../styles/components/TwoStepBanner.module.scss';

interface Props {
  currentState: string;
  href?: string;
  majorVersion?: string;
  isOutdated: boolean;
  changeState: Function;
}

class TwoStepBanner extends Component<Props> {
  stateChangeTimer?: number;

  constructor (props: Props) {
    super(props);
    this.setStateCallback = this.setStateCallback.bind(this);
  }

  componentWillUnmount () {
    if (this.stateChangeTimer) {
      clearTimeout(this.stateChangeTimer);
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
        <InstallButton href={this.props.href} isOutdated={this.props.isOutdated} setState={this.setStateCallback} isActive={this.props.currentState === 'install'} />
      ];
    } else {
      return [
        <InstallButton href={this.props.href} isOutdated={this.props.isOutdated} setState={this.setStateCallback} isActive={this.props.currentState === 'install'} />,
        <ExtensionInstallButton isActive={this.props.currentState === 'extension_install'} />
      ];
    }
  }

  shouldActivateCheckmark (step: string) {
    if (step !== 'one') {
      return false;
    }

    switch(this.props.currentState) {
      case 'running_with_green_checkmarks':
        return true;
      case 'extension_install':
        return Utils.NO_EXTENSION;
      case 'install':
        return Utils.EXTENSION;
      default:
        return false;
    }
  }

  render() {
    let howTo;

    let title = Utils.BROWSER.SAFARI ? dict.get('installOnSafari') : dict.get('bannerTitle');

    if (this.props.majorVersion) {
      title = title.replace(/{.*}/, this.props.majorVersion);
    }

    let [ stepOneButton, stepTwoButton ] = this.getAllButtons();

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
          <Checkmark isVisible={this.shouldActivateCheckmark('one')}/>
          <div className={styles.step}>
            {Utils.EXTENSION ? (newText) : null}
            <span className={Utils.EXTENSION ? styles.stepNewText : styles.stepText}>{dict.get('stepOne')}</span>
          </div>
          <Pictogram step='one'/>
          {stepOneButton}
        </div>
        <div id='step-two' className={styles.stepContainer}>
          <Checkmark isVisible={this.shouldActivateCheckmark('two')}/>
          <div className={styles.step}>
            {Utils.BROWSER.SAFARI ? (newText) : null}
            <span className={Utils.BROWSER.SAFARI ? styles.stepNewText : styles.stepText}>{dict.get('stepTwo')}</span>
          </div>
          <Pictogram step='two'/>
          {stepTwoButton}
          {howTo}
        </div>
        <Footer isOutdated={this.props.isOutdated}/>
      </div>
    );
  }
}

export default TwoStepBanner;
