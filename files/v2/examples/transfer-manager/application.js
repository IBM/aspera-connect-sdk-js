/* Author: Marco Di Costanzo marco@asperasoft.com */

/* ////////////////////////////////////

	File transfer functionality follows

*/

fileControls = {};

fileControls.handleTransferEvents = function (event, obj) {
	var transferId
	, reqestId;
	logger('transfer activity:');
	logger(obj);
	if (obj.error_code === -1) {
		// Handle case when unable to contact Connect
		asChrome.removeDialog();
		alert(obj.error_desc);
	}
	transferId = obj.uuid;
	requestId = obj.aspera_connect_settings.request_id;
	asChrome.updateItem(transferId, requestId, obj);
};
fileControls.currentParams = {};

fileControls.clearCurrentParams = function() {
	this.currentParams = {};
};

fileControls.clearSourcePaths = function () {
	fileControls.currentParams.paths = [];
};

fileControls.storePaths = function (paths) {
	function parseFileName(path) {
		if (/Win/.test(navigator.platform)) {
			return '/' + path.substring(path.lastIndexOf('\\') + 1);
		} else {
			return '/' + path.substring(path.lastIndexOf('/') + 1);
		}
	}
	// Called before a 'send', after selecting source files from the dialog.
	for (var i = 0, length = paths.length; i < length; i +=1) {
		if (paths[i]) {
			fileControls.currentParams.paths.push({"source":paths[i], "destination": remotePath + parseFileName(paths[i])}); 
		}
	}
	if (fileControls.currentParams.paths.length === 0) {
		return;
	}
	logger(fileControls.currentParams.paths);
	fileControls.attemptTransfer();
};
var remotePath;
fileControls.getParams = function(el) {
	// Build transfer parameters from the 
	// data attributes set on the button.
	currentParams = fileControls.currentParams;
	currentParams.remote_host = el.getAttribute('data-remote_host');
	currentParams.remote_user = el.getAttribute('data-remote_user');
	currentParams.direction = el.getAttribute('data-direction');
	currentParams.paths = currentParams.direction === 'receive' ? [{"source":el.getAttribute('data-paths'), "destination": ''}] : [];
	currentParams.target_rate_kbps = el.getAttribute('data-target_rate_kbps');
	// Destination path gets set here when 'receiving'.
	remotePath = currentParams.direction === 'send' ? el.getAttribute('data-destination_path') : '';
	logger({'paths': currentParams.paths, 'remote_host': currentParams.remote_host, 'direction': currentParams.direction, 'remote_user': currentParams.remote_user});
    
	this.attemptTransfer();
};
fileControls.handleStartResponse = function(responseData) {
	var code
	, userMessage;
	
	code = responseData.error.code;
	userMessage = responseData.error.user_message;
	
	switch(code) {
		case 401: 
			asChrome.removeDialog(); 
			fileControls.clearCurrentParams();
			asChrome.showFailedStartDialog(userMessage);
			break;
		case 900:
			// Content protection not accepted by the destination
			asChrome.removeDialog(); 
			fileControls.clearCurrentParams();
			asChrome.showFailedStartDialog('Disable content protection in Connect Preferences > Security > Content Protection and try your transfer again. <a href="javascript:void(0);" onclick="asChrome.connect.showPreferences();">Open Preferences</a>');
			break;
		default: 
			asChrome.removeDialog(); 
			fileControls.clearCurrentParams();
			asChrome.showFailedStartDialog(userMessage);
	}
	
};
fileControls.getConnectSettings = function(params) {
	params.needs_destination = params.direction === 'receive' ? 'true' : '';
	if (params.direction === 'receive') {
		return {
			allow_dialogs : false,
			needs_destination : true
		};
	} else { 
		return {
			allow_dialogs : false
		};
	}
};
fileControls.attemptTransfer = function(params) {
	// Once we attempt a download, keep passing and modifying 
	// parameters around until they can be sent to Connect, 
	// otherwise (on dialog cancel) make sure to clear any 
	// user-entered transfer params.
	var params
	, startResponse
	, encryptionAtRestRequired
	, contentPassphrase;
	params = params || currentParams;
	startResponse = {};
	contentPassphrase = fileControls.currentParams['content_protection_passphrase'] || false;
	encryptionAtRestRequired = document.getElementById('content_encryption').checked || false;
	
	if (params.direction === 'send' && params.paths.length < 1) {
		// Show the file dialog if nothing has been selected for an upload
		fileControls.asperaWeb.showSelectFileDialog({success:fileControls.storePaths});
	} else if (params.direction === 'send' && encryptionAtRestRequired && !contentPassphrase) {
		// Content protection passphrase is required but not supplied.
		// Insert the Passphrase Dialog. Uploads ony
		asChrome.insertPassphraseDialog(fileControls.currentParams, fileControls.attemptTransfer);
		return;
	} else if (params.remote_password && params.remote_user) {
		// Password and user are supplied
		startResponse = fileControls.asperaWeb.startTransfer(params, 
			fileControls.getConnectSettings(params), 
			{ "error": fileControls.handleStartResponse});
		fileControls.clearCurrentParams();
	} else {
		// User and password are not both supplied. Insert our Auth Dialog.
		asChrome.insertAuthDialog(params, fileControls.attemptTransfer);
		return;
	}
	// If the auth dialog is open, set the requestId 
	// so we can check this transfer's state later.
	if (startResponse.request_id && document.getElementById('aspera_auth_dialog')) {
		authDialog = document.getElementById('aspera_auth_dialog');
		authDialog.setAttribute('data-request-id', startResponse.request_id);
	} else if (startResponse.error) {
		throw new Error('There was a problem starting this transfer, make sure Aspera Connect is running.');
	}
};
fileControls.initAsperaWeb = function (id) {
	this.asperaWeb = new AW.Connect(id);
	asChrome.registerConnectObject(this.asperaWeb);
};

