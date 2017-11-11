# Client Side Service Worker Ready Event

[![Greenkeeper badge](https://badges.greenkeeper.io/MetaMask/sw-controller.svg)](https://greenkeeper.io/)
[sw-stream]:https://github.com/kumavis/sw-stream

Intended to be used with [sw-stream] to register a service worker and
provide the active service worker on a ready event


### Usage
```javascript
const SWcontroller = require('client-sw-ready-event/lib/sw-client.js')
const SwStream = require('sw-stream/lib/sw-stream.js')

const background = new SWcontroller({
  fileName: '/service-worker.js',
  // optional
  scope: '/',
})

background.on('ready', () => {
  let swStream = SwStream({
    serviceWorker: background.controller,
  })
 // do stuff
})

background.startWorker()
```

