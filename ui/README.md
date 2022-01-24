# Connect Installer Banner UI

The Connect banner UI that provides a guided installation experience to get users
started with the Connect desktop application.

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app locally.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run build`

Builds the banner UI and outputs to the `build` directory.<br>

### `npm run test`

Runs the test suite.<br>

## Notes on Testing

When viewing the app either via `npm run start` or directly opening `build/index.html`
in a browser, you can use `window.postMessage(event, '*')` to trigger the various banner states.

For example:

```javascript
window.postMessage('download', '*');
window.postMessage('extension_install', '*');
window.postMessage('running', '*');
```
