<template>
  <div
    class="tpl-card" :class="{ 'is-horizontal': isHorizontal, 'is-logo-shadow': logoShadow }"
    :style="{
      '--box-shadow': shadow,
      '--font-scale': fontScale,
      '--text-color': textColor,
    }"
  >
    <img
      class="main-image"
      :style="{
        display: 'block',
        margin: '0 auto',
        borderRadius: `calc(var(--base-size) * ${radius})`,
      }"
      :src="imgUrl"
    >
    <div class="card-info">
      <div class="make-model">
        <div class="make-logo">
          <div v-if="logoColorAuto && utils.getMakeLogoSvg(info)" class="svg-logo" v-html="utils.getMakeLogoSvg(info)" />
          <img v-else-if="utils.getMakeLogo(info)" :src="utils.getMakeLogo(info)" alt="">
          <span v-else>{{ info.Make }}</span>
        </div>
        <div class="model-name">
          {{ utils.getModelName(info.Model) }}
        </div>
      </div>
      <div class="details-info">
        <div class="basie-info">
          {{ utils.replaceTextVars(text1, info) }}
          <!-- <span>{{ info.FocalLength }}</span>
          <span>{{ info.FNumber }}</span>
          <span v-if="info.ExposureTime">{{ info.ExposureTime }}s</span>
          <span v-if="info.ISOSpeedRatings">ISO{{ info.ISOSpeedRatings }}</span> -->
        </div>
        <div class="date-time">
          <span>{{ utils.replaceTextVars(text2, info) || info.DateTimeOriginal }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({
  id: 'tpl-default2',
  name: 'TplDefault2',
  title: '默认模板(无框圆角)',
});

const props = defineProps({
  utils: {
    type: Object,
    default: () => ({}),
  },
  imgUrl: String,
  info: {
    type: Object,
    default: () => ({}),
  },
  radius: {
    type: Number,
    default: 0.1,
    __co: {
      label: '图片圆角',
    },
  },
  direction: {
    type: Number,
    default: 0,
    __co: {
      label: '排列方向',
      enums: [
        {
          label: '自动',
          value: 0,
        },
        {
          label: '垂直',
          value: 1,
        },
        {
          label: '水平',
          value: -1,
        },
      ],
    },
  },
  fontScale: {
    type: Number,
    default: 1,
    __co: {
      label: '文字缩放',
    },
  },
  textColor: {
    type: String,
    default: '#000',
    __co: {
      label: '文字颜色',
      type: 'color',
    },
  },
  logoColorAuto: {
    type: Boolean,
    default: false,
    __co: {
      label: '标志颜色',
    },
  },
  logoShadow: {
    type: Boolean,
    default: false,
    __co: {
      label: '标志阴影',
      when: (props: any) => !props.logoColorAuto,
    },
  },
  shadow: {
    type: String,
    default: '0 0 calc(var(--base-size) * 0.2) 0 rgba(0, 0, 0, 0.8)',
    __co: {
      label: '阴影',
      type: 'shadow',
    },
  },
  text1: {
    type: String,
    default: '{FocalLength} {FNumber} {ExposureTime}s ISO{ISOSpeedRatings}',
    __co: {
      type: 'vars-input',
      label: '文本 1',
    },
  },
  text2: {
    type: String,
    default: '{DateTimeOriginal}',
    __co: {
      type: 'vars-input',
      label: '文本 2',
    },
  },
});

const isHorizontal = computed(() => {
  return props.direction === 0 ? props.info.ImageWidth < props.info.ImageHeight : props.direction === -1;
});
</script>

<style lang="scss" scoped>
@function size($multiplier) {
  @return calc(var(--base-size, 1rem) * $multiplier);
}

.tpl-card {
  --box-shadow: 0 0 size(0.2) rgba(0, 0, 0, 0.8);
  --font-scale: 1;
  --text-color: #000;
  color: var(--text-color);

  &.is-logo-shadow {
    .make-model .make-logo {
      > img {
        filter: drop-shadow(0 0 size(0.02) var(--text-color)) drop-shadow(0 0 size(0.02) var(--text-color));
      }
    }
  }
}

.card-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: size(0.04);
  padding-top: size(0.2);
  font-size: calc(var(--font-scale) * size(0.2));

  .make-model {
    display: flex;
    align-items: center;

    .make-logo {
      display: flex;
      align-items: center;
      font-weight: bold;

      .svg-logo {
        display: flex;

        :deep(svg) {
          width: unset;
        }
      }

      > img,
      :deep(svg) {
        height: size(100);
        max-height: calc(var(--font-scale) * size(0.2));
        max-width: calc(var(--font-scale) * size(0.6));
      }
    }

    .model-name {
      display: flex;
      align-items: flex-end;
      margin-left: size(0.05);
      font-size: calc(var(--font-scale) * size(0.1));
    }
  }

  .details-info {
    .basie-info {
      display: flex;
      align-items: flex-end;
      gap: size(0.05);
      font-size: calc(var(--font-scale) * size(0.1));
    }
    .date-time {
      margin-top: calc(var(--font-scale) * size(0.02));
      font-size: calc(var(--font-scale) * size(0.08));
      text-align: center;
      color: color-mix(in srgb, var(--text-color) 50%, transparent);
    }
  }
}

.is-horizontal.tpl-card {
  display: flex;

  .card-info {
    flex-direction: column;
    height: unset;
    padding: size(0.02);

    .make-model {
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: size(0.1);
    }
    .details-info {
      .basie-info {
        align-items: center;
        flex-direction: column;
        gap: 1em;
        margin-left: 0;
        font-size: calc(var(--font-scale) * size(0.1));
      }
    }
  }
}

.main-image {
  width: size(0.6);
  height: auto;
  border-radius: size(0.05);
  box-shadow: var(--box-shadow);
}
</style>
