<template>
  <div v-if="templateInfo" class="app-container">
    <Sidebar
      :template-info="templateInfo"
      :selected-tpl="selectedTpl"
      @select="selectComponent"
    />
    <div class="main-content">
      <PreviewPanel
        :selected-tpl="selectedTpl"
        :template-props="templateProps"
        :settings="settings"
        :img-url="imgUrl"
        :exif="exif"
        @refresh="refreshPreview"
      />
      <PropsPanel
        v-if="selectedTpl?.component.props"
        :tpl-props="selectedTpl.component.props"
        :template-props="templateProps"
        @update:template-props="updateTemplateProps"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Settings } from './types';
import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './utils/template';
import { ref, shallowRef } from 'vue';
import PreviewPanel from './preview/PreviewPanel.vue';
import PropsPanel from './preview/PropsPanel.vue';
import Sidebar from './preview/Sidebar.vue';
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
// 模板属性
const templateProps = ref<Record<string, any>>({});

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
  const compProps = (selectedTpl.value?.component.props || {});
  templateProps.value = Object.keys(compProps).reduce((acc, key) => {
    if (compProps[key].__co) {
      acc[key] = compProps[key].default;
    }
    return acc;
  }, {} as Record<string, any>);
}

// 预览控制方法
function refreshPreview() {
  // 重新触发组件渲染
  if (selectedTpl.value) {
    selectComponent(selectedTpl.value);
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

// 更新模板属性的方法
function updateTemplateProps(newProps: Record<string, any>) {
  templateProps.value = { ...newProps };
}

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
}

// 主内容区
.main-content {
  flex: 1;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: row;
  overflow: hidden;

  // 响应式设计
  @media (max-width: 768px) {
    flex-direction: column;

    :first-child {
      flex: none;
      height: 50%;
    }
  }
}
</style>
