<template>
  <v-app id="rk002-sequence-editor">
    <v-app-bar app flat>
      <v-toolbar-title style="min-width: 150px">
        <a class="title-link" href="/">LENSFLARE.DEV</a>
      </v-toolbar-title>
      <v-tabs color="grey darken-1" class="ml-2 mr-2" v-model="activeTab">
        <v-tab v-for="link in links" :key="link.title" :href="link.url">
          {{ link.title }}
        </v-tab>
      </v-tabs>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon outlined rounded class="mr-1" v-bind="attrs" v-on="on" :disabled="commDisabled">
            <v-icon>mdi-arrow-down-bold</v-icon>
          </v-btn>
        </template>
        <span>Download sequence from RK002</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon outlined rounded class="mr-1" v-bind="attrs" v-on="on" :disabled="commDisabled">
            <v-icon>mdi-arrow-up-bold</v-icon>
          </v-btn>  
        </template>
        <span>Upload sequence to RK002</span>
      </v-tooltip>    
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon outlined rounded class="mr-1" @click.stop="configDialog = true" v-bind="attrs" v-on="on">
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </template>
        <span>MIDI Configuration</span>
      </v-tooltip>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col class="d-flex justify-end align-start" cols="3" md="4" lg="3">
            <!-- Left column -->
            <SequencerSimulator />
          </v-col>
          <v-col class="d-flex justify-center" cols="6" md="6" lg="6">
            <v-sheet rounded="lg" style="width: 100%;">
              <!-- Middle column -->
              <v-container>
                <h3 class="text-center">Action Sequencer</h3>
                <v-row dense>
                  <v-col>
                    <SequenceEntry
                      v-for="(sequenceEntry, index) in sequence"
                      :key="index"
                      :action-index="index"
                      :class="index != 0 ? 'mt-3' : ''"
                    />
                  </v-col>
                </v-row>
              </v-container>
            </v-sheet>
          </v-col>
          <v-col class="d-flex justify-start align-start" cols="3" md="2" lg="3">
            <v-sheet rounded="lg" max-width="175px" min-width="175px" class="sheets-fixed">
              <!-- Right column -->
              <v-container>
                <h3 class="text-center">Actions</h3>
                <p class="text--disabled text-center mb-0">
                  Drop me to the slot:
                </p>
                <v-row
                  v-for="(action, index) in actionTypes"
                  :key="index"
                  dense
                >
                  <v-chip
                    class="action-chips ma-2"
                    :disabled="action.actionTypeId === 4"
                    :key="index"
                    :color="action.color"
                    :input-value="true"
                    filter
                    :filter-icon="action.icon"
                    draggable
                    @dragstart="onChipDragStart($event, action)"
                    @mouseenter="onChipMouseEnter(action)"
                    @mouseleave="onChipMouseLeave"
                  >
                    {{ action.title }}
                  </v-chip>
                </v-row>
              </v-container>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <v-snackbar
      v-model="snackbar"
      :timeout="10000"
      :color="snackbarColor"
    >
      {{ snackbarText }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="white"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-footer inset app>{{ statusBarText }}</v-footer>
    <v-dialog
      v-model="configDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title>
          <span class="headline">MIDI Configuration</span>
        </v-card-title>
        <v-card-text class="pb-0">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  :disabled="commInProcess"
                  :items="midiInputs"
                  v-model="selectedMidiInputId"
                  label="Input (Orange connector)"
                  required
                  outlined
                  dense
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  :disabled="commInProcess"
                  :items="midiOutputs"
                  v-model="selectedMidiOutputId"
                  label="Output (Black connector)"
                  required
                  outlined
                  dense
                ></v-select>
              </v-col>
            </v-row>
            <v-row v-if="firmwareInfo">
              <small class="font-weight-bold">{{ firmwareInfo.name }} v{{ firmwareInfo.version }}</small>
            </v-row>
            <v-row v-if="firmwareInfo">
              <small class="font-weight-bold">{{ firmwareInfo.author }}</small>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="tryToConnect" :disabled="commInProcess">
            Connect
          </v-btn>
          <v-btn color="default" @click="configDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import SequencerSimulator from "./components/sequencer-simulator"
import SequenceEntry from "./components/sequence-entry"
import { mapState, mapMutations, mapGetters } from 'vuex'
import RK002MIDIObserver from './assets/js/rk002-wrapper'

const midiObserver = new RK002MIDIObserver()

export default {
  name: "rk002-sequence-editor",

  components: {
    SequenceEntry,
    SequencerSimulator
  },

  data: () => ({
    expectedFirmwareGUID: "c1825f6a-45fd-4ccc-b470-e3064ee4f94f",
    expectedFirmwareVersion: "1.0",
    commInProcess: false,
    firmwareInfo: null,
    configDialog: false,
    midiInputsAndOutputs: null,
    selectedMidiInputId: -1,
    selectedMidiOutputId: -1,
    activeTab: 1,
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'red',
    statusBarText: "Status bar",
    links: [
      { title: "RK002 Circuit Song Mode", url: "" },
      { title: "About", url: "/retrokits/2020/11/24/rk002-circuit-song-mode.html" }
    ],
  }),

  computed: { 
    midiInputs: function() {
      if(this.midiInputsAndOutputs === null) return []
      return this.midiInputsAndOutputs.inputs.map(input => { 
        return { 
          text: input.name, 
          value: input.id,
          disabled: input.state === "disconnected"
        } 
      })
    },
    midiOutputs: function() {
      if(this.midiInputsAndOutputs === null) return []
      return this.midiInputsAndOutputs.outputs.map(output => { 
        return { 
          text: output.name, 
          value: output.id,
          disabled: output.state === "disconnected"
        } 
      })
    },
    connected: function() {
      if(!this.midiInputsAndOutputs) return false

      const input = this.midiInputsAndOutputs.inputs.find(input => input.id === this.selectedMidiInputId)
      const output = this.midiInputsAndOutputs.outputs.find(output => output.id === this.selectedMidiOutputId)

      return this.firmwareInfo &&
        input &&
        output &&
        input.state === "connected" &&
        output.state === "connected"
    },
    commDisabled: function() {
      return !this.connected ||
        this.commInProcess ||
        !this.firmwareInfo || 
        this.firmwareInfo.version !== this.expectedFirmwareVersion || 
        this.firmwareInfo.guid !== this.expectedFirmwareGUID
    },
    ...mapState([
      'actionTypes',
      'errorMessage', 
      'sequence']),
    ...mapGetters(['sequenceValid'])
  },

  watch: {
    errorMessage: function(val) {
      if(val.length > 0) {
        this.snackbarText = val
        this.setErrorMessage('')
        this.snackbar = true
      }
    },
    selectedMidiInputId: async function(val) {
      localStorage.selectedMidiInputId = val
      if(!midiObserver.setMidiInputId(this.selectedMidiInputId)) return
      this.tryToConnect()
    },
    selectedMidiOutputId: async function(val) {
      localStorage.selectedMidiOutputId = val
      if(!midiObserver.setMidiOutputId(this.selectedMidiOutputId)) return
      this.tryToConnect()
    },
    firmwareInfo: function(val) {
      if(!val) return
      // check if correct software and show error if not
      if (val.version !== this.expectedFirmwareVersion || val.guid !== this.expectedFirmwareGUID) {
        this.setErrorMessage('You have unsupported software on the RK002')
      }
    }
  },

  methods: {
    onChipDragStart: function (event, action) {
      event.dataTransfer.dropEffect = "copy";
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("action-type-id", action.actionTypeId);
    },
    onChipMouseEnter: function(action) {
      this.statusBarText = "Hint: " + action.hint
    },
    onChipMouseLeave: function() {
      this.statusBarText = "Status bar"
    },
    onMidiStateChange: function(port) { // TODO: NEED TO REFACTOR this mess. Let's make just one source of ports - rk002-wrapper
      if(port.type === "input") {
        const item = this.midiInputsAndOutputs.inputs.find(item => item.id === port.id)
        if(item) {
          // existing input port
          item.state = port.state
          if(item.id === this.selectedMidiInputId) {
            if(item.state === "disconnected") this.firmwareInfo = null
            else this.tryToConnect()
          }
        } else {
          // new input port
          this.midiInputsAndOutputs.inputs.push(port)
          this.tryToConnect()
        }
      } else if (port.type === "output") {
        const item = this.midiInputsAndOutputs.outputs.find(item => item.id === port.id)
        if(item) {
          // existing input port
          item.state = port.state
          if(item.id === this.selectedMidiOutputId) {
            if(item.state === "disconnected") this.firmwareInfo = null
            else this.tryToConnect()
          }
        } else {
          // new input port
          this.midiInputsAndOutputs.outputs.push(port)
          this.tryToConnect()
        }
      }
    },
    tryToConnect: async function() {
      // probably good idea to add debounce timeout here, when we have a bunch of events for new devices
      if(this.selectedMidiInputId !== -1 && 
        this.selectedMidiOutputId !== -1 && 
        !this.commInProcess) {

        this.commInProcess = true
        this.firmwareInfo = null
        try {
          this.firmwareInfo = await midiObserver.inquiryDevice()
        } catch (err) {
          console.error("tryToConnect error:", err)
        }

        this.commInProcess = false
      }
    },
    ...mapMutations([
      'clearSequenceActionAt', 
      'addSequenceActionAt',
      'setErrorMessage'])
  },

  mounted: async function() {
    try {
      midiObserver.onMidiStateChange = this.onMidiStateChange.bind(this)
      this.midiInputsAndOutputs = await midiObserver.initWebMIDI()

      if(localStorage.selectedMidiInputId) {
        midiObserver.setMidiInputId(localStorage.selectedMidiInputId)
        this.selectedMidiInputId = localStorage.selectedMidiInputId        
      }

      if(localStorage.selectedMidiOutputId) {
        midiObserver.setMidiOutputId(localStorage.selectedMidiOutputId)
        this.selectedMidiOutputId = localStorage.selectedMidiOutputId 
      }
    } catch(err) {
      console.error("onMounted error:", err)
    }
  }
}
</script>
<style scoped>
  .action-chips {
    cursor: grab;
  }
  .sheets-fixed {
    position: fixed;
  }
  .title-link {
    color: white;
    text-decoration: none;
  }
</style>
