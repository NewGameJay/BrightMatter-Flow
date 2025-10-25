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
  score: number,
  postId: string,
  timestamp: number
) {
  const cadence = `
    import CampaignEscrow from 0x14aca78d100d2001
    import CreatorProfile from 0x14aca78d100d2001

    transaction(
        campaignId: String,
        creator: Address,
        postId: String,
        score: UFix64,
        timestamp: UFix64,
        oracleSignerAddr: Address
    ) {
        let profileRef: &CreatorProfile.Profile{CreatorProfile.ProfileOracleReceiver}?

        prepare(signer: auth(Storage, SaveValue, BorrowValue) &Account) {
            // 1) Update score in CampaignEscrow
            let ok = CampaignEscrow.updateCreatorScore(
                campaignId: campaignId,
                creator: creator,
                score: score,
                signer: oracleSignerAddr
            )
            assert(ok, message: "updateCreatorScore failed")

            // 2) Create the proof resource
            let proof <- CreatorProfile.createProof(
                postId: postId,
                score: score,
                timestamp: timestamp,
                campaignId: campaignId
            )

            // 3) Borrow creator's Profile via public capability
            let cap = getAccount(creator)
                .getCapability<&CreatorProfile.Profile{CreatorProfile.ProfileOracleReceiver}>(
                    /public/CreatorProfileReceiver
                )

            self.profileRef = cap.borrow()
            assert(self.profileRef != nil, message: "Profile capability unavailable")

            // 4) Add proof to the profile (oracle-authorized)
            self.profileRef!.addProof(<-proof, oracleAddress: oracleSignerAddr)
        }

        execute {}
    }
  `;
  
  return runTx({
    cadence,
    args: (arg, types) => [
      arg(campaignId, types.String),
      arg(creatorAddress, types.Address),
      arg(postId, types.String),
      arg(score.toFixed(2), types.UFix64),
      arg(timestamp.toFixed(2), types.UFix64),
      arg(process.env.FLOW_ADDRESS || "14aca78d100d2001", types.Address),
    ],
  });
}

/**
 * Trigger campaign payout
 */
export async function triggerPayout(campaignId: string) {
  const cadence = `
    import CampaignEscrow from 0x14aca78d100d2001
    
    transaction(campaignId: String, signer: Address) {
        prepare(signer: auth(Storage, SaveValue, BorrowValue) &Account) {
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
    import CampaignEscrow from 0x14aca78d100d2001
    
    transaction(campaignId: String, signer: Address) {
        prepare(signer: auth(Storage, SaveValue, BorrowValue) &Account) {
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
