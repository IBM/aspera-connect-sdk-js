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
* NodeJS 12+

### Build

```shell
$ git clone https://github.com/IBM/aspera-connect-sdk-js.git
$ cd aspera-connect-sdk-js
$ npm install
$ npm run build
```

## Troubleshooting

In the browser, run `AW4.Logger.setLevel(2)` in the Developer Console to enable trace logging.

For help regarding the Connect desktop application, please visit [IBM Support](https://ibm.com/support).
