const EventEmitter = require('events')

module.exports = class ClientSideServiceWorker extends EventEmitter{
  constructor (opts) {
    super()
    this.fileName = opts.fileName
    this.startDelay = opts.startDelay
    this.scope = opts.scope
    this.serviceWorkerApi = navigator.serviceWorker
    this.serviceWorkerApi.onmessage = (messageEvent) => this.emit('message', messageEvent)
    this.serviceWorkerApi.onerror = (err) => this.emit('error', err)

    this.on('ready', () => this.ready = true)

    this._letBeIdel = opts.letBeIdel === undefined ? true : opts.letBeIdel
    this.wakeUpInterval = opts.wakeUpInterval || 60000
    if (opts.initStart) this.startWorker()

    if (!this._letBeIdel) this.on('ready', this._setWakeUps)
  }

  get letBeIdel () {
    return this._letBeIdel
  }

  set letBeIdel (bool) {
    if (bool && !this._letBeIdel) this.emit('turnOffInterval')
    else if (!bool) this.ready ? this._setWakeUps() : this.on('ready', this._setWakeUps)
    this._letBeIdel = bool

  }

  get controller () {
    return  this.sw || this.serviceWorkerApi.controller
  }

  startWorker () {
    return this.registerWorker()
    .then((sw) => {
      this.sw = sw
      this.sw.onerror = (err) => this.emit('error', err)
      this.sw = sw
      this.emit('ready', this.sw)
    })
    .catch((err) => this.emit('error', err))
  }

  registerWorker () {
    return this.serviceWorkerApi.register(this.fileName, {scope: this.scope})
    .then((registerdWorker) => {
      return new Promise((resolve, reject) => {
        let timeOutId = setTimeout(() => {
          if (this.serviceWorkerApi.controller) return resolve(this.serviceWorkerApi.controller)
          if (registerdWorker.active) return resolve(registerdWorker.active)
          return reject(new Error('ClientSideServiceWorker: No controller found and onupdatefound timed out'))
        }, this.startDelay || 1000 )

        registerdWorker.onupdatefound =  (event) => {
          this.emit('updatefound')
          registerdWorker.update()
        }
      })
    })
  }

  sendMessage (message) {
    const self = this
    return new Promise((resolve, reject) => {
       var messageChannel = new MessageChannel()
       messageChannel.port1.onmessage = (event) => {
         if (event.data.err) {
           reject(event.data.error)
         } else {
           resolve(event.data.data)
         }
       }
      this.controller.postMessage(message, [messageChannel.port2])
    })
  }

  _setWakeUps () {
    let intervalId = setInterval(() => {
      this.emit('sendingWakeUp')
      this.sendMessage('wakeup')
    }, this.wakeUpInterval)
    this.on('turnOffInterval', () => {
      clearInterval(intervalId)
    })
  }
}