fileControls.handleInitSession = function () {
	logger('handleInitSession called...');
	// Subscribe to events at initSession time until
	// there's a better way.
};
fileControls.insertUploadControls = function () {
	var browseButton
	, uploadButton
	, pathsContainer;
	uploadButton = document.createElement('input');
	uploadButton.type = 'button';
	uploadButton.value = 'Upload Files';
	uploadButton.onclick = function() { 
			fileControls.getParams(this); 
			return false;
		};
	uploadButton.className = 'upload_button';
	// Store Transfer Parameters for upload on the button
	uploadButton.setAttribute('data-remote_host', 'demo.asperasoft.com');
	uploadButton.setAttribute('data-remote_user', 'aspera');
	uploadButton.setAttribute('data-direction', 'send');
	uploadButton.setAttribute('data-target_rate_kbps', 5000);
	uploadButton.setAttribute('data-destination_path', 'Upload');
	uploadButton.setAttribute('data-resume_check', 'sparse');
	document.getElementById('button_container').appendChild(uploadButton);
};
fileControls.insertDownloadControls = function () {
	var downloadButton;
	downloadButton = document.createElement('input');
	downloadButton.type = 'button';
	downloadButton.value = 'Download File (100MB)';
	downloadButton.className = 'download_button';
	// Store Transfer Parameters for download on the button
	downloadButton.onclick = function() { 
			fileControls.getParams(this); 
			return false;
		};
	downloadButton.setAttribute('data-direction', 'receive');
	downloadButton.setAttribute('data-remote_host', 'demo.asperasoft.com');
	downloadButton.setAttribute('data-remote_user', 'aspera');
	downloadButton.setAttribute('data-target_rate_kbps', 5000);
	downloadButton.setAttribute('data-destination_path', './');
	downloadButton.setAttribute('data-resume_check', 'sparse');
	downloadButton.setAttribute('data-paths', 'aspera-test-dir-large/100MB');
	document.getElementById('button_container').appendChild(downloadButton);

};
fileControls.insertContentEncryptionControls = function() {
	var toolbar, wrapper, checkbox, label;
	if (document.getElementById('content_encryption')) {
		return;
	}
	wrapper = document.createElement('div');
	wrapper.className = 'content_encryption_wrapper';
	checkbox = document.createElement('input');
	checkbox.id = 'content_encryption';
	checkbox.setAttribute('type', 'checkbox');
	label = document.createElement('label');
	label.setAttribute('for', 'content_encryption');
	label.innerHTML = 'Content Encryption';
	toolbar = document.getElementById('toolbar')
	if (!toolbar) {
		toolbar = document.createElement('div');
		toolbar.id = 'toolbar';
		toolbar.className = 'toolbar';
	}
	wrapper.appendChild(checkbox);
	wrapper.appendChild(label);
	toolbar.appendChild(wrapper);
	document.body.appendChild(toolbar);
};
fileControls.setup = function () {
	this.initAsperaWeb({id:'aspera_web_transfers'});
	this.insertUploadControls();
	this.insertDownloadControls();
	this.insertContentEncryptionControls();
	this.asperaWeb.initSession();
	fileControls.asperaWeb.addEventListener('transfer', fileControls.handleTransferEvents);
};

