import {
  serializeVarInt,
  deserializeVarInt,
  deserializeVarIntPossiblyBigInt,
  deserializeVarIntFromStream,
  deserializeVarIntPossiblyBigIntFromStream,
} from "../varint";

describe("serializeVarInt", () => {
  it("should serialize a number in the 1-byte range correctly", () => {
    const result = serializeVarInt(63);
    expect(result).toEqual(new Uint8Array([0x3F]));
  });

  it("should serialize a number in the 2-byte range correctly", () => {
    const result = serializeVarInt(16383);
    expect(result).toEqual(new Uint8Array([0x7F, 0xFF]));
  });

  it("should serialize a number in the 4-byte range correctly", () => {
    const result = serializeVarInt(1073741823);
    expect(result).toEqual(new Uint8Array([0xBF, 0xFF, 0xFF, 0xFF]));
  });

  it("should serialize a number in the 8-byte range correctly", () => {
    const result = serializeVarInt(2n ** 62n - 1n);
    expect(result).toEqual(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));
  });

  it("should throw an error for numbers out of range", () => {
    expect(() => serializeVarInt(-1)).toThrow(RangeError);
    expect(() => serializeVarInt(2n ** 62n)).toThrow(RangeError);
  });
});

describe("deserializeVarIntFromBuffer", () => {
  it("should deserialize a 1-byte varint correctly", () => {
    const result = deserializeVarInt(new Uint8Array([0x3F]));
    expect(result.value).toBe(63);
  });

  it("should deserialize a 2-byte varint correctly", () => {
    const result = deserializeVarInt(new Uint8Array([0x7F, 0xFF]));
    expect(result.value).toBe(16383);
  });

  it("should deserialize a 4-byte varint correctly", () => {
    const result = deserializeVarInt(new Uint8Array([0xBF, 0xFF, 0xFF, 0xFF]));
    expect(result.value).toBe(1073741823);
  });

  it("should throw an error for insufficient data", () => {
    expect(() => deserializeVarInt(new Uint8Array([0x7F]))).toThrow(Error);
    expect(() => deserializeVarInt(new Uint8Array([0xBF, 0xFF]))).toThrow(Error);
  });
});

describe("deserializeVarIntPossiblyBigIntFromBuffer", () => {
  it("should deserialize a 1-byte varint correctly", () => {
    const result = deserializeVarIntPossiblyBigInt(new Uint8Array([0x3F]));
    expect(result.value).toBe(63);
  });

  it("should deserialize a 2-byte varint correctly", () => {
    const result = deserializeVarIntPossiblyBigInt(new Uint8Array([0x7F, 0xFF]));
    expect(result.value).toBe(16383);
  });

  it("should deserialize a 4-byte varint correctly", () => {
    const result = deserializeVarIntPossiblyBigInt(new Uint8Array([0xBF, 0xFF, 0xFF, 0xFF]));
    expect(result.value).toBe(1073741823);
  });

  it("should deserialize an 8-byte varint correctly", () => {
    const result = deserializeVarIntPossiblyBigInt(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));
    expect(result.value).toBe(2n ** 62n - 1n);
  });

  it("should throw an error for insufficient data", () => {
    expect(() => deserializeVarIntPossiblyBigInt(new Uint8Array([0xFF]))).toThrow(Error);
  });
});

describe("deserializeVarIntFromStream", () => {
  it("should deserialize a varint from a readable stream correctly", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0x7F, 0xFF]));
        controller.close();
      },
    });

    const result = await deserializeVarIntFromStream(stream);
    expect(result).toBe(16383);
  });

  it("should handle streams with insufficient data", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0xBF]));
        controller.close();
      },
    });

    await expect(deserializeVarIntFromStream(stream)).rejects.toThrow(Error);
  });
});

describe("deserializeVarIntPossiblyBigIntFromStream", () => {
  it("should deserialize a varint from a readable stream correctly", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0x7F, 0xFF]));
        controller.close();
      },
    });

    expect(await deserializeVarIntPossiblyBigIntFromStream(stream)).toBe(16383);
  });

  it("should handle streams with insufficient data", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0xBF]));
        controller.close();
      },
    });

    await expect(deserializeVarIntPossiblyBigIntFromStream(stream)).rejects.toThrow(Error);
  });

  it("should handle streams with exactly 8 bytes of data", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]));
        controller.close();
      },
    });

    expect(await deserializeVarIntPossiblyBigIntFromStream(stream)).toBe(2n ** 62n - 1n);
  });
});
