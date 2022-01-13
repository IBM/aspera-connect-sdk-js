# Upgrading from 3.x/4.x to 5.0.0

The `5.0.0` major release introduces several breaking changes as the SDK went through dramatic refactoring in order to be able to deploy the
SDK separately from the Connect installers as well as deploy the SDK and typings to NPM.

## 1. Cloudfront CDN URL

For web applications that load the SDK via script tag, we now deploy the SDK to a new Cloudfront URL.

```html
<!-- Before -->
<script src="https://d3gcli72yxqn2z.cloudfront.net/connect/v4/asperaweb-4.js"></script>>

<!-- New in 5.0.0 -->
<script
    src="https://d3gcli72yxqn2z.cloudfront.net/@ibm-aspera/connect-sdk-js/v5.0.0/connect-sdk.js"
    integrity="sha384-Y6T0AxMBLlay7gSJrZp3pJisXTWaw7xyvZZyQ4Qmkes0+RTLRG2sDhEPlag/Knaf"
    crossorigin="anonymous">
</script>
```

Alternatively, since the SDK is now available via NPM, it's possible to remove the script tag entirely and instead bundle the SDK directly in your
application via `npm install --save @ibm-aspera/connect-sdk-js`.

## 2. Connect installers

In `5.0.0`, the only Connect installers available to offer for download are the `4.x.x` installers. Your web application will no longer be able to offer `3.x.x`.

See below for more information regarding handling the Connect installers.

## 3. New `version` option
The `AW4.ConnectInstaller` class has a new `version` option that specifies the Connect installer version to offer for downloads.

By default, the `latest` version is offered. You can pin to a specific Connect installer like this:

```javascript
// New in 5.0.0
const options = { version: '4.1.1' };
const connectInstaller = new AW4.ConnectInstaller(options);
```

## 4. Updates to the `sdkLocation` option

The `AW4.ConnectInstaller` class has an `sdkLocation` option that specifies the URL to serve the Connect installers from.

The default URL used if no `sdkLocation` is specified has changed.

Before: `//d3gcli72yxqn2z.cloudfront.net/connect/v4`

After:  `//d3gcli72yxqn2z.cloudfront.net/downloads/connect/latest`

By default, the latest Connect installers will be offered. If your web application specifies `sdkLocation`, in certain cases it may be necessary to make updates:

#### If your `sdkLocation` specifies a Cloudfront URL:

If your web application explicitly sets a Cloudfront URL for `sdkLocation`, it's required to remove the `sdkLocation` option.

```javascript
// Before
const options = { sdkLocation: '//d3gcli72yxqn2z.cloudfront.net/connect_4_1_1_23b54d2_ga/v4' };
const connectInstaller = new AW4.ConnectInstaller(options);

// New in 5.0.0
const options = { version: '4.1.1' };
const connectInstaller = new AW4.ConnectInstaller(options);

// Before
const options = { sdkLocation: '//d3gcli72yxqn2z.cloudfront.net/connect/v4' };
const connectInstaller = new AW4.ConnectInstaller(options);

// New in 5.0.0
const options = {};
const connectInstaller = new AW4.ConnectInstaller(options);
```

## 5. Remove `blue` banner UI

The `blue` banner UI is no longer available in `5.0.0`. If set, the value is ignored and the default `carbon` banner UI is displayed instead.

```javascript
// Before
const options = { style: 'blue' };
const connectInstaller = new AW4.ConnectInstaller(options);

// New in 5.0.0
const options = {};
const connectInstaller = new AW4.ConnectInstaller(options);
```

## 6. Changing `installationJSON()` return object

The object returned by the `installationJSON()` function has been updated to remove older entries, and now better reflects the Connect installers currently offered.

In most cases this will not require any changes, but if your web application does complex logic with the object returned, it may require changes. This also applies if your web application depends on the internal `window.connectVersions` object.

The overall structure of the return object remains the same, but some outdated fields such as `id`, `navigator` and `platform.version` have been removed. `platform.os` is now used to determine the Connect installer to offer to the user.

## 7. Remove `useFips` option

The `useFips` option in the `AW4.ConnectInstaller` class has been removed. Since it was introduced, this option forced the old Connect 3.10.1 installers to be offered to users on Windows. Instead, try offering the Connect 4.1.1 installers or direct users to download the Connect 3.10.1 installers on Windows from [IBM Fix Central](https://www.ibm.com/support/fixcentral/).

```javascript
// Before
const options = { useFips: true };
const connectInstaller = new AW4.ConnectInstaller(options);

// New in 5.0.0
const options = {};
const connectInstaller = new AW4.ConnectInstaller(options);
```
