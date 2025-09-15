import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - IDL JSON import
import ESCROW_IDL from '../idl/escrow.json';

export class EscrowClient {
  private program: Program;

  constructor(provider: AnchorProvider, programId: PublicKey = new PublicKey(process.env.ESCROW_PROGRAM_ID!)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.program = new Program(ESCROW_IDL as Idl, programId, provider);
  }

  /**
   * Releases funds from escrow. Returns the transaction signature.
   * TODO: Align accounts, seeds, and args exactly to the real IDL once available.
   */
  async releaseEscrow(orderPubkey: PublicKey): Promise<string> {
    // TODO: Replace with actual method name and accounts
    /*
    return await this.program.methods
      .release()
      .accounts({ /* ... * / })
      .rpc();
    */
    return 'MOCK_ESCROW_TX_SIG';
  }
}