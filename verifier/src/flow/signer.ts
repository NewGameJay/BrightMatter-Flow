/**
 * Server-Side Flow Authorization
 * 
 * ECDSA_P256 signing for mainnet transactions
 */

import * as fcl from "@onflow/fcl";
import { ec as EC } from "elliptic";
import { sha3_256 as sha3 } from "js-sha3";

const ec = new EC("p256");

const FLOW_ACCESS_NODE = process.env.FLOW_ACCESS_NODE || "https://rest-mainnet.onflow.org";
const FLOW_ACCOUNT_ADDRESS = (process.env.FLOW_ADDRESS || process.env.FLOW_ACCOUNT_ADDRESS || "14aca78d100d2001").replace(/^0x/, "");
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY || "49cd6b9efbb08635220096c4cb5f626908227a957fbbad5d129b21f049fa394d";
const FLOW_KEY_INDEX = Number(process.env.FLOW_KEY_INDEX || 0);

console.log('🔧 Flow Config:', { 
  accessNode: FLOW_ACCESS_NODE,
  address: FLOW_ACCOUNT_ADDRESS,
  privateKeyLength: FLOW_PRIVATE_KEY.length,
  keyIndex: FLOW_KEY_INDEX
});

// Configure FCL
fcl.config()
  .put("accessNode.api", FLOW_ACCESS_NODE)
  .put("flow.network", "mainnet")
  .put("fcl.accountProofResolve", null)
  .put("fcl.accountProofResolve", null);

const key = ec.keyFromPrivate(FLOW_PRIVATE_KEY, "hex");

const sign = (hexMsg: string) => {
  console.log('🔐 Signing message:', { hexMsg, type: typeof hexMsg, length: hexMsg?.length });
  
  if (!hexMsg || typeof hexMsg !== 'string') {
    throw new Error(`Invalid hexMsg: ${hexMsg} (type: ${typeof hexMsg})`);
  }
  
  const digest = Buffer.from(sha3(Buffer.from(hexMsg, "hex")), "hex");
  console.log('🔐 Digest created:', { digestLength: digest.length });
  
  const sig = key.sign(digest, { canonical: true });
  const r = sig.r.toArrayLike(Buffer, "be", 32);
  const s = sig.s.toArrayLike(Buffer, "be", 32);
  return Buffer.concat([r, s]).toString("hex");
};

export const authz = async (account: any = {}) => {
  const addr = `0x${FLOW_ACCOUNT_ADDRESS}`;
  const keyId = FLOW_KEY_INDEX;
  return {
    ...account,
    tempId: `${addr}-${keyId}`,
    addr,
    keyId,
    sequenceNum: 0,
    signingFunction: async ({ message }: { message: string }) => ({
      addr,
      keyId,
      signature: sign(message),
    }),
  };
};

export const getOracleAddress = () => `0x${FLOW_ACCOUNT_ADDRESS}`;

