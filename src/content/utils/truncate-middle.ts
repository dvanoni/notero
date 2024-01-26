export function truncateMiddle(
  str: string,
  maxLength: number,
  separator: string = '…',
): string {
  if (str.length <= maxLength) return str;

  if (separator.length >= maxLength) {
    return separator.substring(0, maxLength);
  }

  const budget = maxLength - separator.length;
  const startLength = Math.ceil(budget / 2);
  const endLength = Math.floor(budget / 2);
  const start = str.substring(0, startLength);
  const end = str.substring(str.length - endLength);

  return `${start}${separator}${end}`;
}
