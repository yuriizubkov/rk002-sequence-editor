<template>
  <v-card elevation="2" outlined shaped
    @dragenter="onCheckDrop"
    @dragover="onCheckDrop"
    @drop.prevent="onChipDrop">
      <v-chip class="ml-3 mt-3 text--disabled" v-if="actionType === null" outlined>Empty slot</v-chip>
      <v-chip class="ml-3 mt-3" v-else :color="actionType.color" close @click:close="onChipClose">{{ actionType.title }}</v-chip>
      <v-card-subtitle>Add new action by dropping here an action type from the list</v-card-subtitle>
  </v-card>
</template>
<script>
import { mapState } from 'vuex'

export default {
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