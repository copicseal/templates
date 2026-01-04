import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './template';
import { TemplateParser } from './template';

// 导入所有模板组件
const templateMap = import.meta.glob<any>('../templates/**/*.vue', { eager: true, import: 'default' });
// 导入组件的manifest信息
const manifestMap = import.meta.glob<any>('../templates/**/manifest.json', { eager: true, import: 'default' });

export class LocalTemplateParser extends TemplateParser {
  constructor() {
    super('');
  }

  getInfo(): Promise<TemplateGroupManifest> {
    return loadLocalTpl();
  }

  async getTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
    return {
      ...info,
      source: '',
      component: templateMap[`${info.url}index.vue`],
    };
  }
}

export async function loadLocalTpl() {
  const groupInfo = manifestMap['../templates/manifest.json'] as TemplateGroupManifest;
  groupInfo.groups?.forEach((group) => {
    group.templates = Object.keys(manifestMap).filter(key => key.includes(`/templates/${group.id}/`)).map(key => ({
      ...manifestMap[key],
      url: key.replace('manifest.json', ''),
    }));
  });

  return groupInfo;
}
