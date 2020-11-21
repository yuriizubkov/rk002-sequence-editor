<template>
  <v-card elevation="2" outlined shaped
    :class="actionType !== null ? 'blue-grey darken-4' : ''"
    @dragenter="onCheckDrop"
    @dragover="onCheckDrop"
    @drop.prevent="onChipDrop">
      <v-chip class="ml-3 mt-3 text--disabled" v-if="actionType === null" outlined>Empty slot</v-chip>
      <v-chip class="ml-3 mt-3" v-else :color="actionType.color" close @click:close="onChipClose">{{ actionType.title }}</v-chip>
      <div class="float-right ma-4 text--secondary"># {{ actionIndex + 1 }}</div>
      <v-card-subtitle v-if="actionType === null">Add new action by dropping here an action type from the list</v-card-subtitle>
      <ActionFormSwitchSession v-if="actionType !== null && actionType.actionTypeId === 1" />
      <ActionFormStop v-if="actionType !== null && actionType.actionTypeId === 2" />
      <ActionFormLoopSessions v-if="actionType !== null && actionType.actionTypeId === 3" />
      <ActionFormLoopActions v-if="actionType !== null && actionType.actionTypeId === 4" />
      <ActionFormJump v-if="actionType !== null && actionType.actionTypeId === 5" />
  </v-card>
</template>
<script>
import { mapState } from 'vuex'
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
    actionTypeId: null
  }),

  computed: {
    actionType: function() {
      if (this.actionTypeId && this.actionTypes) {
        return this.actionTypes.find(entry => entry.actionTypeId === this.actionTypeId)
      } else {
        return null
      }
    },
    ...mapState(['actionTypes'])
  },

  methods: {
    onCheckDrop: function(event) {
      if(event.dataTransfer.types.includes('action-type-id')) {
        event.preventDefault()
      }
    },
    onChipDrop: function(event) {
      // default data type is String here in the dataTransfer Object
      this.actionTypeId = Number(event.dataTransfer.getData('action-type-id'))
    },
    onChipClose: function() {
      this.actionTypeId = null
    }
  }
}
</script>