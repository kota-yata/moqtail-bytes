const MAX_1BYTE = 63; // 2^6 - 1
const MAX_2BYTES = 16383; // 2^14 - 1
const MAX_4BYTES = 1073741823; // 2^30 - 1
const MAX_8BYTES = 2n ** 62n - 1n; // 2^62 - 1

// serialize number to varint in an uint8 array
export const serializeVarInt = (value: number): Uint8Array => {
  if (value < 0) {
    throw new RangeError("Value must be non-negative");
  }
  if (value > MAX_4BYTES) {
    throw new RangeError("Cannot serialize value greater than 2^30 - 1");
  }

  if (value <= MAX_1BYTE) {
    // 1-byte encoding (prefix: 00)
    return new Uint8Array([Number(value)]);
  } else if (value <= MAX_2BYTES) {
    // 2-byte encoding (prefix: 01)
    const buffer = new Uint8Array(2);
    buffer[0] = 0x40 | (value >> 8) & 0x3F;
    buffer[1] = value & 0xFF;
    return buffer;
  } else {
    // 4-byte encoding (prefix: 10)
    const buffer = new Uint8Array(4);
    buffer[0] = 0x80 | value >> 24 & 0x3F;
    buffer[1] = (value >> 16) & 0xFF;
    buffer[2] = (value >> 8) & 0xFF;
    buffer[3] = value & 0xFF;
    return buffer;
  }
};

export const serializeVarIntPossiblyBigInt = (value: number | bigint): Uint8Array => {
  if (typeof value === 'number') value = BigInt(value);
  if (value < 0n) {
    throw new RangeError("Value must be non-negative.");
  }
  if (value > MAX_8BYTES) {
    throw new RangeError("Value exceeds the maximum allowed varint size (2^62 - 1).");
  }

  if (value <= MAX_4BYTES) {
    return serializeVarInt(Number(value));
  } else {
    const buffer = new Uint8Array(8);
    buffer[0] = 0xC0 | Number((value >> 56n) & 0x3Fn);
    buffer[1] = Number((value >> 48n) & 0xFFn);
    buffer[2] = Number((value >> 40n) & 0xFFn);
    buffer[3] = Number((value >> 32n) & 0xFFn);
    buffer[4] = Number((value >> 24n) & 0xFFn);
    buffer[5] = Number((value >> 16n) & 0xFFn);
    buffer[6] = Number((value >> 8n) & 0xFFn);
    buffer[7] = Number(value & 0xFFn);
    return buffer;
  }
}

// deserialize varint in an uint8 array to number
export const deserializeVarIntFromBuffer = (data: Uint8Array): number | bigint => {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Input must be a Uint8Array");
  }

  const firstByte = data[0];
  const prefix = firstByte >> 6;

  switch (prefix) {
    case 0: // Prefix: '00' -> Single byte
      return firstByte & 0x3F;

    case 1: // Prefix: '01' -> Two bytes
      if (data.length < 2) throw new Error("Insufficient data for decoding");
      return ((firstByte & 0x3F) << 8) | data[1];

    case 2: // Prefix: '10' -> Four bytes
      if (data.length < 4) throw new Error("Insufficient data for decoding");
      return (
        ((firstByte & 0x3F) << 24) |
        (data[1] << 16) |
        (data[2] << 8) |
        data[3]
      );

    case 3: // Prefix: '11' -> Eight bytes
      if (data.length < 8) throw new Error("Insufficient data for decoding");
      let result = BigInt(firstByte) & 0x3Fn;
      for (let i = 1; i < data.length; i++) {
        result = (result << 8n) | BigInt(data[i]);
      }
      return result;

    default:
      throw new Error("Invalid varint prefix");
  }
}

// deserialize varint in a readable stream to number
export const deserializeVarIntFromStream = async (stream: ReadableStream): Promise<number | bigint> => {
  const reader = stream.getReader();
    let resultBuffer = [];
    let done, chunk;

    try {
      while (!done && resultBuffer.length < 8) {
        ({ done, value: chunk } = await reader.read());
        if (chunk) resultBuffer.push(...chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return deserializeVarIntFromBuffer(new Uint8Array(resultBuffer));
}
