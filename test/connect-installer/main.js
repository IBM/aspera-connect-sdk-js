var initialize = function() {
    var CONNECT_INSTALLER =  "../../dist/v4";
    let connectOptions = { minVersion: "3.10.0", connectMethod: "extension" };
    var asperaWeb = new AW4.Connect(connectOptions);

    let installerOptions = { sdkLocation: CONNECT_INSTALLER, style: "carbon", correlationId: 'test', useFips: true, oneClick: false };
    var asperaInstaller = new AW4.ConnectInstaller(installerOptions);
    asperaInstaller.addEventListener((event) => {
      console.log(event);
    });

    var onStatusEvent = function (eventType, data) {
        if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.INITIALIZING) {
            asperaInstaller.showLaunching();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.FAILED) {
            asperaInstaller.showDownload();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.OUTDATED) {
            asperaInstaller.showUpdate();
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.RUNNING) {
            asperaInstaller.connected();
            // Make sure we can use Connect API after we're told it's running.
            let callback = {
              success: (version) => { console.log('version returned:', version); },
              error: () => { console.log('version error'); }
            };
            asperaWeb.version(callback);
        } else if (eventType === AW4.Connect.EVENT.STATUS && data == AW4.Connect.STATUS.EXTENSION_INSTALL) {
            // Comment out to simulate customer not making changes to their integration
            //asperaInstaller.showExtensionInstall();
        }
    };

    var initAsperaConnect  = function () {
        asperaWeb.addEventListener(AW4.Connect.EVENT.STATUS, onStatusEvent);
        asperaWeb.initSession();
    };

    document.querySelector('#state_init').onclick = function() {
        asperaInstaller.showLaunching();
    };
    document.querySelector('#state_failed').onclick = function() {
        asperaInstaller.showRetry();
    };
    document.querySelector('#state_outdated').onclick = function() {
        asperaInstaller.showUpdate();
    };
    document.querySelector('#state_retrying').onclick = function() {
        asperaInstaller.showLaunching();
    };
    document.querySelector('#state_running').onclick = function() {
        asperaInstaller.connected();
    };
    document.querySelector('#state_extension_install').onclick = function() {
        asperaInstaller.showExtensionInstall();
    }
    document.querySelector('#state_downloading_installer').onclick = function() {
        asperaInstaller.showDownload();
    }
    document.querySelector('#state_install_connect').onclick = function() {
        asperaInstaller.showInstall();
    }
    document.querySelector('#state_unsupported_browser').onclick = function() {
        asperaInstaller.showUnsupportedBrowser();
    }
    document.querySelector('#state_safari_mitigate').onclick = function() {
        window.postMessage('show_safari_mitigate', '*');
    }

    document.querySelector('#connect_action').onclick = function() {
        var lastStatus = asperaWeb.getStatus();
        if (lastStatus != AW4.Connect.STATUS.RUNNING) {
            // Ask ConnectInstaller to handle the status again
            onStatusEvent(AW4.Connect.EVENT.STATUS, lastStatus);
        } else {
            asperaWeb.showAbout();
        }
    }
    initAsperaConnect();
};

var myInit = function () {
    setTimeout(initialize, 1000);
}
