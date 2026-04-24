/**
 * Return an object with a property key of correct type.
 * Workaround for TypeScript issue #13948.
 * @see https://github.com/Microsoft/TypeScript/issues/13948#issuecomment-1333159066
 */
export function keyValue<K extends PropertyKey, const V>(
  key: K,
  value: V,
): { [P in K]: { [Q in P]: V } }[K] {
  // oxlint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-return, typescript/no-unsafe-type-assertion
  return { [key]: value } as any;
}
