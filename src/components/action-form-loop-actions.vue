<template>
  <v-card-text>
    <v-form v-if="action" v-model="action.valid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="actionNumberFrom"
              :rules="actionRules"
              label="From action number"
              required
              outlined
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="pb-0">
            <v-text-field
              v-model="actionNumberTo"
              :rules="actionRules"
              label="To action number"
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
    actionNumberFrom: 1,
    actionNumberTo: 4,
    repeats: 4,
    actionRules: [
      (v) => !!v || "Action number is required",
      (v) => {
          if (Number.isNaN(v) || !Number.isInteger(Number(v))) return "Please enter integer value"
          const intVal = Number(v)
          if (intVal <= 30 && intVal >= 1) return true
          else return "Action number must be between 1 and 30"
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
    actionNumberFrom: function(val) {
      if(!this.action) return
      this.action.startActionIndex = Number(val) - 1 
    },
    actionNumberTo: function(val) {
      if(!this.action) return
      this.action.endActionIndex = Number(val) - 1 
    },
    repeats: function(val) {
      if(!this.action) return
      this.action.repeats = Number(val) - 1 // 0...7 = 8 beats = 3 bits
    }
  },

  computed: mapState(['sequence']),

  mounted: function () {
    this.$nextTick(function () {
      this.actionNumberFrom = this.action.startActionIndex + 1
      this.actionNumberTo = this.action.endActionIndex + 1
      this.repeats = this.action.repeats + 1
    })
  }
}
</script>