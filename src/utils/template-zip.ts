import type { TemplateGroupManifest, TemplateManifest, TemplateSource } from './template';
import JSZip from 'jszip';
import { ref } from 'vue';
import { parseVueComp, TemplateParser } from './template';
import { verifySignedCode } from './validator';

export class ZipTemplateParser extends TemplateParser {
  private zip: JSZip | null = null;
  private zipLoaded = false;

  zipFile: File;
  constructor(zipFile: File) {
    super(zipFile.name);
    this.zipFile = zipFile;
  }

  async loadZip() {
    if (this.zipLoaded)
      return;

    this.zip = await JSZip.loadAsync(this.zipFile);
    this.zipLoaded = true;
  }

  async getInfo(): Promise<TemplateGroupManifest> {
    await this.loadZip();

    const manifestFile = this.zip!.file('manifest.json');
    if (!manifestFile) {
      throw new Error('manifest.json not found in zip');
    }

    const manifestContent = await manifestFile.async('text');
    const groupInfo = JSON.parse(manifestContent) as TemplateGroupManifest;
    groupInfo.url = this.baseUrl;

    groupInfo.groups = await Promise.all(
      groupInfo.groups?.map(async (group) => {
        if (group.templates && Array.isArray(group.templates)) {
          const templateInfos = await Promise.all(
            group.templates.map(async (template) => {
              const templatePath = `${template.url.replace(/^\.\/+/, '')}/`;
              const manifestJson = await this.loadTemplateManifest(templatePath);
              const valid = ref<boolean>();
              (async () => {
                const source = await this.zip!.file(`${templatePath}${manifestJson.entry}`)!.async('text');
                valid.value = await verifySignedCode(source);
              })();
              return {
                ...manifestJson,
                url: templatePath,
                valid,
              };
            }),
          );

          group.templates = templateInfos;
        }
        return group;
      }) ?? [],
    );

    return groupInfo;
  }

  private async loadTemplateManifest(templatePath: string): Promise<TemplateManifest> {
    const manifestFile = this.zip!.file(`${templatePath}manifest.json`);
    if (!manifestFile) {
      throw new Error(`manifest.json not found at ${templatePath}manifest.json`);
    }

    const manifestContent = await manifestFile.async('text');
    return JSON.parse(manifestContent);
  }

  async getTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
    await this.loadZip();

    const entryFile = this.zip!.file(`${info.url}${info.entry}`);
    if (!entryFile) {
      throw new Error(`Entry file ${info.url}${info.entry} not found in zip`);
    }

    const source = await entryFile.async('text');

    const cssFile = this.zip!.file(`${info.url}${info.css}`);
    if (cssFile) {
      const css = await cssFile.async('text');
      info.css = css;
    }

    return {
      source,
      component: parseVueComp(source),
      css: info.css,
      files: info.files.map(f => `${info.url}${f}`),
    };
  }
}
