import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, TransactionSignature } from '@solana/web3.js';
import { getAnchorProvider } from './provider';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow importing json
import escrowIdl from '../idl/escrow.json';

export class EscrowClient {
  private readonly program: Program<Idl>;

  constructor(private readonly provider: AnchorProvider = getAnchorProvider()) {
    const programIdStr = process.env.ESCROW_PROGRAM_ID;
    if (!programIdStr) {
      // eslint-disable-next-line no-console
      console.warn('[EscrowClient] ESCROW_PROGRAM_ID not set. Using PublicKey.default');
    }
    const programId = programIdStr ? new PublicKey(programIdStr) : PublicKey.default;
    this.program = new Program(escrowIdl as Idl, programId, provider);
  }

  // Align to IDL method name. If your IDL uses a different instruction name
  // such as `releaseFromEscrow`, replace the method called below accordingly.
  async release(params: {
    escrow: PublicKey;
    seller: PublicKey;
    buyer: PublicKey;
  }): Promise<{ tx: TransactionSignature }> {
    // TODO(ACCOUNTS): Verify exact accounts and PDAs per your Anchor IDL/SDK
    const tx = await this.program.methods
      // @ts-expect-error: method existence depends on real IDL
      .release()
      .accounts({
        escrow: params.escrow,
        seller: params.seller,
        buyer: params.buyer,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ skipPreflight: true });

    return { tx };
  }
}

