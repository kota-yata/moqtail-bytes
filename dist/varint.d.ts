export declare const serializeVarInt: (value: number | bigint) => Uint8Array;
export declare const deserializeVarIntFromBuffer: (data: Uint8Array) => number | bigint;
export declare const deserializeVarIntFromStream: (stream: ReadableStream) => Promise<number | bigint>;
