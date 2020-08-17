import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Constants from '../constants';
import { 
  Checkmark,
  DownloadButton,
  ExtensionInstallButton, 
  Footer, 
  Indicator,
  InstallButton,
  Pictogram } from './ThreeStep';
import Utils from '../utils';
import styles from '../styles/components/ThreeStepBanner.module.scss';

// Map active buttons to state
const MAP_ACTIVE_WITH_EXTENSIONS = {
  'extension_install': 0,
  'download': 1,
  'install': 2,
  'running_with_green_checkmarks': 2
}

const MAP_ACTIVE_NO_EXTENSIONS = {
  'extension_install': 2,
  'download': 0,
  'install': 1
}

class ThreeStepBanner extends Component {
  constructor (props) {
    super(props);
    this.timer = null;
    this.stateChangeTimer = null;
    this.indicatorCallback = this.indicatorCallback.bind(this);
    this.setStateCallback = this.setStateCallback.bind(this);

    this.state = {
      displayIndicator: false,
      indicatorText: 'download'
    };

    // Default button components
    this.defaultDownloadButton = <DownloadButton href={this.props.href} onClick={this.indicatorCallback} setState={this.setStateCallback}/>;
    this.defaultExtensionInstallButton =  <ExtensionInstallButton/>;
    this.defaultInstallButton = <InstallButton onClick={this.indicatorCallback} isOutdated={this.props.isOutdated} setState={this.setStateCallback}/>;
  }

  componentWillUnmount () {
    if (this.stateChangeTimer || this.timer) {
      clearTimeout(this.timer);
      clearTimeout(this.stateChangeTimer);
    }
  }

  // On click handler passed to child components to toggle the indicator element
  indicatorCallback(btn) {
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

      this.timer = setTimeout(() => {
        this.setState({
          displayIndicator: !this.state.displayIndicator
        });
      }, 8000)

      let position = 'bottom';
      if (Utils.BROWSER.FIREFOX || Utils.BROWSER.SAFARI) {
        position = 'upper';
      }

      // Render the indicator component outside of parent div
      return ReactDOM.createPortal(
        <Indicator position={position} button={this.state.indicatorText} key={this.state.indicatorText}/>,
        document.getElementById('indicator')
      );
    }
  }

  // Pass to child components to change state after timeout or immediately
  setStateCallback (newState, timeout) {
    if (timeout) {
      if (!this.stateChangeTimer && newState) {
        this.stateChangeTimer = setTimeout(() => {
          if (this.props.currentState !== newState) {
            this.props.changeState(newState);
          }
        }, timeout);
      }
    } else {
      this.props.changeState(newState);
    }
  }

  getAllButtons () {
    let buttons;
    let activeButtonIndex;
    if (Utils.EXTENSION) {
      buttons = [ this.defaultExtensionInstallButton, this.defaultDownloadButton, this.defaultInstallButton ];
      activeButtonIndex = MAP_ACTIVE_WITH_EXTENSIONS[this.props.currentState];
    } else {
      buttons = [ this.defaultDownloadButton, this.defaultInstallButton, this.defaultExtensionInstallButton ];
      activeButtonIndex = MAP_ACTIVE_NO_EXTENSIONS[this.props.currentState];
    }
    buttons[activeButtonIndex] = this.setActiveProp(buttons[activeButtonIndex]);
    return buttons;
  }

  setActiveProp (component) {
    return React.cloneElement(component, { isActive: true });
  }

  render() {
    let howTo;

    let title = (Utils.BROWSER.SAFARI && this.props.currentState === 'install') ? Constants.bannerStrings.installOnSafari : Constants.bannerStrings.bannerTitle;
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
                  <span>{Constants.bannerStrings.how}</span>
                  <span><img src={image} alt="How?" /></span>
                </a>
      }

    }

    let newText = <span className={styles.newText}>{Constants.bannerStrings.new}</span>;

    Utils.sendResizeEvent();

    return (
      <div id='three-step' className={styles.banner}>
        <div className={styles.required}>{Constants.bannerStrings.required}</div>
        <div className={styles.title}>{title}</div>
        <div id='step-one' className={styles.stepOne}>
          <Checkmark currentState={this.props.currentState} step='one'/>
          <div className={styles.step}>
            {Utils.EXTENSION ? (newText) : null}
            <span className={Utils.EXTENSION ? styles.stepNewText : styles.stepText}>{Constants.bannerStrings.stepOne}</span>
          </div>
          <Pictogram step='one'/>
          {stepOneButton}
        </div>
        <div id='step-two' className={styles.stepContainer}>
          <Checkmark currentState={this.props.currentState} step='two'/>
          <span className={styles.step}>{Constants.bannerStrings.stepTwo}</span>
          <Pictogram step='two'/>
          {stepTwoButton}
        </div>
        <div id='step-three' className={styles.stepContainer}>
          <Checkmark currentState={this.props.currentState} step='three'/>
          <div className={styles.step}>
            {Utils.BROWSER.SAFARI ? (newText) : null}
            <span className={Utils.BROWSER.SAFARI ? styles.stepNewText : styles.stepText}>{Constants.bannerStrings.stepThree}</span>
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
