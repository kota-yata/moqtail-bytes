"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeVarIntPossiblyBigIntFromStream = exports.deserializeVarIntFromStream = exports.deserializeVarIntPossiblyBigIntFromBuffer = exports.deserializeVarIntFromBuffer = exports.serializeVarIntPossiblyBigInt = exports.serializeVarInt = void 0;
const MAX_1BYTE = 63; // 2^6 - 1
const MAX_2BYTES = 16383; // 2^14 - 1
const MAX_4BYTES = 1073741823; // 2^30 - 1
const MAX_8BYTES = 2n ** 62n - 1n; // 2^62 - 1
// Serialize number to varint in an uint8 array
const serializeVarInt = (value) => {
    if (value < 0) {
        throw new RangeError("Value must be non-negative");
    }
    if (value > MAX_4BYTES) {
        throw new RangeError("Cannot serialize value greater than 2^30 - 1");
    }
    if (value <= MAX_1BYTE) {
        // 1-byte encoding (prefix: 00)
        return new Uint8Array([Number(value)]);
    }
    else if (value <= MAX_2BYTES) {
        // 2-byte encoding (prefix: 01)
        const buffer = new Uint8Array(2);
        buffer[0] = 0x40 | (value >> 8) & 0x3F;
        buffer[1] = value & 0xFF;
        return buffer;
    }
    else {
        // 4-byte encoding (prefix: 10)
        const buffer = new Uint8Array(4);
        buffer[0] = 0x80 | value >> 24 & 0x3F;
        buffer[1] = (value >> 16) & 0xFF;
        buffer[2] = (value >> 8) & 0xFF;
        buffer[3] = value & 0xFF;
        return buffer;
    }
};
exports.serializeVarInt = serializeVarInt;
// Serialize number or BigInt to varint in an uint8 array
const serializeVarIntPossiblyBigInt = (value) => {
    if (typeof value === 'number')
        value = BigInt(value);
    if (value < 0n) {
        throw new RangeError("Value must be non-negative.");
    }
    if (value > MAX_8BYTES) {
        throw new RangeError("Value exceeds the maximum allowed varint size (2^62 - 1).");
    }
    if (value <= MAX_4BYTES) {
        return (0, exports.serializeVarInt)(Number(value));
    }
    else {
        const buffer = new Uint8Array(8);
        buffer[0] = 0xC0 | Number((value >> 56n) & 0x3fn);
        buffer[1] = Number((value >> 48n) & 0xffn);
        buffer[2] = Number((value >> 40n) & 0xffn);
        buffer[3] = Number((value >> 32n) & 0xffn);
        buffer[4] = Number((value >> 24n) & 0xffn);
        buffer[5] = Number((value >> 16n) & 0xffn);
        buffer[6] = Number((value >> 8n) & 0xffn);
        buffer[7] = Number(value & 0xffn);
        return buffer;
    }
};
exports.serializeVarIntPossiblyBigInt = serializeVarIntPossiblyBigInt;
// Deserialize varint in an uint8 array to number
const deserializeVarIntFromBuffer = (data) => {
    if (!(data instanceof Uint8Array)) {
        throw new TypeError("Input must be a Uint8Array");
    }
    const firstByte = data[0];
    const prefix = firstByte >> 6;
    switch (prefix) {
        case 0: // Prefix: '00' -> Single byte
            return firstByte & 0x3F;
        case 1: // Prefix: '01' -> Two bytes
            if (data.length < 2)
                throw new Error("Insufficient data for decoding");
            return ((firstByte & 0x3F) << 8) | data[1];
        case 2: // Prefix: '10' -> Four bytes
            if (data.length < 4)
                throw new Error("Insufficient data for decoding");
            return (((firstByte & 0x3F) << 24) |
                (data[1] << 16) |
                (data[2] << 8) |
                data[3]);
        default:
            throw new Error("Invalid varint prefix");
    }
};
exports.deserializeVarIntFromBuffer = deserializeVarIntFromBuffer;
// Deserialize varint in a Uint8Array to a number or BigInt
const deserializeVarIntPossiblyBigIntFromBuffer = (data) => {
    if (!(data instanceof Uint8Array)) {
        throw new TypeError("Input must be a Uint8Array");
    }
    const firstByte = data[0];
    const prefix = firstByte >> 6;
    if (prefix < 3)
        return (0, exports.deserializeVarIntFromBuffer)(data);
    // Handle 8-byte varint (prefix: '11')
    if (data.length < 8) {
        throw new Error("Insufficient data for decoding");
    }
    let result = BigInt(firstByte & 0x3F);
    for (let i = 1; i < 8; i++) {
        result = (result << 8n) | BigInt(data[i]);
    }
    return result;
};
exports.deserializeVarIntPossiblyBigIntFromBuffer = deserializeVarIntPossiblyBigIntFromBuffer;
// Deserialize varint in a readable stream to number
const deserializeVarIntFromStream = async (stream) => {
    const reader = stream.getReader();
    let resultBuffer = [];
    let done, chunk;
    try {
        while (!done && resultBuffer.length < 8) {
            ({ done, value: chunk } = await reader.read());
            if (chunk)
                resultBuffer.push(...chunk);
        }
    }
    finally {
        reader.releaseLock();
    }
    return (0, exports.deserializeVarIntFromBuffer)(new Uint8Array(resultBuffer));
};
exports.deserializeVarIntFromStream = deserializeVarIntFromStream;
// Deserialize varint in a readable stream to number or BigInt
const deserializeVarIntPossiblyBigIntFromStream = async (stream) => {
    const reader = stream.getReader();
    let resultBuffer = [];
    let done, chunk;
    try {
        while (!done && resultBuffer.length < 8) {
            ({ done, value: chunk } = await reader.read());
            if (chunk)
                resultBuffer.push(...chunk);
        }
    }
    finally {
        reader.releaseLock();
    }
    return (0, exports.deserializeVarIntPossiblyBigIntFromBuffer)(new Uint8Array(resultBuffer));
};
exports.deserializeVarIntPossiblyBigIntFromStream = deserializeVarIntPossiblyBigIntFromStream;
