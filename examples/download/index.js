function download() {
  /**
   * Transfer spec with desired parameters
   */
  const transferSpec = {
    paths: [
      {
        source: 'aspera-test-dir-large/100MB'
      }
    ],
    remote_host: 'demo.asperasoft.com',
    remote_user: 'aspera',
    remote_password: 'demoaspera',
    direction: 'receive'
  };

  /**
   * Start the download transfer
   */
  this.client.startTransfer(transferSpec);
}

function initAsperaConnect() {
  this.client = new AW4.Connect();
  this.client.initSession();
}
