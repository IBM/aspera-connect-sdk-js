[![Build Status](https://build.aspera.us/buildStatus/icon?job=apps-trunk-build-mac-10.13-64-connect-sdk-dw%2Fmaster)](https://build.aspera.us/job/apps-trunk-build-mac-10.13-64-connect-sdk-dw/job/master/)

## Top-level project for the IBM Aspera Connect SDK

## Getting Started
Clone the repo:
```shell
$ git clone git@gitlab.aspera.us:dwosk/ibm-aspera-connect-sdk.git

```
Install all dependencies:
```shell
$ npm install
```

## Build
To build all javascript components and output SDK zip file, run:

```shell
$ npm run build
```
The SDK zip file will be located in the top-level directory.

To skip bundling the installers, set:
```shell
$ export SKIP_INSTALLERS=1
```

To set a custom location for the installers, including revision number, set:
```shell
$ export OVERRIDE_INSTALLERS=/aspera/process/release/3.9.1
$ export REV_NUMBER=3.9.1.171801

# Optionally - to only skip one click installers
$ export SKIP_ONE_CLICK=1
```
