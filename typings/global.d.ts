export {};

declare global {
  interface Window {
    openDialog: typeof window.open;
  }
}
