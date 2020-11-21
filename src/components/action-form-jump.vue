<template>
  <v-card-text>
    <v-form v-model="formValid">
      <v-container class="pt-0 pb-0">
        <v-row>
          <v-col cols="12" md="4" class="pb-0">
            <v-select
              v-model="selectedActionNumber"
              :items="items"
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
export default {
  data: () => ({
    formValid: false,
    selectedActionNumber: [],
    items: ['#1 - Switch Session']
  })
}
</script>