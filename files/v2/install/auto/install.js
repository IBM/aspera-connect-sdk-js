var parseSdkLocation = function (path) {
	var sdkLocation,
		prefixIndex;
	prefixIndex = window.location.href.lastIndexOf(path);
	sdkLocation = window.location.href.substr(0, prefixIndex);
	return sdkLocation;
};
var installerPath = parseSdkLocation('install/auto');

var isLogging = (function() { //This is here so application.js doens't rely on AW.utils for logging.
	//return false;
	var console = window.console || '';
	if (console.log || !window.attachEvent) {
		return true;
	} else {
		return  false;
	}
}());

var logger = function(msg) {
	if ( this.isLogging ) {
		console.log(msg);
	} else {
		//alert(msg);
	}
}; 
var restoreHash = function(text) {
	var replaceText = new RegExp(text);
	window.location.hash = window.location.hash.replace(replaceText, '');
};

var installPlugin = function() {
	// Precondition: plugin is not installed
	var title = document.getElementById('install_title');
	title.innerHTML = localize('statusTitle');
	if (!awInstaller.installerUpdateAvailable())
		return;

    // logger('Insert progress bar...');
	var progressContainer = document.createElement('div');
	progressContainer.className = 'progress_container';
	progressContainer.id = 'progress_container';
	progressContainer.innerHTML = localize('generalInstallerInstructions') + '<br><br>' + 
		localize('pluginInstallInfo') + '<br><br>' + 
		localize('skipAutoInstall') +
		' <a href=\"'+ (connectInstaller.manualInstallPackage || connectInstaller.installPackage) +'\" onclick=\"handleDownloadInstaller(this.href);return false;\">' +
		localize('downloadInstaller') + '</a>';

	var container = document.getElementById('install_container');
	container.appendChild(progressContainer);
    
    // logger('Hide the install button');
	var buttonEl = document.getElementById("install_plugin_button");
	if (buttonEl != null) {
		buttonEl.style.display = 'none';
	}
    // Start installer
	awInstaller.setInstallSource(installerPath);
	awInstaller.setCallback(function(state, desc, percentage) {
		logger("installer prep callback - " + state + ", " + desc + ", " + percentage);
        
		if (state == "COMPLETE") {
			navigator.plugins.refresh();
			window.location.reload();
		}
	});
	awInstaller.installInstaller();

    // Detect broken Java plugins. Ticket #18158
    // Give the DOM a moment to paint.
    setTimeout( function() {
	    if (AW.utils.isJavaBroken('installer_applet')) {
	        // Clear the container and remove the applet.
	        document.getElementById('install_container').innerHTML = localize('javaFailed');
	        document.getElementById('installer_applet').parentElement.removeChild(document.getElementById('installer_applet'));
	        showPkgDownloadLink(envSupportInfo.packageURL, 'install_container');
    	}
    }, 200);
}; 
    
var handleConnectInstallation = function (evt) {
    var state = evt.state, desc = evt.description, percentage = evt.percent;
	var progressParent
	, progressContainer
	, progressBar
	, barContainer
	, barContainerParent
	, description
	, descriptionText
	, error;
	if (percentage < 0) {
		percentage = 0;
	}
	progressContainer = document.getElementById('progress_container');
	if (progressContainer) {
    	progressBar = document.getElementById('progress_bar');
		description = document.getElementById('progress_description');
		descriptionText = description.getAttribute('data-text') || '';	
		logger('state: ' + state + '  description: ' + desc + '  percentage: ' + percentage);
	
		switch(state.toLowerCase()) {
			case 'start':
				descriptionText = localize('starting') + '\u2026';
				break;
			case 'download':
				bounceBlocker.block(localize('confirmInstallLeave'));
				descriptionText = localize('downloading') + '\u2026';
				break;
			case 'error': 
				bounceBlocker.unblock();
				descriptionText = localize('error') + ': ' + localize(desc);	
				percentage = 0; // -1 is not a valid el.style.width argument in IE.	
				progressBar.setAttribute('data-error', 'true');
				break;
			case 'error_admin_rights': 
				bounceBlocker.unblock();
				descriptionText = localize("ErrAdminRights") + ' ' + '<a href="'+ (connectInstaller.manualInstallPackage || connectInstaller.installPackage) +'">' + localize("Download") + '</a>';	
				percentage = 0; 
				progressBar.setAttribute('data-error', 'true');
				break;
			case 'install':
				bounceBlocker.block(localize('confirmInstallLeave'));
				descriptionText = localize('installing') + '\u2026';
				break;
			case 'restart_required':
				bounceBlocker.unblock();
				// Occurs on IE if Connect was previously installed.
				// Setting search string forces a reload.
				if (window.location.hash.indexOf('requiresrestart') === -1) {
					// 'requiresrestart' is not in the location.hash.
					window.location.hash += 'requiresrestart';
				}
				promptRestart();
				break;
			case 'complete':
				bounceBlocker.unblock();
				if ( progressBar.getAttribute('data-error') !== 'true') {
					setTimeout( function() {
						// Remove the progress markup.
						barContainer = document.getElementById('bar_container');
						barContainerParent = barContainer.parentNode;
						barContainerParent.removeChild(barContainer);
						navigator.plugins.refresh();
						if (!AW.utils.browser.is.ie && !connectInstaller.updateAvailable() && !AW.utils.browser.hasMimeType("application/x-aspera-web")) {
							// Firefox VM's sometimes won't load Aspera Web plugin after install. Ticket #18314
							promptRestart();
						} else {
							descriptionText = localize('installComplete').slice(0,-1) + '! <br><br>' +
									localize('refreshBrowser');
							description.innerHTML = descriptionText;
							// Bliss.
							document.body.className += 'success';
						}
					}, 500);
				}
				break;
		} 
		if (progressBar) {
			progressBar.style.width = percentage + '%';
		}
		description.setAttribute('data-text', descriptionText);
		description.innerHTML = descriptionText;
	}		
};

