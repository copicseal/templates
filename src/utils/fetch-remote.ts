import type { ComponentOptions } from 'vue';
import * as vue from 'vue';

export class TemplateParser {
  private baseUrl!: string;
  private info!: TemplateGroupManifest;
  private sourceMap = new Map<string, TemplateSource>();
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
  groupInfo.children = await Promise.all(
    groupInfo.templates.map(async (path) => {
      const data = await fetchJSON<TemplateManifest>(joinUrl(url, `${path}/`, 'manifest.json'));
      data.url = `${joinUrl(url, path)}/`;
      return data;
    }),
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
  const exports = { } as Record<string, ComponentOptions>;
  const Vue = vue;
  // eslint-disable-next-line no-eval
  eval(source);
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
  templates: string []
  children?: TemplateManifest []
};

export type TemplateManifest = {
  url: string
  name: string
  version: string
  description?: string
  entry: string
  css?: string
  files: string[]
  author?: string
  license?: string
};

export type TemplateSource = {
  source: string
  component: ComponentOptions
  css?: string
  files: string[]
};
