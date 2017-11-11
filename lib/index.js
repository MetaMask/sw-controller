const EventEmitter = require('events')

module.exports = class ClientSideServiceWorker extends EventEmitter {
  
  constructor (opts) {
    super()
    // opts
    this.fileName = opts.fileName
    this.scope = opts.scope
    this.keepAlive = opts.keepAlive === undefined ? true : opts.keepAlive

    // service worker refs
    this.serviceWorkerApi = navigator.serviceWorker
    this.activeServiceWorker = null

    // ready status
    this.ready = false
    this.once('ready', () => this.ready = true)
    
    // keep alive
    this.keepAliveActive = false
    this.keepAliveInterval = opts.keepAliveInterval || 60000
    this.keepAliveIntervalRef = null
    this.keepAliveDelay = opts.keepAliveDelay || 0
    if (this.keepAlive) {
      this.once('ready', () => this.startKeepAlive())
    }

    // start
    if (opts.autoStart) this.startWorker()
  }

  getWorker() {
    return this.activeServiceWorker || this.serviceWorkerApi.controller
  }

  async startWorker () {
    const registeredWorker = await this.registerWorker()
    // forward messages and errors
    this.serviceWorkerApi.addEventListener('message', (messageEvent) => this.emit('message', messageEvent))
    this.serviceWorkerApi.addEventListener('error', (err) => this.emit('error', err))
    const swReady = await this.serviceWorkerApi.ready
    this.activeServiceWorker = swReady.active
    this.activeServiceWorker.onerror = (err) => this.emit('error', err)
    this.emit('ready', this.activeServiceWorker)
  }

  async registerWorker () {
    const registeredWorker = await this.serviceWorkerApi.register(this.fileName, { scope: this.scope })
    registeredWorker.onupdatefound = (event) => {
      this.emit('updatefound')
      registeredWorker.update()
    }
    return registeredWorker
  }

  sendMessage (message) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        if (event.data.err) {
          reject(event.data.error)
        } else {
          resolve(event.data.data)
        }
      }
      this.getWorker().postMessage(message, [messageChannel.port2])
    })
  }

  startKeepAlive () {
    if (this.keepAliveActive) return
    this.keepAliveActive = true
    setTimeout(() => {
      this.keepAliveIntervalRef = setInterval(() => {
        this.emit('sendingWakeUp')
        this.sendMessage('wakeup')
      }, this.keepAliveInterval)
    }, this.keepAliveDelay)
  }

  stopKeepAlive () {
    if (!this.keepAliveActive) return
    clearInterval(this.keepAliveIntervalRef)
    this.keepAliveIntervalRef = null
    this.keepAliveActive = false
  }
}
