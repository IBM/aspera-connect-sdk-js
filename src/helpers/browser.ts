const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

const checkSafari = function (ua: any, minver: number) {
  const match = ua.match(/(?:Version)[/](\d+(\.\d+)?)/i);
  const ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

const checkEdge = function (ua: any, minver: number) {
  const match = ua.match(/(?:Edge)[/](\d+(\.\d+)?)/i);
  const ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

const checkFirefox = function (ua: any, minver: number) {
  const match = ua.match(/(?:Firefox)[/](\d+(\.\d+)?)/i);
  const ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

const isAndroid = (): boolean => /(android)/i.test(ua);

const isIos = (): boolean => /iPad|iPhone|iPod/.test(ua) && !(window as any)['MSStream'];

export default {
  ANDROID: isAndroid(),
  OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
  IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
  IOS: isIos(),
  CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
  FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && checkFirefox(ua, 50),
  FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !checkFirefox(ua, 50),
  EDGE_CHROMIUM: /edg/i.test(ua) && !/edge/i.test(ua),
  EDGE_WITH_EXTENSION: /edge/i.test(ua) && checkEdge(ua, 14),
  EDGE_LEGACY: /edge/i.test(ua) && !checkEdge(ua, 14),
  SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
  SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && checkSafari(ua, 10)
};
