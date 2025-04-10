"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeVarStr = void 0;
const helper_1 = require("./helper");
const varint_1 = require("./varint");
const serializeVarStr = (value) => {
    const len = (0, varint_1.serializeVarInt)(value.length);
    const str = new TextEncoder().encode(value);
    return (0, helper_1.concat)(len, str);
};
exports.serializeVarStr = serializeVarStr;
// export const deserializeVarStrFromBuffer = (data: Uint8Array): string => {
//   const len = deserializeVarIntFromBuffer(data);
//   const str = new TextDecoder().decode(data.slice(len));
//   return str;
// }
