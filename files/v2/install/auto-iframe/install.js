/* developer.asperasoft.com
	This file is responsible for handling the installation of the Aspera Installer Plugin.
	Once the plugin is installed, it will use that plugin to install Aspera Connect.
*/
var parseSdkLocation = function (path) {
	var sdkLocation,
		prefixIndex;
	prefixIndex = window.location.href.lastIndexOf(path);
	sdkLocation = window.location.href.substr(0, prefixIndex);
	return sdkLocation;
};
var installerPath = parseSdkLocation('install/auto-iframe');

var isLogging = (function() { //This is here so application.js doens't rely on AW.utils for logging.
	//return false;
	var console = window.console || '';
	if (console.log || !window.attachEvent) {
		return true;
	} else {
		return false;
	}
}());

var logger = function(msg) {
	if ( this.isLogging ) {
		console.log(msg);
	}
};

var downloadFile = function (url) {
	window.top.location.href = url;
};

var restoreParentHash = function() {
	sendParentMessage('restorehash');
};

var handleDownloadInstaller = function(url) {
	restoreParentHash();
	downloadFile(url);
	closeInstaller();
};

var promptRestart = function () {
	var container;
	showInstallBody();
	container = document.getElementById('install-container');
	container.innerHTML = '';
	showMessage(localize('installComplete') + ' ' + localize('restartBrowser') );
};

var installPlugin = function() {
	// Precondition: plugin is not installed
	var title = document.getElementById('installer-title');
	title.innerHTML = localize('installerTitle');
	if (!awInstaller.installerUpdateAvailable()) {
		return;
	}
	var progressContainer = document.createElement('div');
	progressContainer.className = 'progress_container';
	progressContainer.id = 'progress_container';
	function configureHelpMessage() {
		if (AW.utils.browser.is.safari) {
			return localize('safariInstallerInstructions');
		}
		if (AW.utils.browser.is.ff) {
			return localize('firefoxInstallerInstructions');
		}
		if (AW.utils.browser.is.ie) {
			return localize('ieInstallerInstructions');
		}
	}
	progressContainer.innerHTML = configureHelpMessage() + '<br><br>' +
		localize('skipAutoInstall') + ' ' +
		'<a href=\"'+ (connectInstaller.manualInstallPackage || connectInstaller.installPackage) +'\" onclick=\"handleDownloadInstaller(this.href);return false;\">' +
		localize('downloadInstaller') + '</a>';

	var container = document.getElementById('install-container');
	container.appendChild(progressContainer);

	logger('Hide the install button');
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
		document.getElementById('install-container').innerHTML = localize('javaFailed');
		document.getElementById('installer_applet').parentElement.removeChild(document.getElementById('installer_applet'));
		showPkgDownloadLink(envSupportInfo.packageURL, 'install-container');
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
		logger('state: ' + state + '	description: ' + desc + '	 percentage: ' + percentage);

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
				// Trigger installError callback.
				sendParentMessage('installerror' + desc);
				showCloseButton();
				break;
			case 'error_admin_rights':
				bounceBlocker.unblock();
				descriptionText = localize("ErrAdminRights") + ' ' + '<a href="'+ (connectInstaller.manualInstallPackage || connectInstaller.installPackage) +'" onclick="handleDownloadInstaller(this.href);return false;">' + localize("Download") + '</a>';
				percentage = 0;
				progressBar.setAttribute('data-error', 'true');
				// Trigger installError callback.
				sendParentMessage('installerror');
				showCloseButton();
				break;
			case 'install':
				bounceBlocker.block(localize('confirmInstallLeave'));
				descriptionText = localize('installing') + '\u2026';
				break;
			case 'restart_required':
				bounceBlocker.unblock();
				// Occurs on IE if Connect was previously installed.
				sendParentMessage('requiresrestart');
				promptRestart();
				break;
			case 'complete':
				// IE needs to refresh for new installs. IE upgrades need 
				// to restart and don't get the 'complete' state.
				success();
				break;
		}
		if (progressBar) {
			progressBar.style.width = percentage + '%';
		}
		description.setAttribute('data-text', descriptionText);
		description.innerHTML = descriptionText;
	}
};

