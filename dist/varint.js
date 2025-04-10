"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeVarIntFromStream = exports.deserializeVarIntFromBuffer = exports.serializeVarInt = void 0;
// serialize number to varint in an uint8 array
const serializeVarInt = (value) => {
    if (typeof value === 'number')
        value = BigInt(value);
    if (value < 0n) {
        throw new RangeError("Value must be non-negative.");
    }
    if (value >= 2n ** 62n) {
        throw new RangeError("Value exceeds the maximum allowed varint size (2^62 - 1).");
    }
    if (value <= 63n) {
        // 1-byte encoding (prefix: 00)
        return new Uint8Array([Number(value)]);
    }
    else if (value <= 16383n) {
        // 2-byte encoding (prefix: 01)
        const buffer = new Uint8Array(2);
        buffer[0] = 0x40 | Number((value >> 8n) & 0x3fn);
        buffer[1] = Number(value & 0xffn);
        return buffer;
    }
    else if (value <= 1073741823n) {
        // 4-byte encoding (prefix: 10)
        const buffer = new Uint8Array(4);
        buffer[0] = 0x80 | Number((value >> 24n) & 0x3fn);
        buffer[1] = Number((value >> 16n) & 0xffn);
        buffer[2] = Number((value >> 8n) & 0xffn);
        buffer[3] = Number(value & 0xffn);
        return buffer;
    }
    else {
        // 8-byte encoding (prefix: 11)
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
exports.serializeVarInt = serializeVarInt;
// deserialize varint in an uint8 array to number
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
        case 3: // Prefix: '11' -> Eight bytes
            if (data.length < 8)
                throw new Error("Insufficient data for decoding");
            let result = BigInt(firstByte) & 0x3fn;
            for (let i = 1; i < data.length; i++) {
                result = (result << 8n) | BigInt(data[i]);
            }
            return result;
        default:
            throw new Error("Invalid varint prefix");
    }
};
exports.deserializeVarIntFromBuffer = deserializeVarIntFromBuffer;
// deserialize varint in a readable stream to number
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
