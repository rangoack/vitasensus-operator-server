import BigNumber from "bignumber.js";
import { getBalanceAtSnapshot } from "../helpers/ledger";

export async function getAddressBalanceForTokenAtHeight(
  address: string,
  tokenId: string,
  height: string
) {
  const snapHeight = new BigNumber(height);
  const balance = await getBalanceAtSnapshot(address, tokenId, snapHeight).catch((e) => {
    console.error(e);
    return new BigNumber(0);
  });
  return balance;
}
