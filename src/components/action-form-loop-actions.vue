<template>
  <v-card-text>
    <v-form v-if="model" v-model="model.valid">
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
    model: {
      handler(val) {
        this.modifySequenceActionAt({ actionIndex: this.actionIndex, newValue: val })
      },
      deep: true
    }, 
    actionNumberFrom: function(val) {
      if(!this.model) return
      this.model.startActionIndex = Number(val) - 1 // this will trigger model watcher
    },
    actionNumberTo: function(val) {
      if(!this.model) return
      this.model.endActionIndex = Number(val) - 1 // this will trigger model watcher
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