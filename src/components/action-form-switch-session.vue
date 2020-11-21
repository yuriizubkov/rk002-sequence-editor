<template>
  <v-card-text>
    <v-form v-model="formValid">
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
export default {
  data: () => ({
    formValid: false,
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
};
</script>
