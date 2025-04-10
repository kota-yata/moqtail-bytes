import { concat, readBytesFromStream } from '../helper';

describe('concat', () => {
  it('should return an empty Uint8Array when no arrays are provided', () => {
    const result = concat();
    expect(result).toEqual(new Uint8Array(0));
  });

  it('should return the same array when only one array is provided', () => {
    const array = new Uint8Array([1, 2, 3]);
    const result = concat(array);
    expect(result).toEqual(array);
  });

  it('should concatenate multiple Uint8Arrays into one', () => {
    const array1 = new Uint8Array([1, 2, 3]);
    const array2 = new Uint8Array([4, 5]);
    const array3 = new Uint8Array([6, 7, 8, 9]);
    const result = concat(array1, array2, array3);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it('should handle empty arrays correctly', () => {
    const array1 = new Uint8Array([1, 2, 3]);
    const array2 = new Uint8Array([]);
    const array3 = new Uint8Array([4, 5]);
    const result = concat(array1, array2, array3);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });
});

describe('readBytesFromStream', () => {
  it('should read the exact number of bytes from the stream', async () => {
    const data = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];
    const stream = createMockStream(data);
    const result = await readBytesFromStream(stream, 5);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it('should return all available bytes if the stream ends before the requested length', async () => {
    const data = [new Uint8Array([1, 2, 3])];
    const stream = createMockStream(data);
    const result = await readBytesFromStream(stream, 5);
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('should return an empty Uint8Array if the stream is empty', async () => {
    const stream = createMockStream([]);
    const result = await readBytesFromStream(stream, 5);
    expect(result).toEqual(new Uint8Array(0));
  });

  it('should handle streams with multiple chunks correctly', async () => {
    const data = [
      new Uint8Array([1, 2]),
      new Uint8Array([3, 4]),
      new Uint8Array([5, 6, 7]),
    ];
    const stream = createMockStream(data);
    const result = await readBytesFromStream(stream, 6);
    expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });
});

// Helper function to create a mock ReadableStream
function createMockStream(chunks: Uint8Array[]): ReadableStream {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index++;
      } else {
        controller.close();
      }
    },
  });
}