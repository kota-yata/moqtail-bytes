export declare const serializeVarInt: (value: number) => Uint8Array;
export declare const serializeVarIntPossiblyBigInt: (value: number | bigint) => Uint8Array;
export declare const deserializeVarIntFromBuffer: (data: Uint8Array) => number;
export declare const deserializeVarIntPossiblyBigIntFromBuffer: (data: Uint8Array) => number | bigint;
export declare const deserializeVarIntFromStream: (stream: ReadableStream) => Promise<number>;
export declare const deserializeVarIntPossiblyBigIntFromStream: (stream: ReadableStream) => Promise<number | bigint>;
