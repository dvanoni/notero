type FunctionProperties<T> = {
  // oxlint-disable-next-line typescript/no-explicit-any
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
