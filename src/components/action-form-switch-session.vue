<template>
  <v-card-text>
    <v-form v-if="model" v-model="model.valid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="sessionNumber"
              :rules="sessionRules"
              label="Session number"
              required
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="beatsCount"
              :rules="beatsRules"
              label="Next action on beat"
              required
              outlined
              dense
            ></v-text-field>
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
    sessionNumber: 1,
    beatsCount: 4,
    sessionRules: [
      (v) => !!v || "Session number is required",
      (v) => {
          if (Number.isNaN(v) || !Number.isInteger(Number(v))) return "Please enter integer value"
          const intVal = Number(v)
          if (intVal <= 32 && intVal >= 1) return true
          else return "Session number must be between 1 and 32"
        }
    ],
    beatsRules: [
      (v) => !!v || "Beats counter is required",
      (v) => {
          if (Number.isNaN(v) || !Number.isInteger(Number(v))) return "Please enter integer value"
          const intVal = Number(v)
          if (intVal <= 256 && intVal >= 1) return true
          else return "Beats must be between 1 and 256"
        }
    ]
  }),

  watch: {
    model: {
      handler(val) {
        this.modifySequenceActionAt({ actionIndex: this.actionIndex, newValue: val })
      },
      deep: true
    }, 
    sessionNumber: function(val) {
      if(!this.model) return
      this.model.sessionIndex = Number(val) - 1 // this will trigger model watcher
    },
    beatsCount: function(val) {
      if(!this.model) return
      this.model.nextActionOnBeat = Number(val) // this will trigger model watcher
    }
  },

  computed: mapState(['sequence']),

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
