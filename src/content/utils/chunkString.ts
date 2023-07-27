export function chunkString(str: string, chunkSize: number): string[] {
  const numChunks = Math.ceil(str.length / chunkSize);
  const chunks = new Array<string>(numChunks);
  let offset = 0;
  let nextOffset = chunkSize;

  for (let i = 0; i < numChunks; ++i) {
    chunks[i] = str.substring(offset, nextOffset);
    offset = nextOffset;
    nextOffset += chunkSize;
  }

  return chunks;
}
