<template>
  <div class="props-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        模板属性
      </h3>
      <div v-if="Object.keys(tplProps).length === 0" class="no-props">
        该模板暂无可配置属性
      </div>
    </div>

    <div v-if="Object.keys(tplProps).length > 0" class="props-content">
      <div v-for="(key) in Object.keys(tplProps)" :key="key">
        <div v-show="!tplProps[key].hidden" class="label" :title="tplProps[key].__co?.description">
          {{ tplProps[key].__co?.label || key }}:
        </div>
        <div v-show="!tplProps[key].hidden" class="value">
          <input
            v-if="tplProps[key].type === Boolean"
            v-model="templateProps[key]"
            type="checkbox"
            class="prop-checkbox"
          >
          <input
            v-else
            v-model="templateProps[key]"
            type="text"
            class="prop-input"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// import { watch } from 'vue';

type TplProp = {
  type: any
  hidden?: boolean
  __co?: {
    label?: string
    description?: string
    type?: string
    enums?: Array<{ label: string, value: any }>
    min?: number
    max?: number
  }
};

type Props = {
  tplProps?: Record<string, TplProp>
  vars?: Record<string, any>
};

const props = withDefaults(defineProps<Props>(), {
  tplProps: () => ({}),
  vars: () => ({}),
});

const templateProps = defineModel<Record<string, any>>('templateProps', {
  default: () => ({}),
});

// 监听 templateProps 的变化并向外发出
// watch(() => templateProps.value, (newProps) => {
//   templateProps.value = { ...newProps };
// }, { deep: true });
</script>

<style lang="scss" scoped>
.props-panel {
  width: 300px;
  height: 100%;
  background: #ffffff;
  border-left: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f3f4;
    background: #f8f9fa;

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .no-props {
      font-size: 13px;
      color: #6c757d;
      text-align: center;
      padding: 20px 0;
    }
  }

  .props-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;

    > div {
      padding: 12px 20px;
      border-bottom: 1px solid #f8f9fa;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 13px;
        font-weight: 500;
        color: #495057;
        margin-bottom: 8px;
        cursor: help;

        &:hover {
          color: #667eea;
        }
      }

      .value {
        .prop-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 13px;
          transition: border-color 0.2s ease;

          &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
          }
        }

        .prop-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .props-panel {
    width: 100%;
    height: auto;
    max-height: 300px;
    border-left: none;
    border-top: 1px solid #e9ecef;
  }
}
</style>
