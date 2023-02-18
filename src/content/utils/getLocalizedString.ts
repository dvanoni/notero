import { NoteroPref } from '../prefs/notero-pref';

Components.utils.import('resource://gre/modules/Services.jsm');

const STRING_BUNDLE_URL = 'chrome://notero/locale/notero.properties';

let stringBundle: XPCOM.nsIStringBundle;

function getStringBundle(): XPCOM.nsIStringBundle {
  if (!stringBundle) {
    stringBundle = Services.strings.createBundle(STRING_BUNDLE_URL);
  }
  return stringBundle;
}

export default function getLocalizedString(name: NoteroPref | string): string {
  const fullName = name in NoteroPref ? `notero.preferences.${name}` : name;
  return getStringBundle().GetStringFromName(fullName);
}
