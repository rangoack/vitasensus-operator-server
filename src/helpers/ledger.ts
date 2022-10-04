import * as vitejs from "@vite/vitejs";
import { BigNumber } from "bignumber.js";
import assert from "assert";
import { getReadOnlyViteAPI } from "../config/singleton";

export async function getLatestSnapshot(): Promise<BigNumber> {
  const api = getReadOnlyViteAPI();
  return new BigNumber(await api.request("ledger_getSnapshotChainHeight"));
}

export async function getBalanceAtSnapshot(address: string, tokenId: string, snapshot?: BigNumber) {
  assert(vitejs.utils.isValidTokenId(tokenId), "Invalid ID: Please provide a valid Token ID");
  const snapHeight = snapshot ?? (await getLatestSnapshot());
  const api = getReadOnlyViteAPI();
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
  return new BigNumber((balancesMap[address] && balancesMap[address][tokenId]) ?? 0);
}
