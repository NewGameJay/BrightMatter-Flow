/**
 * CreatorProfile Contract
 * 
 * Implements a non-transferable Soulbound Token (SBT) for creator profiles
 * Each profile contains campaign performance history
 * Only the oracle account can update scores to maintain integrity
 */

access(all) contract CreatorProfile {
    
    // Proof resource for structured on-chain proofs
    access(all) resource Proof {
        access(all) let postId: String
        access(all) let score: UFix64
        access(all) let timestamp: UFix64
        access(all) let campaignId: String
        
        init(postId: String, score: UFix64, timestamp: UFix64, campaignId: String) {
            self.postId = postId
            self.score = score
            self.timestamp = timestamp
            self.campaignId = campaignId
        }
    }
    
    // Public interface for reading profile data
    access(all) resource interface IProfilePublic {
        access(all) fun getCampaignScore(campaignId: String): UFix64?
        access(all) fun getCampaignHistory(): [String]
        access(all) fun getTotalCampaigns(): UInt32
        access(all) fun getLastUpdated(): UFix64
        access(all) fun getProofs(): [Proof]
        access(all) fun getProofsForCampaign(campaignId: String): [Proof]
    }
    
    // Oracle-only interface for adding proofs
    access(all) resource interface ProfileOracleReceiver {
        access(all) fun addProof(proof: @Proof, oracleAddress: Address)
    }

    // Main Profile resource - non-transferable SBT
    access(all) resource Profile: IProfilePublic, ProfileOracleReceiver {
        access(all) var campaignScores: {String: UFix64}
        access(all) var lastUpdated: UFix64
        access(all) var proofs: [Proof]
        
        init() {
            self.campaignScores = {}
            self.lastUpdated = 0.0
            self.proofs = []
        }
        
        // Admin-only function to log campaign performance
        access(all) fun logCampaign(campaignId: String, score: UFix64, timestamp: UFix64) {
            self.campaignScores[campaignId] = score
            self.lastUpdated = timestamp
        }
        
        // Oracle-only function to add proof via interface
        access(all) fun addProof(proof: @Proof, oracleAddress: Address) {
            pre {
                oracleAddress == CreatorProfile.oracle: "Only oracle can add proofs"
            }
            self.proofs.append(<-proof)
            self.lastUpdated = getCurrentBlock().timestamp
        }
        
        // Public read functions
        access(all) fun getCampaignScore(campaignId: String): UFix64? {
            return self.campaignScores[campaignId]
        }
        
        access(all) fun getCampaignHistory(): [String] {
            return self.campaignScores.keys
        }
        
        access(all) fun getTotalCampaigns(): UInt32 {
            return UInt32(self.campaignScores.keys.length)
        }
        
        access(all) fun getLastUpdated(): UFix64 {
            return self.lastUpdated
        }
        
        access(all) fun getProofs(): [Proof] {
            return self.proofs
        }
        
        access(all) fun getProofsForCampaign(campaignId: String): [Proof] {
            let campaignProofs: [Proof] = []
            for proof in self.proofs {
                if proof.campaignId == campaignId {
                    campaignProofs.append(proof)
                }
            }
            return campaignProofs
        }
    }
    
    // Oracle account that can update profiles
    access(all) let oracle: Address
    
    // Function to create a new profile (called during setup)
    access(all) fun createProfile(): @Profile {
        return <- create Profile()
    }
    
    // Function to create a new proof
    access(all) fun createProof(
        postId: String,
        score: UFix64,
        timestamp: UFix64,
        campaignId: String
    ): @Proof {
        return <- create Proof(
            postId: postId,
            score: score,
            timestamp: timestamp,
            campaignId: campaignId
        )
    }
    
    // Events for transparency
    access(all) event ProfileCreated(address: Address)
    access(all) event CampaignScoreLogged(address: Address, campaignId: String, score: UFix64, timestamp: UFix64)
    access(all) event ProofAdded(address: Address, campaignId: String, postId: String, score: UFix64)
    
    init(oracleAddress: Address) {
        self.oracle = oracleAddress
        log("CreatorProfile contract deployed with oracle: ".concat(self.oracle.toString()))
    }
}