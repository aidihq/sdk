import { describe, expect, it } from "vitest";

import packageMetadata from "../package.json";
import { buildClientHeaders } from "../src/http/headers";
import { SDK_VERSION } from "../src/version";

describe("buildClientHeaders", () => {
  it("uses the package version for sdk metadata", () => {
    expect(SDK_VERSION).toBe(packageMetadata.version);
  });

  it("adds auth and sdk metadata headers", () => {
    const headers = buildClientHeaders("secret-key", {
      Accept: "application/json"
    });

    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("x-company-token")).toBe("secret-key");
    expect(headers.get("User-Agent")).toBe(`aidi-node/${SDK_VERSION}`);
    expect(headers.get("X-AIDI-SDK")).toBe("node");
    expect(headers.get("X-AIDI-SDK-Version")).toBe(SDK_VERSION);

    const clientHeader = headers.get("X-AIDI-Client");
    expect(clientHeader).toBeTruthy();

    expect(JSON.parse(clientHeader ?? "{}")).toMatchObject({
      sdk: "node",
      version: SDK_VERSION,
      runtime: "node"
    });
  });
});
