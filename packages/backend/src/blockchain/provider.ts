import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import * as fs from 'fs';

export type NodeWallet = Wallet & { payer: Keypair };

export function loadNodeWallet(): NodeWallet {
  const walletPath = process.env.ANCHOR_WALLET;
  if (!walletPath || !fs.existsSync(walletPath)) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Anchor] ANCHOR_WALLET not set or missing. Using ephemeral in-memory keypair (dev/test only).',
    );
    const payer = Keypair.generate();
    const wallet = {
      payer,
      signTransaction: async (tx: any) => {
        tx.partialSign(payer);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach((tx) => tx.partialSign(payer));
        return txs;
      },
      publicKey: payer.publicKey,
    } as unknown as NodeWallet;
    return wallet;
  }
  const content = fs.readFileSync(walletPath, 'utf-8');
  const secret = JSON.parse(content) as number[];
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
  const wallet = {
    payer,
    signTransaction: async (tx: any) => {
      tx.partialSign(payer);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx) => tx.partialSign(payer));
      return txs;
    },
    publicKey: payer.publicKey,
  } as unknown as NodeWallet;
  return wallet;
}

export function getAnchorProvider(): AnchorProvider {
  const rpcUrl = process.env.SOLANA_RPC || clusterApiUrl('devnet');
  const connection = new Connection(rpcUrl, 'confirmed');
  const wallet = loadNodeWallet();
  return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

export { BN };

