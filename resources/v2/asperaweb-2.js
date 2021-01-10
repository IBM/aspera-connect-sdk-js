/*
* Aspera Web JavaScript API
* Revision date: 02/05/2015
*
* http://www.asperasoft.com/
* 
* $Id: asperaweb-2.js
*/

"use strict";

if (typeof AW === "undefined") var AW = {};


/*//////////////////////////////////////////////////////////////////////////
	AW.utils
*/

AW.utils = {
	////////////////////////////////////////////////////////////////////////////////////////
	// Logging
  isLogging : (function() {
		var console = window.console || '';
		// Block FF3.x
		if ('MozAppearance' in document.documentElement.style && /Firefox\/3./.test(navigator.userAgent)) return false;
		if (console.log || !window.attachEvent) {
			return true;
		} else {
			return false;
		};
	}()),
	
	logger : function(msg) {
		if ( this.isLogging ) {
			console.log(msg);
		} else {
			//alert(msg);
		}
	},  
	
	////////////////////////////////////////////////////////////////////////////////////////
	// Version helpers
	// Returns true if version string 'a' is less than version string 'b'
	//     "1.2.1" < "1.11.3" 
	//     "1.1"   < "2.1"
	//     "1"     = "1"
	//     "1.2"   < "2"
	// Note the following behavior:
	//     "1"     = "1.2"
	//     "1.2"   = "1"
	//   This helps with upgrade checks.  If at least version "4" is required, and 
	//   "4.4.2" is installed, versionLessThan("4.4.2","4") will return false.
	versionLessThan : function( a, b ) {
		var versionToArray = function( version ) {
				var splits = version.split(".");
				var versionArray = new Array();
				for (var i = 0; i < splits.length; i++) {
					if (isNaN(parseInt(splits[i]))) {
						AW.utils.logger('Warning: Version contains non-numbers');
					}
					versionArray.push(parseInt(splits[i],10));
				}
				return versionArray;
			};
			var a_arr = versionToArray(a);
		var b_arr = versionToArray(b);
		var i;
		for ( i = 0; i < Math.min(a_arr.length, b_arr.length); i++ ) {
			// if i=2, a=[0,0,1,0] and b=[0,0,2,0]
			if( a_arr[i] < b_arr[i] ) {
				return true;
			} 
			// if i=2, a=[0,0,2,0] and b=[0,0,1,0]
			if( a_arr[i] > b_arr[i] ) {
				return false;
			} 
			// a[i] and b[i] exist and are equal:
			// move on to the next version number
		}
		// all numbers equal (or all are equal and we reached the end of a or b)
		return false;
	},
	
	////////////////////////////////////////////////////////////////////////////////////////
	// String helpers
	randomString : function (textLength) {
		var text, possible;
		text = '';
		if (textLength > 200) {
			textLength = 200;
		}
		textLength = textLength || 5;
		possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i < textLength; i++ ) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	},
	
	localize : function(id, lang) {
		var ret;
		lang = lang || "en-US";
		if (typeof(AW.localize) === 'undefined') {
			// There's no localize object at all.
			return id;
		}
		if (typeof(AW.localize[lang]) === 'undefined') {
			// This language isn't available. Try the two-letter 
			// language code. Otherwise, fallback to en-US or the ID.
			try { 
				return AW.localize[lang.substring(0, 2)][id];
			} catch (e) {
				return AW.localize["en-US"][id] || id;
			}  
		}
		ret = AW.localize[lang][id];
		if (typeof(ret) === 'undefined') {
			// This string ID doesn't exist for this language,
			// try en-US, fallback to return the ID.
			return AW.localize["en-US"][id] || id;
		}
		return ret;
	},
	
	joinPaths : function() {
		//Takes any amount of args.
		var args, last;
		args = Array.prototype.slice.call(arguments);
		last = args.pop();
		for (var i = 0, l = args.length; i < l; i++) {
			// Clean leading slashes.
			args[i] = args[i].replace(/^\/*/, ''); 
			// Clean trailing slashes.
			args[i] = args[i].replace(/\/*$/, '');
		}
		// Only strip the leading slash from the last argument
		// to preserve directory references.
		last = last.replace(/^\/*/, '');
		return args.join('/') + '/' + last;
	},
	////////////////////////////////////////////////////////////////////////////////////////
	// Browser helpers
	browser : {
		is : {
			ff: navigator.userAgent.indexOf( "Firefox/" ) !== -1,
			ie: !!navigator.userAgent.match(/Trident.*rv/) || Boolean(document.all && !window.opera),
			lteIe6: (function() {
				var check = function() {
					try {
						return parseInt(navigator.userAgent.match(/MSIE (\d+)/)[1]) <= 6 && !window.opera;                                
					} catch(e) {
						return false;
					}
				};
				return check();
			}()),
			ie7: (function() {
				var check = function() {
					try {
						return parseInt(navigator.userAgent.match(/MSIE (\d+)/)[1]) === 7 && !window.opera;                                
					} catch(e) {
						return false;
					}
				};
				return check();
			}()),
			gteIe7:  (function() {
					var check = function() {
						try {
							return !!navigator.userAgent.match(/Trident.*rv/) || (parseInt(navigator.userAgent.match(/MSIE (\d+)/)[1]) >= 7 && !window.opera);
						} catch(e) {
							return false;
						}
					};
				return check();
			}()),
			ie8: (function() {
					var check = function() {
						try {
							return parseInt(navigator.userAgent.match(/MSIE (\d+)/)[1]) === 8 && !window.opera;
						} catch(e) {
							return false;
						}
					};
				return check();
			}()),
			opera: Boolean(window.opera),
			chrome: Boolean(window.chrome),
			safari: Boolean(window.getComputedStyle && !window.globalStorage && 
							navigator.userAgent.toLowerCase().indexOf('safari/') !== -1 &&
							!/Chrome/.test(navigator.userAgent))
		},
		activeXEnabled : (function() {
			var check;        
			try {
				check = !!new ActiveXObject("htmlfile");
			} catch (e) {
				check = false;
			}
			return check;		
		}()),
		name : function() {
			for ( var name in this.is ) {
				if ( this.is[name] ) {
					return name;
				}
			}
		},
		hasMimeType : function(mimeType) {
			for ( var i=0, l = navigator.mimeTypes.length; i<l; i++ ) {
				if (navigator.mimeTypes[i].type.indexOf(mimeType) > -1) {
					return true;
				}
			}
			return false;
		}
	},

	reloadPlugins : function() {
		if (/msie/i.test(navigator.userAgent)) {
			throw("Plugin reload is not yet supported in IE");
		} else {
			navigator.plugins.refresh();
		}
	},

	isJavaBroken : function(id) {
		// Detect if Java is disabled by the OS, even if it looks ok otherwise.
		// Safari check, for now.
		var applet, appletWidth, isJavaDisabledByBrowser;

		applet = document.getElementById(id);
		isJavaDisabledByBrowser = !navigator.javaEnabled();
		if (!this.browser.is.safari) {
			// Exit unles we are working with Safari. That's
			// the only browser using the .jar install.
			return false;
		}
		if (!applet) {
			// No applet to query.
			return false;
		}
		if (isJavaDisabledByBrowser) {
			return true;
		}
		appletWidth = parseInt(applet.width);
		if ( typeof appletWidth === 'number' && appletWidth > 1) {
			// Test passed. We expect an applet with zero width. Safari will take over
			// the applet and draw a message to the user, giving our applet
			// a width greater than 1.
			return true;
		}
		return false;
	},

	loadFile : function(filename, filetype){
		if (filetype.toLowerCase() === "js"){ //if filename is a external JavaScript file
			var fileref=document.createElement('script');
			fileref.setAttribute("type","text/javascript");
			fileref.setAttribute("src", filename);
		}
		else if (filetype.toLowerCase() === "css"){ //if filename is an external CSS file
			var fileref=document.createElement("link");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", filename);
		}
		if (typeof fileref!="undefined")
			document.getElementsByTagName("head")[0].appendChild(fileref);
	},

	loadScript : function(src, callback) {
		var s = document.createElement('script');
		s.type = 'text/' + (src.type || 'javascript');
		s.src = src.src || src;
		s.onreadystatechange = s.onload = function() {
			var state = s.readyState;
			if (!callback.done && (!state || /loaded|complete/.test(state))) {
				callback.done = true;
				callback();
			}
		};
		// use body if available. more safe in IE
		(document.body || head).appendChild(s);
	},
			
	parseSearchString : function(key) {
		return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
	},
	
	// vX: URL, Callback, Async, Params
	awAjax : function(u,f,a,d,x) { x=this.ActiveXObject;x=new(x?x:XMLHttpRequest)('Microsoft.XMLHTTP');x.open(d?'POST':'GET',u,a);x.setRequestHeader('Content-type','application/x-www-form-urlencoded');x.onreadystatechange=function(){x.readyState>3&&f?f(x.responseText,x):0};x.send(d)
	},

	// vX: Json en/decode. data, [decode=true]
	awStringify : function(j,d,t) {
		if(d) return eval('('+j+')');   
		if(!j) return j+'';
		t = [];
		if(j.pop) {
			for(x in j) t.push(_.S(j[x]));
				j = '['+t.join(',')+']';
		}else if(typeof j=='object') {
			for(x in j) t.push(x+':'+_.S(j[x]));
				j = '{'+t.join(',')+'}';
		}else if(j.split) j = "'"+j.replace(/\'/g,"\\'")+"'";
		return j;
	},
	JSON: (function(){
		// Add JSON support to IE 6 and 7 if needed. Adapted from json2.js to modify the window object
		// because of the nested nature of AW.utils. https://github.com/douglascrockford/JSON-js
		var JSON;if(!window.JSON){window.JSON={};}(function(){function f(n){return n<10?"0"+n:n;}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key);}if(typeof rep==="function"){value=rep.call(holder,key,value);}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null";}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null";}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v;}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==="string"){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v);}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v;}}if(typeof window.JSON.stringify!=="function"){window.JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" ";}}else{if(typeof space==="string"){indent=space;}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify");}return str("",{"":value});};}if(typeof window.JSON.parse!=="function"){window.JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}return reviver.call(holder,key,value);}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4);});}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j;}throw new SyntaxError("JSON.parse");};}}());
	}())
};
// Patch missing bind functionality in IE8.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
if (!AW.utils.console) {
  // define missing console functions as noops if necessary
  AW.utils.console = window.console ? window.console : {};
  var fns = ["assert", "count", "debug", "dir", "dirxml", "error", "group",
    "groupCollapsed", "groupEnd", "info", "log", "markTimeline", "profile",
    "profileEnd", "time", "timeEnd", "timeStamp", "trace", "warn"];
  for (var i = 0; i < fns.length; i++){
    if (!AW.utils.console[fns[i]]){
      AW.utils.console[fns[i]] = function() {};
    }
  }
}
/*jslint browser: true, plusplus: true, white: true */

