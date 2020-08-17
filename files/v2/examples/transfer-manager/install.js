// Log only if a window.console object is present
var isLogging = (function() {
	var console = window.console || '';
	if (console.log || !window.attachEvent) {
		return true;
	} else {
		return  false;
	};
}());

var logger = function(msg) {
	if ( this.isLogging ) {
		console.log(msg);
	} else {
		//alert(msg);
	}
}; 

var parseSdkLocation = function (path) {
    var sdkLocation,
        prefixIndex;
    prefixIndex = window.location.href.lastIndexOf(path);
    sdkLocation = window.location.href.substr(0, prefixIndex);
    return sdkLocation;
};
// Pass the path to this example's parent folder
var installerPath = parseSdkLocation('examples/transfer-manager');

/* ////////////////////////////////////

	Installation functionality

*/
var handleConnectReady = function() {
	// Called if Aspera Connect is installed and meets version requirements.
	fileControls.setup();
};

var handleInstallError = function() {
	// Called if an install error occurs. Display some text.
	logger('Installation Error');
};

var handleInstallDismiss = function() {
	// Called if the installer is dismissed by the user.
	alert('For the best file transfer experience, install Aspera Connect.');
};

var handleInstall = function() {
	// Called if an install is required.
	connectInstaller.startEmbeddedInstall({
		installDismiss : handleInstallDismiss,
		installError : handleInstallError
	});
};

var connectInstaller = null;

var initAsperaConnect = function () {
    // Initialize installer 
    if (connectInstaller === null) {
		connectInstaller = new AW.ConnectInstaller(installerPath);
	}
	connectInstaller.init({
		connectReady : handleConnectReady,
		install: handleInstall
	});
};

if (window.addEventListener) {
	window.addEventListener('load', initAsperaConnect, false);
} else {
	window.attachEvent('onload', initAsperaConnect);
}
