[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/5764/badge)](https://bestpractices.coreinfrastructure.org/projects/5764)
[![npm](https://img.shields.io/npm/v/@ibm-aspera/connect-sdk-js)](https://www.npmjs.com/package/@ibm-aspera/connect-sdk-js)

# Official Aspera Connect SDK for JavaScript

Enables web applications to utilize Aspera file-transfer capabilities.

Check out [GitHub Pages](https://ibm.github.io/aspera-connect-sdk-js/) for documentation.

## Installation
Install from npm:

```shell
$ npm install --save @ibm-aspera/connect-sdk-js
```

Install from source:

```shell
$ git clone https://github.com/IBM/aspera-connect-sdk-js.git
$ cd aspera-connect-sdk-js
$ npm install
```

Load from the CDN:

```html
<script src="https://d3gcli72yxqn2z.cloudfront.net/@ibm-aspera/connect-sdk-js/latest/connect-sdk.js"></script>
```

It's highly recommended if you embed the Connect SDK via CDN that you use a specific version instead of using the latest. The latest Connect SDK is subject to change at any time with breaking changes, which could potentially affect your website.

## Usage

Launch and establish a connection to the Connect desktop application:
```javascript
import { Connect } from '@ibm-aspera/connect-sdk-js';

const connectClient = new Connect();
connectClient.initSession();
```

Start a download:
```javascript
try {
  const transferSpec = {
    authentication: 'token',
    paths: [
      {
        source: 'my_awesome_movie.drp'
      }
    ],
    remote_host: 'example.com',
    remote_user: 'foo',
    token: 'ATV7_HtfhDa-JwWfc6RkTwhkDUqjHeLQePiOHjIS254_LJ14_7VTA',
    direction: 'receive'
  };

  const response = await connectClient.startTransferPromise(transferSpec);
  console.log(`Transfer started: ${response}`);
} catch(err) {
  throw new Error(`Could not start transfer: ${err}`);
}
```

Check out the provided [Examples](examples) for more code samples.

## Migration from 3.x/4.x to 5.0.0

Refer to [MIGRATION](MIGRATION.md) to see the required changes when updating your code to `v5.0.0`.

## Development

### Prerequisites
* [Node.js](https://nodejs.org/en/download/) v12+
  - If you are on macOS, we recommend installing Node.js via a package manager such as [nvm](https://github.com/nvm-sh/nvm).
* Git

### Build

```shell
$ git clone https://github.com/IBM/aspera-connect-sdk-js.git
$ cd aspera-connect-sdk-js
$ npm install
$ npm run build
```

## Locally hosting the Connect desktop installers
Rather than having users download Connect from Cloudfront, it is possible to host the installers locally. This is particularly useful if your server is running in an offline environment (i.e. users will not have access to Cloudfront) or if you would simply prefer users download Connect from your server.

To download the `connect-deployer` Docker image:

```shell
$ docker pull icr.io/ibmaspera/connect-deployer:latest
```

Version tags are also available starting from Connect 4.2.2 (ex: `docker pull icr.io/ibmaspera/connect-deployer:4.2.2`).

#### To host the installers on a basic web server:

```shell
$ docker run -it --rm -d -p 8080:80 icr.io/ibmaspera/connect-deployer:latest
```

With the above command, the Connect installers will be available over `http://127.0.0.1:8080/aspera/connect`. To configure the Connect SDK to serve the Connect installers from this URL you must update [`sdkLocation`](https://ibm.github.io/aspera-connect-sdk-js/AW4.ConnectInstaller.html#ConnectInstaller) to the above URL.

#### To host the installers over a secure web server:

```shell
$ docker run -it --rm -d -p 8443:443  -v /path/to/your/ssl/certs:/etc/ssl/certs icr.io/ibmaspera/connect-deployer:latest
```

Note: The server certificate and private key must be named `cert.pem` and `key.pem`, respectively.

## Contributing

We're always looking for contributors to help us fix bugs, build new features, or help us improve the project documentation. If you're interested, definitely check out our [Contributing Guide](/.github/CONTRIBUTING.md).

## Troubleshooting

In the browser, run `AW4.Logger.setLevel(2)` in the Developer Console to enable trace logging.

For help regarding the Connect desktop application, please visit [IBM Support](https://ibm.com/support).
