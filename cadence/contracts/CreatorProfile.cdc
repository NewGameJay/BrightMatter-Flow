pub contract CreatorProfile {

    pub let oracle: Address

    pub resource Proof {
        pub let postId: String
        pub let score: UFix64
        pub let timestamp: UFix64
        pub let campaignId: String

        init(postId: String, score: UFix64, timestamp: UFix64, campaignId: String) {
            self.postId = postId
            self.score = score
            self.timestamp = timestamp
            self.campaignId = campaignId
        }
    }

    // Public interface you expose via a capability
    pub resource interface ProfilePublic {
        pub fun addProof(proof: @Proof)
    }

    pub resource Profile: ProfilePublic {
        pub var proofs: [@Proof]

        init() {
            self.proofs <- []
        }

        pub fun addProof(proof: @Proof) {
            self.proofs.append(<-proof)
        }

        destroy() {
            destroy self.proofs
        }
    }

    pub fun createEmptyProfile(): @Profile {
        return <- create Profile()
    }

    pub fun createProof(postId: String, score: UFix64, timestamp: UFix64, campaignId: String): @Proof {
        return <- create Proof(postId: postId, score: score, timestamp: timestamp, campaignId: campaignId)
    }

    // Contract-level wrapper with oracle check
    pub fun addProofFor(
        creator: Address,
        postId: String,
        score: UFix64,
        timestamp: UFix64,
        campaignId: String,
        signer: Address
    ) {
        pre { signer == self.oracle: "only oracle may add proof" }

        let cap = getAccount(creator)
            .getCapability<&{ProfilePublic}>(/public/CreatorProfile)

        let profileRef = cap.borrow()
            ?? panic("Creator profile not found or wrong cap type")

        let proof <- self.createProof(
            postId: postId,
            score: score,
            timestamp: timestamp,
            campaignId: campaignId
        )

        profileRef.addProof(proof: <-proof)
    }

    init(oracle: Address) {
        self.oracle = oracle
    }
}