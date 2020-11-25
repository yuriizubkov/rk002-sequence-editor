'use strict'

import RK002 from './RK002lib'

// RK002lib Wrapper
class RK002MIDIObserver {
  constructor() {
    this._midiAccess = null
    this._pendingPromise = null
    this._busyErr = Error("Device is busy")
    this._midiInputId = null
    this._midiOutputId = null

    this.onParamDefs = null
    this.onMidiStateChange = null

    this.rk002 = new RK002.Loader()
    this.rk002.setObserver(this)
  }

  // RK002 lib specific part

  rk002_consoleTxt(txt) {
    console.log("rk002_consoleTxt:", txt)
    // really bad hack here... because in JS we need to use Promises since ES6
    if((txt + "").toLowerCase().includes('error') && this._pendingPromise !== null) {
      this._pendingPromise.reject(txt)
      this._pendingPromise = null
    }
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
    if(e.port.type === "input" && !this._allInputs.find(input => input.id === e.port.id)) {
      // adding new input to cache
      this._allInputs.push(e.port)
      if(this._midiInputId === e.port.id) {
        this.rk002.setInputDriver(e.port)
      }
    }

    if(e.port.type === "output" && !this._allOutputs.find(output => output.id === e.port.id)) {
      // adding new input to cache
      this._allOutputs.push(e.port)
      if(this._midiOutputId === e.port.id) {
        this.rk002.setOutputDriver(e.port)
      }
    }

    if(this.onMidiStateChange) {
      const port = { 
        name: e.port.name, 
        id: e.port.id,
        state: e.port.state,
        type: e.port.type
      }

      this.onMidiStateChange(port)
    }
  }

  // Async/Await wrappers around RK002 lib

  async initWebMIDI() {
    this._midiAccess = await navigator.requestMIDIAccess({ sysex: true })
    this._midiAccess.onstatechange = this._onMidiStateChange.bind(this)

    this._allInputs = Array.from(this._midiAccess.inputs.values())
    const convertedIns = this._allInputs.map(input => { 
      return { 
        name: input.name, 
        id: input.id,
        state: input.state
      } 
    })

    this._allOutputs = Array.from(this._midiAccess.outputs.values())    
    const convertedOuts = this._allOutputs.map(output => { 
      return { 
        name: output.name, 
        id: output.id,
        state: output.state
      } 
    })

    return {
      inputs: convertedIns,
      outputs: convertedOuts
    }
  }

  setMidiInputId(id) {
    this._midiInputId = id
    const inputPort = this._allInputs.find(input => input.id === id)

    if(inputPort) { 
      this.rk002.setInputDriver(inputPort)
      console.log('Input set:', inputPort)
      return true
    } else {
      console.log('======== INPUT ID NOT FOUND ========')
      return false
    }
  }

  setMidiOutputId(id) {
    this._midiOutputId = id
    const outputPort = this._allOutputs.find(output => output.id === id)

    if(outputPort) { 
      this.rk002.setOutputDriver(outputPort)
      console.log('Output set:', outputPort)
      return true
    } else {
      console.log('======== OUTPUT ID NOT FOUND ========')
      return false
    }
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