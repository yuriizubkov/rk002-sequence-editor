'use strict'

import RK002 from './RK002lib'

// RK002lib Wrapper
class RK002MIDIObserver {
  constructor() {
    this._midiAccess = null
    this._pendingPromise = null
    this._busyErr = Error("Device is busy")

    this.onParamDefs = null
    this.onMidiStateChange = null

    this.rk002 = new RK002.Loader()
    this.rk002.setObserver(this)
  }

  // RK002 lib specific part

  rk002_consoleTxt(txt) {
    console.log("rk002_consoleTxt:", txt)
  }

  // progress or status bar updates 0 - 100 for long operations
  rk002_stsUpdate(progress, status, isOk) {
    console.log("rk002_stsUpdate:", progress, status, isOk)
  }

  rk002_onEndUpload(txt, isOk, wasLegacy) {
    console.log("rk002_onEndUpload:", txt, isOk, wasLegacy)
  }

  rk002_onInquiryResult(isOk, inquiryResults) {
    if (!this._pendingPromise) return

    if (isOk) {
      this._pendingPromise.resolve(inquiryResults)
    } else {
      this._pendingPromise.reject("Error getting inquiry response")
    }

    this._pendingPromise = null
  }

  // called when all parameter definitions are fetched
  rk002_onParamDefsFetched(params) {
    this.onParamDefs && this.onParamDefs(params)
  }

  // called when a parameter-value has changed (or initially fetched)
  rk002_onParam(param) {
    if (!this._pendingPromise) return

    this._pendingPromise.resolve(param)
    this._pendingPromise = null
  }

  _onMidiStateChange(e) {
    if(!this.onMidiStateChange) return

    const port = { 
      name: e.port.name, 
      id: e.port.id,
      state: e.port.state,
      type: e.port.type
    }

    this.onMidiStateChange(port)
  }

  // Async/Await wrappers around RK002 lib

  async initWebMIDI() {
    this._midiAccess = await navigator.requestMIDIAccess({ sysex: true })
    this._midiAccess.onstatechange = this._onMidiStateChange.bind(this)
    this._allInputs = Array.from(this._midiAccess.inputs.values()).map(input => { 
      return { 
        name: input.name, 
        id: input.id,
        state: input.state
      } 
    })

    this._allOutputs = Array.from(this._midiAccess.outputs.values()).map(output => { 
      return { 
        name: output.name, 
        id: output.id,
        state: output.state
      } 
    })

    return {
      inputs: this._allInputs,
      outputs: this._allOutputs
    }

    //const rk002Input = allInputs.find(input => input.name === "RK006 IN_1")
    //const rk002Output = allOutputs.find(output => output.name === "RK006 OUT_5")

    //console.log(rk002Input)
    //console.log(rk002Output)

    // if (rk002Input && rk002Input.length != 0
    //   && rk002Output && rk002Output.length != 0) {
    //   rk002.setInputDriver(rk002Input)
    //   rk002.setOutputDriver(rk002Output)
    // } else {
    //   throw Error("rk002 is not connected")
    // }
  }

  setInputId(id) {
    console.log(id)
  }

  setOutputId(id) {
    console.log(id)
  }

  inquiryDevice() {
    return new Promise((resolve, reject) => {
      if (this._pendingPromise) return reject(this._busyErr)

      this._pendingPromise = { resolve, reject }
      this.rk002.startInquiry()
    })
  }

  fetchParameters() {
    return new Promise((resolve, reject) => {
      if (this._pendingPromise) return reject(this._busyErr)

      this._pendingPromise = { resolve, reject }
      this.rk002.fetchParams()
    })
  }

  sendParameterValue(nr, val) {
    return new Promise((resolve, reject) => {
      if (this._pendingPromise) return reject(this._busyErr)
      if (val > 65535 || val < 0) return reject(Error('Parameter value should be from 0 to 65535'))

      this._pendingPromise = { resolve, reject }
      this.rk002.setParamVal(nr, val)
    })
  }
}

export default RK002MIDIObserver