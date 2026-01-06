import type { ComponentOptions, Ref } from 'vue';
import { ref } from 'vue';
import * as Vue from 'vue';
import { createSandbox } from './sandbox';
import { verifySignedCode } from './validator';

export class TemplateParser {
  protected baseUrl!: string;
  protected info!: TemplateGroupManifest;
  protected sourceMap = new Map<string, TemplateSource>();
  constructor(url: string) {
    this.baseUrl = url;
  }

  async getInfo() {
    if (!this.info) {
      this.info = await loadTemplateInfo(this.baseUrl);
    }
    return this.info;
  }

  async getTemplateSource(info: TemplateManifest) {
    if (!this.sourceMap.has(info.url)) {
      this.sourceMap.set(info.url, await loadTemplateSource(info));
    }
    return this.sourceMap.get(info.url)!;
  }
}

export async function loadTemplateInfo(url: string) {
  const groupInfo = await fetchJSON<TemplateGroupManifest>(joinUrl(url, 'manifest.json'));
  groupInfo.url = url;
  groupInfo.groups = await Promise.all(
    groupInfo.groups?.map(async (group) => {
      if (group.templates && Array.isArray(group.templates)) {
        const templateInfos = await Promise.all(
          group.templates.map(async (template) => {
            const templatePath = template.url;
            const curl = `${joinUrl(url, templatePath)}/`;
            const data = await fetchJSON<TemplateManifest>(joinUrl(curl, 'manifest.json'));
            data.url = curl;
            const valid = ref<boolean>();
            data.valid = valid;
            (async () => {
              const source = await fetchText(joinUrl(data.url, data.entry));
              valid.value = await verifySignedCode(source);
            })();
            return data;
          }),
        );

        group.templates = templateInfos;
      }
      return group;
    }) ?? [],
  );

  return groupInfo;
}

export async function loadTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
  const { entry, css, files } = info;
  const source = await fetchText(joinUrl(info.url, entry));
  return {
    source,
    component: parseVueComp(source),
    css: css ? joinUrl(info.url, css) : undefined,
    files: files.map(f => joinUrl(info.url, f)),
  };
}

export function parseVueComp(source: string) {
  const exports = createSandbox<ComponentOptions>({ Vue }).run(source).exports;
  return Object.values(exports)[0]!;
}

async function fetchJSON<T = any>(url: string) {
  return fetch(url).then(res => res.json() as Promise<T>);
}
async function fetchText(url: string) {
  return fetch(url).then(res => res.text());
}

/**
 * 合并URL路径
 * @returns 合并后的URL路径
 */
function joinUrl(base: string, ...paths: string[]) {
  let url = new URL(base);

  for (const p of paths) {
    url = new URL(p, url);
  }

  return url.toString().replace(/\/$/, '');
}

export type TemplateGroupManifest = {
  url: string
  name: string
  version: string
  description?: string
  groups?: TemplateGroup[]
};

export type TemplateGroup = {
  id: string
  name: string
  description?: string
  templates: TemplateManifest[]
};

export type TemplateInfo = {
  name: string
  path: string
};

export type TemplateManifest = {
  id: string
  url: string
  name: string
  version: string
  description?: string
  entry: string
  css?: string
  files: string[]
  author?: string
  license?: string
  valid?: boolean | Ref<boolean | undefined>
};

export type TemplateSource = {
  source: string
  component: ComponentOptions
  css?: string
  files: string[]
};
