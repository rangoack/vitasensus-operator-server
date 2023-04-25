import * as vitejs from "@vite/vitejs";
import { BigNumber } from "bignumber.js";
import assert from "assert";
import { getViteAPI } from "../config/singleton";

export async function getLatestSnapshot(network: string): Promise<BigNumber> {
  const api = getViteAPI(network);
  return new BigNumber(await api.request("ledger_getSnapshotChainHeight"));
}

export async function getBalanceAtSnapshot(network: string, address: string, tokenId: string, snapshot?: BigNumber) {
  assert(vitejs.utils.isValidTokenId(tokenId), "Invalid ID: Please provide a valid Token ID");
  const snapHeight = snapshot ?? (await getLatestSnapshot(network));
  const api = getViteAPI(network);
  const snapshotHash = (
    await api.request("ledger_getSnapshotBlockByHeight", snapHeight.toFixed(0)).catch((e) => {
      console.error("Found error in hash", snapHeight.toFixed(0), e);
      return {};
    })
  ).hash;
  const balancesMap = await api.request(
    "ledger_getConfirmedBalances",
    snapshotHash,
    [address],
    [tokenId]
  );
  console.log('balanceMap', balancesMap)
  return new BigNumber((balancesMap[address] && balancesMap[address][tokenId]) ?? 0);
}
