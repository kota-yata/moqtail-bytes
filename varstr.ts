import { concat, readBytesFromStream } from "./helper";
import { deserializeVarInt, deserializeVarIntFromStream, serializeVarInt } from "./varint"

export const serializeVarStr = (value: string): Uint8Array => {
  const str = new TextEncoder().encode(value);
  const len = serializeVarInt(str.byteLength);
  return concat(len, str);
}

export const deserializeVarStr = (data: Uint8Array): string => {
  const result = deserializeVarInt(data);
  const strBytes = data.slice(result.bytes, result.bytes + result.value); // Slice out string bytes
  const str = new TextDecoder().decode(strBytes);
  return str;
}

export const deserializeVarStrFromStream = async (stream: ReadableStream): Promise<string> => {
  const len = await deserializeVarIntFromStream(stream);
  const buffer = await readBytesFromStream(stream, len);
  const str = new TextDecoder().decode(buffer);
  return str;
}
