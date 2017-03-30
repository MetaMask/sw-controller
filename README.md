# Client Side Service Worker Ready Event
[sw-stream]:https://github.com/kumavis/sw-stream

Intended to be used with [sw-stream] to register a service worker and
provide the active service worker on a ready event


### Usage
```javascript
const SWcontroller = require('./sw-controller')
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
```

