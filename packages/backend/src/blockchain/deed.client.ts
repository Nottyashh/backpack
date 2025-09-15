import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAnchorProvider } from './provider';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing json
import deedIdl from '../idl/deed.json';

export class DeedClient {
  private readonly program: Program<Idl>;

  constructor(private readonly provider: AnchorProvider = getAnchorProvider()) {
    const programIdStr = process.env.DEED_PROGRAM_ID;
    if (!programIdStr) {
      // eslint-disable-next-line no-console
      console.warn('[DeedClient] DEED_PROGRAM_ID not set. Using PublicKey.default');
    }
    const programId = programIdStr ? new PublicKey(programIdStr) : PublicKey.default;
    this.program = new Program(deedIdl as Idl, programId, provider);
  }

  // Aligns with IDL instruction name `mintFractions`. If your IDL differs,
  // rename the call accordingly and adjust accounts.
  async mintFractions(params: {
    deed: PublicKey;
    mint: PublicKey;
    authority: PublicKey;
    quantity: number | string | BN;
  }): Promise<{ tx: string }> {
    const quantity = new BN(params.quantity.toString());
    const tx = await this.program.methods
      // @ts-expect-error: method existence depends on real IDL
      .mintFractions(quantity)
      .accounts({
        deed: params.deed,
        mint: params.mint,
        authority: params.authority,
        // TODO(ACCOUNTS): Confirm tokenProgram + any token accounts/spec PDAs
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc({ skipPreflight: true });
    return { tx };
  }
}

