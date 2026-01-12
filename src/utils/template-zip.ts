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
    const { entry, css, files } = info;
    const source = await this.fetchText(this.joinUrl(info.url, entry));
    if (css) {
      const cssFile = await this.fetchText(this.joinUrl(info.url, css));
      if (cssFile) {
        info.css = cssFile;
      }
    }

    return {
      source,
      component: this.parseVueComp(source),
      css: info.css,
      files: files.map(f => this.joinUrl(info.url, f)),
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
