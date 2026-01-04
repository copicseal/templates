<template>
  <div v-if="templateInfo" class="app-container">
    <!-- 左侧组件列表 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          {{ templateInfo.name }}
        </h2>
        <p v-if="templateInfo.description" class="sidebar-description">
          {{ templateInfo.description }}
        </p>
      </div>

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
              @click="selectComponent(tpl)"
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

    <!-- 右侧组件渲染 -->
    <div class="main-content">
      <div class="preview-panel">
        <div class="panel-header">
          <h2 class="panel-title">
            模板预览
          </h2>
          <div v-if="selectedTpl" class="panel-controls">
            <button class="control-btn" @click="refreshPreview">
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
              :tpl-props="{}"
              :settings
              :img-url
              :exif
            />
          </div>
          <div v-else class="empty-preview">
            <div class="empty-icon">
              🎨
            </div>
            <h3>请选择一个模板</h3>
            <p>从左侧选择一个模板进行预览</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Settings } from './types';
import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './utils/template';
import { ref, shallowRef } from 'vue';
import CoRender from './preview/co-render.vue';
import { TemplateParser } from './utils/template';
import { LocalTemplateParser } from './utils/template-local';

const isLocalRemote = false;
const url = import.meta.env.DEV ? `${location.origin}/dist/` : `${location.origin}/`;
const parser = (import.meta.env.DEV && !isLocalRemote) ? new LocalTemplateParser() : new TemplateParser(url);

const templateInfo = ref<TemplateGroupManifest>();

async function loadData() {
  templateInfo.value = await parser.getInfo();
}
loadData();

// 组件选择状态 - 使用 shallowRef 避免对组件对象的深度响应式处理
const selectedTpl = shallowRef<TemplateManifest & TemplateSource>();

// 预加载CSS工具函数
function preloadCSS(cssUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.setAttribute('data-template-css', 'true');

    link.onload = () => {
      // 移除之前的CSS样式
      const existingLink = document.querySelector(`link[data-template-css="true"]:not([href="${cssUrl}"])`);
      if (existingLink) {
        existingLink.remove();
      }
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`CSS加载失败: ${cssUrl}`));
    };

    document.head.appendChild(link);
  });
}

// 组件选择方法
async function selectComponent(tpl: TemplateManifest) {
  const source = await parser.getTemplateSource(tpl);

  // 如果有CSS文件，先预加载CSS
  if (source.css) {
    try {
      await preloadCSS(source.css);
      // CSS预加载完成后才更新模板显示
      selectedTpl.value = { ...tpl, ...source };
    }
    catch (error) {
      console.warn('CSS预加载失败，但仍然显示模板:', error);
      // 即使CSS加载失败，也显示模板
      selectedTpl.value = { ...tpl, ...source };
    }
  }
  else {
    // 没有CSS文件，直接显示模板
    selectedTpl.value = { ...tpl, ...source };
    // 移除之前的CSS样式
    const existingLink = document.querySelector('link[data-template-css="true"]');
    if (existingLink) {
      existingLink.remove();
    }
  }
}

// 预览控制方法
function refreshPreview() {
  // 重新触发组件渲染
  if (selectedTpl.value) {
    selectComponent(selectedTpl.value);
  }
}

function toggleFullscreen() {
  // 全屏切换逻辑
  const previewPanel = document.querySelector('.preview-panel');
  if (previewPanel) {
    previewPanel.classList.toggle('fullscreen');
  }
}

const exif = {
  ImageWidth: 600,
  ImageHeight: 400,
  Make: 'SONY',
  Model: 'ILCE-7M4',
  FocalLength: '24mm',
  FNumber: 'f/2.8',
  ExposureTime: '1/100',
  ISOSpeedRatings: '100',
  DateTimeOriginal: '2025-12-24 12:00:00',
};

// 组件属性
const imgUrl = `https://placehold.co/${exif.ImageWidth}x${exif.ImageHeight}/547792/EAE0CF`;

const settings: Settings = {
  background: {
    mode: 'image',
    color: { rgba: '#ffffff' },
    image: {
      filters: [
        {
          type: 'blur',
          value: '0.4rem',
        },
        {
          type: 'brightness',
          value: '120%',
        },
      ],
    },
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    padding: [0.5, 0.5],
  },
  outputs: [],
};
</script>

<style lang="scss">
// 重置样式
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

// 主应用容器
.app-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

// 侧边栏
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

          // 悬停和选中状态的样式保持不变
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

// 主内容区
.main-content {
  flex: 1;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: auto;

  .preview-panel {
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
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e9ecef;

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

  .main-content {
    .preview-panel {
      margin: 10px;

      .preview-container {
        padding: 20px;
      }
    }
  }
}
</style>
