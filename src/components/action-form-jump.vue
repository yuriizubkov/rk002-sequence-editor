<template>
  <v-card-text>
    <v-form v-if="action" v-model="action.valid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" lg="6" xl="4" class="pb-0">
            <v-select
              v-model="action.toActionIndex"
              :items="items"
              :rules="rules"
              label="Action number"
              outlined
              dense
            ></v-select>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-card-text>
</template>
<script>
import { mapState } from 'vuex'

export default {
  props: {
    action: {
      type: Object,
      required: true
    },
    actionIndex: {
      type: Number,
      required: true
    }
  },
  
  data: () => ({
    selected: 0,
    rules: [
      (v) => !isNaN(v) || "Action should be selected"
    ]
  }),

  computed: {
    items: function() {
      return this.sequence.map((sequenceEntry, index) => {
        let text = ''
        if(sequenceEntry) {
          text = `#${index + 1} ${sequenceEntry.title}`
        } else {
          text = `#${index + 1}`
        }

        return {
          text,
          value: index,
          disabled: index === this.actionIndex // don't allow to jump to itself
        }
      })
    },
    ...mapState(['sequence'])
  }
}
</script>