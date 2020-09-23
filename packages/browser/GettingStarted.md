## IBM Aspera Connect SDK Reference
The Connect SDK enables you to develop a native feel to your web applications while utilizing the Aspera file-transfer capabilities. Through the JavaScript API you can offer a seamless user experience from initial installation of the plugin to use of the web application.

## Install
Access the Connect SDK via browser script tag:

```html
<script
  src="https://d3gcli72yxqn2z.cloudfront.net/connect/v4/asperaweb-4.min.js"
></script>
```

## Configure
Initialize Connect:

```javascript
let client = new AW4.Connect({
  minVersion: '3.10.0',
  dragDropEnabled: true
});
client.initSession();
```
For a full list of configuration options, refer to {@link AW4.Connect}.

## Using the Connect SDK
Most SDK functions support both promise and callback syntax.

**Using Promises**

```javascript
client.version()
  .then((version) => { console.log('Connect version: ${version}'); })
  .catch((err) => { console.log('Handle rejected promise (${err}) here.'); });
```

**Using Callbacks**

```javascript
let callbacks = {
  success: (version) => { console.log('Connect version: ${version}'); },
  error: (err) => { console.log('Handle request error (${err}) here.'); }
};
client.version(callbacks);
```

## Next Steps
For the full Connect API reference, refer to {@link AW4.Connect}.

For a deep dive into integrating the Connect SDK into your web application, check out the [IBM API Hub](http://apie-next-ui-shell-dev.mybluemix.net/explorer/catalog/aspera/product/ibm-aspera/api/connect-sdk/doc/integrating_connect_with_your_web_app).
