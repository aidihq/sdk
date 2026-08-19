# @aidi/node

![Version](https://img.shields.io/badge/version-0.2.0-black)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![Runtime](https://img.shields.io/badge/runtime-server--side-1f6feb)

Official AIDI SDK for Node.js.

`@aidi/node` provides a typed, server-side API for creating AIDI verification and authentication flows, checking their status, retrieving verification results, and exchanging authentication approvals using native `fetch`.

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

const verification = await aidi.verifications.createUserInitiated({
  requestedFields: ["cuil"]
});

console.log(verification.id);
console.log(verification.qrUrl);
```

## Model

AIDI separates what you want to do from how the user enters the flow.

**Intent**

- `VERIFY`: confirm identity or requested data.
- `AUTHENTICATE`: authenticate the user in AIDI and return an assertion your backend can exchange before creating its own session.

**Initiation**

- `TARGETED`: your backend already knows which AIDI user should approve.
- `USER_INITIATED`: the user starts from a QR, button, link, or deeplink.

## USER_INITIATED Authentication

Use this when a user wants to enter your product with AIDI. For desktop, render `qrUrl` as a QR and keep the desktop page waiting for completion. For mobile, open the same `qrUrl` from a button or link.

```ts
const authentication = await aidi.verifications.createUserInitiated({
  intent: "AUTHENTICATE",
  message: "Confirmá tu identidad para continuar",
  requestedFields: ["cuil"],
  redirectUrl: "https://empresa.com/auth/callback",
  state: "auth-attempt-id"
});

const status = await aidi.verifications.getStatus(authentication.id);

if (status.exchangeReady && status.exchangeToken) {
  const result = await aidi.verifications.exchangeAuthentication(
    authentication.id,
    status.exchangeToken
  );

  console.log(result.subjectId);
  console.log(result.claims);
  console.log(result.state);
}
```

If `redirectUrl` is present, AIDI can return the user to that URL after consent with `verificationId`, `status`, and `state` in the query string. The actual authentication still completes server-side with `exchangeAuthentication()`.

## TARGETED Verification

Use this when you already know which AIDI user should approve.

```ts
const verification = await aidi.verifications.createTargeted({
  targetIdentifier: "20-12345678-9",
  requestedFields: ["dni", "cuil", "firstName"]
});

const status = await aidi.verifications.getStatus(verification.id);

if (status.resultAvailable) {
  const result = await aidi.verifications.getResult(verification.id);
  console.log(result);
}
```

## Requested Fields

The SDK currently accepts these values in `requestedFields`:

```ts
["dni", "cuil", "firstName"]
```

Internally, the SDK translates `requestedFields` into the current AIDI HTTP payload shape.

## Public Methods

- `createAidiClient({ apiKey })`
- `aidi.verifications.create({ initiation, intent, requestedFields, ... })`
- `aidi.verifications.createUserInitiated({ intent, requestedFields, redirectUrl, state })`
- `aidi.verifications.createTargeted({ targetIdentifier, requestedFields })`
- `aidi.verifications.getStatus(verificationId)`
- `aidi.verifications.getResult(verificationId)`
- `aidi.verifications.exchangeAuthentication(verificationId, exchangeToken)`

## Version

Version `0.2.0` aligns the SDK with the backend `intent`/`initiation` contract and removes the old QR/DIRECT/LOGIN-facing helpers. See the repository changelog for full version history.

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
  await aidi.verifications.createUserInitiated({
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
