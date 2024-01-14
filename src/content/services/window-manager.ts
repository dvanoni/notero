import type { Service } from './service';

export class WindowManager implements Service {
  private readonly windows: Zotero.ZoteroWindow[] = [];

  public startup() {}

  public addToWindow(window: Zotero.ZoteroWindow) {
    if (!this.windows.includes(window)) {
      this.windows.unshift(window);
    }
  }

  public removeFromWindow(window: Zotero.ZoteroWindow) {
    const index = this.windows.indexOf(window);
    if (index >= 0) {
      this.windows.splice(index, 1);
    }
  }

  public getLatestWindow(): Zotero.ZoteroWindow | undefined {
    return this.windows[0];
  }
}
