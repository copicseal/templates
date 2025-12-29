<template>
  <div class="greeting">
    <h2>Hello!</h2>
    <p>Welcome to our Vue component library.</p>
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
defineProps<{ imgUrl: string }>();
</script>

<style scoped>
.greeting {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  margin: 20px 0;
}
</style>
