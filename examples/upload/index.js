function uploadFile(data) {
  const { files } = data.dataTransfer;
  if (files.length === 1) {
    let fileToUpload = files[0].name;

    /**
     * Transfer spec with desired parameters
     */
    const transferSpec = {
      paths: [
        {
          source: fileToUpload
        }
      ],
      destination_root: 'Upload',
      remote_host: 'demo.asperasoft.com',
      remote_user: 'aspera',
      remote_password: 'demoaspera',
      direction: 'send',
    };

    /**
     * Start the upload transfer
     */
    this.client.startTransfer(transferSpec);
  }
}

function upload() {
  /**
   * Display a file browser for the user to select a file.
   */
  const options = {
    allowMultipleSelection: false
  };

  this.client.showSelectFileDialogPromise(options)
    .then(uploadFile)
    .catch(() => {
      console.error('Unable to select files');
    });
}

function initAsperaConnect() {
  this.client = new AW4.Connect();
  this.client.initSession();
}
