# Changelog

## 0.2.0

### Changed

- Renamed the public verification model around `intent` and `initiation`.
- Replaced `LOGIN` with `AUTHENTICATE` for authentication flows.
- Replaced flow-oriented SDK helpers with product-oriented helpers:
  - `createUserInitiated(...)`
  - `createTargeted(...)`
  - `exchangeAuthentication(...)`
- Aligned the SDK request payload with the backend API contract: the SDK now sends `initiation` directly instead of translating to `flowMode`.
- Updated README examples and runnable examples to use the new API surface.

### Removed

- Removed the old public helpers:
  - `createQr(...)`
  - `createDirect(...)`
  - `exchangeLogin(...)`
- Removed old HTTP-facing SDK types for `LOGIN`, `DIRECT`, and `QR`.

## 0.1.0

### Added

- Initial Node.js SDK package with typed verification helpers, native `fetch`, centralized headers, typed errors, and Node/Next.js examples.
