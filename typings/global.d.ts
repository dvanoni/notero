export {};

declare global {
  function pref(name: string, value: boolean | number | string): void;

  interface Window {
    arguments?: unknown[];
    openDialog: typeof window.open extends (...args: infer A) => infer R
      ? (...args: [...A, ...any]) => R // eslint-disable-line @typescript-eslint/no-explicit-any
      : never;
  }
}
