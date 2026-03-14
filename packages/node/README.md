# @aidi/node

![Version](https://img.shields.io/badge/version-0.1.0-black)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![Runtime](https://img.shields.io/badge/runtime-server--side-1f6feb)

Official AIDI SDK for Node.js.

`@aidi/node` provides a typed, server-side API for creating identity verifications and checking their status using native `fetch`.

## Installation

```bash
npm install @aidi/node
```

## Quick Start

```ts
import { createAidiClient } from "@aidi/node";

const aidi = createAidiClient({
  apiKey: process.env.AIDI_COMPANY_API_KEY!
});

const verification = await aidi.verifications.createQr({
  requestedFields: ["dni", "cuil", "firstName"]
});

console.log(verification.id);
console.log(verification.qrUrl);

const status = await aidi.verifications.getStatus(verification.id);
console.log(status);
```

## Choose the Method

- Use `createQr()` for the simplest QR flow.
- Use `createDirect()` when you already have a `targetIdentifier`.
- Use `create()` when you want the explicit shape with `flowMode`.

## DIRECT Example

```ts
const verification = await aidi.verifications.createDirect({
  targetIdentifier: "bfcf1248-c1d0-4264-b8b8-e801c45ebed0",
  requestedFields: ["dni", "cuil", "firstName"]
});
```

## Why the API uses `requestedFields`

The current AIDI HTTP contract expects:

```ts
requestedData: {
  dni: "required",
  cuil: "required",
  firstName: "required"
}
```

The SDK intentionally exposes a better DX-first input:

```ts
requestedFields: ["dni", "cuil", "firstName"]
```

Internally, the SDK translates that input into the current HTTP payload shape.

## Public Methods

- `createAidiClient({ apiKey })`
- `aidi.verifications.create({ flowMode, requestedFields, ... })`
- `aidi.verifications.createQr({ requestedFields })`
- `aidi.verifications.createDirect({ targetIdentifier, requestedFields })`
- `aidi.verifications.getStatus(verificationId)`

## Errors

The package exports typed errors:

- `AidiError`
- `AidiHttpError`
- `AidiTimeoutError`

Example:

```ts
import { AidiHttpError, createAidiClient } from "@aidi/node";

const aidi = createAidiClient({
  apiKey: process.env.AIDI_COMPANY_API_KEY!
});

try {
  await aidi.verifications.createQr({
    requestedFields: ["dni"]
  });
} catch (error) {
  if (error instanceof AidiHttpError) {
    console.error(error.status, error.body);
  }
}
```

## Security Notes

- Use this package only on the server side
- Never expose `AIDI_COMPANY_API_KEY` to browsers or mobile clients
- Rotate credentials if you suspect they were leaked
