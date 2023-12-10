export function getDOMParser() {
  try {
    return new DOMParser();
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Cc['@mozilla.org/xmlextras/domparser;1']!.createInstance(
      Ci.nsIDOMParser,
    );
  }
}
