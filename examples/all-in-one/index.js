const defaultSpec = {
  remote_host: 'demo.asperasoft.com',
  remote_user: 'aspera',
  remote_password: 'demoaspera'
};

function addTableRow(transfer) {
  const { percentage, title, status, uuid } = transfer;
  const tableRef = document.getElementById('results');
  let transferRow = tableRef.insertRow(-1);
  transferRow.setAttribute('id', uuid);

  const addTransferRowCell = (index, content) => {
    let cell = transferRow.insertCell(index);
    let node = document.createTextNode(content);
    cell.appendChild(node);
  }

  addTransferRowCell(0, `${Math.floor(percentage * 100)}%`);
  addTransferRowCell(1, title);
  addTransferRowCell(2, status);
  addTransferControls(transferRow, uuid);
}

function addTransferControls(transferRow, uuid) {
  let controlsCell = transferRow.insertCell(3);
  const addControl = (text, handler) => {
    let control = document.createElement('button');
    control.textContent = text;
    control.className = "transfer-btn";
    control.onclick = () => handler(uuid);
    controlsCell.appendChild(control);
  };

  addControl('Stop', this.client.stopTransfer);
  addControl('Resume', this.client.resumeTransfer);
  addControl('Remove', this.client.removeTransfer);
  addControl('Show', this.client.showDirectory);
  addControl('Monitor', this.client.showTransferMonitor);
}

function download(source) {
  const transferSpec = {
    ...defaultSpec,
    paths: [{
        source: source
    }],
    direction: 'receive'
  };

  this.client.startTransfer(transferSpec);
}

function upload(data) {
  const { files } = data.dataTransfer;
  if (files.length === 1) {
    const transferSpec = {
      ...defaultSpec,
      paths: [{
        source: files[0].name
      }],
      destination_root: 'Upload',
      direction: 'send'
    };

    this.client.startTransfer(transferSpec);
  }
}

function selectFile() {
  const options = {
    allowMultipleSelection: false
  };

  this.client.showSelectFileDialogPromise(options)
    .then(upload)
    .catch(() => {
      console.error('Unable to select files')
    });
}

function selectFolder() {
  const options = {
    allowMultipleSelection: false
  };

  this.client.showSelectFolderDialogPromise(options)
    .then(upload)
    .catch(() => {
      console.error('Unable to select files')
    });
}

function handleTransferEvents(type, data) {
  data.transfers.forEach((transfer) => {
    const transferRow = document.getElementById(transfer.uuid);
    if (transferRow) {
      transferRow.cells[0].textContent = `${Math.floor(transfer.percentage * 100)}%`;
      transferRow.cells[2].textContent = transfer.status;
    } else {
      addTableRow(transfer);
    }
  });
}

function initAsperaConnect() {
  this.client = new AW4.Connect();
  this.client.initSession();
  this.client.addEventListener(AW4.Connect.EVENT.TRANSFER, handleTransferEvents);
}
