/**
 * Flow Client
 * 
 * Unified interface for Flow transactions and scripts
 */

import * as fcl from "@onflow/fcl";
import { authz } from "./signer";

export async function sendTx(cadence: string, args: any[] = []) {
  const txId = await fcl.mutate({
    cadence,
    args: (arg: any, t: any) => args.map((fn) => fn(arg, t)),
    payer: authz as any,
    proposer: authz as any,
    authorizations: [authz as any],
    limit: 9999,
  });
  
  const sealed = await fcl.tx(txId).onceSealed();
  console.log(`[Flow] Transaction ${txId} sealed at block ${sealed.blockId}`);
  
  return { txId, sealed };
}

export async function runScript(cadence: string, args: any[] = []) {
  return fcl.query({
    cadence,
    args: (arg: any, t: any) => args.map((fn) => fn(arg, t)),
  });
}

export { fcl };

