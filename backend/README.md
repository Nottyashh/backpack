# Deedify Backend

NestJS backend for the Deedify tokenized real estate platform with Solana blockchain integration.

## Features

- **Orders Management**: Create PENDING orders and process fiat payment webhooks
- **Blockchain Integration**: Solana/Anchor programs for escrow and deed token minting
- **Database**: Prisma with PostgreSQL for data persistence
- **API Documentation**: Swagger/OpenAPI documentation
- **E2E Testing**: Comprehensive test suite

## Prerequisites

- Node.js 20.10.0+
- PostgreSQL database
- Solana CLI tools
- Anchor framework

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Solana Configuration
SOLANA_RPC=https://devnet.helius-rpc.com/?api-key=11d1056e-2fdc-43bc-a985-c649236d3af1
ANCHOR_WALLET=/Users/yashpatil/.config/solana/unruggable/unruggable.json

# Program IDs (Replace with actual deployed program IDs)
ESCROW_PROGRAM_ID=11111111111111111111111111111111
DEED_PROGRAM_ID=22222222222222222222222222222222
USDC_MINT=33333333333333333333333333333333
SPV_TREASURY=44444444444444444444444444444444

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/deedify?schema=public"

# API URLs
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_URL=http://localhost:8000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## API Endpoints

### Orders

- `POST /orders` - Create a new PENDING order
- `POST /orders/fiat/webhook` - Process fiat payment webhook
- `GET /orders/user/:userId` - Get all orders for a user
- `GET /orders/:orderId` - Get order by ID

### Documentation

- `GET /api` - Swagger API documentation

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Schema

The application uses the following Prisma models:

- **Profile**: User profiles with wallet addresses
- **Listing**: Real estate listings with pricing and supply
- **Order**: Purchase orders with status tracking
- **Transaction**: Blockchain transaction records
- **Holding**: User token holdings per listing

## Blockchain Integration

### IDL Files

Place your Anchor program IDLs in `src/idl/`:
- `escrow.json` - Escrow program IDL
- `deed.json` - Deed token program IDL

### TODO Items

1. **Replace IDL placeholders**: Update `src/idl/escrow.json` and `src/idl/deed.json` with actual program IDLs
2. **Update PDA seeds**: Modify PDA derivation in blockchain clients to match your program
3. **Implement ATA derivation**: Use proper Associated Token Account derivation
4. **Add authentication**: Implement JWT guards for protected endpoints
5. **Add error handling**: Enhance error handling for blockchain operations

## Development Notes

- The blockchain clients currently use mock transaction hashes for testing
- RLS (Row Level Security) is assumed to be handled at the database level
- Authentication guards are marked with TODO comments
- All blockchain operations include proper error handling and logging