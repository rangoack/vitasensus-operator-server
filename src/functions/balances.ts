import BigNumber from "bignumber.js";
import * as constants from "../config/constants";
import { cacheSnapshotBalances, isSnapshotInCache, retrieveSnapshotBalanceForAddress } from "../helpers/cache";
import { getBalancesAtSnapshot } from "../helpers/ledger";

export async function getAddressBalanceForTokenAtHeight(address:string, tokenId: string, height: string) {
    const snapHeight = new BigNumber(height);
    const isCached = await isSnapshotInCache(snapHeight, tokenId);
    if (!isCached) {
        const balances = await getBalancesAtSnapshot(constants.GVITE_EXECUTABLE, tokenId, snapHeight);
        await cacheSnapshotBalances(snapHeight, tokenId, balances);
        return balances[address] ?? new BigNumber(0);
    }

    return await retrieveSnapshotBalanceForAddress(snapHeight, tokenId, address);
}
