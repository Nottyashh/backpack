# Deedify Backend (NestJS)

## How to Trigger (no terminal)

Use the provided `deedify.http` file inside this directory. If your editor supports the REST client plugin (VS Code REST Client or JetBrains HTTP client), you can simply click **Send Request** on the queries:

1. Create a pending order.
2. Simulate the fiat webhook to complete the order.

Update environment variables in a `.env` file at the project root or export them in your shell as per `src/blockchain/provider.ts` requirements.