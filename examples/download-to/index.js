function download() {
  const options = {
    allowMultipleSelection: false
  };

  this.client.showSelectFolderDialogPromise(options)
    .then(data => {
      if (data && data.dataTransfer && data.dataTransfer.files && data.dataTransfer.files.length === 1) {
        const connectSpec = {
          use_absolute_destination_path: true
        };

        const transferSpec = {
          paths: [
            {
              source: '10MB.1'
            }
          ],
          source_root: 'aspera-test-dir-small',
          destination_root: data.dataTransfer.files[0].name,
          remote_host: 'demo.asperasoft.com',
          remote_user: 'aspera',
          remote_password: 'demoaspera',
          direction: 'receive'
        };

        this.client.startTransfer(transferSpec, connectSpec);
      }
    })
    .catch(() => {
      console.error('Unable to select folders');
    });
}

function initAsperaConnect() {
  this.client = new AW4.Connect();
  this.client.initSession();
}