var promptRestart = function() {
	var container;
	container = document.getElementById('install_container');	
	container.innerHTML = '';
	showMessage(localize('installComplete') + ' ' + localize('restartBrowser'));
};

var otherBrowserRunningAsperaWeb = function() {
	return awInstaller.checkProcesses("npasperaweb.dll,asperaweb.ocx,npinstaller.dll");
};

var firstBrowserShutdownMessage = true;

var promptOtherBrowserShutdown = function() {
	if (firstBrowserShutdownMessage) {
		showMessage("<span class='large_text'> " + localize('quitBrowsers') + "</span> <br/><br/><a class='btn' onclick='attemptConnectInstall();'>" + localize('continue') + "</a>");
		firstBrowserShutdownMessage = false;
	} else {
		showMessage("<span class='large_text important'>" + localize('quitBrowsers') + "</span> <br/><br/><a class='btn' onclick='attemptConnectInstall();'>" + localize('continue') + "</a>");
	}
};

var clearMessage = function() {
	var el = document.getElementById('message');
	el.innerHTML = '';
	el.style.display = 'none';
};

var attemptConnectInstall = function() {
	clearMessage();
	if (otherBrowserRunningAsperaWeb()) {
		promptOtherBrowserShutdown();
	} else {
		installConnect();
	}
};

var installConnect = function (elementId) {
	var el
	, container
	, progressContainer
	, progressDescription
	, barContainer
	, progressBar
	, title;
	
	title = document.getElementById('install_title');
	title.innerHTML = localize('statusTitle');

	logger('Create and assemble progress bar components...');
	progressContainer = document.createElement('div');
	progressContainer.className = 'progress_container';
	progressContainer.id = 'progress_container';
	progressDescription = document.createElement('p');
	progressDescription.className = 'progress_description';
	progressDescription.id = 'progress_description';
	progressDescription.innerHTML = '&nbsp;';
	barContainer = document.createElement('div');
	barContainer.className = 'bar_container';
	barContainer.id = 'bar_container';
	progressBar = document.createElement('div');
	progressBar.className = 'progress_bar';
	progressBar.id = 'progress_bar';
	progressBar.innerHTML = '&nbsp;';
	barContainer.appendChild(progressBar);
	progressContainer.appendChild(progressDescription);
	progressContainer.appendChild(barContainer);
    
	logger('Insert progress bar...');
	container = document.getElementById('install_container');
	container.appendChild(progressContainer);

	logger('Calling internalInstallLatest()');
	connectInstaller.internalInstallLatest(handleConnectInstallation);

};

var _AsperaWeb;
var awLastKnowVersion;

var insertFileList = function () {
	setupFileControls();
};

var removeEl = function(elId) {
	var el;
	el = document.getElementById(elId);
	el.parentNode.removeChild(el);		
};
var updateVersionNumber = function () {
	var el;
	el = document.getElementById('version');
	if (connectInstaller.availableVersion) {
		el.innerHTML = localize('version') + ' ' + connectInstaller.availableVersion;
	}
};

var showMessage = function (message) {
	var container,
		toggleEl;
	if (!message) return;
	container = document.getElementById('message');
	container.innerHTML = message;
	container.style.display = "block";
	if (document.getElementById('progress_container')) {
		toggleEl = document.getElementById('progress_container');
		toggleEl.style.display = 'none';
	}
};
var showPkgDownloadLink = function(url, containerElId) {
	var container,
		wrapper,
		link;
	if (!url) return;
	container = document.getElementById(containerElId);
	link = '<br><a href="' + url + '" class="package_url btn">' + localize('downloadPackage') + '</a>';
	wrapper = document.createElement('div');
	wrapper.innerHTML = link;
	if (container) {
		container.appendChild(wrapper);
		// Show the container in case it's hidden.
		if (container.style.display === 'none') {
			container.style.display = 'block';
		}
	}
};


