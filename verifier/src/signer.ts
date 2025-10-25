/**
 * Server-side Flow Account Authorization
 * Signs transactions with private key using ECDSA_P256 + SHA3_256
 */
import * as fcl from "@onflow/fcl";
import { SHA3 } from "sha3";
import elliptic from "elliptic";

const ec = new elliptic.ec("p256"); // ECDSA_P256

// Environment variables for the oracle account
const FLOW_ADDRESS = process.env.FLOW_ADDRESS || "14aca78d100d2001";
const FLOW_KEY_ID = Number(process.env.FLOW_KEY_ID || "0");
const FLOW_PRIVATE = process.env.FLOW_PRIVATE || "654778a449ba7d2e2eba94e90b08d810d5ef1bfab036a16f24159f23ff316a23";

// Configure FCL for mainnet
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "0xCreatorProfile": "0x14aca78d100d2001",
  "0xCampaignEscrow": "0x14aca78d100d2001",
  "0xFlowToken": "0x1654653399040a61"
});

function hashMsgHex(hex: string): Buffer {
  const sha3 = new SHA3(256);
  sha3.update(Buffer.from(hex, "hex"));
  return Buffer.from(sha3.digest());
}

/**
 * Server-side Account Authorization Function
 * This replaces browser user services with direct private key signing
 */
export const serverAuthorization = async (account: any = {}) => {
  const addr = fcl.withPrefix(FLOW_ADDRESS);

  return {
    ...account,
    tempId: `${addr}-${FLOW_KEY_ID}`,
    addr,
    keyId: FLOW_KEY_ID,
    signingFunction: async (signable: any) => {
      const digest = hashMsgHex(signable.message);
      const key = ec.keyFromPrivate(Buffer.from(FLOW_PRIVATE, "hex"));
      const sig = key.sign(digest, { canonical: true });
      const r = sig.r.toArrayLike(Buffer, "be", 32);
      const s = sig.s.toArrayLike(Buffer, "be", 32);
      const signature = Buffer.concat([r, s]).toString("hex");

      return {
        addr,
        keyId: FLOW_KEY_ID,
        signature,
      };
    },
  };
};
