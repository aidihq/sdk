# AIDI TypeScript SDK

![Version](https://img.shields.io/badge/version-0.1.0-black)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![Package](https://img.shields.io/badge/npm-%40aidi%2Fnode-CB3837)

Official AIDI SDK for Node.js and TypeScript.

This repository contains the publishable `@aidi/node` package, internal shared types, tests, and runnable examples for Node and Next.js.

## Why this SDK

- Strong TypeScript types for the current AIDI verification contract
- Clean server-side API built on native `fetch`
- DX-first inputs with `requestedFields`
- Internal HTTP client with centralized headers, timeouts, and typed errors
- Monorepo ready for future packages without over-engineering v0.1.0

## Quick Start

Install dependencies in this repository:

```bash
pnpm install
```

Basic usage:

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

Direct verification:

```ts
const verification = await aidi.verifications.createDirect({
  targetIdentifier: "bfcf1248-c1d0-4264-b8b8-e801c45ebed0",
  requestedFields: ["dni", "cuil", "firstName"]
});
```

## Public API

- `createAidiClient({ apiKey })`
- `aidi.verifications.create({ flowMode, requestedFields, ... })`
- `aidi.verifications.createQr({ requestedFields })`
- `aidi.verifications.createDirect({ targetIdentifier, requestedFields })`
- `aidi.verifications.getStatus(verificationId)`

## Repository Layout

```txt
examples/
  example-node/   Runnable Node example
  example-next/   Runnable Next.js example
packages/
  node/           Publishable SDK package: @aidi/node
  types/          Internal shared types for the monorepo
```

## Scripts

```bash
pnpm build
pnpm test
pnpm lint
pnpm dev
pnpm clean
```

## Examples

### Node Example

Create `examples/example-node/.env` from [examples/example-node/.env.example](C:/Users/ginos/Desktop/2026/AIDI/@aidi-sdk/examples/example-node/.env.example):

```env
AIDI_COMPANY_API_KEY=your_company_api_key
```

Run it:

```bash
pnpm --filter example-node dev
```

This example creates a QR verification and then fetches its status.

### Next.js Example

Create `examples/example-next/.env.local` from [examples/example-next/.env.local.example](C:/Users/ginos/Desktop/2026/AIDI/@aidi-sdk/examples/example-next/.env.local.example):

```env
AIDI_COMPANY_API_KEY=your_company_api_key
```

Run it:

```bash
pnpm --filter example-next dev
```

This example exposes a server-side route handler that calls AIDI and a page that displays the returned `qrUrl`.

## Security

- This SDK is server-side first
- Never expose `AIDI_COMPANY_API_KEY` in frontend code
