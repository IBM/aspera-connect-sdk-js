## Description
Bundles SDK into dist/asperaweb-4.js file that supports:
* CommonJS module require
* AMD module require
* Loaded via browser script tag

Adheres to the "Universal Module Definition" pattern: https://github.com/umdjs/umd

## Getting Started

```shell
$ npm install
```

## Build
For a production build, run:

```shell
$ npm run build
```

Compiled files are output to the `dist/` directory. Will only output if there are no
type errors.

There are 3 types of output under `./packages/browser`:
- For use in the browser: `./dist/asperaweb-4.js` (this is bundled and output via webpack)
- For use in Node (CommonJS): `./dist/index.js` (configured via tsconfig.json)
- For use as an ES6 module: `./esm/index.js` (configured via tsconfig.esm.json)

The `package.json` for `@ibm-aspera-sdk/browser` has a `"main"` field that points to
`./dist/index.js` which is consistent with Node usage via `require`. There is also a
`"module"` field that points to `./esm/index.js` which is the module that supports ES6 (ES2015)
syntax (`import/export`). The `module` field tells ES6 aware tools like Rollup/Webpack to use the ES6 version
of the module.

Basically, the SDK will work for everyone using legacy formats (UMD/CommonJS/AMD/browser globals) while
enabling people using ES6 module bundlers like Rollup/Webpack to use this newer and better format.

More info here: https://github.com/rollup/rollup/wiki/pkg.module

## Development
During development, it's convenient to set webpack to compile whenever changes are made. Run:

```shell
$ npm run dev
```

Compiled files are output to the `dist/` directory. This will still compile even if there
are type errors. To just run a type check without compiling, run:

```shell
$ npm run check-types
```

## Linting
To check your code adheres to the linting rules, run:

```shell
$ npm run lint
```

## Running Tests

```shell
$ npm run test
```
