/**
 * Flow Cadence Client
 * 
 * Handles all Flow blockchain interactions
 * Signs transactions with oracle private key
 */
import * as fcl from "@onflow/fcl";
import * as sdk from "@onflow/sdk";
export class CadenceClient {
    private oracleAddress: string;
    private oraclePrivateKey: string;
    
    constructor(oracleAddress: string, oraclePrivateKey: string) {
        this.oracleAddress = oracleAddress;
        this.oraclePrivateKey = oraclePrivateKey;
        
        // Configure FCL for mainnet
        fcl.config({
            "accessNode.api": "https://access.mainnet.nodes.onflow.org:9000",
            "0xCreatorProfile": "0x14aca78d100d2001",
            "0xCampaignEscrow": "0x14aca78d100d2001",
            "0xFlowToken": "0x1654653399040a61"
        });
        
        console.log(`🔧 [CADENCE_CLIENT] Initialized with mainnet configuration`, {
            oracleAddress: this.oracleAddress,
            accessNode: "https://access.mainnet.nodes.onflow.org:9000"
        });
    }
    
    /**
     * Update creator score in campaign
     */
    public async updateCreatorScore(
        campaignId: string,
        creatorAddress: string,
        score: number
    ): Promise<string> {
        try {
            console.log(`⛓️ [CADENCE_CLIENT] Starting creator score update`, {
                campaignId,
                creatorAddress,
                score,
                oracleAddress: this.oracleAddress
            });
            
            const transaction = await fcl.send([
                fcl.transaction`
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
                            
                            if let profile = acct.borrow<&CreatorProfile.Profile>(from: CreatorProfile.ProfileStoragePath) {
                                profile.logCampaign(
                                    campaignId: campaignId,
                                    score: score,
                                    timestamp: getCurrentBlock().timestamp
                                )
                            }
                        }
                    }
                `,
                fcl.args([
                    fcl.arg(campaignId, fcl.t.String),
                    fcl.arg(creatorAddress, fcl.t.Address),
                    fcl.arg(score.toString(), fcl.t.UFix64),
                    fcl.arg(this.oracleAddress, fcl.t.Address)
                ]),
                fcl.proposer(fcl.currentUser),
                fcl.payer(fcl.currentUser)
            ]);
            
            console.log(`📝 [CADENCE_CLIENT] Transaction sent`, { transaction });
            
            const result = await fcl.decode(transaction);
            console.log(`✅ [CADENCE_CLIENT] Creator score updated successfully`, { result });
            
            return result;
        } catch (error) {
            console.error("❌ [CADENCE_CLIENT] Error updating creator score:", error);
            throw error;
        }
    }
    
    /**
     * Trigger campaign payout
     */
    public async triggerPayout(campaignId: string): Promise<string> {
        try {
            const transaction = await fcl.send([
                fcl.transaction`
                    import CampaignEscrow from 0xCampaignEscrow
                    
                    transaction(
                        campaignId: String,
                        signer: Address
                    ) {
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
                `,
                fcl.args([
                    fcl.arg(campaignId, fcl.t.String),
                    fcl.arg(this.oracleAddress, fcl.t.Address)
                ]),
                fcl.proposer(fcl.currentUser),
                fcl.payer(fcl.currentUser)
            ]);
            
            const result = await fcl.decode(transaction);
            return result;
        } catch (error) {
            console.error("Error triggering payout:", error);
            throw error;
        }
    }
    
    /**
     * Trigger campaign refund
     */
    public async triggerRefund(campaignId: string): Promise<string> {
        try {
            const transaction = await fcl.send([
                fcl.transaction`
                    import CampaignEscrow from 0xCampaignEscrow
                    
                    transaction(
                        campaignId: String,
                        signer: Address
                    ) {
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
                `,
                fcl.args([
                    fcl.arg(campaignId, fcl.t.String),
                    fcl.arg(this.oracleAddress, fcl.t.Address)
                ]),
                fcl.proposer(fcl.currentUser),
                fcl.payer(fcl.currentUser)
            ]);
            
            const result = await fcl.decode(transaction);
            return result;
        } catch (error) {
            console.error("Error triggering refund:", error);
            throw error;
        }
    }
    
    /**
     * Read campaign data
     */
    public async readCampaign(campaignId: string): Promise<any> {
        try {
            const result = await fcl.send([
                fcl.script`
                    import CampaignEscrow from 0xCampaignEscrow
                    
                    access(all) fun main(campaignId: String): CampaignEscrow.Campaign? {
                        return CampaignEscrow.getCampaign(id: campaignId)
                    }
                `,
                fcl.args([
                    fcl.arg(campaignId, fcl.t.String)
                ])
            ]);
            
            return await fcl.decode(result);
        } catch (error) {
            console.error("Error reading campaign:", error);
            throw error;
        }
    }
}
