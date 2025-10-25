/**
 * Flow Cadence Client
 * 
 * Handles all Flow blockchain interactions
 * Signs transactions with oracle private key using Flow SDK
 */
import * as fcl from "@onflow/fcl";
import * as sdk from "@onflow/sdk";
import { serialize } from "@onflow/sdk";
import { SHA3 } from "sha3";
import * as elliptic from "elliptic";

const ec = new elliptic.ec("p256");

export class CadenceClient {
    private oracleAddress: string;
    private oraclePrivateKey: string;
    private privateKeyHex: string;
    
    constructor(oracleAddress: string, oraclePrivateKey: string) {
        this.oracleAddress = oracleAddress;
        this.oraclePrivateKey = oraclePrivateKey;
        this.privateKeyHex = oraclePrivateKey;
        
        // Configure FCL for mainnet (for scripts only)
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
     * Helper function to sign with private key
     */
    private async sign(transaction: any): Promise<{addr: string, keyId: number, signature: string}> {
        const key = ec.keyFromPrivate(Buffer.from(this.privateKeyHex, "hex"));
        const signer = async (acct: any) => ({
            addr: acct.addr,
            keyId: acct.keyId,
            signature: await sign(transaction, acct.keyId, key)
        });
        
        async function sign(tx: any, keyId: number, key: any) {
            const hash = sha3_256([
                domainTag("FLOW-V0.0-transaction"),
                ...tx.cadence
            ].join(""));
            
            const sig = key.sign(hash);
            const n = 32;
            const r = sig.r.toArray("be", n);
            const s = sig.s.toArray("be", n);
            
            return Buffer.concat([Buffer.from(r), Buffer.from(s)]).toString("hex");
        }
        
        return await signer({ addr: this.oracleAddress, keyId: 0 });
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
            
            // Read transaction from file
            const code = `
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
            `;
            
            const response = await sdk.send([
                sdk.transaction(code),
                sdk.args([
                    sdk.arg(campaignId, sdk.t.String),
                    sdk.arg(creatorAddress, sdk.t.Address),
                    sdk.arg(score.toString(), sdk.t.UFix64),
                    sdk.arg(this.oracleAddress, sdk.t.Address)
                ]),
                sdk.proposer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.payer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.authorizations([sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))]),
                sdk.ref(this.oracleAddress),
                sdk.limit(1000)
            ]).then(sdk.decode);
            
            console.log(`✅ [CADENCE_CLIENT] Creator score updated successfully`, { response });
            return response;
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
            console.log(`💰 [CADENCE_CLIENT] Triggering payout`, { campaignId });
            
            const code = `
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
            `;
            
            const response = await sdk.send([
                sdk.transaction(code),
                sdk.args([
                    sdk.arg(campaignId, sdk.t.String),
                    sdk.arg(this.oracleAddress, sdk.t.Address)
                ]),
                sdk.proposer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.payer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.ref(this.oracleAddress),
                sdk.limit(1000)
            ]).then(sdk.decode);
            
            return response;
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
            console.log(`🔄 [CADENCE_CLIENT] Triggering refund`, { campaignId });
            
            const code = `
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
            `;
            
            const response = await sdk.send([
                sdk.transaction(code),
                sdk.args([
                    sdk.arg(campaignId, sdk.t.String),
                    sdk.arg(this.oracleAddress, sdk.t.Address)
                ]),
                sdk.proposer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.payer(sdk.authorization(this.oracleAddress, 0, this.privateKeyHex, this.sign.bind(this))),
                sdk.ref(this.oracleAddress),
                sdk.limit(1000)
            ]).then(sdk.decode);
            
            return response;
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
            const code = `
                import CampaignEscrow from 0xCampaignEscrow
                
                access(all) fun main(campaignId: String): CampaignEscrow.Campaign? {
                    return CampaignEscrow.getCampaign(id: campaignId)
                }
            `;
            
            const response = await fcl.query({
                cadence: code,
                args: (arg: any, t: any) => [arg(campaignId, t.String)]
            });
            
            return response;
        } catch (error) {
            console.error("Error reading campaign:", error);
            throw error;
        }
    }
}

// Helper functions
function sha3_256(data: string): Buffer {
    const hash = new SHA3(256);
    hash.update(data);
    return hash.digest();
}

function domainTag(tag: string): string {
    return sha3_256(tag).toString();
}

// SDK authorization helper
(sdk as any).authorization = (addr: string, keyId: number, privateKey: string, signer: any) => ({
    addr,
    keyId,
    resolve: async () => ({
        addr,
        keyId,
        sequenceNum: await getSequenceNumber(addr, keyId),
        signature: await signer({ addr, keyId })
    })
});

async function getSequenceNumber(addr: string, keyId: number): Promise<number> {
    const response = await fetch(`https://access.mainnet.nodes.onflow.org/v1/accounts/${addr}`);
    const account = await response.json();
    return account.keys[keyId].sequenceNumber;
}
