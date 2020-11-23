<template>
  <v-app id="rk002-sequence-editor">
    <v-app-bar app flat>
      <v-toolbar-title style="min-width: 150px">LENSFLARE.DEV</v-toolbar-title>
      <v-tabs centered class="ml-n9" color="grey darken-1" v-model="activeTab">
        <v-tab v-for="link in links" :key="link.title" :href="link.url">
          {{ link.title }}
        </v-tab>
      </v-tabs>
      <v-btn icon outlined rounded class="mr-1" @click="onSyncClick">
        <v-icon>mdi-sync</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" sm="3">
            <!-- Left column -->
            <SequencerSimulator />
          </v-col>
          <v-col cols="12" sm="8">
            <v-sheet rounded="lg">
              <!-- Middle column -->
              <v-container>
                <h3 class="text-center">Action Sequencer</h3>
                <v-row dense>
                  <v-col cols="12">
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
          <v-col cols="12" sm="1">
            <v-sheet rounded="lg" class="sheets-fixed">
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
  </v-app>
</template>

<script>
import SequencerSimulator from "./components/sequencer-simulator"
import SequenceEntry from "./components/sequence-entry"
import { mapState, mapMutations, mapGetters } from 'vuex'

export default {
  name: "rk002-sequence-editor",

  components: {
    SequenceEntry,
    SequencerSimulator
  },

  data: () => ({
    activeTab: 1,
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'red',
    statusBarText: "Status bar",
    links: [
      { title: "Home", url: "/" },
      { title: "RK002 - Circuit Song Mode", url: "" },
    ],
  }),

  computed: { 
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
    onSyncClick: function() {
      if(!this.sequenceValid()) {
        // todo
      }
    },
    ...mapMutations([
      'clearSequenceActionAt', 
      'addSequenceActionAt',
      'setErrorMessage'])
  },
};
</script>
<style scoped>
  .action-chips {
    cursor: grab;
  }
  .sheets-fixed {
    position: fixed;
  }
</style>
