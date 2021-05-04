var expect = chai.expect;
var sandbox = sinon.createSandbox();

var callback = {
  success: function(success) {},
  error: function(err) {}
};

var DEFAULT_VERSION = '4.0.0.17';

var extResponse = {};
var extensionRequests;

if (!Array.prototype.last){
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
};

function isNullOrUndefinedOrEmpty(x) {
  return x === '' || x === null || typeof x === 'undefined';
}

function extensionResponse(httpCode, body) {
  if (httpCode && body) {
    extResponse = {
      'status' : httpCode,
      'body'   : body
    };
  } else {
    extResponse = null;
  }
}

function returnVersion() {
  var version = {
      'extension_version' : DEFAULT_VERSION
  };

  window.postMessage({
    'type': 'AsperaConnectCheckResponse',
    'detail': version
  }, '*')
}

function copyData(data) {
  var localData = {};
  if (!isNullOrUndefinedOrEmpty(data)) {
      for (var property in data) {
          if (data.hasOwnProperty(property)) {
              localData[property] = data[property];
          }
      }
  }
  return localData;
}

function httpRequest(evt) {
  // If extResponse set to null, don't respond
  if (!extResponse) {
    return;
  }
  var message = copyData(extResponse);
  extensionRequests.push(evt.detail)

  // Default responses to ensure extensionResponse() doesn't need to be called
  // for each test case.
  if (JSON.stringify(extResponse) === JSON.stringify({})) {
    var uri = evt.detail.uri_reference;
    message.status = 200;
    message.request_id = evt.detail.request_id;

    if (uri.match(/version/)) {
      var body = JSON.stringify({ 'version' : DEFAULT_VERSION });
      message.body = body;
    } else if (uri.match(/require/) || uri.match(/authenticate/) || uri.match(/activity/) ||
                uri.match(/transfer/) || uri.match(/array/) || uri.match(/windows/)) {
        var body = JSON.stringify({});
        message.body = body;
    }
  } else {
    message.request_id = evt.detail.request_id;
  }

  window.postMessage({
    'type': 'AsperaConnectResponse',
    'detail': message
  }, '*')
}

// Fake that Connect is installed and running.
beforeEach("Fake Connect is running", function() {
  this.server = sinon.fakeServer.create();

  this.server.respondImmediately = true;
  // Respond 200 to startup http requests.
  this.server.respondWith('GET', /ping/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith(/ready/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith('POST', /require/, [200, { "Content-Type": "application/json" }, '{}']);
  // Default respond with 4.0.0 Connect
  this.server.respondWith('GET', /version/, [200, { "Content-Type": "application/json" }, '{ "version": "4.0.0.17" }']);
  this.server.respondWith('POST', /activity/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith('POST', /authenticate/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith('POST', /array/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith('POST', /transfers/, [200, { "Content-Type": "application/json" }, '{}']);
  this.server.respondWith(/windows/, [200, { "Content-Type": "application/json" }, '{}']);

  this.clock = sinon.useFakeTimers();

  this.browser_ctx = copyData(AW4.Utils.BROWSER);

  // Stub the native host extensions
  extensionRequests = [];
  extResponse = {};
  document.addEventListener('AsperaConnectRequest', httpRequest);
  document.addEventListener('AsperaConnectCheck', returnVersion);

  asperaWeb = new AW4.Connect({ connectMethod: 'http'});
  asperaWeb.initSession();

  sinon.spy(callback, "success");
  sinon.spy(callback, "error");

  // Disable redirects to fix karma issue
  window.onbeforeunload = () => 'Oh no!';

  sessionStorage.clear();
});

afterEach(function() {
  this.server.restore();
  this.clock.restore();
  this.server.requests = [];
  AW4.Utils.BROWSER = copyData(this.browser_ctx);

  callback.success.restore();
  callback.error.restore();

  localStorage.removeItem(AW4.Utils.LS_CONTINUED_KEY);
  localStorage.removeItem(AW4.Utils.LS_CONNECT_APP_ID);

  sandbox.restore();
  extResponse = {};

  // It's very important to cleanup these event listeners
  document.removeEventListener('AsperaConnectRequest', httpRequest);
  document.removeEventListener('AsperaConnectCheck', returnVersion);
  extensionRequests = [];
});
