import React, { FunctionComponent } from 'react';
import { dict } from '../language';
import { Button } from './Button';
import * as Utils from '../utils';

let buttonText = () => {
  let text = dict.get('installExtension');

  if (Utils.BROWSER.IE || Utils.BROWSER.SAFARI) {
    text = dict.get('enableExtension');
  } else if (Utils.BROWSER.FIREFOX) {
    text = dict.get('installAddon');
  }

  return text;
}

let getExtensionStoreLink = () => {
  if (Utils.BROWSER.FIREFOX === true) {
      return 'https://addons.mozilla.org/en-US/firefox/addon/ibm-aspera-connect';
  } else if (Utils.BROWSER.EDGE_WITH_EXTENSION === true) {
      return 'ms-windows-store://pdp/?productid=9N6XL57H8BMG';
  } else if (Utils.BROWSER.EDGE_CHROMIUM === true) {
      return 'https://microsoftedge.microsoft.com/addons/detail/ibm-aspera-connect/kbffkbiljjejklcpnfmoiaehplhcifki';
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
  let hiddenIframe = document.createElement('IFRAME') as HTMLIFrameElement;
  hiddenIframe.src = 'fasp://initialize?checkextensions';
  hiddenIframe.style.visibility = 'hidden';
  hiddenIframe.style.position = 'absolute';
  hiddenIframe.style.width = '0px';
  hiddenIframe.style.height = '0px';
  hiddenIframe.style.border = '0px';
  document.body.appendChild(hiddenIframe);
}

interface Props {
  isActive: boolean;
}

export const ExtensionInstallButton: FunctionComponent<Props> = ({ isActive = false }) => {
  let text = buttonText();

  return (
    <Button
      target="_blank"
      onClick={handleClick}
      disabled={!isActive}
    >
      {text}
    </Button>
  );
}
