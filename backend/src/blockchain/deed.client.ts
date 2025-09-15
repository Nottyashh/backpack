import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAnchorProvider } from './provider';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deedIdl = require('../idl/deed.json');

type DeedIdl = Idl;

export class DeedClient {
  private readonly provider: AnchorProvider;
  private readonly program: Program<DeedIdl>;

  constructor(provider?: AnchorProvider) {
    this.provider = provider ?? getAnchorProvider();
    const programIdStr = process.env.DEED_PROGRAM_ID || deedIdl?.metadata?.address;
    if (!programIdStr) {
      throw new Error('DEED_PROGRAM_ID not set and IDL missing metadata.address');
    }
    const programId = new PublicKey(programIdStr);
    this.program = new Program<DeedIdl>(deedIdl as DeedIdl, programId, this.provider);
  }

  async mintFractions(params: {
    deedPda: PublicKey; // TODO: compute PDA seeds per real IDL
    fractionMint: PublicKey; // TODO
    fractionTreasury: PublicKey; // TODO
    quantity: number | string | BN;
  }): Promise<string> {
    const authority = (this.provider.wallet as any).payer.publicKey as PublicKey;
    const qty = params.quantity instanceof BN ? params.quantity : new BN(params.quantity);
    const tx = await this.program.methods
      .mintFractions(qty)
      .accounts({
        deed: params.deedPda,
        authority,
        fractionMint: params.fractionMint,
        fractionTreasury: params.fractionTreasury,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc();
    return tx as string;
  }
}

