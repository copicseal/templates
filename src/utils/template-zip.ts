import type { TemplateManifest, TemplateSource } from './template';
import JSZip from 'jszip';
import { TemplateParser } from './template';

export class ZipTemplateParser extends TemplateParser {
  private zip: JSZip | null = null;
  private zipLoaded = false;

  zipFile: File;
  constructor(zipFile: File) {
    super(`https://zip/`);
    this.zipFile = zipFile;
  }

  async loadZip() {
    if (this.zipLoaded)
      return;

    this.zip = await JSZip.loadAsync(this.zipFile);
    this.zipLoaded = true;
  }

  protected async loadTemplateSource(info: TemplateManifest): Promise<TemplateSource> {
    const json = await this.fetchJSON<{ code: string, style: string }>(info.url);
    return {
      source: json.code,
      component: this.parseVueComp(json.code),
      css: json.style,
    };
  }

  protected async fetchJSON<T = any>(url: string): Promise<T> {
    const content = await this.fetchText(url);
    return JSON.parse(content) as T;
  }

  protected async fetchText(url: string): Promise<string> {
    await this.loadZip();
    const file = this.zip!.file(this.getLocalUrl(url));
    if (!file) {
      throw new Error(`File not found at ${this.getLocalUrl(url)}`);
    }

    return await file.async('text');
  }

  private getLocalUrl(url: string) {
    return url.replace(this.baseUrl, '');
  }
}
