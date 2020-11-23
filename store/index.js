import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    errorMessages: [], // array of strings
    sequence: new Array(30).fill(null),
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
        hint: 'Switch session to empty slot and stop sequencer. Circuit will "play" empty slot.',
        color: "pink",
        icon: "mdi-stop-circle-outline"
      },
      //{ actionTypeId: 6, title: "Reserved" }, not sure what types of actions we need
      //{ actionTypeId: 7, title: "Reserved" },
    ],
  },
  getters: {
    sequenceValid: state => {    
      // Is sequence empty
      if(state.sequence.filter(action => action === null).length === state.sequence.length) {
        state.errorMessages.push('Sequence is empty')
        return false
      }

      // Is first slot present
      if(state.sequence[0] === null) { 
        state.errorMessages.push('First sequencer slot can\'t be empty')
        return false
      }

      // Is every action valid
      if(state.sequence.filter(action => action && action.valid === false).length !== 0) {
        state.errorMessages.push('Some of the sequencer actions are not valid')
        return false
      }

      // Checking sequence logic (some of the logic for now)
      let hadNullSequenceEntry = false
      for (let index = 0; index < state.sequence.length; index++) {
        if(state.sequence[index] === null) hadNullSequenceEntry = true
        if(state.sequence[index] !== null && hadNullSequenceEntry) {
          state.errorMessages.push('Sequence have empty slots between actions')
          return false
        }
      }

      return true
    },
    nextErrorMessage: state => {
      const message = state.errorMessages.pop()
      return message || ''
    }
  },
  mutations: {
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
    }
  }
})