<template>
  <v-card-text>
    <v-form v-if="model" v-model="model.valid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="sessionNumberFrom"
              :rules="sessionRules"
              label="From session number"
              required
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="sessionNumberTo"
              :rules="sessionRules"
              label="To session number"
              required
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="repeats"
              :rules="repeatsRules"
              label="How many repeats"
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
    sessionNumberFrom: 1,
    sessionNumberTo: 8,
    repeats: 4,
    sessionRules: [
      (v) => !!v || "Session number is required",
      (v) => {
          if (Number.isNaN(v) || !Number.isInteger(Number(v))) return "Please enter integer value"
          const intVal = Number(v)
          if (intVal <= 32 && intVal >= 1) return true
          else return "Session number must be between 1 and 32"
        }
    ],
    repeatsRules: [
      (v) => !!v || "Repeat counter is required",
      (v) => {
          if (Number.isNaN(v) || !Number.isInteger(Number(v))) return "Please enter integer value"
          const intVal = Number(v)
          if (intVal <= 8 && intVal >= 1) return true
          else return "Repeats must be between 1 and 8"
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
    sessionNumberFrom: function(val) {
      if(!this.model) return
      this.model.startSessionIndex = Number(val) - 1 // this will trigger model watcher
    },
    sessionNumberTo: function(val) {
      if(!this.model) return
      this.model.endSessionIndex = Number(val) - 1 // this will trigger model watcher
    },
    repeats: function(val) {
      if(!this.model) return
      this.model.repeats = Number(val) // this will trigger model watcher
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