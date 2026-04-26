import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './template';
import { TemplateParser } from './template';

// 导入所有模板组件
const templateMap = import.meta.glob<any>('../templates/**/*.vue', { eager: true, import: 'default' });
// 导入组件的manifest信息
const manifestMap = import.meta.glob<any>('../templates/**/manifest.json', { eager: true, import: 'default' });

export class LocalTemplateParser extends TemplateParser {
  constructor() {
    super('https://local/');
  }

  protected async loadGroupInfo(url: string) {
    const groupInfo = await this.fetchJSON<TemplateGroupManifest>(this.joinUrl(url, 'manifest.json'));
    groupInfo.url = url;
    groupInfo.groups?.forEach((group) => {
      group.templates = Object.keys(manifestMap).filter(key => key.includes(`/templates/${group.id}/`)).map(key => ({
        ...manifestMap[key],
        url: key.replace('manifest.json', '').replace('../templates/', ''),
      }));
    });

    return groupInfo;
  }

  protected async loadTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
    const source = await this.fetchJSON(this.getLocalUrl(this.joinUrl(info.url, 'index.vue')));

    return {
      source,
      component: source,
    };
  }

  protected async verifyTemplateSource(_source: string) {
    return true;
  }

  protected async fetchJSON<T = any>(url: string): Promise<T> {
    return ({ ...templateMap, ...manifestMap })[this.getLocalUrl(url)] as Promise<T>;
  }

  protected async fetchText(url: string): Promise<string> {
    return ({ ...templateMap, ...manifestMap })[this.getLocalUrl(url)] as Promise<string>;
  }

  private getLocalUrl(url: string) {
    return url.replace(this.baseUrl, '../templates/');
  }
}
