access(all) contract CreatorProfile {

    access(all) let oracle: Address

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

    // Public interface you expose via a capability
    access(all) resource interface ProfilePublic {
        access(all) fun addProof(proof: @Proof)
    }

    access(all) resource Profile: ProfilePublic {
        access(all) var proofs: @[Proof]

        init() {
            self.proofs <- [] as @[Proof]
        }

        access(all) fun addProof(proof: @Proof) {
            self.proofs.append(<-proof)
        }
    }

    access(all) fun createEmptyProfile(): @Profile {
        return <- create Profile()
    }

    access(all) fun createProof(postId: String, score: UFix64, timestamp: UFix64, campaignId: String): @Proof {
        return <- create Proof(postId: postId, score: score, timestamp: timestamp, campaignId: campaignId)
    }

    // Contract-level wrapper with oracle check
    access(all) fun addProofFor(
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