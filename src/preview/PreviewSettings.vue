<template>
  <div class="preview-settings">
    <div class="setting-group">
      <div class="setting-label">
        模板库地址
      </div>
      <div class="url-options">
        <label class="radio-option">
          <input
            type="radio"
            value="current"
            :checked="urlMode === 'current'"
            @change="$emit('update:urlMode', 'current')"
          >
          <span class="radio-label">当前地址</span>
        </label>
        <label class="radio-option">
          <input
            type="radio"
            value="custom"
            :checked="urlMode === 'custom'"
            @change="$emit('update:urlMode', 'custom')"
          >
          <span class="radio-label">自定义地址</span>
        </label>
      </div>
      <div v-if="urlMode === 'custom'" class="custom-url-input">
        <input
          type="url"
          :value="customUrl"
          placeholder="https://tpl.copicseal.com/"
          @input="$emit('update:customUrl', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
    <div class="setting-actions">
      <button class="save-btn" @click="$emit('save')">
        保存并刷新
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
type Props = {
  urlMode: 'current' | 'custom'
  customUrl: string
};

type Emits = {
  (e: 'update:urlMode', value: 'current' | 'custom'): void
  (e: 'update:customUrl', value: string): void
  (e: 'save'): void
};

defineProps<Props>();
defineEmits<Emits>();
</script>

<style lang="scss" scoped>
.preview-settings {
  padding: 4px 0;

  .setting-group {
    .setting-label {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .url-options {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .radio-option {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 14px;
        color: #2c3e50;

        input[type='radio'] {
          margin-right: 6px;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .radio-label {
          color: inherit;
        }
      }
    }

    .custom-url-input {
      input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        font-size: 14px;
        color: #2c3e50;
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: #667eea;
        }

        &::placeholder {
          color: #adb5bd;
        }
      }
    }
  }

  .setting-actions {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;

    .save-btn {
      width: 100%;
      padding: 10px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>
