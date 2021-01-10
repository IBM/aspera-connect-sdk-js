## Top-level project for the IBM Aspera Connect SDK

## Description
This project builds and bundles the [Connect SDK](https://api.ibm.com/explorer/catalog/aspera/product/ibm-aspera/api/connect-sdk/doc/connect_sdk_guide) which contains both the [Javascript SDK](packages/browser/README.md) and [Carbon Installer](packages/carbon-installer/README.md) components as well as various Connect [installers](https://www.ibm.com/aspera/connect/).

## Prerequisites
* NodeJS 12.x+

## Getting Started
Clone the repo:
```shell
git clone git@github.ibm.com:Aspera/connect-sdk.git

```
Install all dependencies:
```shell
cd connect-sdk
npm install
```

## Build
1. Copy all required Connect installers into a root directory named `imports`. Custom installer directories can be set via environment variables (in order of priority):
      1. `SKIP_INSTALLERS=1` Skip bundling the installers
      2. `OVERRIDE_LINUX_INSTALLERS=/tmp/linux` Custom directory for Linux installers
      3. `OVERRIDE_MAC_INSTALLERS=/tmp/mac` Custom directory for macOS installers      
      4. `OVERRIDE_WIN_INSTALLERS=/tmp/win` Custom directory for Windows installers
      5. `OVERRIDE_INSTALLERS=/tmp/default` Custom directory for all installers
2. `npm run build`

## Release
To bump the version, run:

```shell
npm run bump -- --release-as <new_version>
```

For automatic tagging and CHANGELOG generation, run:

```shell
npm run release -- --dry-run
```
Remove `--dry-run` to actually make the changes.
