import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './template';
import { ref } from 'vue';
import { TemplateParser } from './template';

// 导入所有模板组件
const templateMap = import.meta.glob<any>('../templates/**/*.vue', { eager: true, import: 'default' });
// 导入组件的manifest信息
const manifestMap = import.meta.glob<any>('../templates/**/manifest.json', { eager: true, import: 'default' });

export class LocalTemplateParser extends TemplateParser {
  constructor() {
    super('https://local/');
  }

  protected async loadTemplateInfo(url: string): Promise<TemplateGroupManifest> {
    return this.loadGroupInfo(url);
  }

  protected async loadGroupInfo(url: string): Promise<TemplateGroupManifest> {
    const groupInfo: TemplateGroupManifest = {
      url,
      name: '本地模板库',
      version: '1.0.0',
      groups: [],
    };

    const groupIds = ['group1', 'group2', 'group3'];
    for (const groupId of groupIds) {
      const templates: TemplateManifest[] = [];

      Object.keys(manifestMap).forEach((key) => {
        if (key.includes(`/templates/${groupId}/`)) {
          const manifest = manifestMap[key];
          templates.push({
            id: manifest.id,
            name: manifest.name,
            version: manifest.version || '1.0.0',
            description: manifest.description,
            url: key.replace('manifest.json', '').replace('../templates/', ''),
            valid: ref<boolean>(true),
          });
        }
      });

      if (templates.length > 0) {
        groupInfo.groups!.push({
          id: groupId,
          name: this.getGroupName(groupId),
          templates,
        });
      }
    }

    return groupInfo;
  }

  private getGroupName(groupId: string) {
    const names: Record<string, string> = {
      group1: '基础模板',
      group2: '高级模板',
      group3: '水印模板',
    };
    return names[groupId] || groupId;
  }

  protected async loadTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
    const urlPath = info.url.replace(/^\/|\/$/g, '');
    const templateKey = `../templates/${urlPath}/index.vue`;
    const component = templateMap[templateKey];

    return {
      source: '',
      component,
    };
  }

  protected async verifyTemplateSource(_source: string) {
    return true;
  }

  protected async fetchJSON<T = any>(url: string): Promise<T> {
    return ({ ...templateMap, ...manifestMap })[this.getLocalUrl(url)] as Promise<T>;
  }

  private getLocalUrl(url: string) {
    return url.replace(this.baseUrl, '../templates/');
  }
}
