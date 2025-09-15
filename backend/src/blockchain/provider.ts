import { AnchorProvider, NodeWallet, setProvider } from '@coral-xyz/anchor';
import { Connection, Keypair, Commitment } from '@solana/web3.js';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const RPC_ENDPOINT = process.env.SOLANA_RPC as string;
const WALLET_PATH = process.env.ANCHOR_WALLET as string;
const COMMITMENT: Commitment = 'confirmed';

function loadKeypair(): Keypair {
  const secret = JSON.parse(readFileSync(WALLET_PATH, 'utf-8')) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

const wallet = new NodeWallet(loadKeypair());
export const provider = new AnchorProvider(new Connection(RPC_ENDPOINT, COMMITMENT), wallet, { commitment: COMMITMENT });
setProvider(provider);