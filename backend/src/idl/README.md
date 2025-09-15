Paste real Anchor IDLs here by replacing the JSON files:

- Replace `escrow.json` with the full IDL for `ESCROW_PROGRAM_ID`.
- Replace `deed.json` with the full IDL for `DEED_PROGRAM_ID`.

Exact lines to replace:

- File: `src/idl/escrow.json` -> replace the entire file contents with the real IDL JSON.
- File: `src/idl/deed.json` -> replace the entire file contents with the real IDL JSON.

After replacing, ensure accounts and instruction names in:

- `src/blockchain/escrow.client.ts`
- `src/blockchain/deed.client.ts`

are updated to match your IDL exactly (method names, account names, PDA seeds).

