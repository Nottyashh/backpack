import { AnchorProvider, NodeWallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

// Load wallet from file
const loadWallet = (): Keypair => {
  const walletPath = process.env.ANCHOR_WALLET;
  if (!walletPath) {
    throw new Error('ANCHOR_WALLET environment variable is not set');
  }
  
  const walletData = fs.readFileSync(walletPath, 'utf8');
  const secretKey = JSON.parse(walletData);
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

// Create connection and provider
const connection = new Connection(process.env.SOLANA_RPC || 'https://api.devnet.solana.com');
const wallet = loadWallet();
const provider = new AnchorProvider(connection, new NodeWallet(wallet), {
  commitment: 'confirmed',
});

// Program IDs
export const ESCROW_PROGRAM_ID = new PublicKey(process.env.ESCROW_PROGRAM_ID || '11111111111111111111111111111111');
export const DEED_PROGRAM_ID = new PublicKey(process.env.DEED_PROGRAM_ID || '22222222222222222222222222222222');
export const USDC_MINT = new PublicKey(process.env.USDC_MINT || '33333333333333333333333333333333');
export const SPV_TREASURY = new PublicKey(process.env.SPV_TREASURY || '44444444444444444444444444444444');

export { provider, connection, wallet };