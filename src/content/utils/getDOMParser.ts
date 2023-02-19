export function getDOMParser() {
  try {
    return new DOMParser();
  } catch {
    return Cc['@mozilla.org/xmlextras/domparser;1'].createInstance(
      Ci.nsIDOMParser
    );
  }
}