/**
 * == API ==
 **/

/** section: API
 * AW
 *
 * The Aspera Web namespace.
 **/

/** section: API
 * class AW.Connect
 *
 * The [[AW.Connect]] class contains all the Connect API methods.
 **/

/**
 * new AW.Connect([options])
 * - options (Object): Configuration parameters for the plug-in.
 *
 * Creates a new [[AW.Connect]] object, initializes the plug-in, and inserts it
 * into
 * the DOM.
 *
 * ##### Options
 *
 * 1. `connectLaunchWaitTimeoutMs` (`Number`):
 *     How long to wait in milliseconds for Aspera Connect to launch. Default:
 *     `20000`.
 * 2. `containerId` (`String`):
 *     The DOM `id` of an existing element to insert the plug-in element into
 *     (replacing its contents). If not specified, the plug-in is appended to
 *     the document body. Note that the plug-in must not be hidden in order to
 *     be loaded.
 * 3. `dropAllowDirectories` (`Boolean`):
 *     Allow drop-and-drop of directories or not. This setting is ignored if
 *     `dropMode` is `"disabled"`. Default: `true`.
 * 4. `dropAllowMultiple` (`Boolean`):
 *     Allow drag-and-drop of multiple files or not. This setting is ignored if
 *     `dropMode` is `"disabled"`. Default: `true`.
 * 5. `dropMode` (`String`):
 *     Indicates the operation to take when files are dropped onto the plug-in
 * object.
 *     If `"disabled"`, drag-and-drop is disabled and will have no effect. If
 *     `"upload"`, the files dragged onto the plug-in will be uploaded to the
 *     server. If `"callback"`, a JavaScript method will be executed allowing a
 *     script to perform the desired actions.
 *     See
 * [AW.Connect.DROP_MODE](../../../../api/AW/Connect/DROP_MODE/index.html).
 *     Default: `"disabled"`.
 * 6. `dropUploadUrl` (`String`):
 *     The URL of the server that will receive upload of dropped files,
 *     when `dropMode` is `"upload"`.
 * 7. `height` (`Number`): The height in pixels of the plug-in object. It should
 * match the
 *     height of the specified image parameter. Default: `1`.
 * 8. `id` (`String`):
 *            The DOM `id` of the plug-in object to be inserted. Default:
 *            `"aspera-web"`.
 * 9. `image` (`String`):
 *            The URL of an image to render in the space occupied by the plug-in
 * object. If an image is used, also specify the `height` and `width` options.
 * 10. `imageCover` (`String`):
 *            On IE, the user must mouse-over the plug-in before drag-and-drop
 *            is enabled. This image will display over the plug-in until
 *            the user clicks it. The `imageCover` should be the same
 *            size as the `image`, and inform the user to first click the
 * image to enable drag-and-drop.
 * 12. `width` (`Number`):
 *            The width in pixels of the plug-in object. It should match the
 *            width of the specified image parameter. Default: `1`.
 *
 * ##### Example
 *
 * The following JavaScript creates an [[AW.Connect]] object to interface with
 * Aspera Connect on the client computer. This code should be executed on
 * document ready.
 *
 *     var asperaConnect = new AW.Connect({
 *       id:"aspera_connect_object_container",
 *       containerId: "pluginContainer",
 *       image: "http://myPic.com",
 *       width: 42,
 *       height 42,
 *       dropMode: "callback"
 *     });
 *
 * The following HTML will be inserted into the DOM element with `id`
 * equal to the `containerId` option:
 *
 *     <div id="pluginContainer">
 *       <object id="aspera_connect_object_container"
 * type="application/x-aspera-web" width="42" height="42">
 *         <param name="image" value="http://myPic.com">
 *         <param name="drop-mode" value="callback">
 *       </object>
 *     </div>
 **/
