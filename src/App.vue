<template>
  <div v-if="templateInfo" class="app-container">
    <Sidebar
      :template-info="templateInfo"
      :selected-tpl="selectedTpl"
      :url-mode="urlMode"
      :custom-url="customUrl"
      @select="selectComponent"
      @update:url-mode="updateUrlMode"
      @update:custom-url="updateCustomUrl"
      @save="handleSave"
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
import { computed, onMounted, ref, shallowRef } from 'vue';
import PreviewPanel from './preview/PreviewPanel.vue';
import PropsPanel from './preview/PropsPanel.vue';
import Sidebar from './preview/Sidebar.vue';
import { TemplateParser } from './utils/template';
import { LocalTemplateParser } from './utils/template-local';

const isLocalRemote = false;
const defaultUrl = import.meta.env.DEV ? `${location.origin}/dist/` : `${location.origin}/`;

const urlMode = ref<'current' | 'custom'>('current');
const customUrl = ref<string>('');

const baseUrl = computed(() => {
  if (urlMode.value === 'custom' && customUrl.value) {
    return customUrl.value.endsWith('/') ? customUrl.value : `${customUrl.value}/`;
  }
  return defaultUrl;
});

let parser = getParser();
const templateInfo = ref<TemplateGroupManifest>();

const selectedTpl = shallowRef<TemplateManifest & TemplateSource>();
const templateProps = ref<Record<string, any>>({});

function getParser() {
  if (urlMode.value === 'custom' && customUrl.value) {
    return new TemplateParser(customUrl.value);
  }
  else {
    return (import.meta.env.DEV && !isLocalRemote) ? new LocalTemplateParser() : new TemplateParser(baseUrl.value);
  }
}

onMounted(() => {
  const savedSettings = localStorage.getItem('preview-settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      urlMode.value = parsed.urlMode || 'current';
      customUrl.value = parsed.customUrl || '';
      parser = getParser();
      loadData();
    }
    catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
  }
});

function updateUrlMode(value: 'current' | 'custom') {
  urlMode.value = value;
  saveSettings();
}

function updateCustomUrl(value: string) {
  customUrl.value = value;
  saveSettings();
}

function saveSettings() {
  localStorage.setItem('preview-settings', JSON.stringify({
    urlMode: urlMode.value,
    customUrl: customUrl.value,
  }));
}

async function handleSave() {
  saveSettings();
  parser = getParser();
  await loadData();
  selectedTpl.value = undefined;
  templateProps.value = {};
}

async function loadData() {
  templateInfo.value = await parser.getInfo();
}

function preloadCSS(cssUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.setAttribute('data-template-css', 'true');

    link.onload = () => {
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

async function selectComponent(tpl: TemplateManifest) {
  const source = await parser.getTemplateSource(tpl);

  if (source.css) {
    try {
      await preloadCSS(source.css);
      selectedTpl.value = { ...tpl, ...source };
    }
    catch (error) {
      console.warn('CSS预加载失败，但仍然显示模板:', error);
      selectedTpl.value = { ...tpl, ...source };
    }
  }
  else {
    selectedTpl.value = { ...tpl, ...source };
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

function refreshPreview() {
  if (selectedTpl.value) {
    selectComponent(selectedTpl.value);
  }
}

function updateTemplateProps(newProps: Record<string, any>) {
  templateProps.value = { ...newProps };
}

const exif = {
  ImageWidth: 600,
  ImageHeight: 400,
  Make: 'SONY',
  Model: 'α7M4',
  FocalLength: '24mm',
  FNumber: 'f/2.8',
  ExposureTime: '1/100',
  ISOSpeedRatings: '100',
  DateTimeOriginal: '2025-12-24 12:00:00',
};

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

.app-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  flex-direction: row;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;

    :first-child {
      flex: none;
      height: 50%;
    }
  }
}
</style>
