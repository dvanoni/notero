export function chunkString(str: string, chunkSize: number): string[] {
  const codePoints = [...str]; // Strings are iterated by Unicode code points
  const numChunks = Math.ceil(codePoints.length / chunkSize);
  const chunks = new Array<string>(numChunks);
  let offset = 0;
  let nextOffset = chunkSize;

  for (let i = 0; i < numChunks; ++i) {
    chunks[i] = codePoints.slice(offset, nextOffset).join('');
    offset = nextOffset;
    nextOffset += chunkSize;
  }

  return chunks;
}
