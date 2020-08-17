export const INSTALL_EVENT = {
  DOWNLOAD_CONNECT : 'downloadconnect',
  REFRESH_PAGE : 'refresh',
  IFRAME_REMOVED : 'removeiframe',
  IFRAME_LOADED : 'iframeloaded',
  TROUBLESHOOT : 'troubleshoot',
  CONTINUE : 'continue',
  RESIZE : 'px',
  RETRY : 'retry',
  EXTENSION_INSTALL : 'extension_install',
  DOWNLOAD_EXTENSION : 'download_extension'
};

export interface IActivityEvent {
  [key: string]: string;
}

export const ACTIVITY_EVENT: IActivityEvent = {
  CONNECT_BAR_VISIBLE: 'connect_bar_visible',
  CLICKED_INSTALL_EXTENSION: 'clicked_install_extension',
  CLICKED_ENABLE_EXTENSION: 'clicked_enable_extension',
  CLICKED_INSTALL_ADDON: 'clicked_install_addon',
  CLICKED_DOWNLOAD_APP: 'clicked_download_app',
  CLICKED_INSTALL_APP: 'clicked_install_app',
  CLICKED_TROUBLESHOOT: 'clicked_troubleshoot',
  CLICKED_DOWNLOAD_INDICATOR: 'clicked_download_indicator',
  DOWNLOAD_INDICATOR_VISIBLE: 'download_indicator_visible',
  CLICKED_HOW_LINK: 'clicked_how_link',
  CONNECT_BAR_REMOVED: 'connect_bar_removed',
  CLICKED_RETRY: 'mitigate_with_tab'
};

export const EVENT_TYPE = {
  CONNECT_BAR_EVENT: 'connect_bar_event'
};
