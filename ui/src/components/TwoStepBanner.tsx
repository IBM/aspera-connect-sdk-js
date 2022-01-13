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
    let title = dict.get('bannerTitle');
    if ((Utils.isWindows() && this.props.isOutdated) || Utils.BROWSER.SAFARI) {
      title = dict.get('restartBanner');
    }

    if (this.props.majorVersion) {
      title = title.replace(/{.*}/, this.props.majorVersion);
    }

    let [ stepOneButton, stepTwoButton ] = this.getAllButtons();

    let newText = <span className={styles.newText}>{dict.get('new')}</span>;


    if (this.props.currentState !== 'running_with_green_checkmarks') {
      Utils.sendResizeEvent();
      Utils.sendConnectBarVisible();
    }

    // Don't show extension enable step during Safari upgrades (ASCN-2277)
    const isSafariUpgrade = Utils.BROWSER.SAFARI && this.props.isOutdated;

    return (
      <div id='three-step' className={styles.banner}>
        <div className={styles.required}>{dict.get('required')}</div>
        <div className={styles.title}>{title}</div>
        <div id='step-one' className={styles.stepOne}>
          <Checkmark isVisible={this.shouldActivateCheckmark('one')}/>
          {
            isSafariUpgrade
              ? null
              : <div className={styles.step}>
                  {Utils.EXTENSION ? (newText) : null}
                  <span className={Utils.EXTENSION ? styles.stepNewText : styles.stepText}>{dict.get('stepOne')}</span>
                </div>
          }
          <Pictogram step='one'/>
          {stepOneButton}
        </div>
        {
          isSafariUpgrade
            ? null
            : <div id='step-two' className={styles.stepContainer}>
                <Checkmark isVisible={this.shouldActivateCheckmark('two')}/>
                <div className={styles.step}>
                  {Utils.BROWSER.SAFARI ? (newText) : null}
                  <span className={Utils.BROWSER.SAFARI ? styles.stepNewText : styles.stepText}>{dict.get('stepTwo')}</span>
                </div>
                <Pictogram step='two'/>
                {stepTwoButton}
              </div>
        }
        <Footer isOutdated={this.props.isOutdated}/>
      </div>
    );
  }
}

export default TwoStepBanner;
