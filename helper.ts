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