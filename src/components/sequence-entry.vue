<template>
  <v-card elevation="2" outlined shaped
    :class="action !== null ? 'blue-grey darken-4' : ''"
    @dragenter="onCheckDrop"
    @dragover="onCheckDrop"
    @drop.prevent="onChipDrop">
      <v-chip class="ml-3 mt-3 text--disabled" v-if="action === null" outlined>Empty slot</v-chip>
      <v-chip class="ml-3 mt-3" v-else :color="action.color" close @click:close="onChipClose">{{ action.title }}</v-chip>
      <div class="float-right ma-4 text--secondary"># {{ actionIndex + 1 }}</div>
      <v-card-subtitle v-if="action === null">Add new action by dropping here an action type from the list</v-card-subtitle>
      <ActionFormSwitchSession v-if="action !== null && action.actionTypeId === 1" :action="action" :actionIndex="actionIndex" />
      <ActionFormStop v-if="action !== null && action.actionTypeId === 2" :action="action" :actionIndex="actionIndex" />
      <ActionFormLoopSessions v-if="action !== null && action.actionTypeId === 3" :action="action" :actionIndex="actionIndex" />
      <ActionFormLoopActions v-if="action !== null && action.actionTypeId === 4" :action="action" :actionIndex="actionIndex" />
      <ActionFormJump v-if="action !== null && action.actionTypeId === 5" :action="action" :actionIndex="actionIndex" />
  </v-card>
</template>
<script>
import { mapState, mapMutations } from 'vuex'
import ActionFormSwitchSession from "./action-form-switch-session"
import ActionFormStop from './action-form-stop'
import ActionFormLoopSessions from './action-form-loop-sessions'
import ActionFormLoopActions from './action-form-loop-actions'
import ActionFormJump from './action-form-jump'

export default {
  components: {
    ActionFormSwitchSession,
    ActionFormStop,
    ActionFormLoopSessions,
    ActionFormLoopActions,
    ActionFormJump
  },

  props: {
    actionIndex: {
      type: Number,
      required: true
    }
  },

  data: () => ({
    
  }),

  computed: {
    action: function() {
      if (this.sequence) {
        return this.sequence[this.actionIndex]
      } else {
        return null
      }
    },
    ...mapState(['sequence'])
  },

  methods: {
    onCheckDrop: function(event) {
      if(event.dataTransfer.types.includes('action-type-id')) {
        event.preventDefault()
      }
    },
    onChipDrop: function(event) {
      // default data type is String here in the dataTransfer Object, we need to cast it to Number
      const actionTypeId = Number(event.dataTransfer.getData('action-type-id'))
      // calling vuex mutation, if more than 1 arguments - should be passed as an object
      this.addSequenceActionAt({ actionIndex: this.actionIndex, actionTypeId: actionTypeId })
    },
    onChipClose: function() {
      this.clearSequenceActionAt(this.actionIndex) // calling vuex mutation
    },
    ...mapMutations([
      'clearSequenceActionAt',
      'addSequenceActionAt'])
  }
}
</script>