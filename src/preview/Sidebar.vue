<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-header-content">
        <h2 class="sidebar-title">
          {{ templateInfo.name }}
        </h2>
        <p v-if="templateInfo.description" class="sidebar-description">
          {{ templateInfo.description }}
        </p>
      </div>
      <button class="settings-btn" @click="showSettings = true">
        ⚙️
      </button>
    </div>

    <SettingsModal
      :show="showSettings"
      title="预览设置"
      @close="showSettings = false"
    >
      <PreviewSettings
        :url-mode="urlMode"
        :custom-url="customUrl"
        @update:url-mode="$emit('update:urlMode', $event)"
        @update:custom-url="$emit('update:customUrl', $event)"
        @save="handleSave"
      />
    </SettingsModal>

    <div class="template-groups">
      <div
        v-for="(group) in templateInfo.groups"
        :key="group.id"
        class="template-group"
      >
        <div class="group-header">
          <h3 class="group-title">
            {{ group.name }}
          </h3>
          <p v-if="group.description" class="group-description">
            {{ group.description }}
          </p>
        </div>

        <div class="group-templates">
          <div
            v-for="(tpl) in group.templates"
            :key="tpl.id"
            class="template-item"
            :class="{ active: selectedTpl?.id === tpl.id }"
            @click="$emit('select', tpl)"
          >
            <div class="template-info">
              <div class="template-header">
                <div class="template-icon">
                  📄
                </div>
                <div class="template-text">
                  <div class="template-name">
                    {{ tpl.name || `组件 ${tpl.id}` }}
                  </div>
                  <div v-if="tpl.description" class="template-description">
                    {{ tpl.description }}
                  </div>
                </div>
              </div>
              <div class="template-meta">
                <span class="template-id">#{{ tpl.id }}</span>
                <div v-if="tpl.valid === false" class="template-warning" title="模板验证失败">
                  ⚠️
                </div>
                <div v-else-if="tpl.valid === true" class="template-verified" title="模板已验证">
                  ✅
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TemplateGroupManifest, TemplateManifest } from '../utils/template';
import { ref } from 'vue';
import PreviewSettings from './PreviewSettings.vue';
import SettingsModal from './SettingsModal.vue';

type Props = {
  templateInfo: TemplateGroupManifest
  selectedTpl?: TemplateManifest | null
  urlMode: 'current' | 'custom'
  customUrl: string
};

type Emits = {
  (e: 'select', tpl: TemplateManifest): void
  (e: 'update:urlMode', value: 'current' | 'custom'): void
  (e: 'update:customUrl', value: string): void
  (e: 'save'): void
};

defineProps<Props>();
const emit = defineEmits<Emits>();

const showSettings = ref(false);

function handleSave() {
  showSettings.value = false;
  emit('save');
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 320px;
  height: 100%;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 24px 20px 16px;
    border-bottom: 1px solid #f1f3f4;
    background: #ffffff;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .sidebar-header-content {
      flex: 1;
      min-width: 0;
    }

    .sidebar-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .sidebar-description {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }

    .settings-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f8f9fa;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #e9ecef;
        transform: rotate(45deg);
      }
    }
  }

  .template-groups {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;

    .template-group {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .group-header {
        padding: 0 20px 12px;

        .group-title {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .group-description {
          font-size: 12px;
          color: #7f8c8d;
          line-height: 1.4;
        }
      }

      .group-templates {
        .template-item {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          margin: 0 12px 4px;
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;

          .template-info {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .template-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 4px;

            .template-icon {
              width: 32px;
              height: 32px;
              background: #f8f9fa;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              margin-right: 12px;
              flex-shrink: 0;
            }

            .template-text {
              flex: 1;
              min-width: 0;

              .template-name {
                font-size: 14px;
                font-weight: 500;
                color: inherit;
                line-height: 1.3;
                margin-bottom: 2px;
              }

              .template-description {
                font-size: 12px;
                color: #6c757d;
                line-height: 1.3;
                opacity: 0.8;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                margin-top: 2px;
              }
            }
          }

          .template-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 6px;

            .template-id {
              font-size: 11px;
              color: #868e96;
              font-family: 'Monaco', 'Menlo', monospace;
              background: rgba(0, 0, 0, 0.04);
              padding: 2px 6px;
              border-radius: 4px;
            }

            .template-warning {
              font-size: 16px;
              margin-left: 8px;
            }

            .template-verified {
              font-size: 16px;
              margin-left: 8px;
            }
          }

          &:hover {
            background: #f8f9fa;
            border-color: #dee2e6;
            transform: translateX(2px);

            .template-icon {
              background: #e9ecef;
            }
          }

          &.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

            .template-icon {
              background: rgba(255, 255, 255, 0.2);
            }

            .template-text {
              .template-description {
                color: rgba(255, 255, 255, 0.8);
              }
            }

            .template-meta {
              .template-id {
                background: rgba(255, 255, 255, 0.2);
                color: rgba(255, 255, 255, 0.9);
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .sidebar {
    .template-groups {
      overflow-x: auto;
      white-space: nowrap;
      padding: 12px 0;

      .template-group {
        display: inline-block;
        margin-right: 20px;
        margin-bottom: 0;
        vertical-align: top;
        min-width: 200px;

        .group-templates {
          .template-item {
            margin: 0 0 8px 0;
          }
        }
      }
    }
  }
}
</style>
