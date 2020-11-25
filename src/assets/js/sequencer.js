///////////////////////
// Sequencer Entry   //
///////////////////////
class SequencerAction {
    constructor(props, paramObj, midiObserver) {
      this._action = 0
      this._sessionIndex = 0
      this._steps = 0
  
      Object.assign(this, props)
      
      this._paramObj = paramObj
      this._midiObserver = midiObserver
    }
  
    get paramNr() {
      return this._paramObj.nr
    }
  
    set action(val) {
      if (val > 3 || val < 0) throw Error('Value of the action code should be between 0 and 3')
      this._action = val
    }
  
    set sessionIndex(val) {
      if (val > 31 || val < 0) throw Error('Value of the session index should be between 0 and 31')
      this._sessionIndex = val
    }
  
    set steps(val) {
      if(val > 255 || val < 0) throw Error('Value of the steps should be between 0 and 255')
      this._steps = val
    }
  
    getParamValue() {
      // TODO: merge to 16 bit value
    }
  }

///////////////////////
// Sequencer UI      //
///////////////////////
class SequencerJqueryUI {
    constructor(rk002MIDIObserver) {
      this._midiObserver = rk002MIDIObserver
      this._midiObserver.onParamDefs = this.onParamDefs.bind(this)
      this._sequencerRawParams = [] // Array of 64 bytes. One action = one parameter or 2 bytes.
      this.sequencerActions = [] // Array of actions
      this.actionCode = {
        next: 0, // switch to next session from address
        start: 1, // session from which to start, can go to the next only
        loop: 2, // loop from start addr to end addr
        stop: 3 // stop
      }
    }
  
    set sequencerRawParams(params) { 
      this._sequencerRawParams = params
      this.sequencerActions = []
  
      for (let param of params) {
        // Split 16bit value in two 8 bit values
        // merge two char into short
        // MyShort = (Char2 << 8) | Char1;
        const byte1 = param.val & 0xFF
        const byte2 = param.val >> 8
  
        // Action, 2 MSBs of the 2nd byte
        let action = (byte2 & 0b11000000) >> 6
        // Session number, 6 LSBs of the 2nd byte
        let sessionIndex = byte2 & 0b00111111
  
        this.sequencerActions.push(new SequencerAction({
          action,
          sessionIndex,
          steps: byte1
        }, param, midiObserver))
      }
  
      console.log(this.sequencerActions)
    }
  
    onParamDefs(params) {
      this.sequencerRawParams = params
    }
  
    bindUIEvents(actionEls) {
      actionEls.children('a.action-edit').click(this.onEditButtonClick.bind(this))
    }
  
    async onEditButtonClick(event) {
      if(this.sequencerActions.length === 0) {
        alert('Please read RK002 device first')
        return
      }
  
      const actionIndex = event.target.attributes.action.value - 1
      const actionEntry = this.sequencerActions[actionIndex]
  
      actionEntry.action = this.actionCode.next
      actionEntry.sessionIndex = 2
  
      const response = await this._midiObserver.sendParameterValue(actionEntry.paramNr, actionEntry.getParamValue())
      console.info(response)
    }
  }
  
  /////////////////////
  // Main            //
  /////////////////////
  let rk002 = new RK002.Loader()
  let midiObserver = new RK002MIDIObserver(rk002)
  let actionSequencer = new SequencerJqueryUI(midiObserver)
  
  $(document).ready(() => {
    // html elements
    const actionEls = $('[id*=action]')
    // vars
    const sleep = ms => new Promise(r => setTimeout(r, ms))
  
    async function start() {
      try {
        await midiObserver.initWebMIDI()
        const inquiryResult = await midiObserver.inquiryDevice()
        console.log("INQUIRY:", inquiryResult)
        await sleep(50) // 50ms delay. When requesting too fast - device is not responding
  
        const parameters = await midiObserver.fetchParameters()
        console.log("PARAMETERS:", parameters)
      } catch (err) {
        console.error(err)
      }
    }
  
    // attaching UI event handlers
    actionSequencer.bindUIEvents(actionEls)
  
    start()
  })