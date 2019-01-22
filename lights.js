const gpio = require('rpi-gpio')
const gpiop = gpio.promise

const LED_AMBER = 18
const LED_GREEN = 22
const LED_RED = 17
const STATE_ON = true
const STATE_OFF = false

class Light {
  constructor() {
    this.initialised = false
    this.state = {
      [LED_AMBER]: STATE_OFF,
      [LED_GREEN]: STATE_OFF,
      [LED_RED]: STATE_OFF
    }
  }

  getState() {
    return Promise.all([
      gpiop.read(LED_AMBER),
      gpiop.read(LED_GREEN),
      gpiop.read(LED_RED)
    ]).then(([amber, green, red]) => {
      return {
        amber,
        green,
        red
      }
    })
  }

  initialise() {
    if (this.initialised) {
      return Promise.resolve()
    }

    console.log('Initialising...')

    gpio.setMode(gpio.MODE_BCM)

    return Promise.all([
      gpiop.setup(LED_AMBER, gpio.DIR_OUT),
      gpiop.setup(LED_GREEN, gpio.DIR_OUT),
      gpiop.setup(LED_RED, gpio.DIR_OUT)
    ]).then(() => {
      console.log('GPIO Setup complete')

      return Promise.all([
        this.setLightState(LED_AMBER, STATE_ON),
        this.setLightState(LED_GREEN, STATE_ON),
        this.setLightState(LED_RED, STATE_ON)
      ])
    }).then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 1000)
      })
    }).then(() => {
      return Promise.all([
        this.setLightState(LED_AMBER, STATE_OFF),
        this.setLightState(LED_GREEN, STATE_OFF),
        this.setLightState(LED_RED, STATE_OFF)
      ])      
    }).then(() => {
      this.initialised = true
    })
  }

  setBlinkingState(light, interval = 250) {
    const timer = setInterval(() => {
      this.getState().then(state => {
        const newState = state[light] === STATE_OFF
          ? STATE_ON
          : STATE_OFF

        this.setState({
          [light]: newState
        })
      })
    }, interval)
    const callback = () => {
      clearInterval(timer)
    }

    return Promise.resolve(callback)
  }

  setLightState(light, state) {
    return gpiop.write(light, state)
  }

  setState({
    amber = STATE_OFF,
    green = STATE_OFF,
    red = STATE_OFF
  }) {
    const commands = [
      this.setLightState(LED_AMBER, amber),
      this.setLightState(LED_GREEN, green),
      this.setLightState(LED_RED, red)
    ]

    return Promise.all(commands).then(() => {
      this.state = {
        [LED_AMBER]: amber,
        [LED_GREEN]: green,
        [LED_RED]: red
      }

      return this.state
    })
  }
}

module.exports = new Light()
module.exports.constants = {
  LED_AMBER,
  LED_GREEN,
  LED_RED,
  STATE_ON,
  STATE_OFF
}
