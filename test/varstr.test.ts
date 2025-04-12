import {
  serializeVarStr,
  deserializeVarStr,
  deserializeVarStrFromStream,
} from "../varstr";

describe('Deserialize serialized varstr', () => {
  test('serialize and deserialize a simple string', () => {
    const input = "Hello, World!";
    const serialized = serializeVarStr(input);
    const deserialized = deserializeVarStr(serialized);

    expect(deserialized).toBe(input); // Assert the deserialized string is the same as the input
  });

  test('serialize and deserialize an empty string', () => {
    const input = "";
    const serialized = serializeVarStr(input);
    const deserialized = deserializeVarStr(serialized);

    expect(deserialized).toBe(input); // The deserialized string should be empty
  });

  test('serialize and deserialize a string with special characters', () => {
    const input = "😊💻🚀";
    const serialized = serializeVarStr(input);
    const deserialized = deserializeVarStr(serialized);

    expect(deserialized).toBe(input); // The deserialized string should be the same as the input
  });

  test('deserialize large string properly', () => {
    const input = "A".repeat(5000); // String of 5000 "A"s
    const serialized = serializeVarStr(input);
    const deserialized = deserializeVarStr(serialized);

    expect(deserialized).toBe(input); // The deserialized string should match the input
  });
});

describe('Deserialize varstr from stream', () => {
  test('deserialize from stream', async () => {
    const input = "Hello, Stream!";
    const serialized = serializeVarStr(input);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(serialized);
        controller.close();
      },
    });

    const deserialized = await deserializeVarStrFromStream(stream);

    expect(deserialized).toBe(input); // Assert the deserialized string is the same as the input
  });

  test('deserialize empty string from stream', async () => {
    const input = "";
    const serialized = serializeVarStr(input);

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(serialized);
        controller.close();
      },
    });

    const deserialized = await deserializeVarStrFromStream(stream);

    expect(deserialized).toBe(input); // The deserialized string should be empty
  });
})
