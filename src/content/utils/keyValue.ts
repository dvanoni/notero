/**
 * Return an object with a property key of correct type.
 * Workaround for TypeScript issue #13948.
 * @see https://github.com/Microsoft/TypeScript/issues/13948#issuecomment-1333159066
 */
export function keyValue<K extends PropertyKey, V>(
  key: K,
  value: V
): { [P in K]: { [Q in P]: V } }[K] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return { [key]: value } as any;
}
