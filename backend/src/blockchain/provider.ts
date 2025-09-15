import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * NodeWallet implementation for server-side Anchor operations
 */
export class NodeWallet implements Wallet {
  constructor(private _payer: Keypair) {}

  get publicKey() {
    return this._payer.publicKey;
  }

  async signTransaction(tx: any) {
    tx.partialSign(this._payer);
    return tx;
  }

  async signAllTransactions(txs: any[]) {
    return txs.map((t) => {
      t.partialSign(this._payer);
      return t;
    });
  }

  get payer(): Keypair {
    return this._payer;
  }
}

@Injectable()
export class BlockchainProvider {
  private _connection: Connection;
  private _provider: AnchorProvider;
  private _wallet: NodeWallet;

  constructor(private configService: ConfigService) {
    this.initializeProvider();
  }

  private initializeProvider() {
    // Initialize Solana connection
    const rpcUrl = this.configService.get<string>('SOLANA_RPC');
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC environment variable is required');
    }
    
    this._connection = new Connection(rpcUrl, 'confirmed');

    // Load wallet from file
    const walletPath = this.configService.get<string>('ANCHOR_WALLET');
    if (!walletPath) {
      throw new Error('ANCHOR_WALLET environment variable is required');
    }

    try {
      const keypairData = JSON.parse(readFileSync(walletPath, 'utf8'));
      const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
      this._wallet = new NodeWallet(keypair);
    } catch (error) {
      throw new Error(`Failed to load wallet from ${walletPath}: ${error.message}`);
    }

    // Initialize Anchor provider
    this._provider = new AnchorProvider(
      this._connection,
      this._wallet,
      AnchorProvider.defaultOptions()
    );
  }

  get connection(): Connection {
    return this._connection;
  }

  get provider(): AnchorProvider {
    return this._provider;
  }

  get wallet(): NodeWallet {
    return this._wallet;
  }

  /**
   * Get program IDs from environment
   */
  getEscrowProgramId(): string {
    const programId = this.configService.get<string>('ESCROW_PROGRAM_ID');
    if (!programId) {
      throw new Error('ESCROW_PROGRAM_ID environment variable is required');
    }
    return programId;
  }

  getDeedProgramId(): string {
    const programId = this.configService.get<string>('DEED_PROGRAM_ID');
    if (!programId) {
      throw new Error('DEED_PROGRAM_ID environment variable is required');
    }
    return programId;
  }

  getUsdcMint(): string {
    const mint = this.configService.get<string>('USDC_MINT');
    if (!mint) {
      throw new Error('USDC_MINT environment variable is required');
    }
    return mint;
  }

  getSpvTreasury(): string {
    const treasury = this.configService.get<string>('SPV_TREASURY');
    if (!treasury) {
      throw new Error('SPV_TREASURY environment variable is required');
    }
    return treasury;
  }
}