/*
* asChrome handles the transfer UI. 
*
* Methods:
* _createEl
* _truncate
* _initUI
* _toggleItems
* insertItem
* removeItem
* updateItem
* controls { pause, resume, deleteItem, reveal }
* insertAuthDialog
* insertPassphraseDialog
* removeDialog
* updateAuthError
*
* Notes:
	Listeners are set on each transfer item control. One listener
	should be set on asChrome to boost performance. Minor.

	Check for memory leaks where listeners are set.

	Add transfer byte info.

	Add transfer time info. Something like: http://timeago.yarp.com/
	
	Does asChrome need a reference to the plugin or a single asperaWeb object?
*/
var asChrome = {};
asChrome._createEl = function(nodeName, id, className) {
	var el;
	el = document.createElement(nodeName);
	el.id = id;
	el.className = className;
	return el;
};
asChrome._truncate = function (string, maxLength) {
	var l
	, splitLength
	, truncatedString
	, exp
	, matches;
	l = (maxLength/2) || 46;
	if (string === undefined) return;
	truncatedString = string;
	if (string.length > l) {
		splitLength = l / 2;
		
		if (navigator.platform === "Win32") {
			// truncatedString = truncatedString.replace(/\\/, '/');
			truncatedString = encodeURI(string);
			exp = new RegExp("(^.{" + splitLength + "}).*?(.{" + splitLength + "}$)") ;
			matches = string.match(exp);
			truncatedString = decodeURI(RegExp.$1) + '&hellip;' + decodeURI(RegExp.$2);
		} else {
			truncatedString = encodeURI(string);
			exp = new RegExp("(^.{" + splitLength + "}).*?(.{" + splitLength + "}$)") ;
			matches = string.match(exp);
			//process our new string
			truncatedString = decodeURI(RegExp.$1) + '&hellip;' + decodeURI(RegExp.$2);
		}
	}
	return truncatedString;
};

