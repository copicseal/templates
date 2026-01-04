<script lang="tsx">
import type {
  CSSProperties,
  PropType,
} from 'vue';
import type { Settings } from '../types';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { renderUtils } from '../utils/render';

export default defineComponent({
  props: {
    tpl: {
      type: Object as PropType<any>,
      required: true,
    },
    tplProps: {
      type: Object as PropType<any>,
      required: true,
    },
    imgUrl: {
      type: String,
      required: true,
    },
    settings: {
      type: Object as PropType<Settings>,
      required: true,
    },
    exif: {
      type: Object as PropType<any>,
      required: true,
    },
    fontFamily: {
      type: String,
    },
  },
  setup(props) {
    const isHorizontal = ref(true);
    const sizeRatio = ref(0);
    const bgStyle = computed<CSSProperties>(() => {
      const { mode, style, padding } = props.settings.background;

      return {
        position: 'relative',
        zIndex: 0,
        padding: mode === 'none' ? 0 : (padding ?? []).map((i: number) => `${i}rem`).join(' '),
        overflow: 'hidden',
        ...style,
      };
    });

    const bgImgStyle = computed<CSSProperties>(() => {
      const { mode, style, image, color } = props.settings.background;

      if (mode === 'none') {
        return {};
      }

      const blur
        = Number.parseFloat(String(image?.filters?.find(it => it.type === 'blur')?.value || 0)) * 2;

      return {
        zIndex: -1,
        position: 'absolute',
        inset: `-${blur}rem`,
        background: mode === 'image' ? `url(${props.imgUrl})` : color?.rgba,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter:
          mode === 'image' ? image?.filters?.map(it => `${it.type}(${it.value})`).join(' ') : '',
        pointerEvents: 'none',
        ...style,
      };
    });

    const isLoading = ref(true);
    const el = ref<HTMLDivElement>();
    const bgEl = ref<HTMLDivElement>();
    // const [ow, oh] = [1280, 720]

    onMounted(async () => {
      setTimeout(() => {
        handleCalcSize();
      }, 200);
    });

    window.addEventListener('resize', handleCalcSize);

    watch(() => [props.settings, props.tpl, props.tplProps], () => {
      setTimeout(() => {
        handleCalcSize();
      }, 0);
    }, { deep: true });

    function render() {
      const info = props.exif;

      return (
        <props.tpl
          {...props.tplProps}
          data-co-tpl={props.tpl.__scopeId}
          utils={renderUtils}
          info={info}
          imgUrl={props.imgUrl}
          fontFamily={props.fontFamily}
        />
      );
    }

    function handleCalcSize() {
      const wrapperEl = el.value?.parentElement;
      if (el.value && bgEl.value && wrapperEl) {
        const { width, height } = wrapperEl.getBoundingClientRect();
        calcSize(el.value, bgEl.value, [width, height]);
      }
    }

    async function calcSize(
      _wrapper: HTMLDivElement,
      containerEl: HTMLDivElement,
      [ow, oh]: [number, number],
    ) {
      containerEl.style.width = '';
      containerEl.style.height = '';
      containerEl.style.minWidth = '';
      containerEl.style.minHeight = '';
      const initialWidth = 400;
      document.querySelector('html')!.style.fontSize = `${initialWidth}px`;

      const mainImage = containerEl.querySelector<HTMLDivElement>('.main-image');
      if (!mainImage)
        return;

      const [iw, ih] = await getImgSize();
      if (iw < ih) {
        mainImage.style.width = `${iw / ih}rem`;
        mainImage.style.height = '1rem';
      }
      else {
        mainImage.style.width = '1rem';
        mainImage.style.height = `${ih / iw}rem`;
      }
      const scale = 4;
      const wr = iw / ih * scale;
      const hr = wr * (ih / iw);
      mainImage.style.width = `${wr}rem`;
      mainImage.style.height = `${hr}rem`;

      const { width: w1, height: h1 } = containerEl.getBoundingClientRect();

      const imgRatio = w1 / h1;
      isHorizontal.value = imgRatio <= ow / oh;
      const fontSize = isHorizontal.value ? (initialWidth * oh) / h1 : (initialWidth * ow) / w1;

      document.querySelector('html')!.style.fontSize = `${fontSize}px`;

      sizeRatio.value = isHorizontal.value ? oh / fontSize : ow / fontSize;

      if (props.settings.background.mode === 'none') {
        ow = oh * imgRatio;
      }

      containerEl.style.width = `${ow}px`;
      containerEl.style.height = `${oh}px`;
      containerEl.style.minWidth = `${ow}px`;
      containerEl.style.minHeight = `${oh}px`;
      isLoading.value = false;
    }

    function getImgSize() {
      const { ImageWidth, ImageHeight } = props.exif;
      if (ImageWidth && ImageHeight)
        return [+ImageWidth, +ImageHeight];

      const img = new Image();
      img.src = props.imgUrl;

      return new Promise<[number, number]>((resolve) => {
        img.onload = () => {
          resolve([img.width, img.height]);
        };
        img.onerror = () => {
          resolve([0, 0]);
        };
      });
    }
    return () => (
      <div ref={el} class="co-render" style={{ opacity: isLoading.value ? 0 : 1, fontFamily: `""` }}>
        <div ref={bgEl} class="background" style={bgStyle.value}>
          <div class="background-image" style={bgImgStyle.value}></div>
          {render()}
        </div>
      </div>
    );
  },
});
</script>
