# Service Worker Controller

Used to register a service worker and listen for a ready event.
Can be used with [sw-stream] for easy plumbing.


### Usage

```js
const SwController = require('sw-controller')
const createSwStream = require('sw-stream')

const controller = new SwController({
  fileName: '/service-worker.js',
  // optional
  scope: 'clientA',
})

controller.on('ready', () => {
  const swStream = createSwStream({
    serviceWorker: controller.getWorker(),
  })
  // talk to the service worker
})

controller.startWorker()
```

[sw-stream]:https://github.com/kumavis/sw-stream