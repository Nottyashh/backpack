import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAnchorProvider } from './provider';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const escrowIdl = require('../idl/escrow.json');

type EscrowIdl = Idl;

export class EscrowClient {
  private readonly provider: AnchorProvider;
  private readonly program: Program<EscrowIdl>;

  constructor(provider?: AnchorProvider) {
    this.provider = provider ?? getAnchorProvider();
    const programIdStr = process.env.ESCROW_PROGRAM_ID || escrowIdl?.metadata?.address;
    if (!programIdStr) {
      throw new Error('ESCROW_PROGRAM_ID not set and IDL missing metadata.address');
    }
    const programId = new PublicKey(programIdStr);
    this.program = new Program<EscrowIdl>(escrowIdl as EscrowIdl, programId, this.provider);
  }

  // Align to actual IDL method name. Placeholder uses `release`.
  async release(params: {
    escrowPda: PublicKey; // TODO: compute PDA with real seeds
    receiver: PublicKey;
  }): Promise<string> {
    const payer = (this.provider.wallet as any).payer.publicKey as PublicKey;
    const tx = await this.program.methods
      // TODO: if real method differs (e.g., releaseFromEscrow), rename here
      .release()
      .accounts({
        escrow: params.escrowPda,
        payer,
        receiver: params.receiver,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return tx as string;
  }
}

