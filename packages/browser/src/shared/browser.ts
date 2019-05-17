let ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

let checkSafari = function (ua: any, minver: number) {
  let match = ua.match(/(?:Version)[\/](\d+(\.\d+)?)/i);
  let ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

let checkEdge = function (ua: any, minver: number) {
  let match = ua.match(/(?:Edge)[\/](\d+(\.\d+)?)/i);
  let ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

let checkFirefox = function (ua: any, minver: number) {
  let match = ua.match(/(?:Firefox)[\/](\d+(\.\d+)?)/i);
  let ver = parseInt((match && match.length > 1 && match[1] || '0'), 10);
  return (ver >= minver);
};

export default {
  OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
  IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
  CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
  FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && checkFirefox(ua, 50),
  FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !checkFirefox(ua, 50),
  EDGE_WITH_EXTENSION: /edge/i.test(ua) && checkEdge(ua, 14),
  EDGE_LEGACY: /edge/i.test(ua) && !checkEdge(ua, 14),
  SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
  SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && checkSafari(ua, 10)
};
