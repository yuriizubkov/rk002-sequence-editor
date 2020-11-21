import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sequence: new Array(30).fill(null),
    actionTypes: [ // id 0 - empty slot, sessionIndex -1 - not set
      {
        actionTypeId: 1,
        title: "Switch Session",
        hint: "Switch session to session number",
        color: "primary",
        icon: "mdi-skip-next-circle-outline",
        sessionIndex: -1,
        nextActionOnBeat: -1
      }, {
        actionTypeId: 3,
        title: "Loop Sessions",
        hint: "Loop sessions from session number to session number",
        color: "indigo",
        icon: "mdi-restore",
        startSessionIndex: -1,
        endSessionIndex: -1,
        nextActionOnBeat: -1
      }, {
        actionTypeId: 4,
        title: "Loop Actions",
        hint: "Loop actions from action number to action number",
        color: "cyan",
        icon: "mdi-restore",
        startActionIndex: -1,
        endActionIndex: -1,
        nextActionOnBeat: -1
      }, {
        actionTypeId: 5,
        title: "Jump to Action",
        hint: "Jump to action number",
        color: "orange",
        icon: "mdi-debug-step-over",
        actionIndex: -1,
        nextActionOnBeat: 0
      }, {
        actionTypeId: 2,
        title: "Stop Sequence",
        hint:
          'Switch session to empty slot and stop sequencer. Circuit will "play" empty slot.',
        color: "pink",
        icon: "mdi-stop-circle-outline",
        sessionIndex: 0,
        nextActionOnBeat: -1
      },
      //{ actionTypeId: 6, title: "Reserved" },
      //{ actionTypeId: 7, title: "Reserved" },
    ],
  },
  mutations: {
    // increment (state) {
    //   state.count++
    // }
  }
})