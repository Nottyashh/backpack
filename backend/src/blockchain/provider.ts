import { AnchorProvider, NodeWallet } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Solana blockchain provider configuration
 * Creates AnchorProvider with NodeWallet from ANCHOR_WALLET file
 */
export class BlockchainProvider {
  private static instance: AnchorProvider;
  private static connection: Connection;

  /**
   * Get singleton instance of AnchorProvider
   */
  static getInstance(): AnchorProvider {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance;
  }

  /**
   * Get singleton instance of Connection
   */
  static getConnection(): Connection {
    if (!this.connection) {
      this.initialize();
    }
    return this.connection;
  }

  /**
   * Initialize provider and connection
   */
  private static initialize(): void {
    const rpcUrl = process.env.SOLANA_RPC;
    const walletPath = process.env.ANCHOR_WALLET;

    if (!rpcUrl) {
      throw new Error('SOLANA_RPC environment variable is required');
    }

    if (!walletPath) {
      throw new Error('ANCHOR_WALLET environment variable is required');
    }

    // Create connection
    this.connection = new Connection(rpcUrl, 'confirmed');

    try {
      // Load wallet from file
      const walletKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(readFileSync(walletPath, 'utf8')))
      );

      // Create NodeWallet
      const wallet = new NodeWallet(walletKeypair);

      // Create AnchorProvider
      this.instance = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });
    } catch (error) {
      throw new Error(`Failed to load wallet from ${walletPath}: ${error.message}`);
    }
  }

  /**
   * Get program IDs from environment
   */
  static getProgramIds() {
    return {
      escrow: new PublicKey(process.env.ESCROW_PROGRAM_ID || '11111111111111111111111111111111'),
      deed: new PublicKey(process.env.DEED_PROGRAM_ID || '22222222222222222222222222222222'),
      usdcMint: new PublicKey(process.env.USDC_MINT || '33333333333333333333333333333333'),
      spvTreasury: new PublicKey(process.env.SPV_TREASURY || '44444444444444444444444444444444'),
    };
  }
}