var success = function() {
	bounceBlocker.unblock();
	// Restore the parent window's url hash.
	restoreParentHash();
	navigator.plugins.refresh();
	if (!AW.utils.browser.is.ie && !connectInstaller.updateAvailable() && !AW.utils.browser.hasMimeType("application/x-aspera-web")) {
		// Firefox VM's sometimes won't load Aspera Web plugin after install. A restart
		// fixes this. Ticket #18314
		promptRestart();
	} else {
		showMessage(localize('installComplete').slice(0,-1) + '! ' +
			localize('refreshBrowser') +
			'<br /><br /><a href="javascript:void(0)" class="btn" onclick="sendParentMessage(\'reloadparent\');">' + localize('refreshNow') + '</a>');
	}
};

var otherBrowserRunningAsperaWeb = function() {
	return awInstaller.checkProcesses("npasperaweb.dll,asperaweb.ocx,npinstaller.dll");
};

var firstBrowserShutdownMessage = true;

var promptOtherBrowserShutdown = function() {
	if (firstBrowserShutdownMessage) {
		showMessage("<span class='text'>" + localize('quitBrowsers') + "</span> <br/><br/><a class='btn' onclick='attemptConnectInstall();'>" + localize('continue') + "</a>");
		firstBrowserShutdownMessage = false;
	} else {
		showMessage("<span class='text important'>" + localize('quitBrowsers') + "</span> <br/><br/><a class='btn' onclick='attemptConnectInstall();'>" + localize('continue') + "</a>");
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

var setInstallerTitle = function(title) {
	var titleEl = document.getElementById('installer-title');
	titleEl.innerHTML = title;
};

var installConnect = function (elementId) {
	var el
	, container
	, progressContainer
	, progressDescription
	, barContainer
	, progressBar;

	setInstallerTitle = localize('statusTitle');
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

	container = document.getElementById('install-container');
	container.appendChild(progressContainer);

	logger('Calling internalInstallLatest()');
	connectInstaller.internalInstallLatest(handleConnectInstallation);
};

var updateVersionNumber = function () {
	var el;
	el = document.getElementById('version');
	if (connectInstaller.availableVersion) {
		el.innerHTML = 'v' + connectInstaller.availableVersion;
	}

};

var showMessage = function (message) {
	var promptEl,
		installBody,
		container,
		toggleEl;
	if (!message) return;
	promptEl = document.getElementById('install-prompt');
	promptEl.style.display = 'none';
	container = document.getElementById('message');
	container.innerHTML = message;
	container.style.display = "block";
	showInstallBody();
	if (document.getElementById('progress_container')) {
		toggleEl = document.getElementById('progress_container');
		toggleEl.style.display = 'none';
	}
};

var userPromptedToAllowPlugin = function() {
	var aw, isCurrentVersion;
	function allowPluginReminder() {
		alert('Make sure you have given the Aspera Web plugin permission to run.')
	}
	try {
		aw = new AW.Connect({
			id: AW.utils.randomString(9)
		});
		isCurrentVersion = (aw.version().connect.version === connectInstaller.availableVersion);
	} catch (e) {
      
	}
	if (isCurrentVersion) {
		sendParentMessage('connectready');
		sendParentMessage('silentremoveiframe');
	} else {
		allowPluginReminder();
	}
}

var showAllowPluginInstructions = function() {
	showMessage('Select the "Always run on this site" button at the top of your browser window. Then click the OK button.'+
	'<br><br><a href="javascript:void(0);" class="btn" style="margin:0 auto;display:inline-block;width:30%" onclick="userPromptedToAllowPlugin()">OK</a> or <a href="javascript:void(0)" onclick="cancelAllowPluginInstructions(envSupportInfo.packageURL, \'message\')">'+ localize('cancel') +'</a>');
};

var cancelAllowPluginInstructions = function(path, elId) {
	message = localize(envSupportInfo.code);
	showMessage(message);
  showPkgDownloadLink(path, elId);
}

var showPkgDownloadLink = function(url, containerElId) {
	var container,
		wrapper,
		link;
	if (!url) return;
	container = document.getElementById(containerElId);
	link = '<br><a href="' + url + '" class="package_url btn" onclick="handleDownloadInstaller(this.href);return false;">' + localize('downloadPackage') + '</a>';
	wrapper = document.createElement('div');
	// Chrome needs special attention for its plugin authorization
	// butter bar. Show another button that allows the user to express
	// that they have installed Connect at the time they are prompted
	// to install. Then show instructions about how to avoid being prompted.
	if (AW.utils.browser.is.chrome) {
		link += ' <br><br><a href="' + url + '" class="package_url" onclick="showAllowPluginInstructions();return false;">' + 'Already installed this version?' + '</a>' 
	}
	wrapper.innerHTML = link;
	if (container) {
		container.appendChild(wrapper);
		// Show the container in case it's hidden.
		if (container.style.display === 'none') {
			container.style.display = 'block';
		}
	}
};

var connectInstaller = null;
var awInstaller = null;
var installing = false;
var minVersion;
var envSupportInfo;

var parseLanguage = function() {
	var lang = function() {
		try {
			return location.hash.match(/awlang=(\S\S-?\S?\S?)/)[1];
		} catch (e) {
			return 'en-US';
		}
	};
	return lang();
};

var runInstallCases = function () {
	var message;
	if (!minVersion) {
		minVersion = '';
	}
	updateVersionNumber();
	setInstallerTitle(localize('installerTitle'));
	if (connectInstaller.awInstaller.hasHiddenUpdatedAsperaWeb(connectInstaller.availableVersion, connectInstaller.installedVersion)) {
		// Catch hidden installs. Don't run the installer again. Prompt restart. Ticket #18314
		promptRestart();
		return;
	}
	if (!envSupportInfo.isSupported && envSupportInfo.code) {
		//Show message if no download is available
		message = localize(envSupportInfo.code);
		showMessage(message);
		showCloseButton();
		return;
	} else if (AW.utils.versionLessThan(connectInstaller.availableVersion, minVersion)) {
		// Connect does not meet the minimum version and no available 
		// version for this platform will meet the minimum version. 
		showMessage(localize('availableVersionLowerThanMinVersion'));
		showCloseButton();
		// TODO - Add a link to a compatibility table when we have
		// a suitable solution.
		return;
	} else if (envSupportInfo.isSupported && envSupportInfo.downloadOnly) {
		//Show message if ONLY a download is available.
		message = localize(envSupportInfo.code);
		showMessage(message);
		// Show a package download link.
		showPkgDownloadLink(envSupportInfo.packageURL, 'message');
		showCloseButton();
		return;
	}
	//Clear out the container
	document.getElementById('install-container').innerHTML = '';
	// If the plugin is installed, do we have the latest Connect App
	if (connectInstaller.asperaWebInstalled() && !connectInstaller.updateAvailable()) {
		// Aspera Web plugin and Aspera Connect App are installed
		connectAlreadyInstalled();
	} else {
		if (installing === true) {
			// We've begun install, bypass the installer button.
			// Otherwise IE will show the button after the install is requested.
			continueFromInstallerPrompt();
		} else {
			showInstallerPrompt();
		}
	}
}

var loadLanguages = function(lang, callback) {
	AW.utils.loadScript(AW.utils.joinPaths(installerPath, 'localize.js'), callback);
};

var localize = function(id) {
	return AW.utils.localize(id, connectInstaller.language);
}

var initAsperaConnect = function () {
	// Initialize installer 
	connectInstaller = connectInstaller || new AW.ConnectInstaller({'path':installerPath, 'language': parseLanguage()});
	awInstaller = awInstaller || connectInstaller.getAsperaInstaller();
	envSupportInfo = connectInstaller.getEnvSupportInfo();
	loadLanguages(connectInstaller.language, runInstallCases);
};

logger("self.location.href: " + self.location.href);

// Iframe-specific code
var showInstallerPrompt = function() {
	var prompt, promptMsg, installBody, installButton, denyButton;
	prompt = document.getElementById('install-prompt');
	promptMsg = document.getElementById('prompt-message');
	promptMsg.innerHTML = localize('promptMessage');
	prompt.style.display = 'block';
	function vAlignEl(el) {
		if (!el) return;
		var parent, vHeight, elHeight, yOffset;
		parent = el.parentNode;
		vHeight = parent.offsetHeight;
		elHeight = el.offsetHeight;
		yOffset = (vHeight - elHeight)/3;
		el.style.marginTop = yOffset + 'px';
		el.style.visibility = 'visible';
	};
	function buttonText() {
		if (connectInstaller.isUpgrade()) {
			return localize('upgradeNow');
		} else {
			return localize('installNow');
		}
	};
	installButton = document.getElementById('install-button');
	installButton.innerHTML = buttonText();
	installButton = document.getElementById('deny-button');
	installButton.innerHTML = localize('cancel');
};

var hideInstallerPrompt = function() {
	var prompt;
	prompt = document.getElementById('install-prompt');
	prompt.style.display = 'none';
};
var showInstallBody = function() {
	var installerBody;
	installerBody = document.getElementById('install-body');
	installerBody.style.display = "block";
	installerBody.className += ' show';
};
var showCloseButton = function() {
	var button;
	button = document.getElementById('close-button');
	button.style.display = 'block';
};
var hideCloseButton = function() {
	var button;
	button = document.getElementById('close-button');
	button.style.display = 'none';
};
var closeInstaller = function(event) {
	if (AW.utils.browser.is.ie7) {
		return;
	}
	sendParentMessage('removeiframe');
};
var handleInstallButton = function() {
	if (AW.utils.browser.is.ie7) {
		// IE 7 is not supported, install with the startExternalInstall method.
		connectInstaller = connectInstaller || new AW.ConnectInstaller(installerPath);
		initAsperaConnect();
		return;
	}
	sendParentMessage('embeddedinstall');
	continueFromInstallerPrompt();
};
var continueFromInstallerPrompt = function() {
	// console.log('continuing from installer prompt started');
	connectInstaller = connectInstaller || new AW.ConnectInstaller("aspera-web", installerPath);
	awInstaller = awInstaller || connectInstaller.getAsperaInstaller();
	if (!AW.localize) {
		loadLanguages(connectInstaller.language, continueFromInstallerPrompt);
		return;
	}
	hideInstallerPrompt();
	showInstallBody();
	setInstallerTitle(localize('installerTitle'));
	if (awInstaller.isInstallerAvailable()) {
		// Aspera Installer plugin installed
		attemptConnectInstall()
	} else {
		// Deliver the Aspera Installer Plugin
		installPlugin();
	}
};
var sendParentMessage = function(message) {
	// Make sure IE7 never tries to send.
	if (AW.utils.browser.is.ie7) return;
	// Not passing sensitive information. The '*' is acceptable.
	parent.postMessage(message, '*');
};
var handleMessage = function(event) {
	// console.log(event);
	// console.log('iframe got this origin from the Parent: ' + event.origin);
	// console.log('iframe got a message from the parent: ' + event.data);
	if (event.data.indexOf('minversion=') === 0 ) {
		// Must be set by the parent to ensure that an
		// available client version of Connect meets the requested minVersion.
		minVersion = event.data.replace('minversion=', '');
	}
	if (event.data === 'installing') {
		installing = true;
		initAsperaConnect();
	}
	if (event.data === 'notinstalling') {
		initAsperaConnect();
	}
	if (event.data === 'requiresrestart') {
		promptRestart();
	}
	if (event.data.indexOf('insertstylesheet=') === 0) {
		// Get the URL from the data.
		AW.utils.loadFile(event.data.replace('insertstylesheet=',''), 'css');
	}
}
// Set onmessage handlers
if (window.addEventListener) {
	window.addEventListener('message', handleMessage, false);
} else {
	window.attachEvent('onmessage', handleMessage);
}
var handleOnLoad = function(event) {
	// console.log('iframe is handling its onload event');
	if (AW.utils.browser.is.ie7) {
		initAsperaConnect(); 
		if (!AW.localize) {
			loadLanguages(connectInstaller.language, handleOnLoad);
		}  
		showInstallerPrompt();
		return;
	};
	sendParentMessage('iframeloaded');
}
// Dispatch 'onload' message to parent when iframe loads
if (window.addEventListener) {
	window.addEventListener('load', handleOnLoad, false);
} else {
	window.attachEvent('onload', handleOnLoad);
}

var connectAlreadyInstalled = function() {
	// IE gets here when the iframe reloads on 'complete' install.
	sendParentMessage('connectready');
	success();
};
function closeWindow() {
	window.open('','_parent','');
	window.close();
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
