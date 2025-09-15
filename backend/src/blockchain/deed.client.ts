import { Injectable } from '@nestjs/common';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { BlockchainProvider } from './provider';
import * as deedIdl from '../idl/deed.json';

export interface MintFractionsParams {
  recipientAddress: string;
  quantity: number;
  listingId: string;
}

@Injectable()
export class DeedClient {
  private program: Program;

  constructor(private blockchainProvider: BlockchainProvider) {
    this.initializeProgram();
  }

  private initializeProgram() {
    const programId = new PublicKey(this.blockchainProvider.getDeedProgramId());
    this.program = new Program(
      deedIdl as any,
      programId,
      this.blockchainProvider.provider
    );
  }

  /**
   * Mint fractional ownership tokens for a real estate property
   * TODO: Adjust account derivation and PDA seeds based on actual deed program implementation
   */
  async mintFractions(params: MintFractionsParams): Promise<string> {
    try {
      const { recipientAddress, quantity, listingId } = params;

      // Convert addresses to PublicKeys
      const recipientPubkey = new PublicKey(recipientAddress);
      const authorityPubkey = this.blockchainProvider.wallet.publicKey;

      // TODO: Derive the mint address based on actual program logic
      // This might be a PDA derived from the listing ID or property identifier
      const [mintPda, mintBump] = await this.deriveMintPda(listingId);

      // Get or create associated token account for recipient
      const recipientTokenAccount = getAssociatedTokenAddressSync(
        mintPda,
        recipientPubkey
      );

      // TODO: Adjust these accounts based on actual program requirements
      // The actual deed program may require additional accounts like:
      // - deedMetadata
      // - propertyRegistry
      // - treasuryAccount
      const accounts = {
        mint: mintPda,
        tokenAccount: recipientTokenAccount,
        authority: authorityPubkey,
        recipient: recipientPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };

      // Execute the mint instruction
      const signature = await this.program.methods
        .mintFractions(quantity)
        .accounts(accounts)
        .rpc();

      console.log('Deed fractions mint transaction signature:', signature);
      return signature;

    } catch (error) {
      console.error('Error minting deed fractions:', error);
      throw new Error(`Failed to mint deed fractions: ${error.message}`);
    }
  }

  /**
   * Get mint info for a property
   * TODO: Implement based on actual deed program structure
   */
  async getMintInfo(listingId: string) {
    try {
      const [mintPda] = await this.deriveMintPda(listingId);
      const mintAccount = await this.program.account.deedMint.fetch(mintPda);
      return mintAccount;
    } catch (error) {
      console.error('Error fetching mint info:', error);
      throw new Error(`Failed to fetch mint info: ${error.message}`);
    }
  }

  /**
   * Derive mint PDA (Program Derived Address) for a property
   * TODO: Update seeds based on actual deed program implementation
   */
  async deriveMintPda(listingId: string): Promise<[PublicKey, number]> {
    const seeds = [
      Buffer.from('deed_mint'),
      Buffer.from(listingId),
    ];

    return PublicKey.findProgramAddressSync(
      seeds,
      this.program.programId
    );
  }

  /**
   * Get token balance for a user and property
   */
  async getTokenBalance(userAddress: string, listingId: string): Promise<number> {
    try {
      const userPubkey = new PublicKey(userAddress);
      const [mintPda] = await this.deriveMintPda(listingId);
      
      const tokenAccount = getAssociatedTokenAddressSync(mintPda, userPubkey);
      const connection = this.blockchainProvider.connection;
      
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  /**
   * Create a new property mint
   * TODO: Implement based on actual deed program requirements
   */
  async createPropertyMint(listingId: string, totalSupply: number): Promise<string> {
    try {
      const authorityPubkey = this.blockchainProvider.wallet.publicKey;
      const [mintPda, mintBump] = await this.deriveMintPda(listingId);

      // TODO: Add actual create mint instruction based on deed program
      // This is a placeholder implementation
      const signature = await this.program.methods
        .createMint(totalSupply, mintBump)
        .accounts({
          mint: mintPda,
          authority: authorityPubkey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('Property mint creation signature:', signature);
      return signature;

    } catch (error) {
      console.error('Error creating property mint:', error);
      throw new Error(`Failed to create property mint: ${error.message}`);
    }
  }
}