const MAX_1BYTE = 63; // 2^6 - 1
const MAX_2BYTES = 16383; // 2^14 - 1
const MAX_4BYTES = 1073741823; // 2^30 - 1
const MAX_8BYTES = 2n ** 62n - 1n; // 2^62 - 1

export function serializeVarInt(value: number | bigint): Uint8Array {
  let v = BigInt(value);
  if (v < 0n || v > MAX_8BYTES) {
    throw new RangeError("Value out of range for QUIC varint (must be 0 <= value < 2^62)");
  }

  let length: number;
  let prefix: number;
  if (v <= BigInt(MAX_1BYTE)) {
    length = 1;
    prefix = 0;
  } else if (v <= BigInt(MAX_2BYTES)) {
    length = 2;
    prefix = 1;
  } else if (v <= BigInt(MAX_4BYTES)) {
    length = 4;
    prefix = 2;
  } else {
    length = 8;
    prefix = 3;
  }

  const bytes = new Uint8Array(length);
  for (let i = length - 1; i > 0; i--) {
    bytes[i] = Number(v & 0xFFn);
    v >>= 8n;
  }
  const prefixBits = prefix << 6;
  bytes[0] = prefixBits | Number(v);
  return bytes;
}

// Deserialize varint in an uint8 array to number
export function deserializeVarInt(data: Uint8Array): { value: number, bytes: number } {
  const firstByte = data[0];
  const prefix = firstByte >> 6;
  let value = firstByte & 0x3F;
  let bytes = 1;

  if (prefix === 1) {
    bytes = 2;
    if (data.length < bytes) throw new Error("Insufficient data for decoding");
    value |= data[1] << 6;
  } else if (prefix === 2) {
    bytes = 4;
    if (data.length < bytes) throw new Error("Insufficient data for decoding");
    value |= data[1] << 6 | data[2] << 14 | data[3] << 22;
  } else if (prefix >= 3) {
    throw RangeError("Invalid varint prefix");
  }
  return { value, bytes };
};

// Deserialize varint in a Uint8Array to a number or BigInt
export function deserializeVarIntPossiblyBigInt(data: Uint8Array): { value: number | bigint, bytes: number } {
  if (!(data instanceof Uint8Array)) {
    throw new TypeError("Input must be a Uint8Array");
  }

  const firstByte = data[0];
  const prefix = firstByte >> 6;

  if (prefix < 3) return deserializeVarInt(data);

  // Handle 8-byte varint (prefix: '11')
  if (data.length < 8) {
    throw new Error("Insufficient data for decoding");
  }

  let result = BigInt(firstByte & 0x3F);
  for (let i = 1; i < 8; i++) {
    result = (result << 8n) | BigInt(data[i]);
  }
  return { value: result, bytes: 8 };
};

// Deserialize varint in a readable stream to number
export async function deserializeVarIntFromStream(stream: ReadableStream): Promise<number> {
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

  return deserializeVarInt(new Uint8Array(resultBuffer)).value;
}

// Deserialize varint in a readable stream to number or BigInt
export async function deserializeVarIntPossiblyBigIntFromStream(stream: ReadableStream): Promise<number | bigint> {
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

  return deserializeVarIntPossiblyBigInt(new Uint8Array(resultBuffer)).value;
}
