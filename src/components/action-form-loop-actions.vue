<template>
  <v-card-text>
    <v-form v-model="formValid">
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
export default {
  data: () => ({
    formValid: false,
    actionNumberFrom: 1,
    actionNumberTo: 8,
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
}
</script>