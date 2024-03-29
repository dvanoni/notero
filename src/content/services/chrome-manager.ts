import type { Service, ServiceParams } from './service';

export class ChromeManager implements Service {
  private chromeHandle?: XPCOM.nsIJSRAIIHelper;

  public startup({ pluginInfo: { rootURI } }: ServiceParams) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const aomStartup = Cc[
      '@mozilla.org/addons/addon-manager-startup;1'
    ]!.getService(Ci.amIAddonManagerStartup);

    const manifestURI = Services.io.newURI(rootURI + 'manifest.json');

    this.chromeHandle = aomStartup.registerChrome(manifestURI, [
      ['content', 'notero', 'content/'],
      ['locale', 'notero', 'en-US', 'locale/en-US/'],
      ['locale', 'notero', 'zh-CN', 'locale/zh-CN/'],
    ]);
  }

  public shutdown() {
    if (this.chromeHandle) {
      this.chromeHandle.destruct();
      delete this.chromeHandle;
    }
  }
}