var parseLanguage = function() {
	var lang = function() {
		try {
			return location.hash.match(/awlang=(\S\S-?\S?\S?)/)[1];
		} catch (e) {
			return 'en-US';
		}
	}
	return lang();
};

var runInstallCases = function() {
	var message, installedVersion;
    installedVersion = connectInstaller.installedVersion || '0';
	updateVersionNumber();
	// Minversion should be assigned by connectinstaller.js.
	//Default to latest available in case page is run by itself.
	minVersion = AW.utils.parseSearchString('minversion') || connectInstaller.availableVersion;
	 	if (connectInstaller.awInstaller.hasHiddenUpdatedAsperaWeb(connectInstaller.availableVersion, connectInstaller.installedVersion)) {
		// Catch hidden installs. Don't run the installer again. Prompt restart. Ticket #18314
		promptRestart();
		return;
	}
	// Catch restart required case if IE user refreshes instead of restarts.
	if (window.location.hash.indexOf('requiresrestart') !== -1) {
		// 'requiresrestart' is in the location.hash.
		promptRestart();
		return;
	}
	if (!envSupportInfo.isSupported && envSupportInfo.code) {
		// Connect is NOT supported.
		message = localize(envSupportInfo.code);
		showMessage(message);
		return;
	} else if (AW.utils.versionLessThan(connectInstaller.availableVersion, minVersion)) {
		// Connect does not meet the minimum version and no available 
		// version for this platform will meet the minimum version. 
		showMessage(localize('availableVersionLowerThanMinVersion'));
		// TODO - Add a link to a compatibility table when we have
		// a suitable solution.
		return;
	} else if (envSupportInfo.isSupported && envSupportInfo.downloadOnly && 
            AW.utils.versionLessThan(installedVersion, minVersion)) {
		// Connect is Supported but only with a download.
		message = localize(envSupportInfo.code) || '';
		showMessage(message);
		// Show a package download link.
		showPkgDownloadLink(envSupportInfo.packageURL, 'message');
		return;
	}
	//Clear out the container
	document.getElementById('install_container').innerHTML = '';
	// If the plugin is installed, do we have the latest Connect App
	if (connectInstaller.asperaWebInstalled() && !connectInstaller.updateAvailable()) {
	    // Aspera Web plugin and Aspera Connect App are installed
	    connectAlreadyInstalled();
	} else {
		if (awInstaller.isInstallerAvailable()) {
			// Aspera Installer plugin installed
			attemptConnectInstall();
		} else {
			// Deliver the Aspera Installer Plugin
			installPlugin();
		}
	}
};

var connectInstaller = null;
var awInstaller = null;
var minVersion;
var envSupportInfo;

var loadLanguages = function(lang, callback) {
	AW.utils.loadScript(AW.utils.joinPaths(installerPath, 'localize.js'), callback);
};

var localize = function(id) {
	return AW.utils.localize(id, connectInstaller.language);
}

var initAsperaConnect = function () {
	var message;
	// Initialize installer 
	if (connectInstaller == null) {
		connectInstaller = new AW.ConnectInstaller({'path':installerPath, 'language': parseLanguage()});
	}
	awInstaller = connectInstaller.getAsperaInstaller();
	envSupportInfo = connectInstaller.getEnvSupportInfo();
	loadLanguages(connectInstaller.language, runInstallCases);
};


var connectAlreadyInstalled = function() {
	var el = document.getElementById('install_container');
	el.innerHTML = localize('installThankYou');
};

function closeWindow() {
	window.open('','_parent','');
	window.close();
}

var startFuncDone = false; // NOTE: This var is used to avoid #14670. Downloading a file can trigger start fn again. 
var startFunc = function() {

	if (startFuncDone) {
		return;
	}
	startFuncDone = true;
	setTimeout(initAsperaConnect, 300); // NOTE: This delay appears to help with IE CAB installs
};
// Start
if (window.addEventListener) {
	window.addEventListener('load', startFunc, false);
} else {
	window.attachEvent('onload', startFunc);
}
var bounceBlocker = (function () {
	var blockFlag = false;

	var removeOnBeforeUnloadHandler = function() {
		window.onbeforeunload = null;
	};
	var setOnBeforeUnloadHandler = function(confirmMessage) {
		window.onbeforeunload = function beforeUnload() {
			if (blockFlag) {
				return confirmMessage;
			};
		};
	};
	var block = function(confirmMessage) {
	  blockFlag = true;
	  setOnBeforeUnloadHandler(confirmMessage);
	};
	var unblock = function() {
	  blockFlag = false;
	  removeOnBeforeUnloadHandler();
	};
	var status = function() {
	  return blockFlag;
	};

	return {
		status: status,
		block: block,
		unblock: unblock
	};
})();
