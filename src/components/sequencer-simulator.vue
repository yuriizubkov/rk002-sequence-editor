<template>
  <v-sheet
    rounded="lg"
    min-width="305"
    max-width="305"
    class="sheets-fixed"
  >
    <v-container>
      <h3 class="text-center">Simulator</h3>
      <p class="text--disabled text-center mb-0">Circuit sessions 1 - 32</p>
      <v-row v-for="rowNumber in 4" :key="rowNumber" class="ma-1">
        <template>
          <v-col v-for="colNumber in 8" :key="colNumber" class="pa-1 ma-0">
            <v-sheet
              rounded="lg"
              :color="currentSessionPadIndex === ((rowNumber - 1) * 8 + colNumber) - 1 ? 'blue': 'deep-purple darken-3'"
              class="text-center"
            >
              <span class="ma-1">
                {{ (rowNumber - 1) * 8 + colNumber }}
              </span>
            </v-sheet>
          </v-col>
        </template>
      </v-row>
      <v-row align="center" justify="center">
         <v-item-group class="v-btn-toggle">      
          <v-btn @click="onPlayStop" :color="timer !== null ? 'primary': ''">
            <v-icon>{{ timer !== null ? 'mdi-stop-circle-outline' : 'mdi-play-circle-outline' }}</v-icon>
          </v-btn>
          <v-btn>
            <v-progress-circular class="no-transition" :value="currentActionProgress">{{ (beatsTotal - beatsUntilNextAction) + 1 }}</v-progress-circular>
          </v-btn>
          <v-btn @click="onNext">
            <v-icon>mdi-skip-next</v-icon>
          </v-btn>
         </v-item-group>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";

export default {
  data: () => ({
    audio: new Audio('tick.mp3'),
    currentSessionPadIndex: null,
    timer: null,
    beatsUntilNextAction: 0,
    beatsTotal: 0,
    loopingSessionsRepeats: null,
  }),

  computed: {
    currentActionProgress: function() {
      if(this.beatsTotal === 0) return 0
      return ((this.beatsTotal - this.beatsUntilNextAction) + 1) / this.beatsTotal * 100 
    },
    ...mapState([
      "sequence", 
      "activeActionIndex"]),
    ...mapGetters(["sequenceValid"]),
  },

  methods: {
    onPlayStop: function () {
      if(this.timer) {
        this.stopSequencer()
        return
      }

      if(!this.sequenceValid()) {
        return
      }

      this.stopSequencer() // reset all counters
      this.audio.play() // play tick sound
      this.processNextSequencerAction()
      this.timer = setInterval(this.onTimer, 500)
    },
    onNext: function() {
      if(this.timer) {
        this.stopSequencer()
      }

      if(this.sequenceValid()) {
        if(this.loopingSessionsRepeats !== null) {
          this.processNextSequencerAction(false)
        } else {
          this.processNextSequencerAction()
        }
      }
    },
    onTimer: function () {
      this.audio.play() // play tick sound
      
      // If we edited step when sequencer is running
      if(!this.sequenceValid()) {
        this.stopSequencer()
        return
      }

      this.beatsUntilNextAction--
      if(this.beatsUntilNextAction === 0) {
        if(this.loopingSessionsRepeats !== null) {
          this.processNextSequencerAction(false)
          return
        }

        this.processNextSequencerAction()
      }
    },
    stopSequencer: function() {
      clearInterval(this.timer)
      this.timer = null
      this.setActiveActionIndex(null)
      this.currentSessionPadIndex = null
      this.loopingSessionsRepeats = null
      this.beatsUntilNextAction = 0
      this.beatsTotal = 0
    },
    processNextSequencerAction(incrementActionIndex = true) {
      if(this.activeActionIndex === null) {
        this.setActiveActionIndex(0)
      } else {
        if(this.activeActionIndex > 29 || this.activeActionIndex < 0) {
          this.stopSequencer()
          return
        }

        incrementActionIndex && this.setActiveActionIndex(this.activeActionIndex + 1)
      }

      const currentAction = this.sequence[this.activeActionIndex]

      if (currentAction === null) {
        this.stopSequencer()
        return
      }

      switch(currentAction.actionTypeId) {
        case 1: {
          // switch session
          this.currentSessionPadIndex = currentAction.sessionIndex
          this.beatsUntilNextAction = currentAction.nextActionOnBeat
          this.beatsTotal = currentAction.nextActionOnBeat
          break
        }

        case 2: {
          // stop
          this.stopSequencer()
          break
        }

        case 3: {
          // loop sessions, 1 session = 32 beats
          if(this.loopingSessionsRepeats === null) {
            this.loopingSessionsRepeats = currentAction.repeats
            this.currentSessionPadIndex = currentAction.startSessionIndex
          } else {
            if(this.currentSessionPadIndex === currentAction.endSessionIndex) {
              this.loopingSessionsRepeats--
              if(this.loopingSessionsRepeats > 0) this.currentSessionPadIndex = currentAction.startSessionIndex
            } else if(currentAction.startSessionIndex <= currentAction.endSessionIndex) {
              // increment or decrement
              this.currentSessionPadIndex++
            } else {
              this.currentSessionPadIndex--
            }

            if(this.loopingSessionsRepeats <= 0) {
              this.loopingSessionsRepeats = null
              this.processNextSequencerAction()
              return
            }
          }
          
          this.beatsUntilNextAction = 32
          this.beatsTotal = 32
          break
        }

        case 4: {
          // loop actions
          this.setErrorMessage('Loop Actions is not supported at the moment')
          this.stopSequencer()
          break
        }

        case 5: {
          // jump to action
          this.setActiveActionIndex(currentAction.toActionIndex)
          this.processNextSequencerAction(false) // recursive call without increment of action index
          break
        }

        default: {
          // stop
          this.stopSequencer()
          break
        }
      }
    },
    ...mapMutations([
      'setActiveActionIndex',
      'setErrorMessage'])
  },
}
</script>
<style>
  .no-transition .v-progress-circular__overlay { transition: none !important; }
</style>
