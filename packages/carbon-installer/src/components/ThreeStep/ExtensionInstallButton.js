import React from 'react';
import Constants from '../../constants';
import Utils from '../../utils';
import styles from '../../styles/components/shared/Button.module.scss';

let buttonText = () => {
  let text = Constants.bannerStrings.installExtension;

  if (Utils.BROWSER.IE || Utils.BROWSER.SAFARI) {
    text = Constants.bannerStrings.enableExtension;
  } else if (Utils.BROWSER.FIREFOX) {
    text = Constants.bannerStrings.installAddon;
  }

  return text;
}

let getExtensionStoreLink = () => {
  if (Utils.BROWSER.FIREFOX === true) {
      return 'https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect';
  } else if (Utils.BROWSER.EDGE_WITH_EXTENSION === true) {
      return 'ms-windows-store://pdp/?productid=9N6XL57H8BMG';
  } else if (Utils.BROWSER.CHROME === true) {
      return 'https://chrome.google.com/webstore/detail/ibm-aspera-connect/kpoecbkildamnnchnlgoboipnblgikpn';
  }
  return '';
}

let handleClick = () => {
  Utils.sendExtensionEvent();
  let storeLink = getExtensionStoreLink();
  if (storeLink) {
    Utils.openTab(storeLink);
  }

  if (Utils.BROWSER.SAFARI) {
    triggerExtensionCheck();
  } else if (Utils.BROWSER.IE) {
    Utils.sendRefreshEvent();
  }
}

let triggerExtensionCheck = () => {
  let dummyIframe = document.createElement('IFRAME');
  dummyIframe.src = 'fasp://initialize?checkextensions';
  dummyIframe.style.visibility = 'hidden';
  dummyIframe.style.position = 'absolute';
  dummyIframe.style.width = '0px';
  dummyIframe.style.height = '0px';
  dummyIframe.style.border = '0px';
  document.body.appendChild(dummyIframe);
}

export const ExtensionInstallButton = ({ isActive = false }) => {
  let text = buttonText();
  
  return (
    <div className={isActive ? styles.active : styles.notActive}>
      <a id="extension-button" className={isActive ? styles.filled : styles.notFilled} target="_blank" onClick={handleClick}>{text}</a>
    </div>
  );
}
