# Deedify Backend

Tokenized real-estate platform backend built with NestJS, Prisma, and Solana.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Solana CLI tools
- Anchor framework

## Environment Variables

Copy `.env` and update the values:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/deedify?schema=public"

# Solana Configuration
SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=11d1056e-2fdc-43bc-a985-c649236d3af1
ANCHOR_WALLET=/Users/yashpatil/.config/solana/unruggable/unruggable.json

# Program IDs (TODO: Replace with actual deployed program IDs)
ESCROW_PROGRAM_ID=11111111111111111111111111111111
DEED_PROGRAM_ID=22222222222222222222222222222222
USDC_MINT=33333333333333333333333333333333
SPV_TREASURY=44444444444444444444444444444444

# API URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:8000
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Push database schema:
```bash
npm run prisma:push
```

4. Start the development server:
```bash
npm run start:dev
```

## API Endpoints

- `POST /orders` - Create a new PENDING order
- `POST /orders/fiat/webhook` - Process fiat payment webhook
- `GET /orders/user/:userId` - Get orders for a user
- `GET /orders/:id` - Get order by ID
- `GET /api` - Swagger documentation

## Testing

Run e2e tests:
```bash
npm run test:e2e
```

## Important TODOs

1. **IDL Files**: Replace placeholder IDLs in `src/idl/` with actual deployed program IDLs
2. **PDA Derivation**: Update PDA derivation logic in blockchain clients
3. **Authentication**: Add JWT authentication guards
4. **Webhook Security**: Add webhook signature verification
5. **Error Handling**: Enhance error handling for blockchain operations
6. **Price Calculation**: Implement actual price per share calculation

## Blockchain Integration

The backend integrates with two Solana programs:
- **Escrow Program**: Handles fund escrow and release
- **Deed Program**: Mints property fractions as tokens

Both programs use placeholder IDLs that need to be replaced with actual deployed program interfaces.