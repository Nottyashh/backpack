import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { provider, ESCROW_PROGRAM_ID } from './provider';
import escrowIdl from '../idl/escrow.json';

// Initialize the escrow program
const program = new Program(escrowIdl as any, ESCROW_PROGRAM_ID, provider);

export class EscrowClient {
  /**
   * Release funds from escrow
   * @param escrowPda - The escrow PDA
   * @param recipient - The recipient of the funds
   * @param amount - Amount to release
   * @returns Transaction signature
   */
  static async release(
    escrowPda: PublicKey,
    recipient: PublicKey,
    amount: number
  ): Promise<string> {
    try {
      // TODO: Replace with actual PDA derivation logic
      // const [escrowPda] = await PublicKey.findProgramAddress(
      //   [Buffer.from('escrow'), authority.toBuffer()],
      //   ESCROW_PROGRAM_ID
      // );

      const transaction = await program.methods
        .release(amount)
        .accounts({
          escrow: escrowPda,
          authority: provider.wallet.publicKey,
          recipient: recipient,
          tokenMint: new PublicKey(process.env.USDC_MINT || '33333333333333333333333333333333'),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return transaction;
    } catch (error) {
      console.error('Error releasing from escrow:', error);
      throw new Error(`Failed to release from escrow: ${error.message}`);
    }
  }

  /**
   * Get escrow account info
   * @param escrowPda - The escrow PDA
   * @returns Escrow account data
   */
  static async getEscrowInfo(escrowPda: PublicKey) {
    try {
      const escrowAccount = await program.account.escrow.fetch(escrowPda);
      return escrowAccount;
    } catch (error) {
      console.error('Error fetching escrow info:', error);
      throw new Error(`Failed to fetch escrow info: ${error.message}`);
    }
  }
}