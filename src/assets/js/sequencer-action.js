export default class SequencerAction {
  constructor(options) {
    let actionTypeId = -1
    let byte1, byte2 = 0

    if(typeof options === 'object') {
      actionTypeId = options.actionTypeId
    } else if(!isNaN(options)) {
      // Split 16bit value in two 8 bit values
      byte1 = options & 0xFF
      byte2 = options >> 8
      // Action, 3 MSBs of the 2nd byte
      actionTypeId = (byte2 & 0b11100000) >> 5
    } else {
      throw new Error(`Wrong constructor arguments for SequencerAction class ${ options }`)
    }

    // type defaults
    this.actionTypeId = actionTypeId
    switch (actionTypeId) {
      case SequencerAction.Type.SwitchSession: {
        this.valid = false
        this.title = "Switch Session"
        this.hint = "Switch session to session number"
        this.color = "primary"
        this.icon = "mdi-skip-next-circle-outline"
        this.sessionIndex = 0
        this.nextActionOnBeat = 4
        break
      }

      case SequencerAction.Type.LoopSessions: {
        this.valid = false
        this.title = "Loop Sessions"
        this.hint = "Loop sessions from session number to session number"
        this.color = "indigo"
        this.icon = "mdi-restore"
        this.startSessionIndex = 0
        this.endSessionIndex = 7
        this.repeats = 4
        break
      }

      case SequencerAction.Type.LoopActions: {
        this.valid = false
        this.title = "Loop Actions"
        this.hint = "Loop actions from action number to action number",
        this.color = "cyan",
        this.icon = "mdi-restore",
        this.startActionIndex = 0,
        this.endActionIndex = 3,
        this.repeats = 4
        break
      }

      case SequencerAction.Type.JumpToAction: {
        this.valid = false
        this.title = "Jump to Action",
        this.hint = "Jump to action number",
        this.color = "orange",
        this.icon = "mdi-debug-step-over",
        this.toActionIndex = 0
        break
      }

      case SequencerAction.Type.StopSequence: {
        this.valid = true, // nothing to check here
        this.title = "Stop Sequence",
        this.hint = 'Stop sequencer. Circuit will play last loaded session.',
        this.color = "pink",
        this.icon = "mdi-stop-circle-outline"
        break
      }

      default: {
        throw new Error('Empty sequencer slot or undefined action type')
      }
    }

    if(typeof options === 'object') {
      // overriding defaults here
      Object.assign(this, options)
      return
    }

    // parsing the rest here, except stop action - it has only action type, that was already parsed above
    switch (actionTypeId) {
      case SequencerAction.Type.SwitchSession: {
        // Session index 0 - 31, 5 LSBs of the 2nd byte
        this.sessionIndex = byte2 & 0b00011111
        this.nextActionOnBeat = byte1
        break
      }

      case SequencerAction.Type.LoopSessions: {
        this.startSessionIndex = byte2 & 0b00011111
        this.endSessionIndex = byte1 & 0b00011111
        this.repeats = (byte1 & 0b11100000) >> 5
        break
      }

      case SequencerAction.Type.LoopActions: {
        // TODO: not implemented
        this.startActionIndex = 0,
        this.endActionIndex = 3,
        this.repeats = 4
        break
      }

      case SequencerAction.Type.JumpToAction: {
        this.toActionIndex = byte2 & 0b00011111
        break
      }
    }
  }

  static Type = {
    SwitchSession: 1,
    LoopSessions: 3,
    LoopActions: 4,
    JumpToAction: 5,
    StopSequence: 2
    // 6 - reserved,
    // 7 - reserved
  }

  getUserParamValue() {
    let paramValue = 0 // 16 bit word

    switch (this.actionTypeId) {
      case SequencerAction.Type.SwitchSession: {
        // Session index 0 - 31, 5 LSBs of the 2nd byte
        paramValue = this.actionTypeId << 5
        paramValue = (paramValue | this.sessionIndex) << 8
        paramValue = paramValue | this.nextActionOnBeat
        break
      }

      case SequencerAction.Type.LoopSessions: {
        paramValue = this.actionTypeId << 5
        paramValue = (paramValue | this.startSessionIndex) << 8
        paramValue = paramValue | (this.repeats << 5)
        paramValue = paramValue | this.endSessionIndex
        break
      }

      case SequencerAction.Type.LoopActions: {
        // TODO: not implemented
        // this.startActionIndex = 0,
        // this.endActionIndex = 3,
        // this.repeats = 4
        break
      }

      case SequencerAction.Type.JumpToAction: {
        paramValue = this.actionTypeId << 5
        // 0 - 29, 2 last parameters reserved for config
        paramValue = (paramValue | this.toActionIndex) << 8
        break
      }

      case SequencerAction.Type.StopSequence: {
        paramValue = this.actionTypeId << 13 // 8 + 5
        break
      }
    }

    return paramValue
  }

  clone() {
    return new SequencerAction(Object.assign({} , this))
  }
}