asChrome._initUI = function () {
	var container
	, chromeHeader
	container = this._createEl('div', 'asChrome', 'asChrome');
	chromeHeader = this._createEl('div', 'aschrome_header', 'header');
	chromeHeader.onclick = function() {
			asChrome._toggleItems();
		};
	chromeHeader.innerHTML = 'Transfers';
	container.appendChild(chromeHeader);
	document.body.appendChild(container);
	this.self = document.getElementById('asChrome');
	this.self.remove = function () {
			var parent;
			parent = asChrome.self.parentNode;
			if (parent) parent.removeChild(asChrome.self);
		};
};
asChrome._toggleItems = function () {
	var parent
	, kids;
	parent = document.getElementById('asChrome');
	kids = parent.childNodes;
	
	for ( var i=0; i < kids.length; i+=1 ) {
		if ( kids[i].id.match(/item_/) ) {
			if ( kids[i].style.display !== 'none' ) {
				kids[i].style.display = 'none';
			} else {
				kids[i].style.display = 'block';
			}
		}
	}	
};
asChrome.insertItem = function (transferId) {
	var item
	, path
	, barContainer
	, bar
	, status
	, written
	, total
	, remaining
	, percentage
	, request;
	if (document.getElementById('aspera_auth_dialog')) {
		request = {};
		request.dialog = document.getElementById('aspera_auth_dialog');
		request.id = request.dialog.getAttribute('data-request-id');
		if ( transferId === request.id ) {
			return;
		}
	}
	if ( !document.getElementById('asChrome') ) {
		asChrome._initUI();
	}
	// DOM id's shouldn't start with a number. 
	item = this._createEl('div', 'item_'+transferId, 'item');
	path = this._createEl('div', 'path_'+transferId, 'path');
	path.innerHTML = '&nbsp;';
	barContainer = this._createEl('div', 'bar_container_'+transferId, 'wrap_bar');
	bar = this._createEl('div', 'bar_'+transferId, 'bar'); 
	bar.innerHTML = '&nbsp;';
	bar.style.backgroundColor = 'green';
	status = this._createEl('div', 'status_'+transferId, 'status');
	status.innerHTML = '&nbsp;';
	barContainer.appendChild(bar);
	item.appendChild(path);
	item.appendChild(barContainer);
	item.appendChild(status);
	document.getElementById('asChrome').appendChild(item);
	logger('Transfer item inserted');
};
asChrome.registerConnectObject = function(connectObj) {
	this.connect = connectObj;
}
asChrome.removeItem = function(itemId) {
	transferId = itemId.split('item_')[1];
	asChrome.self.removeChild(document.getElementById(itemId));
	asChrome.connect.removeTransfer(transferId);
};
asChrome.controls = {
	removeAll: function (el) {
		var kids
		, i;
		// Make the array-like a true array so it won't update its length
		// during the for loop.
		if (!el) return;
		kids = el.getElementsByTagName('a');
		for(i=kids.length; i--;) { // Decrement 'live' NodeList
			logger(/control/.test(kids[i].className));
			if(/control/.test(kids[i].className)) {
				el.removeChild(kids[i]);
			}
		}
	},
	reveal: {
		// Show the uploaded or downloaded files in the Finder 
		insert: function (el, transferId) {
			var revealButton;
			// Reveal in finder control
			revealButtonEl = document.createElement('a');
			revealButtonEl.className = 'control reveal_item';
			revealButtonEl.href = 'javascript:void(0);'
			revealButtonEl.title = 'Show Files';
			revealButtonEl.onclick = function() {
					logger('Reveal files...');
					asChrome.connect.showDirectory(transferId);
				};
			el.appendChild(revealButtonEl);
		},
		remove: function (el) {
			var kids = el.childNodes;
			for(var i=0; i < kids.length; i++) {
				if(kids[i].className.match(/reveal_item/)) {
					el.removeChild(kids[i]);
					break;
				}
			}
		}
	},
	deleteItem: {
		// Will remove the transfer from the web UI
		// and the Connect.app Transfer Manager.
		insert: function (el, transferId) {
			var closeButtonEl;
			if (!el) return;
			closeButtonEl = document.createElement('a');
			closeButtonEl.className = 'control delete_item';
			closeButtonEl.href = 'javascript:void(0);'
			closeButtonEl.title = 'Clear';
			closeButtonEl.onclick = function(e) {
					logger('Remove DOM node ' + transferId + '...');
					asChrome.self.removeChild(el);
					logger('Delete transfer from Connect...');
					asChrome.connect.removeTransfer(transferId);
				};
			el.appendChild(closeButtonEl);
		},
		remove: function (el) {
			var kids = el.childNodes;
			for(var i=0; i < kids.length; i++) {
				if(kids[i].className.match(/delete_item/)) {
					el.removeChild(kids[i]);
					break;
				}
			
			}
		} 	
	},
	pause: {
		insert: function (el, transferId) {
			var pauseButtonEl;
			pauseButtonEl = document.createElement('a');
			pauseButtonEl.className = 'control pause_item';
			pauseButtonEl.href = 'javascript:void(0);'
			pauseButtonEl.title = 'Pause';
			pauseButtonEl.onclick = function(e) {
					logger('Pausing transfer...');
					asChrome.connect.stopTransfer(transferId);
					logger(transferId);
					asChrome.controls.removeAll(el);
				};
			el.appendChild(pauseButtonEl);
		},
		remove: function (el) {
			var kids = el.childNodes;
			for(var i=0; i < kids.length; i++) {
				if(kids[i].className.match(/pause_item/)) {
					el.removeChild(kids[i]);
					break;
				}
			
			}
		} 
	},
	resume: {
		// Acts more like a restart, but I'd like to hide this complexity.
		insert: function (el, transferId) {
			var resumeButtonEl;
			resumeButtonEl = document.createElement('a');
			resumeButtonEl.className = 'control resume_item';
			resumeButtonEl.title = 'Resume';
			resumeButtonEl.href = 'javascript:void(0);'
			resumeButtonEl.onclick = function(e) {
					logger('Resuming transfer...');
					asChrome.connect.resumeTransfer(transferId);
					asChrome.controls.removeAll(el);
				};
			el.appendChild(resumeButtonEl);
		},
		remove: function (el) {
			var kids = el.childNodes;
			for(var i=0; i < kids.length; i++) {
				if(kids[i].className.match(/resume_item/)) {
					el.removeChild(kids[i]);
					break;
				}
			}
		}
	},
	start: {
		// Used for starting queued transfers.
		insert: function (el, transferId) {
			var closeButtonEl;
			if (!el) return;
			startButtonEl = document.createElement('a');
			startButtonEl.className = 'control start';
			startButtonEl.href = 'javascript:void(0);'
			startButtonEl.title = 'Start';
			startButtonEl.onclick = function(e) {
					logger('Starting queued transfer: ' + transferId + '...');
					asChrome.connect.resumeTransfer(transferId);
				};
			el.appendChild(startButtonEl);
		},
		remove: function (el) {
			var kids = el.childNodes;
			for(var i=0; i < kids.length; i++) {
				if(kids[i].className.match(/start/)) {
					el.removeChild(kids[i]);
					break;
				}
			
			}
		} 	
	}
}

asChrome.updateAuthError = function(msg) {
	var el;
	if ( document.getElementById('aspera_auth_error') ) {
		el = document.getElementById('aspera_auth_error');
		el.innerHTML = msg;
	}
}; 
asChrome.updatePassphraseError = function(msg) {
	var el;
	if ( document.getElementById('aspera_passphrase_error') ) {
		el = document.getElementById('aspera_passphrase_error');
		el.innerHTML = msg;
	}
};

