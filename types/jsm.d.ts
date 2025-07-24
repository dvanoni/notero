/**
 * @see https://udn.realityripple.com/docs/Mozilla/JavaScript_code_modules
 */
declare namespace jsm {
  type ModuleURIMap = {
    'resource://gre/modules/AddonManager.sys.mjs': {
      AddonManager: AddonManager;
    };
    'resource://gre/modules/Services.sys.mjs': {
      Services: Services;
    };
  };

  interface Addon {
    readonly isActive: boolean;
  }

  interface AddonManager {
    getAddonByID(id: string): Promise<Addon | null>;
  }

  interface Services {
    io: XPCOM.nsIIOService;
    logins: XPCOM.nsILoginManager;
    prefs: XPCOM.nsIPrefService;
    prompt: XPCOM.nsIPromptService;
    scriptloader: XPCOM.mozIJSSubScriptLoader;
    strings: XPCOM.nsIStringBundleService;
    wm: XPCOM.nsIWindowMediator;
  }
}

/**
 * @see https://searchfox.org/mozilla-esr115/source/dom/chrome-webidl/ChromeUtils.webidl
 */
declare const ChromeUtils: {
  importESModule<URI extends keyof jsm.ModuleURIMap>(
    aResourceURI: URI,
    options?: object,
  ): jsm.ModuleURIMap[URI];
};

declare const Services: jsm.Services;
