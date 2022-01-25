function download() {
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

  this.client.startTransfer(transferSpec);
}

function getAllTransfersCallback(transfersInfo) {
  const resultsEl = document.getElementById('results');
  const { iteration_token, result_count, transfers } = transfersInfo;
  if (transfers.length === 0) {
    resultsEl.innerText = 'No transfers found!';
  } else {
    resultsEl.innerText = 'Num. of Transfers: ' + result_count;
    for (let i = 0; i < transfers.length; i++) {
      resultsEl.innerText += '\n'
      resultsEl.innerText += `Transfer #${i+1} status: ${transfers[i].status}`;
    }
  }

  // Full transferInfo object
  console.log(transfersInfo);
}

function getAllTransfers() {
  const iterationToken = 0;
  /**
   * Get information about all of the transfers in Connect's activity window.
   */
  this.client.getAllTransfers({
    success: getAllTransfersCallback
  }, iterationToken);
}

function initAsperaConnect() {
  this.client = new AW4.Connect();
  this.client.initSession();
}