asChrome.updateItem = function(transferId, requestId, data) {
	var itemEl
	, pathEl
	, barEl
	, statusEl
	, prevStatus
	, prevModifiedDate
	, bytesWritten
	, percent
	, isUpload
	, status
	, path
	, truncatedPath
	, errorMessage
	, hideProgressBar
	, fileCount
	, authDialog
	, cancelButton;

    status = data.status;	
	itemEl = document.getElementById('item_' + transferId);
	
	if ( itemEl ) {
		pathEl = itemEl.childNodes[0];
		barEl = itemEl.childNodes[1].firstChild;
		statusEl = itemEl.childNodes[2];
		prevStatus = itemEl.getAttribute('data-state');
	}
	hideProgressBar = function () {
		if (barEl) barEl.parentNode.style.display = 'none';
	};
	showProgressBar = function () {
		if (barEl) barEl.parentNode.style.display = 'bloc';
	};

	var handleDialogUp = function () {
		// An auth dialog is waiting
		authDialog = document.getElementById('aspera_auth_dialog');
		authDialog.request = authDialog.getAttribute('data-request-id');
		cancelButton = document.getElementById('cancel_button');
		if ( authDialog.request === data.aspera_connect_settings.request_id && !(status === 'initiating' || status === 'failed') ) {
			// Close the dialog if the transfer status is good
			asChrome.removeDialog();
		}
		if ( document.getElementById('aspera_auth_dialog') ) {
			if ( requestId === authDialog.request) {
				// If the auth dialog is open, set the Transfer ID 
				// so we can check this transfer's status later.
				// This will keep our list of transfer items populated with
				// authenticated transfers only.
				authDialog.setAttribute('data-transfer-id', transferId);
			}
			if ( requestId === authDialog.request ) {
				// If this transfer session is the same one that our dialog is
				// holding, check for failures and alert the user.
				switch(data.error_code) {
					case 19: 
						// Authentication error
						asChrome.updateAuthError("User name or password is incorrect. Please try again.");
						break;
					case 30:
						// Server aborted session: License expired
						asChrome.updateAuthError("Unable to move files. Server license expired.");
						break;	
					default:
						if (status === 'failed') {
							asChrome.updateAuthError(data.error_desc ? 'Error: ' + data.error_code + ' ' + data.error_desc : 'Error: ' + data.error_code + ' No information available');
						}
				}
				cancelButton.onclick = function(){
						asChrome.connect.removeTransfer("' + transferId + '"); 
						asChrome.removeDialog();
						return false;
					};
				return;
			}	
		}	
	};

	if ( document.getElementById('aspera_auth_dialog') ) {
		handleDialogUp();
		if (status === 'failed') return;
	} 
	if ( !document.getElementById('item_' + transferId) && !(status === 'failed' || status === 'initiating') ) {
		// Add this transfer in asChrome if it doesn't exist and there's no dialog
		logger("New transfer found.");
		this.insertItem(transferId);
	} 
	
	// Duplicate assignment needed for page reload case
	itemEl = document.getElementById('item_' + transferId);
	if (itemEl) {
		pathEl = itemEl.childNodes[0];
		barEl = itemEl.childNodes[1].firstChild;
		statusEl = itemEl.childNodes[2];
		prevStatus = itemEl.getAttribute('data-state');
		// End duplicate assignment
	}
	fileCount = data.transfer_spec.paths.length;
	path = data.title || '';	
	truncatedPath = this._truncate(path, 100) || '';
	isUpload = data.transfer_spec.direction === 'send';
	percent = (data.percentage * 100) + '%';
	
	// Possible status: initiating|running|willretry|cancelled|completed|failed|queued|removed

	switch(status) {
		case 'failed':

				// The dialog is not up but the transfer failed.
				// Show the error in the UI. 
				switch(data.error_code) {
					case 19: 
						// Authentication error
						errorMessage = 'Authentication failed.';
						break;
					case 30:
						// Server aborted session: License expired
						errorMessage = 'Server license expired.';
						break;	
					default:
						// Catch all errors
						errorMessage = data.error_code + ' ' + data.error_desc;
				}
				// Hide the progress bar
				if (barEl) barEl.parentNode.style.display = 'none';
				// Remove any other controls
				this.controls.removeAll(itemEl);
				// Give the option to remove item from list.
				this.controls.deleteItem.insert(itemEl, transferId);
				errorMessage = 'Error: ' + errorMessage;
				if (statusEl) statusEl.innerHTML = errorMessage;
			break;
		case 'initiating': 
			if (statusEl) statusEl.innerHTML = 'Connecting';
			break;
		case 'running':
			barEl.style.width = percent;
			if (prevStatus !== 'running') {
				this.controls.removeAll(itemEl);
				this.controls.pause.insert(itemEl, transferId);
				barEl.className = 'bar';
			}
			statusEl.innerHTML = isUpload ? 'Uploading' : 'Downloading';
			break;

		case 'cancelled':
			barEl.style.width = percent;
			statusEl.innerHTML = (isUpload ? 'Upload' : 'Download') + ' paused';
			if (prevStatus !== 'cancelled') {
				this.controls.removeAll(itemEl);
				barEl.className = barEl.className + ' cancelled';
				this.controls.resume.insert(itemEl, transferId);
				this.controls.deleteItem.insert(itemEl, transferId);
			}
			break;
		case 'queued' :
			if ( prevStatus !== status ) {
				// Remove other controls
				this.controls.removeAll(itemEl);
				// Show the start button
				this.controls.start.insert(itemEl, transferId);
			}
			break;
		case 'completed':
			// Hide the progress bar
			if ( prevStatus !== status ) {
				statusEl.innerHTML = (isUpload ? fileCount + ' file' + 
						(fileCount > 1 ? 's' : '')  + ' uploaded' : fileCount + ' file' + 
						(fileCount > 1 ? 's' : '')  + ' downloaded') ;
				hideProgressBar();
				// Remove other controls
				this.controls.removeAll(itemEl);
				// Reveal in finder control
				this.controls.reveal.insert(itemEl, transferId);
				// Delete item control
				this.controls.deleteItem.insert(itemEl, transferId);
			}
			break;
		case 'removed':
			// The transfer has been removed through the Aspera Connect app UI,
			// let's update the web client.
			asChrome.self.removeChild(itemEl);
			// Remove our container if this is the last transfer. Ignore the presence
			// of the header element.
			if (asChrome.self.children.length < 2 && document.getElementById('asChrome')) {
				asChrome.self.remove();
			}

			break;
	}
	if (pathEl) pathEl.title =  path;
	if (pathEl) pathEl.innerHTML = truncatedPath;
	// Set a data-state attribute after each case.
	if (itemEl) itemEl.setAttribute('data-state', status);
	logger(prevStatus + " -> " + status);
};

