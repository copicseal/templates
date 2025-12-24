<template>
  <div class="card">
    <button type="button" @click="count++">
      count is {{ count }}
    </button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
    <img
      class="main-image"
      :style="{
        display: 'block',
        margin: '0 auto',
      }"
      :src="imgUrl"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ imgUrl: string }>();

const count = ref(0);
</script>

<style scoped>
.card {
  border: 10px solid #fff;
}
</style>
