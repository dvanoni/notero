export {};

declare global {
  interface Window {
    arguments?: unknown[];
    openDialog: typeof window.open extends (...args: infer A) => infer R
      ? (...args: [...A, ...any]) => R
      : never;
  }
}
