import BigNumber from "bignumber.js";
import { getBalanceAtSnapshot } from "../helpers/ledger";

export async function getAddressBalanceForTokenAtHeight(
  network: string,
  address: string,
  tokenId: string,
  height: string
) {
  console.log('getAddressBalanceForTokenAtHeight', network, address, tokenId, height)
  const snapHeight = new BigNumber(height);
  const balance = await getBalanceAtSnapshot(network, address, tokenId, snapHeight).catch((e) => {
    console.error(e);
    return new BigNumber(0);
  });
  return balance;
}
