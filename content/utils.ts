export function hasErrorStack(error: unknown): error is Required<Error> {
  return typeof (error as Error).stack !== 'undefined';
}
