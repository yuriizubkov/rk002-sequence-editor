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
          <v-btn icon outlined rounded class="mr-1" @click="onDownloadClick" v-bind="attrs" v-on="on" :disabled="commDisabled">
            <v-icon>mdi-arrow-down-bold</v-icon>
          </v-btn>
        </template>
        <span>Download sequence from RK002</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon outlined rounded class="mr-1" @click="parseAndUploadSequence" v-bind="attrs" v-on="on" :disabled="commDisabled">
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
    <v-dialog v-model="overwriteDialog" max-width="320">
      <v-card>
        <v-card-title>
          Replace current sequence?
        </v-card-title>
        <v-card-text>
          Your current sequence is not empty. <br/>Do you want to replace current sequence with loaded from the RK002?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="onReplace" color="primary">
            Replace
          </v-btn>
          <v-btn @click="overwriteDialog = false">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import SequencerSimulator from "./components/sequencer-simulator"
import SequenceEntry from "./components/sequence-entry"
import { mapState, mapMutations, mapGetters, mapActions } from 'vuex'

export default {
  name: "rk002-sequence-editor",

  components: {
    SequenceEntry,
    SequencerSimulator
  },

  data: () => ({    
    configDialog: false,
    overwriteDialog: false, 
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
    ...mapState([
      'actionTypes',
      'errorMessage', 
      'sequence',
      'commInProcess',
      'selectedMidiInputId',
      'selectedMidiOutputId',
      'firmwareInfo',
      'expectedFirmwareVersion',
      'expectedFirmwareGUID']),
    ...mapGetters([
      'sequenceValid',
      'connected',
      'commDisabled',
      'midiInputs',
      'midiOutputs'
      ])
  },

  watch: {
    errorMessage: function(val) {
      if(val.length > 0) {
        this.snackbarText = val
        this.setErrorMessage('')
        this.snackbar = true
      }
    },
    firmwareInfo: function(val) {
      if(!val) return
      // check if correct software installed on RK002 and show error if not
      if (val.version !== this.expectedFirmwareVersion || val.guid !== this.expectedFirmwareGUID) {
        this.setErrorMessage('You have unsupported software on the RK002')
      }
    },
    connected: async function(val) {
      if(!val) return
      // requesting parameters after successfull connection
      const sleep = ms => new Promise(r => setTimeout(r, ms))
      await sleep(50) //50ms delay. When requesting too fast - device is not responding.
      this.onDownloadClick()
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
    onDownloadClick: async function() {
      if(this.commInProcess) return
      // if sequence is empty - load sequence, if not - ask user what to do
      if(this.sequence.filter(action => action === null).length === this.sequence.length) {
        this.onReplace()
      } else {
        // ask user what to do
        this.overwriteDialog = true
      }
    },
    onReplace: async function() {
      this.overwriteDialog = false
      try {
        await this.fetchParameters()
        this.parseAndLoadSequence()
      } catch (err) {
        this.setErrorMessage('Error loading sequence from RK002')
        console.error('Method "onReplace" error:', err)
      }
    },
    ...mapMutations([
      'clearSequenceActionAt', 
      'addSequenceActionAt',
      'setErrorMessage',
      'setSelectedMidiInputId',
      'setSelectedMidiOutputId']),
    ...mapActions([
      'initWebMIDI',
      'tryToConnect',
      'fetchParameters',
      'parseAndLoadSequence',
      'parseAndUploadSequence'])
  },
  mounted: async function() {
    try {      
      await this.initWebMIDI()
    } catch(err) {
      this.setErrorMessage('Error: can\'t init Web MIDI')
      console.error('On "mounted" error:', err)
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
