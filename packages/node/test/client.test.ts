import { describe, expect, it } from "vitest";

import { createAidiClient } from "../src/client";

describe("createAidiClient", () => {
  it("rejects empty api keys", () => {
    expect(() =>
      createAidiClient({
        apiKey: "   "
      })
    ).toThrowError("AIDI apiKey is required.");
  });

  it("rejects non-string api keys from untyped consumers", () => {
    expect(() =>
      createAidiClient({
        apiKey: 123 as unknown as string
      })
    ).toThrowError("AIDI apiKey is required.");
  });
});
