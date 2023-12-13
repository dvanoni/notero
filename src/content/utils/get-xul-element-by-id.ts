export function getXULElementById<E extends XUL.XULElement>(id: string): E {
  return document.getElementById(id) as unknown as E;
}
