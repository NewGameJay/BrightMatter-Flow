/**
 * Flow Cadence Client
 * Handles blockchain interactions with proper server-side signing
 */
import * as fcl from "@onflow/fcl";
import { serverAuthorization } from "./signer";

/**
 * Run a script (read-only)
 */
export async function runScript<T = unknown>(cadence: string, args: any[] = []): Promise<T> {
  const res = await fcl.query({
    cadence,
    args: (arg, types) => args.length ? args : [],
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
  score: number
) {
  const cadence = `
    import CampaignEscrow from 0xCampaignEscrow
    import CreatorProfile from 0xCreatorProfile
    
    transaction(
        campaignId: String,
        creator: Address,
        score: UFix64,
        signer: Address
    ) {
        prepare(acct: AuthAccount) {
            let success = CampaignEscrow.updateCreatorScore(
                campaignId: campaignId,
                creator: creator,
                score: score,
                signer: signer
            )
            
            if !success {
                panic("Failed to update creator score")
            }
        }
    }
  `;
  
  return runTx({
    cadence,
    args: (arg, types) => [
      arg(campaignId, types.String),
      arg(creatorAddress, types.Address),
      arg(score.toString(), types.UFix64),
      arg(process.env.FLOW_ADDRESS || "14aca78d100d2001", types.Address),
    ],
  });
}

/**
 * Trigger campaign payout
 */
export async function triggerPayout(campaignId: string) {
  const cadence = `
    import CampaignEscrow from 0xCampaignEscrow
    
    transaction(campaignId: String, signer: Address) {
        prepare(acct: AuthAccount) {
            let success = CampaignEscrow.triggerPayout(
                campaignId: campaignId,
                signer: signer
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
      arg(process.env.FLOW_ADDRESS || "14aca78d100d2001", types.Address),
    ],
  });
}

/**
 * Trigger campaign refund
 */
export async function triggerRefund(campaignId: string) {
  const cadence = `
    import CampaignEscrow from 0xCampaignEscrow
    
    transaction(campaignId: String, signer: Address) {
        prepare(acct: AuthAccount) {
            let success = CampaignEscrow.triggerRefund(
                campaignId: campaignId,
                signer: signer
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
      arg(process.env.FLOW_ADDRESS || "14aca78d100d2001", types.Address),
    ],
  });
}

/**
 * Read campaign data
 */
export async function readCampaign(campaignId: string) {
  const cadence = `
    import CampaignEscrow from 0xCampaignEscrow
    
    access(all) fun main(campaignId: String): CampaignEscrow.Campaign? {
        return CampaignEscrow.getCampaign(id: campaignId)
    }
  `;
  
  return runScript(cadence, [
    (arg: any, t: any) => arg(campaignId, t.String)
  ]);
}
