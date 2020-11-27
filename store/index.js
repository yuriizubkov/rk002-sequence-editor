import Vue from 'vue'
import Vuex from 'vuex'
// @ - is an alias for src folder here
import RK002MIDIObserver from '@/assets/js/rk002-wrapper'

Vue.use(Vuex)

const midiObserver = new RK002MIDIObserver()

export default new Vuex.Store({
  state: {
    errorMessage: '',
    activeActionIndex: null,
    sequence: new Array(30).fill(null),
    expectedFirmwareGUID: "c1825f6a-45fd-4ccc-b470-e3064ee4f94f",
    expectedFirmwareVersion: "1.0",
    commInProcess: false,
    firmwareInfo: null,
    midiInputsAndOutputs: null,
    selectedMidiInputId: -1,
    selectedMidiOutputId: -1,
    actionTypes: [ 
      {
        valid: false,
        actionTypeId: 1,
        title: "Switch Session",
        hint: "Switch session to session number",
        color: "primary",
        icon: "mdi-skip-next-circle-outline",
        sessionIndex: 0,
        nextActionOnBeat: 4
      }, {
        valid: false,
        actionTypeId: 3,
        title: "Loop Sessions",
        hint: "Loop sessions from session number to session number",
        color: "indigo",
        icon: "mdi-restore",
        startSessionIndex: 0,
        endSessionIndex: 7,
        repeats: 4
      }, {
        valid: false,
        actionTypeId: 4,
        title: "Loop Actions",
        hint: "Loop actions from action number to action number",
        color: "cyan",
        icon: "mdi-restore",
        startActionIndex: 0,
        endActionIndex: 3,
        repeats: 4
      }, {
        valid: false,
        actionTypeId: 5,
        title: "Jump to Action",
        hint: "Jump to action number",
        color: "orange",
        icon: "mdi-debug-step-over",
        toActionIndex: 0,
      }, {
        valid: true, // nothing to edit here
        actionTypeId: 2,
        title: "Stop Sequence",
        hint: 'Stop sequencer. Circuit will play last loaded session.',
        color: "pink",
        icon: "mdi-stop-circle-outline"
      },
      //{ actionTypeId: 6, title: "Reserved" }, not sure what types of actions we need
      //{ actionTypeId: 7, title: "Reserved" },
    ],
  },
  getters: {
    connected: function(state) {
      if(!state.midiInputsAndOutputs) return false

      const input = state.midiInputsAndOutputs.inputs.find(input => input.id === state.selectedMidiInputId)
      const output = state.midiInputsAndOutputs.outputs.find(output => output.id === state.selectedMidiOutputId)

      return state.firmwareInfo &&
        input &&
        output &&
        input.state === "connected" &&
        output.state === "connected"
    },
    commDisabled: function(state, getters) {
      return !getters.connected ||
        state.commInProcess ||
        !state.firmwareInfo || 
        state.firmwareInfo.version !== state.expectedFirmwareVersion || 
        state.firmwareInfo.guid !== state.expectedFirmwareGUID
    },
    midiInputs: function(state) {
      if(state.midiInputsAndOutputs === null) return []
      return state.midiInputsAndOutputs.inputs.map(input => { 
        return { 
          text: input.name, 
          value: input.id,
          disabled: input.state === "disconnected"
        } 
      })
    },
    midiOutputs: function(state) {
      if(state.midiInputsAndOutputs === null) return []
      return state.midiInputsAndOutputs.outputs.map(output => { 
        return { 
          text: output.name, 
          value: output.id,
          disabled: output.state === "disconnected"
        } 
      })
    }, 
    sequenceValid: state => () => { 
      // returning function here to avoid caching https://forum.vuejs.org/t/vuex-getter-not-re-evaluating-return-cached-data/55697/4    
      // Is sequence empty
      if(state.sequence.filter(action => action === null).length === state.sequence.length) {
        state.errorMessage = 'Sequence is empty'
        return false
      }

      // Is first slot present
      if(state.sequence[0] === null) { 
        state.errorMessage = 'First sequencer slot can\'t be empty'
        return false
      }

      // Is every action valid
      if(state.sequence.filter(action => action && action.valid === false).length !== 0) {
        state.errorMessage = 'Some of the sequencer actions are not valid'
        return false
      }

      // Checking sequence logic (some of the logic for now)
      let hadNullSequenceEntry = false
      for (let index = 0; index < state.sequence.length; index++) {
        const sequenceAction = state.sequence[index]
        if(sequenceAction === null) hadNullSequenceEntry = true
        if(sequenceAction !== null && hadNullSequenceEntry) {
          state.errorMessage = 'Sequence have empty slots between actions'
          return false
        }
        
        if(sequenceAction !== null) {
          switch(sequenceAction.actionTypeId) {
            case 3: {
              // loop sessions
              if(sequenceAction.startSessionIndex === sequenceAction.endSessionIndex) {
                state.errorMessage = `Loop Sessions action #${index+1} can't have equal From - To sessions`
                return false
              }
            }
          }
        }
      }

      return true
    }
  },
  mutations: {
    setMidiInputsAndOutputs(state, value) {
      state.midiInputsAndOutputs = value
    },
    addMidiInputPort(state, value) {
      state.midiInputsAndOutputs.inputs.push(value)
    },
    addMidiOutputPort(state, value) {
      state.midiInputsAndOutputs.outputs.push(value)
    },
    setSelectedMidiInputId(state, value) {
      localStorage.selectedMidiInputId = value
      state.selectedMidiInputId = value
    },
    setSelectedMidiOutputId(state, value) {
      localStorage.selectedMidiOutputId = value
      state.selectedMidiOutputId = value
    },
    setActiveActionIndex(state, value) {
      state.activeActionIndex = value
    },
    setCommInProcess(state, value) {
      state.commInProcess = value
    },
    setFirmwareInfo(state, value) {
      state.firmwareInfo = value
    },
    clearSequenceActionAt(state, actionIndex) {
      Vue.set(state.sequence, actionIndex, null)
    },
    addSequenceActionAt(state, args) {
      const actionType = state.actionTypes.find(entry => entry.actionTypeId === args.actionTypeId)
      Vue.set(state.sequence, args.actionIndex, Object.assign({}, actionType)) // cloning action type to array entry
    },
    modifySequenceActionAt(state, args) {
      const sequenceEntry = state.sequence[args.actionIndex]
      const newValue = args.newValue

      for (const [key, value] of Object.entries(newValue)) {
        if(sequenceEntry[key] != value) {
          sequenceEntry[key] = value
        }
      }
    },
    setErrorMessage(state, message) {
      state.errorMessage = message
    }
  },
  actions: {
    initWebMIDI: async function({ commit, dispatch }) {
      midiObserver.onMidiStateChange = port => dispatch('onMidiStateChange', port)
      const midiInputsAndOutputs = await midiObserver.initWebMIDI()
      commit('setMidiInputsAndOutputs', midiInputsAndOutputs)

      // Restoring settings from the browser's storage
      if(localStorage.selectedMidiInputId) {
        midiObserver.setMidiInputId(localStorage.selectedMidiInputId)
        commit('setSelectedMidiInputId', localStorage.selectedMidiInputId)    
      }

      if(localStorage.selectedMidiOutputId) {
        midiObserver.setMidiOutputId(localStorage.selectedMidiOutputId)
        commit('setSelectedMidiOutputId', localStorage.selectedMidiOutputId)   
      }
    },
    onMidiStateChange: function (context, port) {
      if (port.type === "input") {
        const item = context.state.midiInputsAndOutputs.inputs.find(item => item.id === port.id)
        if (item) {
          // existing input port
          item.state = port.state
          if (item.id === context.state.selectedMidiInputId) {
            if (item.state === "disconnected") context.state.firmwareInfo = null
            else context.dispatch('tryToConnect')
          }
        } else {
          // new input port
          context.commit('addMidiInputPort', port)
          context.dispatch('tryToConnect')
        }
      } else if (port.type === "output") {
        const item = context.state.midiInputsAndOutputs.outputs.find(item => item.id === port.id)
        if (item) {
          // existing output port
          item.state = port.state
          if (item.id === context.state.selectedMidiOutputId) {
            if (item.state === "disconnected") context.state.firmwareInfo = null
            else context.dispatch('tryToConnect')
          }
        } else {
          // new output port
          context.commit('addMidiOutputPort', port)
          context.dispatch('tryToConnect')
        }
      }
    },
    tryToConnect: async function(context) {
      // probably good idea to add debounce timeout here, 
      // because we have a bunch of events for new added devices in case when we connecting RK006
      if(context.state.selectedMidiInputId !== -1 && 
        context.state.selectedMidiOutputId !== -1 && 
        !context.getters.commInProcess) {

        context.commit('setCommInProcess', true)
        context.commit('setFirmwareInfo', null)
        try {
          const firmwareInfo = await midiObserver.inquiryDevice()
          context.commit('setFirmwareInfo', firmwareInfo)
        } catch (err) {
          console.error("tryToConnect error:", err)
        }

        context.commit('setCommInProcess', false)
      }
    },
  }  
})