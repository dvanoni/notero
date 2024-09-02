export {};

declare global {
  function dump(message: string): void;
  function pref(name: string, value: boolean | number | string): void;

  interface Document {
    l10n: L10n.DOMLocalization;
  }

  interface Window {
    arguments?: unknown[];
    openDialog: typeof window.open extends (...args: infer A) => infer R
      ? (...args: [...A, ...any]) => R // eslint-disable-line @typescript-eslint/no-explicit-any
      : never;
    MozXULElement: XUL.MozXULElement;
  }
}
