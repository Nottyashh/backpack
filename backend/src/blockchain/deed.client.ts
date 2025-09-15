import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - IDL JSON import
import DEED_IDL from '../idl/deed.json';

export class DeedClient {
  private program: Program;

  constructor(provider: AnchorProvider, programId: PublicKey = new PublicKey(process.env.DEED_PROGRAM_ID!)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.program = new Program(DEED_IDL as Idl, programId, provider);
  }

  /**
   * Mints fractions to the buyer. Returns the transaction signature.
   * TODO: Align method and accounts to real IDL.
   */
  async mintFractions(quantity: number, buyer: PublicKey): Promise<string> {
    // TODO: implement via this.program.methods.mintFractions(...)
    return 'MOCK_DEED_TX_SIG';
  }
}