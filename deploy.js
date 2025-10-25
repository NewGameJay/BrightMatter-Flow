const fcl = require("@onflow/fcl");
const fs = require("fs");

// Configure FCL for mainnet
fcl.config()
  .put("accessNode.api", "https://rest-mainnet.onflow.org")
  .put("flow.network", "mainnet")
  .put("fcl.limit", 9999);

// Your account details
const PRIVATE_KEY = "49cd6b9efbb08635220096c4cb5f626908227a957fbbad5d129b21f049fa394d";
const ADDRESS = "0xe54a946a7830e4ec";

// Read the contract
const creatorProfileContract = fs.readFileSync("./cadence/contracts/CreatorProfile.cdc", "utf8");

// Create deployment transaction
const deployCreatorProfile = `
${creatorProfileContract}

transaction(oracleAddress: Address) {
    prepare(signer: AuthAccount) {
        signer.contracts.add(name: "CreatorProfile", code: CreatorProfile.code)
    }
}
`;

async function deploy() {
    try {
        console.log("Deploying CreatorProfile contract...");
        
        const txId = await fcl.mutate({
            cadence: deployCreatorProfile,
            args: (arg, t) => [arg(ADDRESS, t.Address)],
            proposer: fcl.authz,
            payer: fcl.authz,
            authorizations: [fcl.authz],
            limit: 999
        });
        
        console.log("Transaction ID:", txId);
        
        const result = await fcl.tx(txId).onceSealed();
        console.log("Deployment result:", result);
        
    } catch (error) {
        console.error("Deployment failed:", error);
    }
}

deploy();

