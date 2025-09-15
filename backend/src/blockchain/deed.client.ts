import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { provider, DEED_PROGRAM_ID } from './provider';
import deedIdl from '../idl/deed.json';

// Initialize the deed program
const program = new Program(deedIdl as any, DEED_PROGRAM_ID, provider);

export class DeedClient {
  /**
   * Mint fractions for a property
   * @param deedPda - The deed PDA
   * @param recipient - The recipient of the fractions
   * @param quantity - Number of fractions to mint
   * @returns Transaction signature
   */
  static async mintFractions(
    deedPda: PublicKey,
    recipient: PublicKey,
    quantity: number
  ): Promise<string> {
    try {
      // TODO: Replace with actual PDA derivation logic
      // const [deedPda] = await PublicKey.findProgramAddress(
      //   [Buffer.from('deed'), listingId.toBuffer()],
      //   DEED_PROGRAM_ID
      // );

      const transaction = await program.methods
        .mintFractions(quantity)
        .accounts({
          deed: deedPda,
          authority: provider.wallet.publicKey,
          recipient: recipient,
          tokenMint: new PublicKey(process.env.USDC_MINT || '33333333333333333333333333333333'),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return transaction;
    } catch (error) {
      console.error('Error minting fractions:', error);
      throw new Error(`Failed to mint fractions: ${error.message}`);
    }
  }

  /**
   * Get deed account info
   * @param deedPda - The deed PDA
   * @returns Deed account data
   */
  static async getDeedInfo(deedPda: PublicKey) {
    try {
      const deedAccount = await program.account.deed.fetch(deedPda);
      return deedAccount;
    } catch (error) {
      console.error('Error fetching deed info:', error);
      throw new Error(`Failed to fetch deed info: ${error.message}`);
    }
  }
}