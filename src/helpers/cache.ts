import BigNumber from "bignumber.js";
import { SnapshotBalanceMap } from "../types";
import { snapBalances } from "./mongo";

export async function cacheSnapshotBalances(
  snapshotHeight: BigNumber,
  tokenId: string,
  balances: SnapshotBalanceMap
) {
  const formatted: { [key: string]: string } = {};
  for (const address in balances) {
    if (Object.prototype.hasOwnProperty.call(balances, address)) {
      const balance = balances[address];
      formatted[address] = balance.toString(10);
    }
  }
  await snapBalances.insertOne({
    balances: formatted,
    height: snapshotHeight.toString(10),
    tokenId,
  });
}

export async function retrieveSnapshotBalances(
  snapshotHeight: BigNumber,
  tokenId: string
) {
  const rawResult = await snapBalances.findOne({
    height: snapshotHeight.toString(10),
    tokenId,
  });
  if (!rawResult) return;
  const { balances: rawBalances } = rawResult;
  const balances: SnapshotBalanceMap = {};

  for (const key in rawBalances) {
    if (Object.prototype.hasOwnProperty.call(rawBalances, key)) {
      const balance = rawBalances[key];
      balances[key] = new BigNumber(balance);
    }
  }

  return balances;
}

export async function retrieveSnapshotBalanceForAddress(
  snapshotHeight: BigNumber,
  tokenId: string,
  address: string
) {
  const rawResult = await snapBalances.findOne(
    {
      height: snapshotHeight.toString(10),
      tokenId,
    },
    { projection: { [`balances.${address}`]: 1 } }
  );
  if (!rawResult || !rawResult.balances[address]) return new BigNumber(0);

  const { balances } = rawResult;

  return new BigNumber(balances[address]);
}

export async function isSnapshotInCache(
  snapshotHeight: BigNumber,
  tokenId: string
) {
  const rawResult = await snapBalances.findOne(
    {
      height: snapshotHeight.toString(10),
      tokenId,
    },
    { projection: { _id: 1 } }
  );

  return !!rawResult?._id;
}
