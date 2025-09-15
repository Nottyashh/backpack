import { Injectable } from '@nestjs/common';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { BlockchainProvider } from './provider';
import * as escrowIdl from '../idl/escrow.json';

export interface EscrowReleaseParams {
  escrowAddress: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
}

@Injectable()
export class EscrowClient {
  private program: Program;

  constructor(private blockchainProvider: BlockchainProvider) {
    this.initializeProgram();
  }

  private initializeProgram() {
    const programId = new PublicKey(this.blockchainProvider.getEscrowProgramId());
    this.program = new Program(
      escrowIdl as any,
      programId,
      this.blockchainProvider.provider
    );
  }

  /**
   * Release funds from escrow to complete a real estate transaction
   * TODO: Adjust account derivation and PDA seeds based on actual escrow program implementation
   */
  async releaseFromEscrow(params: EscrowReleaseParams): Promise<string> {
    try {
      const { escrowAddress, buyerAddress, sellerAddress, amount } = params;

      // Convert addresses to PublicKeys
      const escrowPubkey = new PublicKey(escrowAddress);
      const buyerPubkey = new PublicKey(buyerAddress);
      const sellerPubkey = new PublicKey(sellerAddress);
      const authorityPubkey = this.blockchainProvider.wallet.publicKey;

      // TODO: Adjust these accounts based on actual program requirements
      // The actual escrow program may require additional accounts like:
      // - escrowTokenAccount
      // - buyerTokenAccount
      // - sellerTokenAccount
      // - mint
      const accounts = {
        escrow: escrowPubkey,
        buyer: buyerPubkey,
        seller: sellerPubkey,
        authority: authorityPubkey,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      };

      // Execute the release instruction
      const signature = await this.program.methods
        .releaseFromEscrow(amount)
        .accounts(accounts)
        .rpc();

      console.log('Escrow release transaction signature:', signature);
      return signature;

    } catch (error) {
      console.error('Error releasing from escrow:', error);
      throw new Error(`Failed to release escrow: ${error.message}`);
    }
  }

  /**
   * Get escrow account info
   * TODO: Implement based on actual escrow program structure
   */
  async getEscrowInfo(escrowAddress: string) {
    try {
      const escrowPubkey = new PublicKey(escrowAddress);
      const escrowAccount = await this.program.account.escrow.fetch(escrowPubkey);
      return escrowAccount;
    } catch (error) {
      console.error('Error fetching escrow info:', error);
      throw new Error(`Failed to fetch escrow info: ${error.message}`);
    }
  }

  /**
   * Derive escrow PDA (Program Derived Address)
   * TODO: Update seeds based on actual escrow program implementation
   */
  async deriveEscrowPda(buyer: string, seller: string, seed?: string): Promise<[PublicKey, number]> {
    const seeds = [
      Buffer.from('escrow'),
      new PublicKey(buyer).toBuffer(),
      new PublicKey(seller).toBuffer(),
    ];

    if (seed) {
      seeds.push(Buffer.from(seed));
    }

    return PublicKey.findProgramAddressSync(
      seeds,
      this.program.programId
    );
  }
}