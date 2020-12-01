<template>
  <v-card-text>
    <v-form v-if="action" v-model="action.valid">
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
import { mapState } from 'vuex'

export default {
  props: {
    action: {
      type: Object,
      required: true
    }
  },

  data: () => ({
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
    sessionNumber: function(val) {
      if(!this.action) return
      this.action.sessionIndex = Number(val) - 1
    },
    beatsCount: function(val) {
      if(!this.action) return
      this.action.nextActionOnBeat = Number(val)
    }
  },

  computed: mapState(['sequence']),

  mounted: function() {
    this.$nextTick(function() {
      this.sessionNumber = this.action.sessionIndex + 1
      this.beatsCount = this.action.nextActionOnBeat
    })
  }
}
</script>
