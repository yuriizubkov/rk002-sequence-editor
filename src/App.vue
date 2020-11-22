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
            <v-sheet rounded="lg" class="sheets-fixed" min-width="305" style="margin-left: -35px;">
              <!-- Left column -->
              <v-container>
                <h3 class="text-center">Simulator</h3>
                <p class="text--disabled text-center mb-0">
                  Circuit sessions 1 - 32:
                </p>
                <v-row v-for="rowNumber in 4" :key="rowNumber" class="ma-1">
                  <template v-for="colNumber in 8">
                    <v-col :key="colNumber" class="pa-1 ma-0">
                      <v-sheet rounded="lg" color="deep-purple darken-3" class="text-center">
                        <span class="ma-1">
                          {{(rowNumber - 1) * 8 + colNumber}}
                        </span>
                      </v-sheet>                      
                    </v-col>
                  </template>
                </v-row>
              </v-container>
            </v-sheet>
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
      :timeout="snackbarTimeout"
      :color="snackbarColor"
    >
      {{ nextErrorMessage }}

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
import SequenceEntry from "./components/sequence-entry";
import { mapState, mapMutations, mapGetters } from 'vuex'

export default {
  name: "rk002-sequence-editor",

  components: {
    SequenceEntry,
  },

  data: () => ({
    activeTab: 1,
    snackbar: false,
    snackbarTimeout: 3000,
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
      'sequence']),
    ...mapGetters([
      'sequenceValid', 
      'nextErrorMessage'])
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
    onSyncClick: function(){
      if(!this.sequenceValid) { 
        this.snackbar = true
      }
    },
    ...mapMutations([
      'clearSequenceActionAt', 
      'addSequenceActionAt'])
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
