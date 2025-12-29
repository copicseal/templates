<template>
  <div class="app-container">
    <!-- 左侧组件列表 -->
    <div class="component-list">
      <h2>组件列表</h2>
      <div
        v-for="(template, index) in templates"
        :key="index"
        class="component-item"
        :class="{ active: selectedComponentIndex === index }"
        @click="selectComponent(index)"
      >
        {{ template.name || `组件 ${index + 1}` }}
      </div>
    </div>

    <!-- 右侧组件渲染 -->
    <div class="component-preview">
      <h2>组件预览</h2>
      <div class="preview-container">
        <!-- <component
          :is="selectedComponent"
          v-if="selectedComponent"
          :utils="renderUtils"
          :img-url="imgUrl"
          :info="info"
        /> -->
        <div v-if="selectedComponent" class="render-wrapper">
          <CoRender
            :tpl="selectedComponent"
            :tpl-props="{}"
            :settings
            :img-url
            :exif
          />
        </div>
        <div v-else class="empty-preview">
          请选择一个组件进行预览
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Settings } from './types';
import { computed, ref } from 'vue';
import CoRender from './preview/co-render.vue';
import { TemplateParser } from './utils/template';

// 导入所有模板组件
const templateMap = import.meta.glob<any>('./templates/**/*.vue', { eager: true, import: 'default' });
const templates = Object.values(templateMap);

// 导入组件的manifest信息
const manifestMap = import.meta.glob<any>('./templates/**/manifest.json', { eager: true });
const manifests = Object.values(manifestMap);

const url = `${location.origin}/dist/`;
// const url = 'http://tp-copicseal.kohai.top/';

async function loadData() {
  const parser = new TemplateParser(url);
  const info = await parser.getInfo();
  console.log(info);
  console.log(await parser.getTemplateSource(info.groups![0]!.templates[0]!));
}
loadData();

// 为每个组件添加名称信息
for (let i = 0; i < templates.length; i++) {
  if (manifests[i]) {
    templates[i].name = manifests[i].name;
  }
}

// 组件选择状态
const selectedComponentIndex = ref<number>(0);

// 选中的组件
const selectedComponent = computed(() => templates[selectedComponentIndex.value]);

// 组件选择方法
function selectComponent(index: number) {
  selectedComponentIndex.value = index;
}

// 组件属性
// const imgUrl = 'https://placehold.co/400x600/EEE/31343C';
const imgUrl = 'https://placehold.co/600x400/EEE/31343C';

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
          value: '100%',
        },
      ],
    },
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    padding: [1, 1],
  },
  outputs: [],
};
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-size: 16px;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100%;
  font-family: Arial, sans-serif;
}

/* 左侧组件列表 */
.component-list {
  width: 300px;
  height: 100%;
  overflow: auto;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
}

.component-list h2 {
  margin-bottom: 16px;
  font-size: 20px;
  color: #333;
}

.component-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.component-item:hover {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.component-item.active {
  background-color: #2196f3;
  color: white;
  border-color: #1976d2;
}

/* 右侧组件预览 */
.component-preview {
  flex: 1;
  height: 100%;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.component-preview h2 {
  margin-bottom: 16px;
  font-size: 20px;
  color: #333;
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fafafa;
  overflow: auto;

  .render-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }
}

.empty-preview {
  color: #999;
  font-size: 20px;
}
</style>
