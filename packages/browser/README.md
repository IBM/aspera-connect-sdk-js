## Description
This project builds the Javascript (`asperaweb-4.js`) portion of the Connect SDK.

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

For a production build, run:

```shell
$ npm run build
```

## Linting
To check your code adheres to the linting rules, run:

```shell
$ npm run lint
```

## Running Tests

```shell
$ npm run test:integration
```
