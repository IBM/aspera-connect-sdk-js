let ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

let check_safari = function (ua: any, minver: number) {
  var match = ua.match(/(?:Version)[\/](\d+(\.\d+)?)/i);
  var ver = parseInt((match && match.length > 1 && match[1] || "0"));
  return (ver >= minver);
};

let check_edge = function (ua: any, minver: number) {
  var match = ua.match(/(?:Edge)[\/](\d+(\.\d+)?)/i);
  var ver = parseInt((match && match.length > 1 && match[1] || "0"));
  return (ver >= minver);
};

let check_firefox = function (ua: any, minver: number) {
  var match = ua.match(/(?:Firefox)[\/](\d+(\.\d+)?)/i);
  var ver = parseInt((match && match.length > 1 && match[1] || "0"));
  return (ver >= minver);
};

export default {
  OPERA: /opera|opr/i.test(ua) && !/edge/i.test(ua),
  IE: /msie|trident/i.test(ua) && !/edge/i.test(ua),
  CHROME: /chrome|crios|crmo/i.test(ua) && !/opera|opr/i.test(ua) && !/edge/i.test(ua),
  FIREFOX: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && check_firefox(ua, 50),
  FIREFOX_LEGACY: /firefox|iceweasel/i.test(ua) && !/edge/i.test(ua) && !check_firefox(ua, 50),
  EDGE_WITH_EXTENSION: /edge/i.test(ua) && check_edge(ua, 14),
  EDGE_LEGACY: /edge/i.test(ua) && !check_edge(ua, 14),
  SAFARI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua),
  SAFARI_NO_NPAPI: /safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua) && !/edge/i.test(ua) && check_safari(ua, 10)
};