asChrome.insertPassphraseDialog = function(transferParams, callback) {
	var dialogParams
	, transferParams
	, dialogWrapper
	, overlayBg
	, dialog
	, header
	, title
	, form
	, userLabel
	, userInput
	, passLabel
	, passInput
	, errorBox
	, wrapButtons
	, okButton
	, cancelButton
	, modCallback
	, modifiedCallback;
	if (document.getElementById('aspera_passphrase_dialog')) {
		return;
	}
	modCallback = function() {
		// The function "a" gets run by the dialog's okButton
		var a = function() {
			// Modify parameters to add the passphrase dialog input
			transferParams.content_protection = 'encrypt';
			transferParams.content_protection_passphrase = document.getElementById('aspera_passphrase').value;
			// Catch blank passphrases
			if (transferParams.content_protection_passphrase.match(/\S/) === null) {
				asChrome.updatePassphraseError('Passphrase cannot be blank.');
			} else {
				// Pass the modified transferParams to the supplied callback
				callback(transferParams);
				asChrome.removeDialog();
			}
		};
		return a;
	};
	this.passphraseCallback = modCallback();
	dialogParams = dialogParams || {};
	dialogParams.header = dialogParams.header || "Content Protection";
	dialogParams.title = dialogParams.title || "Enter encryption passphrase";
	dialogParams.className = dialogParams.className || "dialog box_shadow";
    
	dialogWrapper = this._createEl('div', 'aspera_dialog_wrapper', 'aspera_dialog_wrapper');
	dialogBg = this._createEl('div', 'overlay_bg', 'overlay_bg');
	dialog = this._createEl('div', 'aspera_passphrase_dialog', dialogParams.className);
	
	header = this._createEl('div', '', 'dialog_header');
	header.innerHTML = dialogParams.header;
	
	title = this._createEl('div', '', 'title');
	title.innerHTML = dialogParams.title;
	
	form = this._createEl('form', 'passphrase_form', '');
	form.onsubmit = function(){return false;};
	form.setAttribute('action', '#');

	passLabel = this._createEl('label', '', '');
	passLabel.innerHTML = 'Passphrase';
	
	passInput = this._createEl('input', 'aspera_passphrase', '');
	passInput.type = 'text';
	passInput.setAttribute('spellcheck', 'false');
	passInput.setAttribute('autocomplete', 'off');
	
	hint = this._createEl('div', '', 'hint');
	hint.innerHTML = 'Files cannot be unencrypted at the destination if the passphrase is lost.';

	errorBox = this._createEl('div', 'aspera_passphrase_error', 'dialog_error');

	wrapButtons = this._createEl('div', 'wrap_buttons', 'wrap_buttons');

	okButton = this._createEl('input', 'ok_button', 'ok_button');
	okButton.type = 'submit';
	okButton.onclick = function(){
			asChrome.passphraseCallback();
			return false;
		}; 
	okButton.value = 'OK';
	
	cancelButton = this._createEl('button', 'cancel_button', 'cancel_button');
	// TODO - Remove reference to fileControls object
	cancelButton.onclick = function(){
			asChrome.removeDialog(); 
			fileControls.clearCurrentParams(); 
			return false;
		};
	cancelButton.innerHTML = 'Cancel';
	
	dialog.appendChild(header);
	dialog.appendChild(title);
	form.appendChild(passLabel);
	form.appendChild(passInput);
	form.appendChild(hint);
	form.appendChild(errorBox);
	wrapButtons.appendChild(okButton);
	wrapButtons.appendChild(cancelButton);
	form.appendChild(wrapButtons);
	dialog.appendChild(form);
	dialogWrapper.appendChild(dialogBg);
	dialogWrapper.appendChild(dialog);
	document.body.appendChild(dialogWrapper);	
    dialog = document.getElementById(dialog.id);
	// Center the dialog
	this._adjustDialog(dialog);
	// Attach a handler to keep the dialog centered
	if (window.addEventListener) {
		window.addEventListener('resize', function() {
			asChrome._adjustDialog(dialog);
		}, false);
	} else {
		window.attachEvent('onresize', function() {
            asChrome._adjustDialog(dialog);
        });
	}
	// Set focus to the passphrase field
	passInput = document.getElementById('aspera_passphrase');
	passInput.focus();
};