AW.Connect = function(options) {"use strict";

  var API_VERSION, DROP_MODE, EVENT, HTTP_METHOD, STATUS, URI_VERSION_PREFIX, appId, firstTransferEventReceived, hostname, id, isEventSupported, listeners, that, supportsNativeDragAndDrop, dragdropTimeoutId;

  ////////////////////////////////////////////////////////////////////////////
  // Public constants
  ////////////////////////////////////////////////////////////////////////////

  /**
   * AW.Connect.EVENT -> Object
   *
   * Event types:
   *
   * 1. `AW.Connect.EVENT.ALL` (`"all"`)
   * 2. `AW.Connect.EVENT.DRAGENTER` (`"dragenter"`)
   * 3. `AW.Connect.EVENT.DRAGLEAVE` (`"dragleave"`)
   * 4. `AW.Connect.EVENT.DROP` (`"drop"`)
   * 5. `AW.Connect.EVENT.DROPEX` (`"dropex"`)
   * 6. `AW.Connect.EVENT.TRANSFER` (`"transfer"`)
   **/
  AW.Connect.EVENT = {
    ALL : "all",
    DRAGENTER : 'dragenter',
    DRAGLEAVE : 'dragleave',
    DROP : "drop",
    DROPEX : "dropex",
    TRANSFER : "transfer"
  };

  /**
   * AW.Connect.TRANSFER_STATUS -> Object
   *
   * The possible states of a transfer, reported in the `status` field:
   *
   * 1. `AW.Connect.TRANSFER_STATUS.CANCELLED`: The user stopped the transfer.
   * 2. `AW.Connect.TRANSFER_STATUS.COMPLETED`: The transfer finished
   * successfully.
   * 3. `AW.Connect.TRANSFER_STATUS.FAILED`: The transfer had an error.
   * 4. `AW.Connect.TRANSFER_STATUS.INITIATING`: The transfer request was
   *  accepted; starting transfer.
   * 5. `AW.Connect.TRANSFER_STATUS.QUEUED`: The transfer is waiting for other
   * transfers to finish. The queue is configurable in Connect.
   * 6. `AW.Connect.TRANSFER_STATUS.REMOVED`: The user deleted the transfer.
   * 7. `AW.Connect.TRANSFER_STATUS.RUNNING`: Transfer in progress.
   * 8. `AW.Connect.TRANSFER_STATUS.WILLRETRY`: Transfer waiting to retry after
   * a recoverable error.
   **/
  AW.Connect.TRANSFER_STATUS = {
    CANCELLED : "cancelled",
    COMPLETED : "completed",
    FAILED : "failed",
    INITIATING : "initiating",
    QUEUED : "queued",
    REMOVED : "removed",
    RUNNING : "running",
    WILLRETRY : "willretry"
  };

  /**
   * AW.Connect.DROP_MODE -> Object
   *
   * The drop modes, used when creating a new `AW.Connect` object:
   *
   * 1. `AW.Connect.DROP_MODE.CALLBACK`
   * 2. `AW.Connect.DROP_MODE.DISABLED`
   * 3. `AW.Connect.DROP_MODE.UPLOAD`
   **/
  AW.Connect.DROP_MODE = {
    CALLBACK : "callback",
    DISABLED : "disabled",
    UPLOAD : "upload"
  };

  ////////////////////////////////////////////////////////////////////////////
  // Private constants
  ////////////////////////////////////////////////////////////////////////////
  API_VERSION = 4;
  DROP_MODE = AW.Connect.DROP_MODE;
  EVENT = AW.Connect.EVENT;
  HTTP_METHOD = {
    GET : "GET",
    POST : "POST"
  };
  STATUS = AW.Connect.TRANSFER_STATUS;
  URI_VERSION_PREFIX = "/v" + API_VERSION;

  ////////////////////////////////////////////////////////////////////////////
  // Private members
  ////////////////////////////////////////////////////////////////////////////
  that = this;

  hostname = window.location.hostname;
  if (hostname === "") {
    hostname = "localhost";
  }
  // Default appId. Caret prefix differentiates it from a user-specified id.
  appId = "^" + hostname;
  listeners = [];
  firstTransferEventReceived = false;

  ////////////////////////////////////////////////////////////////////////////
  // Helper Functions
  ////////////////////////////////////////////////////////////////////////////

  /*
  * - obj
  * - msg
  */
  function attachError(obj, msg) {
    obj.error = {
      code : -1,
      user_message : msg
    };
  }

  /*
   * - obj
   * - jsError
   * - msg
   */
  function attachJsError(obj, jsError, msg) {
    attachError(obj, arguments.length < 3 ? jsError.message : msg);
    obj.error.internal_info = jsError;
  }

  /*
   * PT - I'm not sure if this is as good as a generator that has system
   * access, but the generated IDs should be unique enough.
   *
   * @returns ID string
   */
  function generateUuid() {
    var date = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = ((date + 16) * Math.random()).toFixed() % 16;
      if (c !== 'x') {
        /*jslint bitwise: true */
        r = r & 0x3 | 0x8;
        /*jslint bitwise: false */
      }
      return r.toString(16);
    });
  }

  /*
   * - x
   * @returns {Boolean}
   */
  function isDefined(x) {
    return typeof x !== "undefined";
  }

  /*
   * - obj
   * @returns {Boolean}
   */
  function isEmptyObject(obj) {
    var name = null;
    for (name in obj) {
      /* "if" statement makes jslint happy */
      if (obj.hasOwnProperty(name)) {
        return false;
      }
    }
    return true;
  }

  /*
   * Copied from Modernizr
   *
   * isEventSupported determines if a given element supports the given event
   * function from yura.thinkweb2.com/isEventSupported/
   */
  isEventSupported = ( function() {
      var TAGNAMES = {
        'select' : 'input',
        'change' : 'input',
        'submit' : 'form',
        'reset' : 'form',
        'error' : 'img',
        'load' : 'img',
        'abort' : 'img'
      };

      function isEventSupportedFn(eventName, element) {
        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;
        // When using `setAttribute`, IE skips "unload", WebKit skips
        // "unload" and "resize", whereas `in` "catches" those
        var isSupported = typeof element.eventName !== "undefined";
        if (!isSupported) {
          // If it has no `setAttribute` (i.e. doesn't implement Node
          // interface), try generic element
          if (!element.setAttribute) {
            element = document.createElement('div');
          }
          if (element.setAttribute && element.removeAttribute) {
            element.setAttribute(eventName, '');
            isSupported = typeof element[eventName] === 'function';
            // If property was created, "remove it" (by setting value
            // to
            // `undefined`)
            if ( typeof element[eventName] !== 'undefined') {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }
        element = null;
        return isSupported;
      }

      return isEventSupportedFn;
    }());

  /*
   * - x
   * @returns {Boolean}
   */
  function isObject(x) {
    return typeof x === "object";
  }

  /*
   * - x
   * @returns {Boolean}
   */
  function isObjectAndNotNull(x) {
    return x !== null && typeof x === "object";
  }

  /*
   * - n
   * @returns {Boolean}
   */
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /*
   * - x
   * @returns {Boolean}
   */
  function isNullOrUndefined(x) {
    return x === null || typeof x === "undefined";
  }

  /*
   * - x
   * @returns {Boolean}
   */
  function isNullOrUndefinedOrEmpty(x) {
    return x === "" || isNullOrUndefined(x);
  }

  /*
   * - x
   * @returns {Boolean}
   */
  function isUndefined(x) {
    return typeof x === "undefined";
  }

  /*
   * Get an id string that is not associated with any elements in the document
   *
   * - baseId
   *            name to use as the id
   * - suffix
   *            should not be specified
   * @returns unused id string
   */
  function getUniqueDomId(baseId, suffix) {
    var element, id;
    id = isDefined(suffix) ? baseId + suffix : baseId;
    element = document.getElementById(id);
    if (element !== null) {
      id = getUniqueDomId(baseId, isDefined(suffix) ? suffix + 1 : 2);
    }
    return id;
  }

  /*
   * - str
   * @returns {Object}
   */
  function parseJson(str) {
    var obj;

    if ( typeof str === "string" && (str.length === 0 || str.replace(/\s/g, "") === "{}")) {
      return null;
    }

    try {
      obj = JSON.parse(str);
    } catch (e) {
      obj = {};
      attachJsError(obj, e, "Failed to parse \"" + str + "\"");
    }
    return obj;
  }

  /*
   * Convert string arguments to objects before calling back
   *
   * - callback
   * @returns {Function}
   */
  function wrapCallback(callback) {
    return function() {
      var args, i;
      try {
        // can't use map function - no IE support
        args = Array.prototype.slice.call(arguments);
        for ( i = 0; i < args.length; i++) {
          args[i] = parseJson(args[i]);
        }
        callback.apply(null, args);
      } catch (e) {
        AW.utils.console.error(e.name + ": " + e.message);
        AW.utils.console.trace();
      }
    };
  }

  /*
   * Convert string arguments to objects before calling back
   *
   * - callbacks
   * @returns {Function}
   */
  function wrapCallbacks(callbacks) {
    return wrapCallback(function() {
      var args, i;
      try {
        args = Array.prototype.slice.call(arguments);
        for ( i = 0; i < args.length; i++) {
          if (isObjectAndNotNull(args[i]) && isDefined(args[i].error)) {
            // error found
            if (isDefined(callbacks.error)) {
              callbacks.error.apply(null, args);
            }
            return;
          }
        }
  
        // success
        if (isDefined(callbacks.success)) {
          callbacks.success.apply(null, args);
        }
      } catch (e) {
        AW.utils.console.error(e.name + ": " + e.message);
        AW.utils.console.trace();
      }
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  // Initialization
  ////////////////////////////////////////////////////////////////////////////

  supportsNativeDragAndDrop = ( function() {
      return (/Mac/).test(navigator.platform) && !(/Mac OS X 10[._]4/).test(navigator.userAgent) && !(/PPC/).test(navigator.platform) && !(/Linux/).test(navigator.platform) && isEventSupported('dragstart') && isEventSupported('drop');
    }());

  // set default options
  if (isUndefined(options)) {
    options = {};
  }
  if (isUndefined(options.authorizationKey)) {
    options.authorizationKey = "";
  }
  if (isUndefined(options.connectLaunchWaitTimeoutMs)) {
    options.connectLaunchWaitTimeoutMs = 20000;
  }
  if (isUndefined(options.containerId)) {
    options.containerId = getUniqueDomId("aspera_connect_object_container");
  }
  if (isUndefined(options.dropAllowDirectories)) {
    options.dropAllowDirectories = true;
  }
  if (isUndefined(options.dropAllowMultiple)) {
    options.dropAllowMultiple = true;
  }
  if (isUndefined(options.dropMode)) {
    options.dropMode = DROP_MODE.DISABLED;
  }
  if (isUndefined(options.dropUploadUrl)) {
    options.dropUploadUrl = "";
  }
  if (isUndefined(options.height)) {
    options.height = 1;
  }
  if (isUndefined(options.id)) {
    options.id = "aspera-web";
  }
  if (isUndefined(options.image)) {
    options.image = "";
  }
  if (isUndefined(options.imageCover)) {
    options.imageCover = "";
  }
  if (isUndefined(options.linkCapacityKbps)) {
    options.linkCapacityKbps = 0;
  }
  if (isUndefined(options.width)) {
    options.width = 1;
  }

  id = options.id;

  ////////////////////////////////////////////////////////////////////////////
  // Private methods
  ////////////////////////////////////////////////////////////////////////////

  /*
  * Get plug-in object
  *
  * @returns {Object}
  */
  function plugin() {
    return document.getElementById(id);
  }

  function setupNativeDragDrop(options) {
    var p, parent;

    p = plugin();
    parent = p.parentNode;

    parent.style.width = options.width + "px";
    parent.style.height = options.height + "px";
    if (options.image.length !== 0) {
      parent.style.background = "transparent url(" + options.image + ") 0 0 no-repeat";
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      return false;
    }
    if (document.addEventListener) {
      parent.addEventListener("dragover", handleDragOver, false); 
    } else {
      parent.attachEvent("ondragover", handleDragOver); 
    }

    //Only called in Mac (Windowless plugin)
    //In IE (windowless) is not called either because the windowless ActiveX
    //control supports IDropTarget
    function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      if (e.preventDefault) {
        e.preventDefault();
      }
      var files = e.dataTransfer.files;
      var fileNameArray = new Array();
      for (var i = 0; i < files.length; i ++) {
        fileNameArray.push(files[i].name);
      }
      p.handleDrop(fileNameArray);
      return false;
    }
    if (document.addEventListener) {
      parent.addEventListener("drop", handleDrop, false);
    } else {
      parent.attachEvent("ondrop", handleDrop);
    }
  }

  function addStandardConnectSettings(data) {
    if (isUndefined(data.aspera_connect_settings)) {
      data.aspera_connect_settings = {};
    }
    data.aspera_connect_settings.app_id = appId;
  }

  function connectHttpRequest(method, path, data, callbacks) {
    var dataStr, response;

    if (isNullOrUndefined(data)) {
      data = {};
    }

    // prepare data
    addStandardConnectSettings(data);
    if (options.authorizationKey.length > 0) {
      data.authorization_key = options.authorizationKey;
    }
    dataStr = JSON.stringify(data);

    if (isDefined(callbacks)) {
      response = plugin().connectHttpRequestAsync(method, path, dataStr, wrapCallbacks(callbacks));
    } else {
      response = plugin().connectHttpRequest(method, path, dataStr);
    }

    return parseJson(response);
  }

  function connectHttpRequestAsync(method, path, data, callbacks) {
    return connectHttpRequest(method, path, data, callbacks);
  }

  /*
   * Add the plugin object to the specified DOM element. If it is not
   * specified, the plugin is appended to the document body.
   *
   * - options
   */
  function insertPluginObject(options) {
    var container, content, coverId, doNativeDragAndDrop, height, image, width, wrapper;

    if (document.getElementById(options.id) !== null) {
      return;
    }

    width = options.width;
    height = options.height;
    image = options.image;
    doNativeDragAndDrop = supportsNativeDragAndDrop && options.dropMode !== DROP_MODE.DISABLED;
    if (doNativeDragAndDrop) {
      width = 0;
      height = 0;
      image = "";
    }

    // The wrapper is needed to do the overlay image for IE. It should be
    // the same size as the plugin, because the plugin is removed from
    // normal flow.
    wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.height = height + "px";
    wrapper.style.width = width + "px";
    if (options.dropMode === DROP_MODE.DISABLED) {
      wrapper.style.overflow = 'hidden';
    }

    container = document.getElementById(options.containerId);
    if (container === null) {
      document.body.appendChild(wrapper);
    } else {
      container.appendChild(wrapper);
    }

    content = "\n";
    content += '<object id="' + options.id + '" type="application/x-aspera-web" width="' + width + '" height="' + height + '" style="position:absolute; top:0px; left:0px;">';
    // Insert Params
    content += '<param name="connect-launch-wait-timeout-ms" value="' + options.connectLaunchWaitTimeoutMs + '">';
    content += '<param name="image" value="' + image + '">';
    content += '<param name="link-capacity" value="' + options.linkCapacityKbps + '">';
    content += '<param name="drop-mode" value="' + options.dropMode + '">';
    if (options.transparent === 'yes') {
      content += '<param name="transparent" value="yes">';
    } else {
      content += '<param name="transparent" value="no">';
    }
    if (options.dropMode === DROP_MODE.UPLOAD) {
      content += '<param name="drop-upload-url" value="' + options.dropUploadUrl + '">';
    }
    if (options.dropMode !== DROP_MODE.DISABLED) {
      content += '<param name="drop-allow-directories" value="' + options.dropAllowDirectories + '">';
      content += '<param name="drop-allow-multiple" value="' + options.dropAllowMultiple + '">';
    }
    content += '</object>\n';

    if (options.imageCover.length !== 0 && AW.utils.browser.is.ie) {
      // on IE, user must mouse-over the ActiveX control before
      // drag-and-drop will work
      coverId = options.id + "-cover";
      content += '<img id="' + coverId + '" src="' + options.imageCover + '" style="position:absolute; top:0px; left:0px;"' + ' onClick="document.getElementById(\'' + coverId + '\').style.display=\'none\';"/>\n';
    }

    wrapper.innerHTML = content;

    if (doNativeDragAndDrop) {
      setupNativeDragDrop(options);
    }

    that.plugin = function() {
        return document.getElementById(options.id);
    }
  }

  function notifyListeners(eventType, data, options) {
    var callback, i, type;
    for ( i = 0; i < listeners.length; i++) {
      try {
        type = listeners[i][0];
        callback = listeners[i][1];
        // call listener if event type matches
        if ((type === eventType || type === EVENT.ALL) && (!listeners[i][2] || firstTransferEventReceived)) {
          callback(eventType, data, options);
        }
      } catch (e) {
        AW.utils.console.error(e.name + ": " + e.message);
        AW.utils.console.trace();
      }
    }
  }

  /*
   * Handle plug-in events - either "transfer" or "drop".
   *
   * - eventType
   * - data
   */
  function onEvent(eventType, data, targetEl) {
    var dataObj, i, transfers, multiDrop;
    // multiDrop represents the new drag and drop API available in 3.4.1.
    multiDrop = !!((eventType === 'drop' || eventType === 'dropex') && dropTargets.currentTarget);

    dataObj = parseJson(data);

    if (multiDrop) {
      returnPluginToNormal();
      notifyListeners(eventType, dataObj, dropTargets.currentTarget);
      return;
    }
    if (eventType === 'dragleave') {
	  if (dropTargets.domEventsSupported() || AW.utils.browser.is.ie) {
        notifyListeners(eventType, null, dropTargets.currentTarget);
      }
      return;
    }
    if (eventType !== EVENT.TRANSFER) {
      // normal case
      notifyListeners(eventType, dataObj);
      return;
    }

    transfers = dataObj.transfers;
    for ( i = 0; i < transfers.length; i++) {
      notifyListeners(EVENT.TRANSFER, transfers[i]);
    }

    firstTransferEventReceived = true;
  }
  
  /**
   * AW.Connect#setDropTargets(selector) -> null | Error
   * - selector (String): The elements currently matching the selector.
   * 
   * Register the selector that matches elements to be used as drop targets for files 
   * and/or folders. Matching elements will be checked as dragenter events are triggered 
   * to account for elements that may be added or removed from the DOM.
   * 
   * Subscribe to 'dragenter' and 'dragleave' events by calling 
   * <asperaPluginInstance>.addEventListener('dragenter', callback) or 
   * <asperaPluginInstance>.addEventListener('dragleave', callback), respectively.
   * The callback will be called with two arguments; 1. event type, 2. event target 
   * (corresponding registered drop target element).
   **/
  var dropTargets = {
    // Holds private methods and properties related
    // to 3.4 drag and drop.
    currentTarget : null,
    get : function() {
      // Gets all drop target elements that match the user-supplied selector.
      if (!document.querySelectorAll) {
        // IE7 support for querySelectorAll in 274 bytes. Supports multiple / grouped selectors and the attribute selector with a "for" attribute. http://www.codecouch.com/
        (function(d,s){d=document,s=d.createStyleSheet();d.querySelectorAll=function(r,c,i,j,a){a=d.all,c=[],r=r.replace(/\[for\b/gi,'[htmlFor').split(',');for(i=r.length;i--;){s.addRule(r[i],'k:v');for(j=a.length;j--;)a[j].currentStyle.k&&c.push(a[j]);s.removeRule(0)}return c}})()
      }
      return document.querySelectorAll(dropTargets.selector);
    },
    domEventsNotSupported : function() {
      return !this.domEventsSupported();
    },
    domEventsSupported : function() {
      var b, isMac;
      b = AW.utils.browser.is;
      isMac = navigator.platform.indexOf('Mac') > -1;
      // Win: IE, OS X: All (Safari, Firefox, Chrome)
      return (isMac && b.ff || isMac && b.chrome  || isMac && b.safari);
    },
    awPlugin : undefined
  };
  
  function stopEvent(e) {
    if(!e) var e = window.event;
    //e.cancelBubble is supported by IE.
    e.cancelBubble = true;
    e.returnValue = false;
    if ( e.stopPropagation ) e.stopPropagation();
    if ( e.preventDefault ) e.preventDefault();		
    return false;
  }
  
  this.setDropTargets = function(selector) {
    var els;
    if (AW.utils.versionLessThan(this.plugin().queryBuildVersion(), '3.4')) {
      throw new Error('This version of Aspera Connect does not support advanced drag and drop features. Please upgrade to version 3.4 or later. http://asperasoft.com/connect');
    }
    dropTargets.selector = selector;
    if (!document.querySelectorAll) {
        // IE7 support for querySelectorAll in 274 bytes. Supports multiple / grouped selectors and the attribute selector with a "for" attribute. http://www.codecouch.com/
        (function(d,s){d=document,s=d.createStyleSheet();d.querySelectorAll=function(r,c,i,j,a){a=d.all,c=[],r=r.replace(/\[for\b/gi,'[htmlFor').split(',');for(i=r.length;i--;){s.addRule(r[i],'k:v');for(j=a.length;j--;)a[j].currentStyle.k&&c.push(a[j]);s.removeRule(0)}return c}})()
    }
    els = document.querySelectorAll(dropTargets.selector);
    for (var i=0, l=els.length; i<l; i++) {
      if (document.addEventListener) {
        els[i].addEventListener('dragenter', pluginDragEnter.bind(els[i], this.plugin().id), false);
      } else {
        els[i].attachEvent('ondragenter', pluginDragEnter.bind(els[i], this.plugin().id));
      }
    }
	//hide plugin so it can be dinamically positioned
	if (els.length) {
      dropTargets.awPlugin = document.getElementById(this.plugin().id);
	  returnPluginToNormal();
	}
    return dropTargets.get();
  }
  
  this.getDropTargets = function() {
    return dropTargets.get();
  }
  
  function pluginDragEnter(pluginId, e) {
    stopEvent(e);
    //Avoid duplicated events
	if (dropTargets.currentTarget == (e.currentTarget || e.srcElement))
	  return;
    // Register the current element
    dropTargets.awPlugin = document.getElementById(pluginId);
    if (dropTargets.domEventsNotSupported()) {
    	if (AW.utils.browser.is.ie) {
    		// Subscribe to the plugin's dragleave event.
    		var IEDragLeave = function () {
    			if (dragdropTimeoutId == 0) {
    				return;
    			}
    			clearTimeout(dragdropTimeoutId);
    			dragdropTimeoutId = 0;
    			if (document.removeEventListener) {
    				dropTargets.awPlugin.parentNode.removeEventListener("dragover", dragoverFunction);
    			} else {
    				dropTargets.awPlugin.parentNode.detachEvent("ondragover", dragoverFunction);
    			}
    			returnPluginToNormal();
    			notifyListeners('dragleave', null, dropTargets.currentTarget);
    			//clear drop target
    			dropTargets.currentTarget = null;
    		}
    		var dragoverFunction = function () {
    			clearTimeout(dragdropTimeoutId);
    			dragdropTimeoutId = 0;
    			dragdropTimeoutId = setTimeout(IEDragLeave, 200);
    		}
    		//we have received a dragenter event, check if we have exited the last event correctly
    		if (dropTargets.currentTarget) {
    			IEDragLeave();
    		}
    		if (document.addEventListener) {
    			dropTargets.awPlugin.parentNode.addEventListener("dragover", dragoverFunction, false);
    		} else {
    			dropTargets.awPlugin.parentNode.attachEvent("ondragover", dragoverFunction);
    		}
    		dragdropTimeoutId = setTimeout(IEDragLeave, 200);
    	} else {
    		// Subscribe to the plugin's dragleave event.
    		var FFChromeDragLeave = function () {
    			if (dragdropTimeoutId == 0) {
    				return;
    			}
    			clearTimeout(dragdropTimeoutId);
    			dragdropTimeoutId = 0;
    			that.removeEventListener('dragover', dragoverFunction);
    			returnPluginToNormal();
    			notifyListeners('dragleave', null, dropTargets.currentTarget);
    			//clear drop target
    			dropTargets.currentTarget = null;
    		}
    		var dragoverFunction = function () {
    			clearTimeout(dragdropTimeoutId);
    			dragdropTimeoutId = 0;
    			dragdropTimeoutId = setTimeout(FFChromeDragLeave, 200);
    		}
    		//we have received a dragenter event, check if we have exited the last event correctly
    		if (dropTargets.currentTarget) {
    			FFChromeDragLeave();
    		}
    		that.addEventListener('dragover', dragoverFunction);
    		dragdropTimeoutId = setTimeout(FFChromeDragLeave, 200);
    	}
    } else {
    	// Subscribe to the plugin's dragleave event.
    	var MacDragLeave = function () {
    		if (dragdropTimeoutId == 0) {
    			return;
    		}
    		clearTimeout(dragdropTimeoutId);
    		dragdropTimeoutId = 0;
    		if (document.removeEventListener && !dropTargets.domEventsNotSupported()) {
    			dropTargets.awPlugin.parentNode.removeEventListener("dragover", dragoverFunction);
    		} else if (!dropTargets.domEventsNotSupported()) {
    			dropTargets.awPlugin.parentNode.detachEvent("ondragover", dragoverFunction);
    		}
    		returnPluginToNormal();
    		notifyListeners('dragleave', null, dropTargets.currentTarget);
    		//clear drop target
    		dropTargets.currentTarget = null;
    	}
    	var dragoverFunction = function () {
    		clearTimeout(dragdropTimeoutId);
    		dragdropTimeoutId = 0;
    		dragdropTimeoutId = setTimeout(MacDragLeave, 200);
    	}
    	//we have received a dragenter event, check if we have exited the last event correctly
    	if (dropTargets.currentTarget) {
    		MacDragLeave();
    	}
    	if (document.addEventListener) {
    		dropTargets.awPlugin.parentNode.addEventListener("dragover", dragoverFunction, false);
    	} else {
    		dropTargets.awPlugin.parentNode.attachEvent("ondragover", dragoverFunction);
    	}
    	dragdropTimeoutId = setTimeout(MacDragLeave, 200);
    }
    notifyListeners('dragenter', null, this);
    dropTargets.currentTarget = this;
    setPluginPosition(dropTargets.awPlugin, this);
  }
  
  function setPluginPosition(plugin, currentElement) {
    if (dropTargets.domEventsNotSupported()) {
      //position relative to the browser
      plugin.parentNode.style.position = 'fixed';
      plugin.parentNode.style.width = currentElement.offsetWidth + 'px';
      plugin.parentNode.style.height = currentElement.offsetHeight + 'px';
      plugin.parentNode.style.top = currentElement.getBoundingClientRect().top + 'px';
      plugin.parentNode.style.left = currentElement.getBoundingClientRect().left + 'px';
	  //position relative to the parent
      plugin.style.position = 'absolute';
      plugin.style.width = currentElement.offsetWidth + 'px';
      plugin.style.height = currentElement.offsetHeight + 'px';
      plugin.style.top = 0 + 'px';
      plugin.style.left = 0 + 'px';
    } else {
      plugin.parentNode.style.position = 'fixed';
      plugin.parentNode.style.width = currentElement.offsetWidth + 'px';
      plugin.parentNode.style.height = currentElement.offsetHeight + 'px';
      plugin.parentNode.style.top = currentElement.getBoundingClientRect().top + 'px';
      plugin.parentNode.style.left = currentElement.getBoundingClientRect().left + 'px';
    }
  }
  
  function returnPluginToNormal() {
    if (dropTargets.awPlugin) {
      if (dropTargets.domEventsNotSupported()) {
        // Hide the plugin
        dropTargets.awPlugin.style.width = '0px';
        dropTargets.awPlugin.style.height = '0px';
      }
      // Hide the plugin wrapper
      dropTargets.awPlugin.parentNode.style.width = '0px';
      dropTargets.awPlugin.parentNode.style.height = '0px';
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  // API Functions
  ////////////////////////////////////////////////////////////////////////////

  /**
   * AW.Connect#addEventListener(type, callback[, ignoreOld]) -> undefined
   * - type (AW.Connect.EVENT): The type of event to receive callbacks for. See
   * below for the format.
   * - callback (Function): The function that will be called when the event
   * occurs.
   * - ignoreOld (Boolean): (*optional*) If set, callbacks for the transfer state
   * of existing transfers will not be sent.
   *
   * Subscribe for Aspera Web events. If a listener is added before
   * [[AW.Connect#initSession]] is called, it will receive an event for each of the
   * transfers already displayed in Connect, such that the listener will know
   * the complete state of all transfers.
   *
   * ##### Format for `callback`
   * 
   *      function(eventType, data) { ... }
   * 
   * Event types ([[AW.Connect.EVENT]]) and their associated `data`:
   *
   * 1. `"transfer"` - [[TransferInfo]]
   * 2. `"drop"` - An array of the paths that the user dropped.
   * 
   * Note: If an `Error` is thrown during a callback, it is logged to
   * `window.console` (if supported by the browser). 
   **/
  this.addEventListener = function(type, callback, ignoreOld) {
    if (isUndefined(ignoreOld)) {
      ignoreOld = false;
    }
    listeners.push([type, callback, ignoreOld]);
    return null;
  };

  /**
   * AW.Connect#authenticate(authSpec, callbacks) -> null | Error
   * - authSpec (Object): Authentication credentials
   * - callbacks (Callbacks): `success` and `error` functions to receive
   * results.
   *
   * *This method is asynchronous.*
   *
   * Test authentication credentials against a transfer server.
   *
   * ##### Options for `authSpec` 
   * 
   * These are a subset of [[TransferSpec]].
   *
   * 1. `remote_host`
   * 2. `ssh_port`
   * 3. `remote_user`
   * 4. `remote_password`
   * 5. `token`
   **/
  this.authenticate = function(authSpec, callbacks) {
    return connectHttpRequestAsync(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/connect/authenticate", authSpec, callbacks);
  };

  /**
   * AW.Connect#getAllTransfers([iterationToken]) -> Object | Error
   * - iterationToken (String): (*optional*) If specified, return only
   * transfers that have had activity since the last call.
   *
   * Get statistics for all transfers. The result contains an array of
   * [[TransferInfo]] objects.
   *
   * ##### Return format
   *
   *     {
   *       "iteration_token": 30,
   *       "result_count": 8,
   *       "transfers": [
   *         TransferInfo,
   *         TransferInfo,
   *         ...
   *       ]
   *     }
   *
   * The `iteration_token` is a marker that represents the moment in time
   * that this method was called. If it is passed as an argument to a
   * subsequent call, the result set will only contain transfers that
   * have had activity since the previous call. Note that this token
   * persists, such that it is still valid if the user restarts Connect.
   **/
  this.getAllTransfers = function(iterationToken) {
    var data = {};
    if (arguments.length > 0) {
      data.iteration_token = iterationToken;
    }
    return connectHttpRequest(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/activity", data);
  };

  /**
   * AW.Connect#initSession([applicationId]) -> Object | Error
   *  - applicationId (String): (*optional*) An ID to represent this session.
   * Transfers
   * initiated during this session will be associated with the ID.
   * To continue a previous session, use the same ID
   *            as before. Use a unique ID in order to keep transfer
   *            information private from other websites. An ID is automatically
   *            generated for you if not specified (default).
   *
   * Starts a new session using this plug-in instance. Call this method
   * immediately after creating the [[AW.Connect]] object. Also call it whenever
   * the plugin's DOM object is displayed after being hidden.
   * 
   * ##### Return format
   * 
   *      {
   *        "app_id" : "^mydomain"
   *      }
   **/
  this.initSession = function(applicationId) {
    var p, result;

    if (!isNullOrUndefinedOrEmpty(applicationId)) {
      appId = applicationId;
    }

    p = plugin();
    result = p.initSession(appId, hostname);

    /*
     * Additional plug-in initialization - Everything needed to reinitialize
     * the plug-in if the browser destroys/recreates the instance needs to
     * be here.
     */
    p.eventHandler = function(type, message) {
      onEvent(type, message);
    };

    return result;
  };

  /**
   * AW.Connect#modifyTransfer(transferId, options) -> TransferSpec | Error
   * - transferId (String): The ID of the transfer to modify.
   * - options (Object): A subset of [[TransferSpec]]
   *
   * Change the speed of a running transfer.
   * 
   * ##### `options`:
   * 
   * See [[TransferSpec]] for definitions.
   * 
   * 1. `rate_policy`
   * 2. `target_rate_kbps`
   * 3. `min_rate_kbps`
   * 4. `target_rate_cap_kbps`
   * 5. `lock_rate_policy`
   * 6. `lock_target_rate`
   * 7. `lock_min_rate`
   **/
  this.modifyTransfer = function(transferId, options) {
    return connectHttpRequest(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/modify/" + transferId, options);
  };

  /**
   * AW.Connect#readAsArrayBuffer(path) -> String | Error
   * - path (String): The path to the file for which we are requesting 64-bit encoded data.
   **/
  this.readAsArrayBuffer = function(path) {
      if (!!that.plugin()) {
          return that.plugin().readAsArrayBuffer(path);
      } else {
          // Handle the plugin's disappearance.
          throw new Error("Unable to find the aspera-web plugin");
      }
  }

  /**
   * AW.Connect#readChunkAsArrayBuffer(options) -> String | Error
   * - options (Object): Object with the options needed for reading a chunk
   * ##### Options
   * 1. 'path' ('String'):
   *     Absolute path to the file we want to read the chunk from. 
   * 2. 'offset' ('Number'):
   *     Offset (in bytes) that we want to start reading the file.
   * 3. 'chunkSize' ('Number'):
   *     The size (in bytes) of the chunk we want.
   *
   * return: String with the following syntax:
   * "data:{mimeType};base64,{base64encodedChunk}"
   *
   **/
  this.readChunkAsArrayBuffer = function(options) {
      if (plugin()) {
          if (!options.path || !options.offset || !options.chunkSize) {
      throw new Error("Invalid parameters");
      }
      console.log(options.offset);
      console.log(options.chunkSize);
          return plugin().readChunkAsArrayBuffer(options.path, options.offset, options.chunkSize);
      } else {
          // Handle the plugin's disappearance.
          throw new Error("Unable to find the aspera-web plugin");
      }
  }

  /**
   * AW.Connect#removeEventListener([type][, callback]) -> undefined
   * - type (AW.Connect.EVENT): (*optional*) The type of event to stop receiving callbacks for.
   * - callback (Function): (*optional*) The function used to subscribe in
   * [[AW.Connect#addEventListener]].
   *
   * Unsubscribe from Aspera Web events. If `type` is not specified,
   * all versions of the `callback` with different types will be removed.
   * If `callback` is not specified, all callbacks for the `type` will be
   * removed. If neither `type` nor `callback` are specified, all listeners
   * will be removed. 
   **/
  this.removeEventListener = function(type, callback) {
    var i, lCallback, lType;
    for ( i = 0; i < listeners.length; i++) {
      lType = listeners[i][0];
      lCallback = listeners[i][1];

      if ((!type && !callback) ||
        (lType === type && !callback) ||
        (lCallback === callback && !type) || 
        (lCallback === callback && lType === type))
      { 
        listeners.splice(i, 1);
      }
    }
    return null;
  };

  /**
   * AW.Connect#removeTransfer(transferId) -> null | Error
   * - transferId (String): The ID (`uuid`) of the transfer to delete.
   * 
   * Remove the transfer - terminating it if necessary - from Connect.
   **/
  this.removeTransfer = function(transferId) {
    return connectHttpRequest(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/remove/" + transferId);
  };

  /**
   * AW.Connect#resumeTransfer(transferId[, options]) -> TransferSpec | Error
   * - transferId (String): The ID (`uuid`) of the transfer to resume.
   * - options (Object): (*optional*) A subset of [[TransferSpec]]
   * 
   * Resume a transfer that was stopped.
   * 
   * ##### `options`:
   * 
   * See [[TransferSpec]] for definitions.
   * 
   * 1. `token`
   * 2. `cookie`
   * 3. `authentication`
   * 4. `remote_user`
   * 5. `remote_password`
   * 6. `content_protection_passphrase`
   **/
  this.resumeTransfer = function(transferId, options) {
    return connectHttpRequest(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/resume/" + transferId, options);
  };

  /**
   * AW.Connect#showAbout() -> null | Error
   *
   * Displays the Aspera Connect "About" window.
   **/
  this.showAbout = function() {
    return connectHttpRequest(HTTP_METHOD.GET, URI_VERSION_PREFIX + "/windows/about");
  };

  /**
   * AW.Connect#showDirectory(transferId) -> null | Error
   * - transferId (String): The ID (`uuid`) of the transfer to show files for.
   * 
   * Open the destination directory of the transfer, using the system file
   * browser.
   **/
  this.showDirectory = function(transferId) {
    return connectHttpRequest(HTTP_METHOD.GET, URI_VERSION_PREFIX + "/windows/finder/" + transferId);
  };

  /**
   * AW.Connect#showPreferences() -> null | Error
   *
   * Displays the Aspera Connect "Preferences" window.
   **/
  this.showPreferences = function() {
    return connectHttpRequest(HTTP_METHOD.GET, URI_VERSION_PREFIX + "/windows/preferences");
  };

  /**
   * AW.Connect#showSaveFileDialog(callbacks[, options]) -> null | Error
   * - callbacks (Callbacks): On success, returns the selected file path.
   * Returns `null` if the user cancels the dialog.
   * - options (Object): (*optional*) File chooser options
   * 
   * *This method is asynchronous.*
   * 
   * Displays a file chooser dialog for the user to pick a "save-to" path.
   * 
   * ##### `options`:
   * 
   * 1. `allowedFileTypes` ([[FileFilters]]): Filter the files displayed by file
   * extension.
   * 2. `suggestedName` (`String`): The file name to pre-fill the dialog with.
   * 3. `title` (`String`): The name of the dialog window.
   **/
  this.showSaveFileDialog = function(callbacks, options) {
    var result;

    if (isUndefined(options)) {
      options = {};
    }
    if (isUndefined(options.title)) {
      options.title = "";
    }
    if (isUndefined(options.suggestedName)) {
      options.suggestedName = "";
    }
    if (isUndefined(options.allowedFileTypes)) {
      options.allowedFileTypes = "";
    } else {
      options.allowedFileTypes = JSON.stringify(options.allowedFileTypes);
    }

    result = plugin().runSaveFileDialogAsync(options.title, options.suggestedName, options.allowedFileTypes, wrapCallbacks(callbacks));
    return isNullOrUndefinedOrEmpty(result) ? null : result;
  };

  /**
   * AW.Connect#showSelectFileDialog(callbacks[, options]) -> null | Error
   * - callbacks (Callbacks): On success, returns an array of file paths.
   * Returns an empty array if the user cancels the dialog.
   * - options (Object): (*optional*) File chooser options
   * 
   * *This method is asynchronous.*
   * 
   * Displays a file browser dialog for the user to select files.
   * 
   * ##### `options`:
   * 
   * 1. `allowedFileTypes` ([[FileFilters]]): Filter the files displayed by file
   * extension.
   * 2. `allowMultipleSelection` (`Boolean`): Allow the selection of multiple
   * files. Default: `true`.
   * 3. `title` (`String`): The name of the dialog window.
   * 4. `extendedInfo` (`Boolean`): Return an object with extended info about the file. Default: `false`.
   **/
  this.showSelectFileDialog = function(callbacks, options) {
    var result;

    if (isUndefined(options)) {
      options = {};
    }
    if (isUndefined(options.title)) {
      options.title = "";
    }
    if (isUndefined(options.allowMultipleSelection)) {
      options.allowMultipleSelection = true;
    }
    if (isUndefined(options.allowedFileTypes)) {
      options.allowedFileTypes = "";
    } else {
      options.allowedFileTypes = JSON.stringify(options.allowedFileTypes);
    }
    if (isUndefined(options.extendedInfo)) {
      options.extendedInfo = false;
    }
    if (AW.utils.versionLessThan(this.version().connect.version, '3.4.1')) {
        result = plugin().runOpenFileDialogAsync(options.title, options.allowMultipleSelection, options.allowedFileTypes, wrapCallbacks(callbacks));
    } else {
        result = plugin().runOpenFileDialogAsync(options.title, options.allowMultipleSelection, options.allowedFileTypes, wrapCallbacks(callbacks), options.extendedInfo);
    }
    return isNullOrUndefinedOrEmpty(result) ? null : result;
  };

  /**
   * AW.Connect#showSelectFolderDialog(callbacks[, options]) -> null | Error
   * - callbacks (Callbacks): On success, returns an array of file paths.
   * Returns an empty array if the user cancels the dialog.
   * - options (Object): (*optional*) File chooser options
   * 
   * *This method is asynchronous.*
   * 
   * Displays a file browser dialog for the user to select directories.
   * 
   * ##### `options`:
   * 
   * 1. `allowMultipleSelection` (`Boolean`): Allow the selection of multiple
   * folders. Default: `true`.
   * 2. `title` (`String`): The name of the dialog window.
   * 3. `extendedInfo` (`Boolean`): Return an object with extended info about the folders. Default: `false`.
   **/
  this.showSelectFolderDialog = function(callbacks, options) {
    var result;

    if (isUndefined(options)) {
      options = {};
    }
    if (isUndefined(options.title)) {
      options.title = "";
    }
    if (isUndefined(options.allowMultipleSelection)) {
      options.allowMultipleSelection = true;
    }
    if (isUndefined(options.extendedInfo)) {
      options.extendedInfo = false;
    }
    if (AW.utils.versionLessThan(this.version().connect.version, '3.4.1')) {
        result = plugin().runOpenFolderDialogAsync(options.title, options.allowMultipleSelection, wrapCallbacks(callbacks));
    } else {
        result = plugin().runOpenFolderDialogAsync(options.title, options.allowMultipleSelection, wrapCallbacks(callbacks), options.extendedInfo);
    }
    return isNullOrUndefinedOrEmpty(result) ? null : result;
  };

  /**
   * AW.Connect#showTransferManager() -> null | Error
   *
   * Displays the Aspera Connect "Transfer Manager" window.
   **/
  this.showTransferManager = function() {
    return connectHttpRequest(HTTP_METHOD.GET, URI_VERSION_PREFIX + "/windows/transfer-manager");
  };

  /**
   * AW.Connect#showTransferMonitor(transferId) -> null | Error
   * - transferId (String): The ID (`uuid`) of the corresponding transfer.
   * 
   * Displays the Aspera Connect "Transfer Monitor" window for the transfer.
   **/
  this.showTransferMonitor = function(transferId) {
    return connectHttpRequest(HTTP_METHOD.GET, URI_VERSION_PREFIX + "/windows/transfer-monitor/" + transferId);
  };

  /**
   * AW.Connect#startTransfer(transferSpec, connectSpecs, callbacks) -> Object | Error
   * - transferSpec (TransferSpec): Transfer parameters
   * - asperaConnectSettings (ConnectSpec): Aspera Connect options
   * - callbacks (Callbacks): (optional) `success` and `error` functions to
   * receive results. This call is successful if Connect is able to start the
   * transfer. Note that an error could still occur after the transfer starts,
   * e.g. if authentication fails. Use [[AW.Connect#addEventListener]] to
   * receive notification about errors that occur during a transfer session.
   * This call fails if validation fails or the user rejects the transfer. 
   *
   * *This method is asynchronous.*
   *
   * Initiates a single transfer. Call [[AW.Connect#getAllTransfers]] to get transfer
   * statistics, or register an event listener through [[AW.Connect#addEventListener]].
   * 
   * ##### Return format
   * 
   * The `request_id`, which is returned immediately, may be for matching
   * this transfer with its events.
   * 
   *      {
   *        "request_id" : "bb1b2e2f-3002-4913-a7b3-f7aef4e79132"
   *      }
   **/
  this.startTransfer = function(transfer_spec, aspera_connect_settings, callbacks) {
    var transferSpecs;

    aspera_connect_settings = aspera_connect_settings || {};

    callbacks = callbacks || {};

    transferSpecs = {
      transfer_specs : [{
        transfer_spec : transfer_spec,
        aspera_connect_settings : aspera_connect_settings
      }]
    };

    return this.startTransfers(transferSpecs, callbacks);
  };

  /**
   * AW.Connect#startTransfers(transferSpecs, callbacks) -> Object | Error
   * - transferSpecs (Object): See below
   * - callbacks (Callbacks): (optional) `success` and `error` functions to
   * receive results. This call is successful if Connect is able to start the
   * transfer. Note that an error could still occur after the transfer starts,
   * e.g. if authentication fails. Use [[AW.Connect#addEventListener]] to
   * receive notification about errors that occur during a transfer session.
   * This call fails if validation fails or the user rejects the transfer. 
   * 
   * *This method is asynchronous.*
   *
   * Initiates one or more transfers (_currently only the first `transfer_spec`
   * is used_). Call [[AW.Connect#getAllTransfers]] to get transfer
   * statistics, or register an event listener through [[AW.Connect#addEventListener]].
   * 
   * Use this method when generating transfer specs using Aspera Node.
   *
   * ##### Return format
   * 
   * The `request_id`, which is returned immediately, may be for matching
   * this start request with transfer events.
   * 
   *      {
   *        "request_id" : "bb1b2e2f-3002-4913-a7b3-f7aef4e79132"
   *      }
   * 
   * ##### Format for `transferSpecs`
   * 
   * See [[TransferSpec]] and [[ConnectSpec]] for definitions.
   * 
   *      {
   *        transfer_specs : [
   *          {
   *            transfer_spec : TransferSpec,
   *            aspera_connect_settings : ConnectSpec
   *          },
   *          {
   *            transfer_spec : TransferSpec,
   *            aspera_connect_settings : ConnectSpec
   *          },
   *          ...
   *        ]
   *      }
   **/
  this.startTransfers = function(transfer_specs, callbacks) {
    var i, requestId, result, transferSpec;

    callbacks = callbacks || {};

    requestId = generateUuid();

    for ( i = 0; i < transfer_specs.transfer_specs.length; i++) {
      transferSpec = transfer_specs.transfer_specs[i];
      addStandardConnectSettings(transferSpec);
      transferSpec.aspera_connect_settings.request_id = requestId;
      if (isUndefined(transferSpec.aspera_connect_settings.back_link)) {
        transferSpec.aspera_connect_settings.back_link = window.location.href;
      }
    }

    result = connectHttpRequestAsync(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/start", transfer_specs, callbacks);

    if (result === null) {
      // success
      result = {
        request_id : requestId
      };
    }

    return result;
  };

  /**
   * AW.Connect#stopTransfer(transferId) -> null | Error
   * - transferId (String): The ID (`uuid`) of the transfer to stop.
   * 
   * Terminate the transfer. Use [[AW.Connect#resumeTransfer]] to resume.
   **/
  this.stopTransfer = function(transferId) {
    return connectHttpRequest(HTTP_METHOD.POST, URI_VERSION_PREFIX + "/transfers/stop/" + transferId);
  };

  /**
   * AW.Connect#version() -> Object | Error
   *
   * Get the Aspera Web plugin version and the Aspera Connect version. If the
   * version does not meet the minimum required version, ask the user to
   * update Aspera Connect. This function does not require session
   * initialization.
   * 
   * ##### Return Format
   * 
   *     {   
   *       connect : {
   *         installed : false,
   *         version : "Not installed"
   *       },
   *       plugin : {
   *         installed : true,
   *         version : "3.0.0.63811"
   *       }
   *     }
   **/
  this.version = function() {
    var p, pluginV, connectV, connectVObj, res;

    res = {
      connect : {
        installed : false,
        version : "Not installed"
      },
      plugin : {
        installed : false,
        version : "Not installed"
      }
    };

    p = plugin();
    try {
      connectV = p.queryConnectVersion();
    } catch (e) {
      attachJsError(res, e, "Plugin install required");
      return res;
    }
    try {
      pluginV = p.queryPluginVersion();
    } catch (e2) {
      // pre-2.8 plugin does not have this method
      res.connect.installed = true;
      res.connect.version = connectV;
      res.plugin.installed = true;
      res.plugin.version = connectV;
      attachJsError(res, e2, "Plugin update required");
      return res;
    }

    // 2.8 and after
    connectVObj = parseJson(connectV);
    if (connectVObj.error) {
      res.error = connectVObj.error;
    } else {
      res.connect.installed = true;
      res.connect.version = connectVObj.release_version;
    }
    res.plugin.installed = true;
    res.plugin.version = pluginV;

    return res;
  };

  ////////////////////////////////////////////////////////////////////////////
  // Initialization
  ////////////////////////////////////////////////////////////////////////////

  insertPluginObject(options);

};
// AW.Connect

/**
 * == Objects ==
 *
 * Specifications for common objects used as arguments or result data.
 **/

/** section: Objects
 * class Callbacks
 *
 * This object can be passed to an asynchronous API call to get the
 * results of the call.
 *
 * ##### Format
 *
 *     {
 *       success: function(Object) { ... },
 *       error: function(Error) { ... }
 *     }
 *
 * The argument passed to the `success` function depends on the original method
 * invoked. The argument to the `error` function is an [[Error]] object.
 * 
 * If an Error is thrown during a callback, it is logged to window.console
 * (if supported by the browser).
 **/

/** section: Objects
 * class Error
 *
 * This object is returned if an error occurs. It contains an error code
 * and a message.
 *
 * *Note that this is not related to the JavaScript `Error`
 * object, but is used only to document the format of errors returned by this
 * API.*
 *
 * ##### Format
 *
 *     {
 *       "error": {
 *         "code": Number,
 *         "internal_message": String,
 *         "user_message": String
 *       }
 *     }
 **/

/** section: Objects
 * class TransferInfo
 *
 * The data format for statistics for one transfer.
 *
 * ##### Example
 *
 *     {
 *       "add_time": "2012-10-05T17:53:16",
 *       "aspera_connect_settings": {
 *         "app_id": "^localhost",
 *         "back_link": "http://http://demo.asperasoft.com",
 *         "request_id": "36d3c2a4-1856-47cf-9865-f8e3a8b47822"
 *       },
 *       "bytes_expected": 102400,
 *       "bytes_written": 11616,
 *       "calculated_rate_kbps": 34,
 *       "current_file": "/temp/tinyfile0001",
 *       "elapsed_usec": 3000000,
 *       "end_time": "",
 *       "modify_time": "2012-10-05T17:53:18",
 *       "percentage": 0.113438,
 *       "previous_status": "initiating",
 *       "remaining_usec": 21000000,
 *       "start_time": "2012-10-05T17:53:16",
 *       "status": "running",
 *       "title": "tinyfile0001",
 *       "transfer_iteration_token": 18,
 *       "transfer_spec": {
 *         "authentication": "password",
 *         "direction": "receive",
 *         "paths": [
 *           {
 *             "destination": "/temp",
 *             "source": "aspera-test-dir-tiny/tinyfile0001"
 *           }
 *         ],
 *         "remote_host": "demo.asperasoft.com",
 *         "remote_user": "asperaweb",
 *         "resume": "none",
 *         "tags": {
 *           "aspera": {
 *             "index": "3",
 *             "xfer_id": "add433a8-c99b-4e3a-8fc0-4c7a24284ada"
 *           }
 *         },
 *         "target_rate_kbps": "100"
 *       },
 *       "uuid": "add433a8-c99b-4e3a-8fc0-4c7a24284ada"
 *     }
 **/

/** section: Objects
 * class TransferSpec
 *
 * The parameters for starting a transfer.
 *
 * ##### Minimal Example
 *
 *     {
 *       "paths": [
 *         {
 *           "source": "/foo/1"
 *         }
 *       ],
 *       "remote_host": "10.0.203.80",
 *       "remote_user": "aspera",
 *       "direction": "send"
 *     }
 *
 * ##### Download Example
 *
 *     {
 *       "paths": [
 *         {
 *           "source": "tinyfile0001"
 *         }, {
 *           "source": "tinyfile0002"
 *         }
 *       ],
 *       "remote_host": "demo.asperasoft.com",
 *       "remote_user": "asperaweb",
 *       "authentication": "password",
 *       "remote_password": "**********",
 *       "fasp_port": 33001,
 *       "ssh_port": 33001,
 *       "http_fallback": true,
 *       "http_fallback_port": 443,
 *       "direction": "receive",
 *       "create_dir": false,
 *       "source_root": "aspera-test-dir-tiny",
 *       "destination_root": "/temp",
 *       "rate_policy": "high",
 *       "target_rate_kbps": 1000,
 *       "min_rate_kbps": 100,
 *       "lock_rate_policy": false,
 *       "target_rate_cap_kbps": 2000,
 *       "lock_target_rate": false,
 *       "lock_min_rate": false,
 *       "resume": "sparse_checksum",
 *       "cipher": "aes-128",
 *       "cookie": "foobarbazqux",
 *       "dgram_size": 1492
 *     }
 **/

/**
 * TransferSpec.authentication -> String
 *
 * *optional*
 *
 * The type of authentication to use.
 *
 * Values:
 *
 * 1. `"password"` (default)
 * 2. `"token"`
 **/

/**
 * TransferSpec.cipher -> String
 *
 * *optional*
 *
 * The algorithm used to encrypt data sent during a transfer. Use this option
 * when transmitting sensitive data. Increases CPU utilization.
 *
 * Values:
 *
 * 1. `"none"` (default)
 * 2. `"aes-128"`
 **/

/**
 * TransferSpec.content_protection -> String
 *
 * *optional*
 *
 * Enable content protection (encryption-at-rest), which keeps files encrypted
 * on the server. Encrypted files have the extension ".aspera-env".
 *
 * Values:
 *
 * 1. `"encrypt"`: Encrypt uploaded files. If `content_protection_passphrase`
 * is not specified, Connect will prompt for the passphrase.
 * 2. `"decrypt"`: Decrypt downloaded files. If `content_protection_passphrase`
 * is not specified, Connect will prompt for the passphrase.
 *
 * Default: disabled
 **/

/**
 * TransferSpec.content_protection_passphrase -> String
 *
 * *optional*
 *
 * A passphrase to use to encrypt or decrypt files when using
 * `content_protection`.
 *
 * Default: none
 **/

/**
 * TransferSpec.cookie -> String
 *
 * *optional*
 *
 * Data to associate with the transfer. The cookie is reported to both client-
 * and server-side applications monitoring fasp™ transfers. It is often used
 * by applications to identify associated transfers.
 *
 * Default: none
 **/

/**
 * TransferSpec.create_dir -> Boolean
 *
 * *optional*
 *
 * Creates the destination directory if it does not already exist. When
 * enabling this option, the destination path is assumed to be a directory
 * path.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/**
 * TransferSpec.destination_root -> String
 *
 * *optional*
 *
 * The transfer destination file path. If destinations are specified in
 * `paths`, this value is prepended to each destination.
 *
 * Note that download destination paths are relative to the user's Connect
 * download directory setting unless `ConnectSpec.use_absolute_destination_path`
 * is enabled.
 *
 * Default: `"/"`
 **/

/**
 * TransferSpec.dgram_size -> Number
 *
 * *optional*
 *
 * The IP datagram size for fasp™ to use. If not specified, fasp™ will
 * automatically detect and use the path MTU as the datagram size.
 * Use this option only to satisfy networks with strict MTU requirements.
 *
 * Default: auto-detect
 **/

/**
 * TransferSpec.direction -> String
 *
 * *required*
 *
 * Whether to perform an upload or a download.
 *
 * Values:
 *
 * 1. `"send"` (upload)
 * 2. `"receive"` (download)
 **/

/**
 * TransferSpec.fasp_port -> Number
 *
 * *optional*
 *
 * The UDP port for fasp™ to use. The default value is satisfactory for most
 * situations. However, it can be changed to satisfy firewall requirements.
 *
 * Default: `33001`
 **/

/**
 * TransferSpec.http_fallback -> Boolean
 *
 * *optional*
 *
 * Attempts to perform an HTTP transfer if a fasp™ transfer cannot be
 * performed.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/**
 * TransferSpec.http_fallback_port -> Number
 *
 * *optional*
 *
 * The port where the Aspera HTTP server is servicing HTTP transfers.
 * Defaults to port 443 if a `cipher` is enabled, or port 80 otherwise.
 *
 * Default: `80` or `443` (HTTPS)
 **/

/**
 * TransferSpec.lock_min_rate -> Boolean
 *
 * *optional*
 *
 * Prevents the user from changing the minimum rate during a transfer.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/**
 * TransferSpec.lock_rate_policy -> Boolean
 *
 * *optional*
 *
 * Prevents the user from changing the rate policy during a transfer.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/**
 * TransferSpec.lock_target_rate -> Boolean
 *
 * *optional*
 *
 * Prevents the user from changing the target rate during a transfer.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/**
 * TransferSpec.min_rate_kbps -> Number
 *
 * *optional*
 *
 * The minimum speed of the transfer. fasp™ will only share bandwidth exceeding
 * this value.
 *
 * Note: This value has no effect if `rate_policy` is `"fixed"`.
 *
 * Default: Server-side minimum rate default setting (aspera.conf). Will
 * respect both local- and server-side minimum rate caps if set.
 **/

/**
 * TransferSpec.paths -> Array
 *
 * *required*
 *
 * A list of the file and directory paths to transfer. Use `destination_root`
 * to specify the destination directory.
 *
 * ##### Source list format
 *
 *     [
 *       {
 *         "source": "/foo"
 *       }, {
 *         "source": "/bar/baz"
 *       },
 *       ...
 *     ]
 *
 * Optionally specify a destination path - including the file name - for each
 * file. This format is useful for renaming files or sending to different
 * destinations. Note that for this format all paths must be file paths (not
 * directory paths).
 *
 * ##### Source-Destination pair format
 *
 *     [
 *       {
 *         "source": "/foo",
 *         "destination": "/qux/foofoo"
 *       }, {
 *         "source": "/bar/baz",
 *         "destination": "/qux/bazbaz"
 *       },
 *       ...
 *     ]
 **/

/**
 * TransferSpec.rate_policy -> String
 *
 * *optional*
 *
 * The congestion control behavior to use when sharing bandwidth.
 *
 * Values:
 *
 * 1. `"fixed"`: Transfer at the target rate, regardless of the actual network
 * capacity. Do not share bandwidth.
 * 2. `"high"`: When sharing bandwidth, transfer at twice the rate of a
 * transfer using a "fair" policy.
 * 3. `"fair"` (default): Share bandwidth equally with other traffic.
 * 4. `"low"`: Use only unutilized bandwidth.
 **/

/**
 * TransferSpec.remote_host -> String
 *
 * *required*
 *
 * The fully qualified domain name or IP address of the transfer server.
 **/

/**
 * TransferSpec.remote_password -> String
 *
 * *optional*
 *
 * The password to use when `authentication` is set to `"password"`. If this
 * value is not specified, Connect will prompt the user.
 **/

/**
 * TransferSpec.remote_user -> String
 *
 * *optional*
 *
 * The username to use for authentication. For password authentication, if
 * this value is not specified, Connect will prompt the user.
 **/

/**
 * TransferSpec.resume -> String
 *
 * *optional*
 *
 * The policy to use when resuming partially transferred (incomplete) files.
 *
 * Values:
 *
 * 1. `"none"`: Transfer the entire file again.
 * 2. `"attributes"`: Resume if the files' attributes match.
 * 3. `"sparse_checksum"` (default): Resume if the files' attributes and sparse
 * (fast) checksums match.
 * 4. `"full_checksum"`: Resume if the files' attributes and full checksums
 * match. Note that computing full checksums of large files takes time, and
 * heavily utilizes the CPU.
 **/

/**
 * TransferSpec.ssh_port -> Number
 *
 * *optional*
 *
 * The server's TCP port that is listening for SSH connections. fasp™ initiates
 * transfers through SSH.
 *
 * Default: `33001`
 **/

/**
 * TransferSpec.source_root -> String
 *
 * *optional*
 *
 * A path to prepend to the source paths specified in `paths`. If this is not
 * specified, then `paths` should contain absolute paths.
 *
 * Default: `"/"`
 **/

/**
 * TransferSpec.target_rate_cap_kbps -> Number
 *
 * *optional*
 *
 * Limit the transfer rate that the user can adjust the target and minimum
 * rates to.
 *
 * Default: no limit
 **/

/**
 * TransferSpec.target_rate_kbps -> Number
 *
 * *optional*
 *
 * The desired speed of the transfer. If there is competing network traffic,
 * fasp™ may share this bandwidth, depending on the `rate_policy`.
 *
 * Default: Server-side target rate default setting (aspera.conf). Will
 * respect both local- and server-side target rate caps if set.
 **/

/**
 * TransferSpec.token -> String
 *
 * *optional*
 *
 * Used for token-based authorization, which involves the server-side
 * application generating a token that gives the client rights to transfer
 * a predetermined set of files.
 *
 * Default: none
 **/

/** section: Objects
 * class ConnectSpec
 *
 * Connect-specific parameters when starting a transfer.
 *
 * ##### Example
 *
 *     {
 *       "allow_dialogs" : false,
 *       "back_link" : "www.foo.com",
 *       "return_paths" : false,
 *       "use_absolute_destination_path" : true
 *     }
 **/

/**
 * ConnectSpec.allow_dialogs -> Boolean
 *
 * *optional*
 *
 * If this value is `false`, Connect will no longer prompt or display windows
 * automatically, except to ask the user to authorize transfers if the server
 * is not on the list of trusted hosts.
 *
 * Values:
 *
 * 1. `true` (default)
 * 2. `false`
 **/

/**
 * ConnectSpec.back_link -> String
 *
 * *optional*
 *
 * A URL to associate with the transfer. Connect will display this link
 * in the context menu of the transfer.
 *
 * Default: The URL of the current page
 **/

/**
 * ConnectSpec.return_paths -> Boolean
 *
 * *optional*
 *
 * If this value is `false`, [[TransferInfo]] will not contain
 * [[TransferSpec.paths]]. Use this option to prevent performance deterioration
 * when specifying a large number of source paths.
 *
 * Values:
 *
 * 1. `true` (default)
 * 2. `false`
 **/

/**
 * ConnectSpec.use_absolute_destination_path -> Boolean
 *
 * *optional*
 *
 * By default, the destination of a download is relative to the user's Connect
 * download directory setting. Setting this value to `true` overrides this
 * behavior, using absolute paths instead.
 *
 * Values:
 *
 * 1. `false` (default)
 * 2. `true`
 **/

/** section: Objects
 * class FileFilters
 *
 * A set of file extension filters.
 *
 * ##### Example
 *
 *     [
 *       {
 *         filter_name : "Text file",
 *         extensions : ["txt"]
 *       },
 *       {
 *         filter_name : "Image file",
 *         extensions : ["jpg", "png"]
 *       },
 *       {
 *         filter_name : "All types",
 *         extensions : ["*"]
 *       }
 *     ]
 **/
 
