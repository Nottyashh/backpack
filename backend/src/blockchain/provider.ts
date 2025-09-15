import { AnchorProvider, BN, Idl, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import * as fs from 'fs';

// NodeWallet compatible minimal wrapper
class NodeWallet implements Wallet {
  public payer: Keypair;
  public publicKey: any;
  constructor(payer: Keypair) {
    this.payer = payer;
    this.publicKey = payer.publicKey;
  }
  signTransaction = async (tx: any) => {
    tx.partialSign(this.payer);
    return tx;
  };
  signAllTransactions = async (txs: any[]) => {
    txs.forEach((tx) => tx.partialSign(this.payer));
    return txs;
  };
}

export function getAnchorProvider(): AnchorProvider {
  const rpcUrl = process.env.SOLANA_RPC || clusterApiUrl('devnet');
  const walletPath = process.env.ANCHOR_WALLET;
  if (!walletPath) {
    // In CI or missing, generate ephemeral
    const payer = Keypair.generate();
    const connection = new Connection(rpcUrl, 'confirmed');
    const wallet = new NodeWallet(payer);
    return new AnchorProvider(connection, wallet as unknown as Wallet, {
      commitment: 'confirmed',
    });
  }
  const secret = JSON.parse(fs.readFileSync(walletPath, 'utf-8')) as number[];
  const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
  const connection = new Connection(rpcUrl, 'confirmed');
  const wallet = new NodeWallet(payer);
  return new AnchorProvider(connection, wallet as unknown as Wallet, {
    commitment: 'confirmed',
  });
}

export type AnchorProgram<T extends Idl> = Program<T>;
export { BN };

