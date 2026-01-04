<template>
  <div class="preview-panel">
    <div class="panel-header">
      <h2 class="panel-title">
        模板预览
      </h2>
      <div v-if="selectedTpl" class="panel-controls">
        <button class="control-btn" @click="$emit('refresh')">
          🔄
        </button>
        <button class="control-btn" @click="toggleFullscreen">
          ⛶
        </button>
      </div>
    </div>

    <div class="preview-container">
      <div v-if="selectedTpl" class="render-wrapper">
        <CoRender
          :tpl="selectedTpl.component"
          :tpl-props="props.templateProps"
          :settings
          :img-url
          :exif
        />
      </div>
      <EmptyState
        v-else
        :title="emptyTitle"
        :description="emptyDescription"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Settings } from '../types';
import type { TemplateManifest, TemplateSource } from '../utils/template';
import CoRender from './co-render.vue';
import EmptyState from './EmptyState.vue';

type Props = {
  selectedTpl?: (TemplateManifest & TemplateSource) | null
  templateProps?: Record<string, any>
  settings: Settings
  imgUrl: string
  exif: any
  emptyTitle?: string
  emptyDescription?: string
};

type Emits = {
  (e: 'refresh'): void
};

const props = withDefaults(defineProps<Props>(), {
  templateProps: () => ({}),
});
defineEmits<Emits>();

// 全屏切换逻辑
function toggleFullscreen() {
  const previewPanel = document.querySelector('.preview-panel');
  if (previewPanel) {
    previewPanel.classList.toggle('fullscreen');
  }
}
</script>

<style lang="scss" scoped>
.preview-panel {
  flex: 1;
  height: 100%;
  background: #ffffff;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    border-radius: 0;
    z-index: 9999;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid #e9ecef;
    background: #ffffff;

    .panel-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .panel-controls {
      display: flex;
      gap: 8px;

      .control-btn {
        width: 36px;
        height: 36px;
        border: 1px solid #dee2e6;
        background: #ffffff;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s ease;

        &:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }
      }
    }
  }

  .preview-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    padding: 20px;
    position: relative;
    overflow: auto;

    .render-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .preview-panel {
    margin: 10px;

    .preview-container {
      padding: 20px;
    }
  }
}
</style>
