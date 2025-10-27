/**
 * Flow Cadence Client
 * Handles blockchain interactions with proper server-side signing
 */
import * as fcl from "@onflow/fcl";
import { serverAuthorization } from "./signer";

/**
 * Run a script (read-only)
 */
export async function runScript<T = unknown>(cadence: string, argsFn?: (arg: any, types: any) => any[]): Promise<T> {
  const res = await fcl.query({
    cadence,
    args: argsFn ?? ((arg, types) => []),
  });
  return res as T;
}

type MutateOpts = {
  cadence: string;
  args?: (arg: any, types: any) => any[];
  limit?: number;
};

/**
 * Run a transaction (write)
 */
export async function runTx({ cadence, args, limit = 9999 }: MutateOpts) {
  const txId = await fcl.mutate({
    cadence,
    args: args ?? ((arg, types) => []),
    proposer: serverAuthorization,
    payer: serverAuthorization,
    authorizations: [serverAuthorization],
    limit,
  });

  // Wait for seal
  const sealed = await fcl.tx(txId).onceSealed();
  return { txId, sealed };
}

/**
 * Update creator score in campaign
 */
export async function updateCreatorScore(
  campaignId: string,
  creatorAddress: string,
  score: number,
  postId: string,
  timestamp: number
) {
  const cadence = `
    import CampaignEscrowV2 from 0x14aca78d100d2001
    import CreatorProfileV2 from 0x14aca78d100d2001

    transaction(
        campaignId: String,
        creator: Address,
        postId: String,
        score: UFix64,
        timestamp: UFix64
    ) {
        prepare(signer: &Account) {
            let signerAddr = signer.address
            
            let ok = CampaignEscrowV2.updateCreatorScore(
                campaignId: campaignId,
                creator: creator,
                score: score,
                signer: signerAddr
            )
            assert(ok, message: "updateCreatorScore failed")

            CreatorProfileV2.addProofFor(
                creator: creator,
                postId: postId,
                score: score,
                timestamp: timestamp,
                campaignId: campaignId,
                signer: signerAddr
            )
        }
    }
  `;
  
  const creatorAddr = fcl.withPrefix(creatorAddress);
  
  return runTx({
    cadence,
    args: (arg, types) => [
      arg(campaignId, types.String),
      arg(creatorAddr, types.Address),
      arg(postId, types.String),
      arg(score.toFixed(2), types.UFix64),
      arg(timestamp.toFixed(2), types.UFix64),
    ],
  });
}

/**
 * Trigger campaign payout
 */
export async function triggerPayout(campaignId: string) {
  const cadence = `
    import CampaignEscrowV2 from 0x14aca78d100d2001
    
    transaction(campaignId: String) {
        prepare(signer: &Account) {
            let success = CampaignEscrowV2.triggerPayout(
                campaignId: campaignId,
                signer: signer.address
            )
            
            if !success {
                panic("Failed to trigger payout")
            }
        }
    }
  `;
  
  return runTx({
    cadence,
    args: (arg, types) => [
      arg(campaignId, types.String),
    ],
  });
}

/**
 * Trigger campaign refund
 */
export async function triggerRefund(campaignId: string) {
  const cadence = `
    import CampaignEscrowV2 from 0x14aca78d100d2001
    
    transaction(campaignId: String) {
        prepare(signer: &Account) {
            let success = CampaignEscrowV2.triggerRefund(
                campaignId: campaignId,
                signer: signer.address
            )
            
            if !success {
                panic("Failed to trigger refund")
            }
        }
    }
  `;
  
  return runTx({
    cadence,
    args: (arg, types) => [
      arg(campaignId, types.String),
    ],
  });
}

/**
 * Read campaign data
 */
export async function readCampaign(campaignId: string) {
  const cadence = `
    import CampaignEscrowV2 from 0x14aca78d100d2001
    
    access(all) fun main(campaignId: String): CampaignEscrowV2.Campaign? {
        return CampaignEscrowV2.getCampaign(id: campaignId)
    }
  `;
  
  return runScript(cadence, (arg: any, t: any) => [arg(campaignId, t.String)]);
}

/**
 * Get campaigns by creator
 */
export async function getCampaignsByCreator(creatorAddress: string) {
  const cadence = `
    import CampaignEscrowV2 from 0x14aca78d100d2001
    
    access(all) fun main(creator: Address): [CampaignEscrowV2.Campaign] {
        return CampaignEscrowV2.getCampaignsByCreator(creator: creator)
    }
  `;
  
  const creatorAddr = fcl.withPrefix(creatorAddress);
  return runScript(cadence, (arg: any, t: any) => [arg(creatorAddr, t.Address)]);
}