asChrome.showFailedStartDialog = function(message) {
	var transferParams
	, dialogWrapper
	, overlayBg
	, dialog
	, header
	, errorBox
	, wrapButtons
	, okButton

	dialogWrapper = this._createEl('div', 'aspera_dialog_wrapper', 'aspera_dialog_wrapper');
	dialogBg = this._createEl('div', 'overlay_bg', 'overlay_bg');
	dialog = this._createEl('div', 'aspera_passphrase_dialog', 'dialog');
	
	header = this._createEl('div', '', 'dialog_header');
	header.innerHTML = "Oops! Something went wrong.";

	errorBox = this._createEl('div', '', 'dialog_error');
	errorBox.innerHTML = 'Error: ' + message;

	wrapButtons = this._createEl('div', 'wrap_buttons', 'wrap_buttons');

	okButton = this._createEl('input', 'ok_button', 'ok_button');
	okButton.type = 'submit';
	okButton.onclick = function(){
			asChrome.removeDialog();
			return false;
		}; 
	okButton.value = 'OK';

	
	wrapButtons.appendChild(okButton);
	dialog.appendChild(header);
	dialog.appendChild(errorBox);
	dialog.appendChild(wrapButtons)
	dialogWrapper.appendChild(dialogBg);
	dialogWrapper.appendChild(dialog);
	document.body.appendChild(dialogWrapper);	
    dialog = document.getElementById(dialog.id);
	// Center the dialog
	this._adjustDialog(dialog);
	// Attach a handler to keep the dialog centered
	if (window.addEventListener) {
		window.addEventListener('resize', function() {
			asChrome._adjustDialog(dialog);
		}, false);
	} else {
		window.attachEvent('onresize', function() {
            asChrome._adjustDialog(dialog);
        });
	}
};

