<template>
  <div class="empty-preview">
    <div class="empty-icon">
      🎨
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<script lang="ts" setup>
type Props = {
  title?: string
  description?: string
};

withDefaults(defineProps<Props>(), {
  title: '请选择一个模板',
  description: '从左侧选择一个模板进行预览',
});
</script>

<style lang="scss" scoped>
.empty-preview {
  text-align: center;
  color: #6c757d;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  h3 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #495057;
  }

  p {
    font-size: 14px;
    color: #6c757d;
  }
}
</style>
