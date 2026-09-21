# @aidihq/sdk

Official TypeScript SDK for integrating AIDI verification and authentication into server-side applications.

📚 **[Read the full AIDI documentation](https://docs.aidi.com.ar)**

Requires Node.js 18 or newer. Uses the native `fetch` API.

## Installation

```bash
npm install @aidihq/sdk
```

## Quick Start

Create an AIDI client using your company API key:

> Keep your API key on the server. Never expose it in browser or client-side code.

```ts
import { createAidiClient } from "@aidihq/sdk";

const aidi = createAidiClient({
  apiKey: process.env.AIDI_COMPANY_API_KEY!
});
```

## Verification

Create a user-initiated verification:

```ts
const verification = await aidi.verifications.createUserInitiated({
  requestedFields: ["dni", "cuil", "firstName"]
});

console.log(verification.id);
console.log(verification.qrUrl);
```

Use the returned `qrUrl` to let the user continue the verification flow in AIDI.

Check its status:

```ts
const status = await aidi.verifications.getStatus(verification.id);

console.log(status.status);
console.log(status.resultAvailable);
```

Once the verification is approved and its result is available:

```ts
const result = await aidi.verifications.getResult(verification.id);

console.log(result.result.identityConfirmed);
console.log(result.result.subjectId);
console.log(result.result.claims);
```

## Authentication

Create a user-initiated authentication flow:

```ts
const authentication = await aidi.verifications.createUserInitiated({
  intent: "AUTHENTICATE",
  message: "Confirm your identity to sign in",
  requestedFields: ["cuil"],
  redirectUrl: "https://example.com/auth/callback",
  state: "abc123"
});
```

Poll the flow until the authentication exchange is ready:

```ts
const status = await aidi.verifications.getStatus(authentication.id);

if (status.exchangeReady && status.exchangeToken) {
  const result = await aidi.verifications.exchangeAuthentication(
    authentication.id,
    status.exchangeToken
  );

  console.log(result.authenticated);
  console.log(result.subjectId);
  console.log(result.claims);
}
```

The exchange must happen on your backend. Your application is responsible for creating its own session after receiving a successful AIDI authentication result.

If `redirectUrl` is present, AIDI can return the user to that URL after consent with `verificationId`, `status`, and `state` in the query string. Authentication still completes server-side with `exchangeAuthentication()`.

## Targeted Verification

Use a targeted verification when your backend already knows which AIDI user should approve the request:

```ts
const verification = await aidi.verifications.createTargeted({
  targetIdentifier: "bfcf1248-c1d0-4264-b8b8-e801c45ebed0",
  requestedFields: ["dni", "cuil", "firstName"]
});
```

## Concepts

AIDI separates what your application wants to do from how the user enters the flow.

### Intent

- `VERIFY`: verifies the user’s identity or requested information.
- `AUTHENTICATE`: authenticates the user and exchanges their approval for an assertion your backend can use.

### Initiation

- `USER_INITIATED`: the user enters the flow through a QR code, link, button, or deeplink.
- `TARGETED`: your backend already knows which AIDI user should receive the request.

### Requested fields

The SDK currently supports:

- `dni`
- `cuil`
- `firstName`

## Errors

The package exports typed errors:

- `AidiError`
- `AidiHttpError`
- `AidiTimeoutError`

```ts
import { AidiHttpError, createAidiClient } from "@aidihq/sdk";

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

## Documentation

For complete integration guides, API reference, and implementation details, visit the [AIDI documentation](https://docs.aidi.com.ar).

## Security

- Use the SDK only from trusted server-side environments.
- Never expose `AIDI_COMPANY_API_KEY` in frontend code.
- Do not log API keys, authentication exchange tokens, or sensitive verification results.

## License

MIT
