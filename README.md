## Top-level project for the IBM Aspera Connect SDK

## Build
To build all javascript components, run:

```shell
$ npm run build
```

To bundle and zip the SDK, run:
```shell
$ npm run sdk
```

To skip bundling the installers, set:
```shell
$ export SKIP_INSTALLERS=1
```

To set a custom location for the installers, including revision number, set:
```shell
$ export OVERRIDE_INSTALLERS=/aspera/process/release/3.9.1
$ export REV_NUMBER=3.9.1.171801

# Optional: To skip one click installers
$ export SKIP_ONE_CLICK=1
```
