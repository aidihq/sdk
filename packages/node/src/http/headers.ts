import { SDK_NAME } from "../constants";
import { SDK_VERSION } from "../version";

function getRuntimeVersion(): string {
  return typeof process !== "undefined" ? process.version : "unknown";
}

export function buildClientHeaders(apiKey: string, headers?: HeadersInit): Headers {
  const resolvedHeaders = new Headers(headers);
  const clientMetadata = JSON.stringify({
    sdk: SDK_NAME,
    version: SDK_VERSION,
    runtime: "node",
    runtimeVersion: getRuntimeVersion()
  });

  resolvedHeaders.set("x-company-token", apiKey);
  resolvedHeaders.set("User-Agent", `aidi-node/${SDK_VERSION}`);
  resolvedHeaders.set("X-AIDI-SDK", SDK_NAME);
  resolvedHeaders.set("X-AIDI-SDK-Version", SDK_VERSION);
  resolvedHeaders.set("X-AIDI-Client", clientMetadata);

  return resolvedHeaders;
}
