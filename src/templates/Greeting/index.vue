<template>
  <div class="greeting">
    <h2>Hello, {{ name }}!</h2>
    <p>Welcome to our Vue component library.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<style scoped>
.greeting {
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
  margin: 20px 0;
}
</style>
