export const concat = (...arrays: Uint8Array[]): Uint8Array => {
  if (arrays.length === 0) {
    return new Uint8Array(0);
  }
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(totalLength);

  // Copy each Uint8Array into the result
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

export const readBytesFromStream = async (stream: ReadableStream, length: number): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytesRead = 0;

  while (totalBytesRead < length) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    totalBytesRead += value.length;
  }

  return concat(...chunks).slice(0, length);
}
