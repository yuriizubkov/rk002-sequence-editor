<template>
  <v-card-text>
    <v-form v-if="action" v-model="action.valid">
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
import { mapState } from 'vuex'

export default {
  props: {
    action: {
      type: Object,
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
    sessionNumberFrom: function(val) {
      if(!this.action) return
      this.action.startSessionIndex = Number(val) - 1 
    },
    sessionNumberTo: function(val) {
      if(!this.action) return
      this.action.endSessionIndex = Number(val) - 1 
    },
    repeats: function(val) {
      if(!this.action) return
      this.action.repeats = Number(val) - 1 // 0...7 = 8 beats = 3 bits
    }
  },

  computed: mapState(['sequence']),

  mounted: function () {
    this.$nextTick(function () {
      this.sessionNumberFrom = this.action.startSessionIndex + 1
      this.sessionNumberTo = this.action.endSessionIndex + 1
      this.repeats = this.action.repeats + 1
    })
  }
}
</script>