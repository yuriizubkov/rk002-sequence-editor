<template>
  <v-card-text>
    <v-form v-if="model" v-model="model.valid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" lg="6" xl="4" class="pb-0">
            <v-select
              v-model="selected"
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
import { mapState, mapMutations } from 'vuex'

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
    model: null,
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
  },

  watch: {
    model: {
      handler(val) {
        this.modifySequenceActionAt({ actionIndex: this.actionIndex, newValue: val })
      },
      deep: true
    }, 
    selected: function() {
      this.model.toActionIndex = Number(this.selected)
    }
  },

  methods: {
    ...mapMutations(['modifySequenceActionAt'])
  },

  mounted: function () {
    this.$nextTick(function () {
      // Code that will run only after the
      // entire view has been rendered
      this.model = Object.assign({}, this.action) // cloning action
    })
  }
}
</script>