asChrome.insertAuthDialog = function(transferParams, callback) {
	var dialogParams
	, transferParams
	, dialogWrapper
	, overlayBg
	, dialog
	, header
	, title
	, form
	, userLabel
	, userInput
	, pwLabel
	, pwInput
	, errorBox
	, wrapButtons
	, okButton
	, cancelButton
	, modCallback
	, modifiedCallback;
	if (document.getElementById('aspera_auth_dialog')) {
		return;
	}
	modCallback = function() {
		// Closure mapped to the dialog's OK button
		var a = function() {
			var dialog;
			dialog = document.getElementById('aspera_auth_dialog');
			//Modify parameters to add the user dialog input
			transferParams.remote_user = document.getElementById('aspera_auth_user').value;
			transferParams.remote_password = document.getElementById('aspera_auth_pw').value;
			if (dialog.getAttribute('data-transfer-id') ) {
				// The auth dialog is open and has an auth failure error.
				// Clear the error message so it looks like a new request.
				errorBox.innerHTML = '';
				// Call resumeTransfer() with the newly entered credentials.
				asChrome.connect.resumeTransfer(dialog.getAttribute('data-transfer-id'), transferParams);	
			} else {
				callback(transferParams);
			}
		};
		return a;
	};
	this.modifiedCallback = modCallback();
	dialogParams = dialogParams || {};
	dialogParams.header = dialogParams.header || "Authenticate";
	dialogParams.title = dialogParams.title || "Enter transfer credentials";
	dialogParams.className = dialogParams.className || "dialog box_shadow";
    
	dialogWrapper = this._createEl('div', 'aspera_dialog_wrapper', 'aspera_dialog_wrapper');
	dialogBg = this._createEl('div', 'overlay_bg', 'overlay_bg');
	dialog = this._createEl('div', 'aspera_auth_dialog', dialogParams.className);
	// Set draggable and add jQuery	
	header = this._createEl('div', '', 'dialog_header');
	header.innerHTML = dialogParams.header;
	
	title = this._createEl('div', '', 'title');
	title.innerHTML = dialogParams.title;
	
	form = this._createEl('form', 'aspera_auth_form', 'aspera_auth_form');
	form.onsubmit = function(){return false;};
	form.setAttribute('action', '#');

	userLabel = this._createEl('label', '', '');
	userLabel.innerHTML = 'User Name';
	
	userInput = this._createEl('input', 'aspera_auth_user', '');
	userInput.type = 'text';
	userInput.setAttribute('spellcheck', 'false');
	userInput.setAttribute('autocomplete', 'off');
	if (transferParams.remote_user) userInput.value = transferParams.remote_user;
	
	pwLabel = this._createEl('label', '', '');
	pwLabel.innerHTML = 'Password';
	
	pwInput = this._createEl('input', 'aspera_auth_pw', '');
	pwInput.type = 'password';
	pwInput.setAttribute('autocomplete', 'off');
	pwInput.setAttribute('placeholder', 'demoaspera');
	
	errorBox = this._createEl('div', 'aspera_auth_error', 'dialog_error');

	wrapButtons = this._createEl('div', 'wrap_buttons', 'wrap_buttons');

	okButton = this._createEl('input', 'ok_button', 'ok_button');
	okButton.type = 'submit';
	okButton.onclick = function(){
			asChrome.modifiedCallback();
			return false;
		}; 
	okButton.value = 'OK';
	
	cancelButton = this._createEl('button', 'cancel_button', 'cancel_button');
	// TODO - Remove reference to fileControls object below. Replace w/ callback.
	// Clear content 'content_protection_passphrase' when auth dialog is cancelled.
	cancelButton.onclick = function(){
			asChrome.removeDialog(); 
			fileControls.clearCurrentParams();
			return false;
		};
	cancelButton.innerHTML = 'Cancel';
	
	dialog.appendChild(header);
	dialog.appendChild(title);
	form.appendChild(userLabel);
	form.appendChild(userInput);
	form.appendChild(pwLabel);
	form.appendChild(pwInput);
	form.appendChild(errorBox);
	wrapButtons.appendChild(okButton);
	wrapButtons.appendChild(cancelButton);
	form.appendChild(wrapButtons);
	dialog.appendChild(form);
	dialogWrapper.appendChild(dialogBg);
	dialogWrapper.appendChild(dialog);
	document.body.appendChild(dialogWrapper);	
	dialog = document.getElementById(dialog.id);
	// Center the dialog
	this._adjustDialog(dialog);
	// Attach a handler to keep the dialog centered
	if (window.addEventListener) {
		window.addEventListener('resize', function() {
			asChrome._adjustDialog(dialog);
		}, false);
	} else {
		window.attachEvent('onresize', function() {
			asChrome._adjustDialog(dialog);
		});
	}
	// Set focus to the user field if no user is supplied,
	// otherwise set focus to the Password field
	userInput = document.getElementById('aspera_auth_user');
	pwInput = document.getElementById('aspera_auth_pw');
	if ( userInput.value === '' ) {
		userInput.focus();
	} else {
		pwInput.focus();
	};
};
asChrome.removeDialog = function() {
	var el = document.getElementById('aspera_dialog_wrapper');
	if (el) el.parentNode.removeChild(el);
};

asChrome._adjustDialog = function(el) {
	var viewport
	, scrollOffsets
	, windowDimensions
	, w
	, h
	, t
	, l; 
	viewport = {};
	viewport.getDimensions = function() {
		var e = window
		, a = 'inner';
		if ( !( 'innerWidth' in window ) ) {
			a = 'client';
			e = document.documentElement || document.body;
		}
		return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
	};
	viewport.getScrollOffsets = function() {
		var l = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
		var t = window.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop;
		return [l, t];
	};
	scrollOffsets = viewport.getScrollOffsets();
	windowDimensions = viewport.getDimensions();
	if ( !el ) return;
	w = el.offsetWidth;
	h = el.offsetHeight;
	t = scrollOffsets[1] + ( windowDimensions.height / 2 ) - ( h / 2 );
	if ( t < 0 ) t = 0;
	l = scrollOffsets[0] + ( windowDimensions.width / 2 ) - ( w / 2 );
	if ( l < 0 ) l = 0;
	el.style.top = t + 'px';
	el.style.left = l + 'px';
};

var handleMac = function() {      
	return false;  
	var el = document.getElementById('button_container');        
	el.className += ' ismac';
	//el.innerHTML = "The Aspera Connect 2.8 Developer Preview will be ready for OS&nbsp;X soon. Come back and explore this demo with Windows or have a look at <a href='http://developer.asperasoft.com/connect-beta/fulldemo_underthehood.html'>the code behind this example</a>. Thank you for your interest!<br/><br/> <span>&ndash;&nbsp;The Aspera Connect Team</span>"
	//el.innerHTML = "The Aspera Connect 2.8 Developer Preview will be ready for OS&nbsp;X soon. Come back and explore this demo with Windows. Thank you for your interest!<br/><br/> <span>&ndash;&nbsp;The Aspera Connect Team</span>"
};