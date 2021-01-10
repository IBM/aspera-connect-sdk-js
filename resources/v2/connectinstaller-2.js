/* Connect Installer: 0.0.0.63156 */
if (typeof AW === "undefined") var AW = {};// Aspera Generic Installer JavaScript Library
// Revision: 2011-12-07
//
// Internal library

/*//////////////////////////////////////////////////////////////////////////
	AW.AsperaInstaller
*/

if (typeof AW === "undefined") var AW = {};

AW.AsperaInstaller = function() {
	var that = this;
	var browser = AW.utils.browser;

	// Configuration section
	that.currentAppId = "Aspera.Installer.6";
	that.currentMimeType = "application/x-aspera-installer-6";
	that.installerPath = ""; 
	this.installerId = "aspera-installer";
	this.installerClsid = '531D5A4A-03D9-4404-AFF7-235A48E6B61E';
	this.cabVersion = '6,0,0,0';
	this.plugin = null;
	this.callback = null;

	initActiveX();
	that.callback = that.callbackDefault;

	// From the AsperaInstaller.prototype object literal
	this.installInProgress = false;

	this.installInstaller = function() {
		if (that.installInProgress || that.isInstallerAvailable())
			return;
		that.installInProgress = true;

		// Flag that survives page refresh (used by IE)
		if (AW.utils.parseSearchString('install') === '' && top === self) {
			// We are not running in an iframe. This is popup-specific code.
			var originParam = AW.utils.parseSearchString('origin');
			if (originParam != '') {
				originParam = "&origin=" + originParam;
			}
			window.location.search += "&install=true&path=" + this.installerPath + originParam;
		}

		// Start installation based on browser
		var macExt = navigator.platform.match(/Mac/) ? '-mac' : '';
		if (browser.is.ff) {
			//extensionURI = AW.utils.joinPaths(this.installerPath, "/bin/aspera-installer") + macExt + ".xpi?" + AW.utils.randomString(5);
      // AW.utils.logger("Installer points to: " + extensionURI);
			//window.location = extensionURI;
		//} else if (browser.is.chrome) {
		    // The optional way. Java install.
		    // startJarInstall();
		    // The old way. Broken on Chrome v21+
        // extensionURI = AW.utils.joinPaths(this.installerPath, "/bin/aspera-installer") + macExt + ".crx?" + AW.utils.randomString(5);
        // AW.utils.logger("Installer points to: " + extensionURI);
        // window.location = extensionURI;
		} else if (browser.is.ie) {
			// AW.utils.logger("You're running IE.");
			if (top !== self) {
				setTimeout(startCabInstall, 1000);
			} else {
				startCabInstall();
			}
		} else if (browser.is.safari) {
			// AW.utils.logger("You're running Safari.");
			startJarInstall();
		}

		// Start polling
		that.detectPluginInstall();
	};

	this.setCallback = function(cb) {
		that.callback = cb;
	};

	this.checkProcesses = function() {
		if (!that.plugin) {
			that.initPlug();
		}
		return that.plugin.checkProcesses('npasperaweb.dll,asperaweb.ocx,npinstaller.dll');
	};

	// Downloads and executes and MSI or EXE signed by Aspera
	this.executeCommands = function(commands) {
		if (!that.isInstallerAvailable())
			return;
		that.initPlug();
		if (that.plugin == null) {
			// AW.utils.logger("Aspera Installer plugin failed to load");
		}
		that.plugin.executeCommands(commands, that.callback);
	};

	this.fixConnectPrecedence = function() {
		if (that.plugin == null) return;
		that.plugin.fixConnectPrecedence();
	};

	this.restartBrowser = function (dllName) {
		//if (that.plugin == null) return;
		//that.plugin.RestartIe(window.location.href);
	}

	this.restartIe = function (url) {
		if (that.plugin === null) {
			initActiveX();
		}
		if (that.plugin === null) {
			// Still no plugin? Die.
			return;
		}
		that.plugin.restartIe(url);
	}

	this.detectPluginInstall = function(callback) {
		if (that.isInstallerAvailable())
		{
			// AW.utils.logger('AsperaInstaller detected');
			navigator.plugins.refresh();
			window.location.reload();
			return;
		} else {
			// AW.utils.logger('AsperaInstaller not detected');
		}

		// Retry if we didn't succeed
		 setTimeout( function() {
			that.detectPluginInstall(callback);
		  }, 2000);
	};

	this.initPlug = function() {
		if (browser.is.ie)
			initActiveX();
		else
			initNp();
	}

	// Allows you to override where the installer is pulled from
	this.setInstallSource = function(url) {
		that.installerPath = url;
	};

	this.callbackDefault = function(state, desc, percentage) {
		// AW.utils.logger(state + " " + desc + " " + percentage); // Default impl
	};

	//////////////////////////////////////////////////////////////////////
	// Version check
	this.isInstallerAvailable = function() {
		if (browser.is.ie) {
			if (that.plugin == null)
				initActiveX();
			return that.plugin != null;
		} else {
			AW.utils.reloadPlugins();
			return AW.utils.browser.hasMimeType(that.currentMimeType);
		}
	};

	this.installerUpdateAvailable = function() {
		return !that.isInstallerAvailable();
	};
	//////////////////////////////////////////////////////////////////////^M
	// Connect Version Verification

	this.hasHiddenUpdatedAsperaWeb = function(latestVersion, installedVersion) {
		// Sometimes Firefox on OS X VM's have a problem
		// loading a newly installed Aspera Web plugin. awInstaller
		// has a method to check the installed version directly and will
		// report that version number back.

		var hiddenVersion;

		if (!that.plugin) {
				that.initPlug();
		}

		if (!latestVersion) {
			return false;
		}

		try {
			hiddenVersion = that.plugin.getConnectVersion();
			if (hiddenVersion &&
				!AW.utils.versionLessThan(hiddenVersion, latestVersion))
			{
				// The hiddenVersion is at least the latestVersion.
				if (installedVersion && !AW.utils.versionLessThan(installedVersion, hiddenVersion)) {
					// In this case, we don't care if the installedVersion is
					// accurately reported.
					return false;
				}
				return true;
			} else {
				return false;
			}
		} catch (e) {
			// awInstaller doesn't support the method getConnectVersion.
			return false;
		}
	};
	//////////////////////////////////////////////////////////////////////
	// IE support
	function startCabInstall(id) {
		var s,
		    el,
		    cabFile;
		if (navigator.platform === 'Win32') {
		    // 32-bit IE
		    cabFile = AW.utils.joinPaths(that.installerPath, '/bin/npinstallhelper.cab')
		} else {
		    // 64-bit IE
		    cabFile = AW.utils.joinPaths(that.installerPath, '/bin/npinstallhelper64.cab')
		}
		el = document.createElement('div');
		el.style.fontSize = '0';
		el.style.lineHeight = '0';
		s = '<object id="' + that.installerId + '" classid="CLSID:' + that.installerClsid + '" width="1" height="1" ';
		s += 'codebase="' + cabFile + '#version=' + that.cabVersion + '" >';
		s += '</object>';
		s += "\n";
		el.innerHTML = s;

		document.body.appendChild(el);
	}

	function initActiveX() {
		// Attempt to initialize plugins that don't trigger any UI
		if (browser.is.ie) {
			try {
				// Initial check for availability
				that.plugin = new ActiveXObject(that.currentAppId);

				// Create windowed plugin
				var el = document.createElement('div');
				el.style.fontSize = '0';
				el.style.lineHeight = '0';
				var s = '<object id="' + that.installerId + '" classid="CLSID:' + that.installerClsid + '" width="1" height="1">';
				s += '</object>';
				s += "\n";
				el.innerHTML = s;

				document.body.appendChild(el);
				that.plugin = document.getElementById(that.installerId);
			} catch (error) {
				// AW.utils.logger("Failed to initialize IE plugin");
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	// Common NPAPI support
	function initNp() {
		if (that.plugin != null) {
			return;
		}
		// Only insert the installer plugin if we think it exists
		// to prevent 'Install Missing Plugin' dialog with FF.
		if (AW.utils.browser.hasMimeType(that.currentMimeType)) {
			var el = document.createElement('div');
			el.style.fontSize = '0';
			el.style.lineHeight = '0';
			var s = '<object id="' + that.installerId + '" width="1" height="1" type="' + that.currentMimeType + '" >';
			s += '</object>';
			s += "\n";
			el.innerHTML = s;

			document.body.appendChild(el);
		}
		that.plugin = document.getElementById(that.installerId);
	}

	//////////////////////////////////////////////////////////////////////
	// Google support

	//////////////////////////////////////////////////////////////////////
	// Firefox support

	//////////////////////////////////////////////////////////////////////
	// Java support
	function javaAvailable() {
		var minVer = "1.5.0";
		jreList = deployJava.getJREs();

		if (!navigator.javaEnabled()){
			return false;
		}

		for (var i=0; i<jreList.length; i++){
			jreVer = jreList[i].toString();
			if (jreVer.indexOf("_") != -1)
				jreVer = jreVer.slice(0,jreVer.indexOf("_"));
			if (!that.versionLessThan(jreVer,minVer))
				return true;
		}
		return false;
	}

	function startJarInstall() {
		var baseUrl, codepath, code, jar, cbk, applet;
		codepath = "aspera/install/applet/InstallerApplet.class";
		code = "aspera.install.applet.InstallerApplet.class";
		jar = "aspera-installer-applet.jar";
		cbk = "awiJarCallback";
		window.awiJarCallback = function(state, description, percent) {
			that.callback(state, description, percent);
		};

		var appletElement = document.createElement('div');
		appletElement.style.fontSize = '0';
		appletElement.style.lineHeight = '0';
		appletElement.setAttribute('id','installer_applet_container');
		document.body.appendChild(appletElement);

		// If Java is broken, it's tough cookies.
		appletElement.innerHTML=
			'<applet id="installer_applet" ' +
			'name="installer_applet" ' +
			'height="0" ' +
			'width="0" ' +
			'code="' + code + '" '+
			'codebase="' + AW.utils.joinPaths(that.installerPath, '/bin') + '" ' +
			'archive="' + jar + '?t='+new Date().getTime()+'" ' +
			'mayscript>' +
			'<param name="separate_jvm" value="true"/>' +
			'<param name="classloader_cache" value="false"/>' +
			'<param name="callback" ' +
			'value="'+cbk+'"/>' +
			'<param name="useragent" '+
			'value="'+navigator.userAgent+'"/>' +
			'<param name="pageurl" '+
			'value="'+document.URL+'"/>' +
			'</applet>';

		// TODO: Ping applet. If available, startInstall.
	}

	// Continuation hook
	if (this.installerUpdateAvailable() &&
		AW.utils.parseSearchString('install') === "true" &&
		window.location.hash.indexOf('requiresrestart') === -1)
	{
		this.installerPath = AW.utils.parseSearchString('path') + '/';
		this.installInstaller();
	}

};
// Aspera Connect Installer JavaScript Library
// Revision: 2011-01-12
//
// http://www.asperasoft.com/developer

/*//////////////////////////////////////////////////////////////////////////
	AW.ConnectInstaller
	Requires AW.utils and AW.AsperaInstaller
*/

AW.ConnectInstaller = function(aw_id, autoInstallLocation) {
	var that = this;
	// Preserve legacy compatibility, but allow 2.8+ users to
	// construct the object with a single argument, the autoInstallLocation.
	var autoInstallLocation = arguments.length === 1 ? aw_id + '/' : autoInstallLocation +'/';

	// New in Connect 3.1 Take a params object, optionally:
	// {
	// 	path : 'http://example.com',
	// 	language : 'en-US'
	// }
	var params;
	if (typeof arguments[0] === 'object') {
		params = arguments[0];
		if (params.path) {
			autoInstallLocation = params.path;
		}
	} else {
		params = {};
	}

	this.minVersion = '0';

	this.setLanguage = function(language) {
		// Language precedence will be as follows:
		// URL query string
		// language parameter sent when instantiating AW.ConnectInstaller
		// navigator.language or IE's version; navigator.userLanguage
		// default to "en-US"
		that.language = AW.utils.parseSearchString('awlang') || language || navigator.language ||
			navigator.userLanguage.replace(/(.*-)(.*)/, function(a, b, c) {return b + c.toUpperCase()}) || 'en-US';
	}
	this.setLanguage(params.language);


	////////////////////////////////////////////////////////////////////
	// Callback helpers
	this.aspera_installer_callback_function;
	function createInstallerEventCallback(state, description, percent) {
		//logger("createInstallerEventCallback() - " + state + ", " + description + ", " + percent);

		var e = new that.ConnectInstallerEvent();
		e.init(state, percent, description);
		if (typeof(that.aspera_installer_callback_function) != 'undefined')
			that.aspera_installer_callback_function(e);
	}

	////////////////////////////////////////////////////////////////////
	// ConnectInstaller
		this.installerPath = autoInstallLocation; // Root url of installation
		this.aspera_web_id = aw_id;
		this.applet_supported = true;
		this.os = "";

		this.awInstaller = new AW.AsperaInstaller();
		this.awInstaller.setCallback(createInstallerEventCallback);

		this.awId = "aspera-web-verify";
		this.asperaClsid = '531D5A4A-03D9-4404-AFF7-235A48E6B61E';
		this.currentMimeType = 'application/x-aspera-web';

		this.internalInstallLatest = function(callback) {
			if (!that.updateAvailable()) {
				createInstallerEventCallback("COMPLETE", "", 100);
				return;
			}
			if (callback != null)
				that.aspera_installer_callback_function = callback;

			if (that.continuationTimeout)
				clearTimeout(that.continuationTimeout);

			// First make sure that the aw installer is updated
			var connectInstaller = that;
			if (that.awInstaller.installerUpdateAvailable()) {
		// AW.utils.logger("ConnectInstaller.internalInstallLatest - Aspera installer update starting");

				that.awInstaller.setInstallSource(that.installerPath);
				that.awInstaller.setCallback(function(state, description, percent) {

					if (state == "COMPLETE") {
						// AW.utils.logger("ConnectInstaller.internalInstallLatest - Aspera installer finished. Continuing with Connect install");
						that.internalInstallLatest(); // Continue with original execution
					} else {
						createInstallerEventCallback(state, description, percent);
					}
				});
				that.awInstaller.installInstaller(); // Async
				return;
			};

			that.originalVersion = that.awInstaller.plugin.getConnectVersion();

			// Override install completion
			that.awInstaller.setCallback(function(state, description, percent) {
				if (state == "COMPLETE") {
					that.awInstaller.fixConnectPrecedence();
					if (that.shouldRestart()) {
						createInstallerEventCallback("RESTART_REQUIRED", "", 0);
						return;
					}
					// Start polling for Connect
					that.detectConnectInstall();
				}
				createInstallerEventCallback(state, description, percent);
			});

			// Build list of commands to execute
		  var commandList = "";
		  if (that.removalTool)
		commandList += that.removalTool + "|";
	  if (that.installPackage)
		commandList += that.installPackage;

	  // AW.utils.logger("ConnectInstaller.internalInstallLatest - Commands: " + commandList);
	  that.awInstaller.executeCommands(commandList); // Async
		};
		this.isUpgrade = function () {
		  if (that.installedVersion && that.updateAvailable()) {
			// Connect is installed AND there is an update available
			return true;
		  } else {
			return false
		  }
		};
		this.installLatest = function(callback, type) {
			if (typeof(type) == "undefined") {
				var installerWindow = window.open(AW.utils.joinPaths(that.installerPath, 'install/auto/index.html?&origin=' + window.location.href), 'installer', 'menubar=no, resizable=no, scrollbars=no, status=no, titlebar=yes, width=700, height=420, top=12, left=12');
			} else if (type == "manual") {
				that.internalInstallLatest(callback);
			}
		};
		this.getAsperaInstaller = function() {
			return that.awInstaller;
		};
		this.restartBrowser = function () {
			//that.awInstaller.restartBrowser("npasperaweb.dll, asperaweb.ocx");

			var url = AW.utils.parseSearchString('origin');
			if (url === '') {
				url = window.location.href;
			}
			that.awInstaller.restartIe(url); // Address of the page to reopen
		};
		this.restartIe = function (url) {
			that.awInstaller.restartIe(url);
		};

		function detectUpdatedPlugin() {
			// Detect if Aspera Web plugin was replaced. Refresh the browser if true.
			// Useful for web installation performed in another browser.
			var firstPluginFilename, secondPluginFilename;
			for (var i = 0, l = navigator.plugins.length; i < l; i += 1 ) {
				// Loop through plugins and check for a change in the name
				if (navigator.plugins[i].filename.indexOf('Aspera Web') !== -1) {
					// Store the initial Aspera Web plugin name.
					firstPluginFilename = navigator.plugins[i].filename;
				}
			};
			navigator.plugins.refresh(false);
			for (var i = 0, l = navigator.plugins.length; i < l; i += 1 ) {
				if (navigator.plugins[i].filename.indexOf('Aspera Web') !== -1) {
					// Store the Aspera Web plugin name after reloading plugins.
					secondPluginFilename = navigator.plugins[i].filename;
				}
			};
			if (firstPluginFilename !== secondPluginFilename) {
				// Reload the document if the plugin name changed after refreshing plugins.
				document.location.reload(true)
			}
		}
		detectUpdatedPlugin();
		//////////////////////////////////////////////////////////////////////
		// Connect checks
		var installedVersion = null;
		var availableVersion = null;
		var installPackage = null; // MSI or DMG path
		var manualInstallPackage; // Vista needs a different download-able package.
		var removalTool = null; // Tool used to remove previous versions cleanly
		var browser = AW.utils.browser;
	function getConnectReleaseVersion (pluginEl) {
	  // Supports checking Connect version for both pre-3.0 plugins
	  // and 3.0 plugins.
	  var version;
	  try {
		// First, the 3.0 way.
		version = JSON.parse(pluginEl.queryConnectVersion()).release_version;
	  } catch (e) {
		// Fall back to the pre-3.0 way.
		version = pluginEl.queryBuildVersion();
	  }
	  return version;
	}
		function checkVersions() {
			// Assumption that connectversions.js is loaded
			try {
				// We need available versions, first.
				that.versions = AW.connectVersions;
				if (!that.installPackage) {
					try {
						// AW.utils.logger("Parsing connect versions");
						// Find relevant OS
						for (var eIx=0; eIx<that.versions.entries.length; eIx++) {
							var e = that.versions.entries[eIx];
							if (e.navigator.platform == that.os) {
								that.availableVersion = e.version;

								// Find link for download package
								for (var lIx=0; lIx<e.links.length; lIx++) {
									var l = e.links[lIx];
									if (l.rel == 'enclosure-manual') {
										that.manualInstallPackage = AW.utils.joinPaths(that.installerPath, l.href);
									}
									if (l.rel == 'enclosure') {
										that.installPackage = AW.utils.joinPaths(that.installerPath, l.href);
									}
									if (l.rel == 'cleanup') {
										that.removalTool = AW.utils.joinPaths(that.installerPath, l.href);
									}
								}
							}
						}
					} catch(e) {
						// AW.utils.logger("Something failed when processing connectversions.js");
					}
				}
				if (!that.awInstaller.plugin) {
					// Load the installer plugin for version checking.
					that.awInstaller.initPlug();
				}
				if (that.awInstaller.plugin) {
					that.installedVersion = that.awInstaller.plugin.getConnectVersion();
				}
				if (!that.installedVersion) {
					// Fallback to query Connect itself for the version.
					if (browser.is.ie) {
						initConnectAx();
						if (that.controlAx != null) {
							that.installedVersion = getConnectReleaseVersion(that.controlAx);
						}
					} else {
						AW.utils.reloadPlugins();
						if (AW.utils.browser.hasMimeType(that.currentMimeType)) {
							if (AW.utils.browser.is.ff) {
								// Fork code to fix XPI install. Prevent the loading of plugin,
								// getting the version from the browsers mimeType object when possible.
								try {
									for ( var i=0, l = navigator.mimeTypes.length; i<l; i++ ) {
										if (navigator.mimeTypes[i].type === 'application/x-aspera-web') {
											that.installedVersion = !!navigator.mimeTypes[i].enabledPlugin.filename.match(/(\d+)/g) ?
												navigator.mimeTypes[i].enabledPlugin.filename.match(/(\d+)/g).splice(0, 3).join('.') :
												navigator.mimeTypes[i].enabledPlugin.version.split('.').splice(0, 3).join('.');
											if (!that.installedVersion) {
												// Linux lacks version info in mimeType object, but doesn't need XPI install. #
												initNp();
												if (that.controlNp != null) {
													that.installedVersion = getConnectReleaseVersion(that.controlNp).split('.').splice(0, 3).join('.');
												}
											}
											break;
										}
									}
								} catch (e) {
									// Version not available.
								}
							} else {
								initNp();
								if (that.controlNp != null) {
									that.installedVersion = getConnectReleaseVersion(that.controlNp).split('.').splice(0, 3).join('.');
								}
							}
						}
					}
				}
				if (!that.originalVersion) {
					// If we never knew about the original version, then set it.
					that.originalVersion = that.installedVersion;
				}
			} catch(e) {
				// AW.utils.logger("Failed to detect Connect plugin");
			}
			if (that.availableVersion && that.installedVersion &&
				that.awInstaller.hasHiddenUpdatedAsperaWeb(that.availableVersion, that.installedVersion)) {
					setRestartRequiredFlag();
			}
		};
		parseNavigator();
		checkVersions();

		function setRestartRequiredFlag() {
			if (window.location.hash.indexOf('requiresrestart') === -1) {
				window.location.hash += 'requiresrestart';
			}
		}

		this.shortenVersionTo = function(versionText, places) {
			try {
				return versionText.split('.').slice(0, places).join('.');
			} catch (e) {
				return;
			}
		};

		this.updateAvailable = function() {
			checkVersions();
			if (that.availableVersion == null) {
				// AW.utils.logger("ConnectInstaller.updateAvailable() might be too early. connectversions.js not parsed");
			}

			if (!that.installedVersion ||
				AW.utils.versionLessThan(that.shortenVersionTo(that.installedVersion, 3), that.shortenVersionTo(that.availableVersion, 3)))
			{
				return true;
			}
			return false;
		};

		this.getLatestConnectVersion = function( os ) {
			return that.availableVersion;
		};

		this.asperaWebInstalled = function() {
			checkVersions();
			if (!that.installedVersion)
				return false;
			else
				return true;
		};

		this.detectConnectInstall = function(installer) {
			if (installer == null)
				installer = that;

			if (!that.updateAvailable()) {
				// AW.utils.logger('ConnectInstaller - Connect detected');
				createInstallerEventCallback("READY", "Aspera Connect is now available", 100);
				return;
			} else {
				// AW.utils.logger('ConnectInstaller - Connect not (yet) detected');
			}

			// Retry if we didn't succeed
			setTimeout( function() { // 2.7 support
				that.detectConnectInstall();
			}, 2000);
		};

		// After installation is completed, call this method to determine if a restart is required
		this.shouldRestart = function() {
			var currentVer, plug;

			if (typeof(that.originalVersion) != 'undefined' && that.originalVersion.length > 0) {
				// Restart IE
				if (browser.is.ie)
					return true;
			}

			// Sometimes navigator.refresh doesn't pick up the plugin. Or the plugin didn't
			// get ordered correctly when upgrading.
			navigator.plugins.refresh();
			for (var i=0; i<navigator.plugins.length; i++) {
				plug = navigator.plugins[i];
				if (/Aspera Web/.test(plug.name) && plug[0].type === that.currentMimeType) {
					// Only compare the first three places.
					currentVer = that.shortenVersionTo(plug.version, 3);
					break;
				}
			}

			if (!currentVer ||
				AW.utils.versionLessThan(currentVer, that.availableVersion)) {
				return true;
			}

		return false;
		};

		function defaultCallback(state, desc, percentage) {
			// AW.utils.logger(state + " " + desc + " " + percentage); // Default impl
		};

		/////////////////////////////////////////////////////////////
		// iFrame Auto Install

		this.iframeDomain = function() {
			// Needed for postMessage from parent window to iframe.
			function createUrl(url) {
				var domainUrl;
				domainUrl = [];
				// Domain URL needs to be in the form 'protocol://domain'
				url = url.split(/\//); // IE8 fails to add // to the array, other browsers do.
				// Clean the array of blank entries.
				for (var i = 0, l = url.length; i < l; i +=1) {
					if (url[i] !== '') {
						domainUrl.push(url[i]);
					}
				}
				domainUrl = domainUrl.slice(0,2);
				domainUrl.splice(1,0,'//');
				return domainUrl.join('');
			}
			if (that.installerPath.indexOf('http') === 0) {
				// We have absolute path for the installer path
				return createUrl(that.installerPath);
			} else {
				// We have a relative URL and the iframe domain comes from window.location.href
				return createUrl(window.location.href);
			}
		};

		this.startEmbeddedInstall = function(options) {
			// Start the iframe install.
			var iframeWrapper
			, iframeWidth
			, iframeHeight
			, divTitle
			, modalOverlay
			, iframe
			, parent;

			options = options || {};

			if (document.getElementById('aspera-iframe-container')) {
				// Aviod inserting the iframe twice.
				return;
			}

			if (options.installDismiss) {
				if (typeof options.installDismiss !== 'function') {
					throw new Error('startEmbeddedInstall: The "installDismiss" option must be a function.');
				}
			}
			if (options.installClose) {
				if (typeof options.installClose !== 'function') {
					throw new Error('startEmbeddedInstall: The "installClose" option must be a function.');
				}
			}
			if (options.prompt === 'false') {
				// Also accept a boolean in the form of a string.
				options.prompt = false;
			}
			// Inserting a stylesheet into the DOM for more manageable styles.
			AW.utils.loadFile(AW.utils.joinPaths(that.installerPath, 'install/auto-iframe/parent.css'), 'css');

			// Build and insert the iframe.
			iframeWrapper = document.createElement('div');
			iframeWrapper.id = 'aspera-iframe-container';
			iframeWrapper.className = iframeWrapper.id;

			iframeHeight = 220;
			iframeWidth = iframeHeight * 1.61;

			iframe = document.createElement('iframe');
			iframe.id = 'aspera-connect-installer';
			iframe.name = iframe.id;
			iframe.className = iframe.id;
			iframe.src = AW.utils.joinPaths(that.installerPath, '/install/auto-iframe/index.html#awlang=' + that.language + '&origin=' + window.location.href);
			iframe.scrolling = 'no';
			iframe.frameBorder = '0';
			iframeWrapper.appendChild(iframe);
			if (options.parentId) {
				// Insert the iframe with a button into the provided element.
				parent = document.getElementById(options.parentId);
				parent.appendChild(iframe);
				parent.style.height = iframeHeight + 'px';
				parent.style.width = iframeWidth + 'px';
				parent.style.visibility = 'visible';
				parent.style.display = 'block';
			} else {
				// Modal overlay doesn't get styles from a stylesheet.
				// Apply all styles with JS.
				parent = document.body;
				// Display the iframe as a modal dialog if no parentId is supplied.
				modalOverlay = document.createElement('div');
				modalOverlay.id = 'aspera-modal-overlay';
				modalOverlay.className = modalOverlay.id;
				modalOverlay.innerHTML = '&nbsp;';
				// Background image set dynamically because of image path.
				modalOverlay.style.backgroundImage = 'url('+ AW.utils.joinPaths(that.installerPath, 'install/auto-iframe/images/bg_white_75pct.png') + ')';
				// The iframe is set to 100% height and width of its container.

				iframeWrapper.style.height = iframeHeight + 'px';
				iframeWrapper.style.width = iframeWidth + 'px';
				// Center the iframe container.
				iframeWrapper.style.marginTop = (iframeHeight / 2) * -1 + 'px';
				iframeWrapper.style.marginLeft = (iframeWidth / 2) * -1 + 'px';
				parent.appendChild(modalOverlay);
				parent.appendChild(iframeWrapper);
			}

			function removeIframe(id) {
				// Takes a string or an array of id's.
				var container, parent;
				function removeEl(id) {
					container = document.getElementById(id);
					parent = container.parentNode;
					parent.removeChild(container);
				}
				if (typeof id === 'string') {
					removeEl(id);
				} else if (id instanceof Array) {
					for (var i = 0, l = id.length; i < l; i += 1) {
						try {
							removeEl(id[i]);
						} catch (e) {

						}
					}
				}
			};

			function handleMessage(event) {
				// iFrame installation: Handling of messages by the parent window.
				var iframe = event.source;
				// AW.utils.logger('iframeDomain: ' + that.iframeDomain());
				if (event.origin !== that.iframeDomain()) return;
				// AW.utils.logger('Parent window got the message: ' + event.data);
				if (window.location.hash.indexOf('embeddedinstall') === -1 && event.data === 'embeddedinstall') {
					// The hash does not already contain 'embeddedinstall'.
					window.location.hash += event.data;
				}
				if (event.data === 'iframeloaded') {
					// iframe continuation hook.
					iframe.postMessage('minversion='+that.minVersion, event.origin);
					if (window.location.hash.indexOf('embeddedinstall') !== -1 ||
						options.prompt === false)
					{
						// Parent tells the iframe that we are in the installation process.
						iframe.postMessage('installing', event.origin);
					} else {
						iframe.postMessage('notinstalling', event.origin);
					}
					if (window.location.hash.indexOf('requiresrestart') !== -1) {
						// Parent tells the iframe that we need a restart.
						// Ensures restart in case user only refreshed after install.
						// Iframe will show the 'restart' button.
						iframe.postMessage('requiresrestart', event.origin);
					}
					if (options.stylesheet) {
						iframe.postMessage('insertstylesheet=' + options.stylesheet + '?' + AW.utils.randomString(), event.origin);
					}
				}
				if (event.data === 'restorehash') {
					window.location.hash = window.location.hash.replace(/installing&/, '');
					window.location.hash = window.location.hash.replace(/embeddedinstall/, '');
				}
				if (event.data === 'installerror') {
					// Allow the iframe to trigger callbacks in the parent window.
					if (options.installError) {
						options.installError();
					};
				}
				if (event.data === 'connectready') {
					// Fire the connectReady callback if one is supplied.
					if (that.installerCallbacks && that.installerCallbacks.connectReady) {
						that.installerCallbacks.connectReady();
					}
				}
				if (event.data === 'reloadparent') {
					// Fire the connectReady callback if one is supplied.
					window.location.reload();
				}
				if (event.data === 'restartbrowser') {
					// Restart for IE upgrades.
					window.location.hash = window.location.hash.replace(/requiresrestart/, '');
					window.location.hash = window.location.hash.replace(/embeddedinstall/, '');
					that.awInstaller.restartIe(window.location.href);
				}
				if (event.data === 'removeiframe') {
					// Remove all elements related to the iframe from the parent.
					if (options.parentId) {
						removeIframe(options.parentId);
					} else {
						removeIframe(['aspera-modal-overlay', 'aspera-iframe-container']);
					}
					// Call the installDismiss callback, if it exists.
					if (options.installDismiss) {
						options.installDismiss();
					}
				}
				if (event.data === 'requiresrestart') {
					// Fire the connectReady callback if one is supplied.
					window.location.hash.replace(/embeddedinstall/, '');
					if (window.location.hash.indexOf('requiresrestart') === -1) {
						window.location.hash += 'requiresrestart';
					}
				}
				if (event.data === 'silentremoveiframe') {
					// Remove all elements related to the iframe from the parent.
					// Do not call the installDismiss callback.
					if (options.parentId) {
						removeIframe(options.parentId);
					} else {
						removeIframe(['aspera-modal-overlay', 'aspera-iframe-container']);
					}
				}
			}

			// Set listener for messages from the iframe installer.
			if (window.addEventListener){
				window.addEventListener("message", handleMessage, false);
			} else {
				window.attachEvent("onmessage", handleMessage);
			}
		};

		this.startExternalInstall = function() {
			// Start the popup install.
			installerWindow = window.open(AW.utils.joinPaths(that.installerPath, 'install/auto/index.html' +
				'?'+ 'minversion=' + that.minVersion + '#awlang=' + that.language + '&'),
				'installer', 'menubar=no, resizable=no, scrollbars=no, ' +
				'status=no, titlebar=yes, width=560, height=290, top=12, left=12');
			// TODO - Marco: Add feature - Setup communication between popup
			// and the window that opened it so 'connectReady' events can be passed
			// around with postMessage.
		};

		this.init = function(options) {
			// options:
			// minVersion : Passing empty string ("") or "latest" will set the minVersion to the
			// highest available version for the client's environment. If user version is equal
			// to or greater than this version, no upgrade will be shown. If the value is higher
			// than the available version, the user will be prompted that Aspera Connect is not
			// supported yet for their browser and platform combination.
			// connectReady : Callback to be called when installation is complete.
			// install : Callback if an install is required.
			// noInstall: Callback no install available. Takes a 'code' and 'description' argument.
			////////////

			// The parent element, if supplied, should have style="display:none" so
			// it doesn't take up unnecessary space when not needed.

			function availableVersion() {
				// We need available versions, first.
				var versions = AW.connectVersions;
				parseNavigator();
				for (var eIx=0; eIx<versions.entries.length; eIx++) {
					var e = versions.entries[eIx];
					if (e.navigator.platform == that.os) {
						return e.version;
					}
				}
			};

			options = options || {};
			if (options.connectReady) {
				that.installerCallbacks = {connectReady : options.connectReady};
			}

			if (typeof options.minVersion !== 'undefined' && (options.minVersion.toLowerCase() === 'latest' || options.minVersion === '')) {
				options.minVersion = availableVersion();
			} else {
				// minVersion is the supplied value or it is set to the highest available version.
				options.minVersion = options.minVersion || availableVersion();
			}
			that.minVersion = options.minVersion;

			if (that.installedVersion &&
				!AW.utils.versionLessThan(that.installedVersion, options.minVersion) &&
				options.connectReady)
			{
				// OK - Connect version passes minVersion test.
				options.connectReady();
				return;
			}

			if (that.installedVersion && // The installedVersion could be undefined and versionLessThan can't deal.
				AW.utils.versionLessThan(that.installedVersion, options.minVersion) &&
				options.install)
			{
				// minVersion supplied, but installedVersion is less than the minVersion
				options.install();
				return;
			}

			if (!that.installedVersion && options.install) {
				// Connect is not installed.
				options.install();
				return;
			}
		};

		//////////////////////////////////////////////////////////////////////
		// Documentation helpers
		this.setUserDocsLocation = function(url) {
			// Takes a custom URL for documentation if the SDK user hosts the docs.
			that.customUserDocsLocation = url;
		};
		this.userDocsLocation = function() {
			// return the default documentation location if one isn't set by the user.
			return that.customUserDocsLocation || 'http://download.asperasoft.com/download/docs/connect/2.8.1/';
		}

		//////////////////////////////////////////////////////////////////////
		// Platform checks
		function parseNavigator() {
		  // This function actually sets the user's platform, mainly for lookup
		  // in connectversions.js.
			var agent = navigator.userAgent;

			// change all of the windows lines to
			// agent.indexOf("Windows") != -1) that.os = "Win32";
			if (agent.indexOf("Windows NT 6.0") != -1) that.os = "Win32-Vista"; //Vista
			if (agent.indexOf("Windows NT 6.1") != -1) that.os = "Win32"; //Win7
			if (agent.indexOf("Windows NT 10.0") != -1) that.os = "Win32"; //Win7
			if (agent.indexOf("Windows NT 6.2") != -1) that.os = "Win32"; //Win8, Server 2012
			if (agent.indexOf("Windows NT 6.3") != -1) that.os = "Win32"; //Win8.1, Server 2012 R2
			if (agent.indexOf("Windows NT 5") != -1) that.os = "Win32"; //Win XP and 2003
			if (agent.indexOf("Win64") !== -1) that.os = "Win64";
			if (agent.indexOf("Windows NT 6.0") != -1 && agent.indexOf("Win64") !== -1) that.os = "Win64-Vista"; //Vista 64
			if (agent.indexOf("Intel Mac") != -1)    that.os = "MacIntel";
			if (agent.indexOf("PPC Mac") != -1)              that.os = "MacPPC";
			if (agent.indexOf("Linux") != -1)                that.os = "Linux i686";
			if (agent.indexOf("Linux x86_64") != -1) that.os = "Linux x86_64";

			if ((/Firefox\/[23]/.test(agent)) ||
					((agent.indexOf("Chrome") != -1) && (that.os === "Win32" || that.os === "Win32-Vista")) ||
					(agent.indexOf("Linux x86_64") != -1) ||
					(agent.indexOf("Linux") != -1) ||
					(agent.indexOf("Windows NT 5.0") != -1) ||
					(agent.indexOf("PPC Mac") != -1)) {
					that.applet_supported = false;
			}



			if (that.os === "MacIntel" && /Mac OS X 10[._]6/.test(agent)) {
				        that.os = "MacIntel-10.6-legacy";
					that.applet_supported = false;
			}

		};

		this.getEnvSupportInfo = function () {
			// If something needs to be installed, help devs
			// ask if the environment is suitable.
			// Return an object containing:

			// description: "describes the special case"
			// platform: The platform key used for lookup in connectinstaller.js,
			//			if different than navigator.platform.
			// package: "path to download package if available"
			// isSupported: bool. Is connect supported in this special case?
			// downloadOnly: bool. Is downloading the installer the only available option in this case?
			// code: Environment code for special environments

			// Browser and platform tests used to find 'special case' environments.
			// Special cases will get either an older download for that OS,
			// or a message saying that the env is not supported.
			var uAgent,
				uPlatform,
				docStyle,
				isMacIntel,
				isMacIntel10_4,
				isMacIntel10_6,
				isSupportedOS,
				isSupportedBrowser,
				envProfiles;
			uAgent = navigator.userAgent;
			uPlatform = navigator.platform;
			docStyle = document.documentElement.style;
			isMacIntel = /MacIntel/.test(uPlatform);
			isMacIntel10_4 = isMacIntel && /Mac OS X 10[._]4/.test(uAgent);
			isMacIntel10_5 = isMacIntel && /Mac OS X 10[._]5/.test(uAgent);
			isMacIntel10_6 = isMacIntel && /Mac OS X 10[._]6/.test(uAgent);

			// Supported OS's:
			// 	 Windows (32-bit and 64-bit, NT 5.1 or higher, "XP")
			//   MacIntel and MacPPC (version 10.4 or higher)
			//   Linux (32 and 64)
			isSupportedOS = (/Win/.test(uPlatform) && !AW.utils.versionLessThan(uAgent.match(/Windows NT (\d+.\d+)/)[1], '5.1')) ||
				(/MacIntel/.test(uPlatform) && parseInt(uAgent.match(/OS X 10[._](\d+)/)[1]) >= 5) ||
				(/Linux/.test(uPlatform));

			// Supported Browsers:
			//   Firefox (version 3 or higher)
			//   Safari (Mac only, version 4 or higher)
			//   Chrome (any version)
			//   IE (version 7 or higher).

			isSupportedBrowser = (AW.utils.browser.is.ff && parseInt(uAgent.match(/Firefox\/(\d+)/)[1]) >= 3) ||
				(AW.utils.browser.is.safari && /Mac/.test(uPlatform) && uAgent.match(/Version\/(\d+)/).length > 0 && parseInt(uAgent.match(/Version\/(\d+)/)[1]) >= 4) ||
				(AW.utils.browser.is.chrome) ||
				(AW.utils.browser.is.gteIe7);

			function asperaWebVersionIsValid() {
				var version;
				for ( var i=0, l = navigator.mimeTypes.length; i<l; i++ ) {
					if (navigator.mimeTypes[i].type === 'application/x-aspera-web') {
						try {
							version = !!navigator.mimeTypes[i].enabledPlugin.filename.match(/(\d+)/g) ?
								navigator.mimeTypes[i].enabledPlugin.filename.match(/(\d+)/g).splice(0, 3).join('.') :
								navigator.mimeTypes[i].enabledPlugin.version.split('.').splice(0, 3).join('.');
							break;
						} catch (e) {
							version = '';
						}
					}
				}
				if (!version) {
					// No version detected.
					return false;
				} else {
					if (AW.utils.versionLessThan(version, '2.8.2')) {
						// The detected version is LOWER than 2.8.2.
						return false;
					} else {
						// The version may be trusted.
						return true;
					}
				}
			}

			function chromeSupportsNapapi() {
				// Chrome version 35 on Linux dropped NPAPI support.
				// Linux with chrome less than v35 or not linux.
				var isLinux = window.navigator.platform.toLowerCase().indexOf('linux') > -1;
				if (!AW.utils.browser.is.chrome) {
					// In case we're called in non-Chrome browsers.
					return true;
				}
				if (!isLinux) {
					// Not Linux.
					return true;
				}
				if (isLinux && parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10) >= 34) {
					return false;
				}
				return true;
			}

			envProfiles = {
				// Be careful when adding special cases to test. They must be mutually exclusive.
				isNotWhiteListed : {
					// This is the ONE test for unsupported browsers and OS's.
					// All other tests are for cases that fall inside (isSupportedOS && isSupportedBrowser).
					test : !(isSupportedOS && isSupportedBrowser),
					description : "Unsupported browser or operating system.",
					code : (function() {
						var specifics = function () {
							if (!isSupportedOS) {
								return 'unsupportedOS';
							}
							if (!isSupportedBrowser) {
								return 'unsupportedBrowser';
							}
							if (!isSupportedOS && !isSupportedBrowser) {
								return 'unsupportedBrowserAndOS';
							}
						};
						return specifics();
					}()),
					isSupported : false
				},

				// Fix XPI installs. Firefox, no installer plugin, Aspera Web plugin exists,
				// mimeType-verified plugin version is 2.8.2 or higher.
				firefoxUpgrade : {
					test: (AW.utils.browser.is.ff && !AW.utils.browser.hasMimeType('application/x-aspera-installer') &&
					!asperaWebVersionIsValid() && AW.utils.browser.hasMimeType('application/x-aspera-web')),
					description : "Upgrade from manual install on Firefox",
					code: "downloadAndInstall",
					downloadOnly: true,
					isSupported:true
				},

				// IE 7 and IE 8 with autoinstall. #26476
				Ie7or8 : {
				  test : (AW.utils.browser.is.ie8 || AW.utils.browser.is.ie7),
				  description: "IE7 or IE8",
				  code: "downloadAndInstall",
				  downloadOnly: true,
				  isSupported:true
				},

				// In Safari v4 and higher, Mac OS X only,
				// a Java update has broken the bootstrapping ability of our installer plugin.
				// Probably this one: http://support.apple.com/kb/HT5982
				// Exclude OS X 10.6, #28236
				isSafari4Plus : {
  				  test : (AW.utils.browser.is.safari && /Mac/.test(uPlatform) && uAgent.match(/Version\/(\d+)/).length > 0 && parseInt(uAgent.match(/Version\/(\d+)/)[1]) >= 4 && !isMacIntel10_6),
  				  description: "Safari",
  				  code: "downloadAndInstall",
  				  downloadOnly: true,
  				  isSupported:true
				},

				isChrome : {
				  test : (uAgent.toLowerCase().indexOf('chrome') > -1 && !isMacIntel10_6),
				  description: "Google Chrome",
				  code: "chromeBrowser",
				  downloadOnly: true,
				  isSupported:true
				},

				MacIntel10_4 : {
					// Legacy install supported. Safari 4 is the newest version available for OS X 10.4.
					// Download only link to 2.7.2 legacy package
					test : (isMacIntel10_4),
					description : "OS X 10.4 is not supported.",
					// platform : 'MacIntel-legacy',
					code: "unsupportedOS",
					// downloadOnly: true,
					isSupported : false
				},

				safari4MacIntel10_5 : {
					// Safari 5 is the newest version available for OS X 10.5.
					// Ask for browser upgrade.
					// Download only link to current package
					test : ('WebkitAppearance' in docStyle && /Version\/4./.test(uAgent) && isMacIntel10_5),
					description : "Safari 4, Mac Intel OS X 10.4",
					platform : 'MacIntel',
					code: "10_5Safari4_0",
					downloadOnly: true,
					isSupported : true
				},

				safari5_0MacIntel10_5 : {
					// Safari 5.0.x is the newest version available for OS X 10.5.
					// Browser upgrade message.
					// Download only link to current package.
					test : ('WebkitAppearance' in docStyle && /Version\/5.0/.test(uAgent) && isMacIntel10_5),
					description : "Safari 5, Mac Intel OS X 10.5",
					platform : 'MacIntel',
					code: "10_5Safari5_0",
					downloadOnly: true,
					isSupported: true
				},

				safari5_0MacIntel10_6 : {
					// Safari 5.1 is the latest Safari version available for OS X 10.6.
					// Give 'browser upgrade' message.
					// Download only link to the current package.
					test : ('WebkitAppearance' in docStyle && /Version\/5.0/.test(uAgent) && isMacIntel10_6),
					description : "It looks like you're using an old version of Safari. Upgrade to the latest version for the best file-transfer experience. <br /><a href='http://www.apple.com/safari/'>Get the latest Safari browser now</a>. <p>If you do not want to upgrade your browser now, download the installer from the link below. Please note: For Safari 5.0, the plug-in will only work in 32-bit mode.</p>",
					platform : 'MacIntel',
					code: "10_6Safari5_0",
					downloadOnly: true,
					isSupported : true
				},

				macIntel10_6 : {
					// No 64-bit plugin support for OS X 10.6. #28236
					// Give informational message for 10.6 users not running Safari 5.0. Old Safari users get another message.
					// Download only link to the current package.
					// test : (isMacIntel10_6 && !(/Version\/5.0/.test(uAgent))),
					test : (isMacIntel10_6),
					description : "Mac Intel OS X 10.6",
					platform : 'MacIntel-10.6-legacy',
					code: "downloadAndInstall",
					downloadOnly: true,
					isSupported : true
				},

				firefox3MacIntel10_4 : {
					// Mac Firefox 3.6 10.4, give link to 2.7.2 legacy package. No message.
					// On PPC, 3.6 is the highest FF available.
					test : ('MozAppearance' in docStyle && /Firefox\/3\./.test(uAgent) && isMacIntel10_4),
					// platform : 'MacIntel-legacy',
					// downloadOnly: true,
					description : "OS X 10.4 is not supported.",
					code: "unsupportedOS",
					isSupported : false
				},

				firefox3MacIntel10_5Plus : {
					// Mac Firefox 3.6, OS X 10.5+. Give 'browser upgrade' message.
					test : ('MozAppearance' in docStyle && /Firefox\/3\./.test(uAgent) && /MacIntel/.test(uPlatform) && !isMacIntel10_4),
					description : "Firefox 3, OS X 10.5 or higher is not supported.",
					code: "firefox310_5Plus",
					isSupported : false
				},

				firefox3Win : {
					// Upgrade Firefox
					test : ('MozAppearance' in docStyle && /Firefox\/3\./.test(uAgent) && /^Win/.test(uPlatform)),
					description : "Firefox 3.x on Windows is not supported. Upgrade browser.",
					code: "firefox3Win",
					isSupported : false
				},

				firefox3Linux : {
					// Upgrade Firefox
					test : ('MozAppearance' in docStyle && /Firefox\/3\./.test(uAgent) && /^Linux/.test(uPlatform)),
					description : "Firefox 3.x on Linux is not supported. Upgrade browser.",
					code: "firefox3Linux",
					isSupported : false
				},

				firefox40AndGreaterNoAutoInstallation : {
					test: (AW.utils.browser.is.ff && parseInt(uAgent.match(/Firefox\/(\d+)/)[1]) >= 40),
					description : "Please download and run the installer script.",
					code: "downloadAndInstall",
					downloadOnly: true,
					isSupported : true
				},

				chromeVersionUnsupported : {
					// Chrome v35 on Linux has dropped NPAPI support.
					test : (!chromeSupportsNapapi()),
					description : "Chrome version does not support NPAPI plugins.",
					code : "chromeNoNpapi",
					isSupported : false
				},

				win8IeNoActiveX : {
					// Plugins are broken in Windows 8 IE, 64-bit chrome-less app. Desktop IE is OK.
					test : (AW.utils.browser.is.ie && uAgent.match(/Windows NT/) &&
						AW.utils.versionLessThan('6.1', uAgent.match(/Windows NT (\d+.\d+)/)[1]) && !AW.utils.browser.activeXEnabled),
					description : "Unsupported browser configuration",
					code : "unsupportedBrowser",
					isSupported : false
				},

				linux32 : {
					test: (/Linux i686/.test(uPlatform) && chromeSupportsNapapi()),
					description : "Please download and run the installer script.",
					code: "linux32",
					platform: 'Linux i686',
					downloadOnly: true,
					isSupported : true
				},

				linux64 : {
					test: (/Linux x86_64/.test(uPlatform) && chromeSupportsNapapi()),
					description : "Please download and run the installer script.",
					code: "linux64",
					downloadOnly: true,
					isSupported : true
				},
				win10AndGreaterNoAutoInstallation : {
					test: (/Win/.test(uPlatform) && !AW.utils.versionLessThan(uAgent.match(/Windows NT (\d+.\d+)/)[1], '10.0')),
					description : "Please download and run the installer script.",
					code: "downloadAndInstall",
					downloadOnly: true,
					isSupported : true
				}
			};

			generateResult = function() {
			// If we have a 'special case', use the object to customize the response.
			for ( profile in envProfiles) {
				if (envProfiles.hasOwnProperty(profile) && envProfiles[profile].test) {
					platform = envProfiles[profile].platform;
					return {
						description: envProfiles[profile].description || '',
						code: envProfiles[profile].code || '',
						packageURL: that.manualInstallPackage || that.installPackage || '',
						packageVersion: that.availableVersion || '',
						downloadOnly: envProfiles[profile].downloadOnly || false,
						isSupported: envProfiles[profile].isSupported,
						platform: envProfiles[profile].platform || window.navigator.platform
					};
				}
			}
			// Not a special case. Build a meaningful response object.
			return {
					isSupported: true,
					code: '',
					packageURL: that.manualInstallPackage || that.installPackage || '',
					packageVersion: that.availableVersion || '',
					downloadOnly: false,
					description: '',
					platform: window.navigator.platform
				};
			};
			return generateResult();
		};

		// This func name is a misnomer. Deprecated from prev api
		this.platformSupportsApplet = function() {
			return that.platformSupportsConnect();
		};

		this.platformSupportsConnect = function() {
			return (that.os != "");
		};
		//////////////////////////////////////////////////////////////////////
		// IE support
		function initConnectAx() {
			if (document.getElementById(that.awId)) {
				that.controlAx = document.getElementById(that.awId);
				return;
			}
			var el = document.createElement('div');
			el.style.overflow = 'hidden'; // Fix pre-2.8 escaping AW plugin text. #15730.
			el.style.fontSize = '0';
			el.style.lineHeight = '0';
			var s = '<object id="' + that.awId + '" width="1" height="1" type="application/x-aspera-web" >';
			s += '</object>';
			s += "\n";
			el.innerHTML = s;

			document.body.appendChild(el);

			that.controlAx = document.getElementById(that.awId);

		};

		//////////////////////////////////////////////////////////////////////
		// Common NPAPI support
		// Handle to the plugin object
		function initNp() {
			if (document.getElementById(that.awId)) {
				that.controlNp = document.getElementById(that.awId);
				return;
			}

			var el = document.createElement('div');
			el.style.fontSize = '0';
			el.style.lineHeight = '0';
			var s = '<object id="' + that.awId + '" width="1" height="1" type="application/x-aspera-web" >';
			s += '<param name="AW_IMGSRV" value="" />';
			s += '</object>';
			s += "\n";
			el.innerHTML = s;

			document.body.appendChild(el);
			that.controlNp = document.getElementById(that.awId);
		};

		//////////////////////////////////////////////////////////////////////
		// Google support

		//////////////////////////////////////////////////////////////////////
		// Firefox support

		//////////////////////////////////////////////////////////////////////
		// Java support
		this.javaAvailable = function() {
			var minVer = "1.5.0";
			jreList = deployJava.getJREs();

			if (!navigator.javaEnabled()){
				return false;
			}

			for (var i=0; i<jreList.length; i++){
				jreVer = jreList[i].toString();
				if (jreVer.indexOf("_") != -1) jreVer = jreVer.slice(0,jreVer.indexOf("_"));
				if (!AW.utils.versionLessThan(jreVer,minVer)) return true;
			}
			return false;
		};

	this.ConnectInstallerEvent = function() {
		var that = this;
		// A ConnectInstallerEvent is passed in the callback during the
		// java-applet-based installer.  Each event has these properties:
		//
		//   1) state: one of "START", "COMPLETE", "DOWNLOAD", "INSTALL",
		//          or "ERROR"
		//   2) description: A user-friendly description of the event.
		//   3) percent: The overall progress toward completion.
		//   4) exceptions: An Array of exceptional conditions that may
		//          be important.  Currently, the only possible condition is
		//            ConnectInstallerEvent.IE_PLUGIN_NOT_INSTALLED
		//          which can only happen during the "COMPLETE" event.
		//


		this.IE_PLUGIN_NOT_INSTALLED = "Plugin installation for Internet Explorer failed.";

		this.init = function(state, percent, description) {
			that.state = state + "";
			loadExceptions(); // modifies this.state
			that.description = convertStateToString(state,description);
			that.percent = inferPercent(state,percent);
		};

		//Internal use only. Not part of the API.

		function loadExceptions() {
			var exceptions = new Array();
			switch (that.state) {
				case "COMPLETE-NO-IE":
					exceptions.push(that.IE_PLUGIN_NOT_INSTALLED);
					break;
				default:
					break;
			}
			if (that.state == "COMPLETE-NO-IE") {
				// The lack of IE support should be communicated in something
				// other than 'state'.
				that.state = "COMPLETE";
			}
		};

		//Internal use only. Not part of the API.
		function inferPercent(state,percent) {
			switch (state) {
			case "START":  return 0;
			case "COMPLETE":
			case "READY": return 100;
			case "COMPLETE-NO-IE":	return 100;
			case "DOWNLOAD":
			case "INSTALL":
			case "ERROR":
			default:  return percent;
			}
		};
		//Internal use only. Not part of the API.
		function convertStateToString(state,description) {
			s = "";
			var lstate = ""+state;

			switch (lstate) {
			case "START":		   s="Starting the installation."; break;
			case "DOWNLOAD":	   s="Downloading Aspera Connect."; break;
			case "READY":          s="Aspera Connect is ready."; break;
			case "COMPLETE":	   s="Installation complete."; break;
			case "COMPLETE-NO-IE": s="Installation complete with no support for Internet Explorer.";  break;
			case "ERROR":		   s=description; break;
			case "INSTALL":		   s="Installing Aspera Connect."; break;
			default:			   s="Installing Aspera Connect.";
			}
			return s;
		}
	};
};
