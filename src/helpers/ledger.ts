import { spawn } from "child_process";
import path from "path";
import { executeCommand } from "./sh";
import * as vitejs from "@vite/vitejs";
import { BigNumber } from "bignumber.js";
import assert from "assert";
import * as CSV from "csv-string";
import { SnapshotBalanceMap } from "../types";
import { cacheSnapshotBalances, retrieveSnapshotBalances } from "./cache";

export async function getLatestSnapshot(gvite: string): Promise<BigNumber> {
  const script = path.resolve(gvite);
  const scriptDir = path.dirname(script);
  await executeCommand("pgrep gvite | xargs kill -9 && pgrep gvite | xargs wait", {
    shell: "bash",
  });
  const command = `${script} ledger latestBlock | grep -v -e "lvl=*" | egrep -o -e "\\"height\\":[0-9]+" | egrep -o -e "[0-9]+"`;

  const result = await executeCommand(command, { cwd: scriptDir });

  const height = new BigNumber(result.stdout.split("\n")[0]);
  const child = spawn(`${script} --pprof >> ${path.join(scriptDir, "gvite.log")} &`, {
    shell: true,
    detached: true,
    cwd: scriptDir,
    env: process.env,
    stdio: "ignore",
  });

  child.unref();

  return height;
}

export async function getBalancesAtSnapshot(gvite: string, tokenId: string, snapshot?: BigNumber) {
  assert(vitejs.utils.isValidTokenId(tokenId), "Invalid ID: Please provide a valid Token ID");
  const snapHeight = snapshot ?? (await getLatestSnapshot(gvite));

  const script = path.resolve(gvite);
  const scriptDir = path.dirname(script);

  // Stop the already running gvite process
  let findProcessId = await executeCommand("pgrep gvite | cat");
  if (findProcessId.stdout) {
    await executeCommand("pgrep gvite | cat | xargs kill -9").catch((e) => {
      console.error(e);
      return { stdout: "", stderr: "" };
    });
  }
  findProcessId = await executeCommand("pgrep gvite | cat");
  if (findProcessId.stdout) {
    await executeCommand("pgrep gvite | cat | xargs wait").catch((e) => {
      console.error(e);
      return { stdout: "", stderr: "" };
    });
  }

  const command = `${script} ledger dumpbalances -config ${path.join(scriptDir, "node_config.json")} -tokenId ${tokenId} -snapshotHeight ${snapHeight.toString()} | grep -v -e "lvl=*" -e "valid size"`;

  const result = await executeCommand(command, { cwd: scriptDir }).catch((e) => {
    console.error(e);
    return { stdout: "", stderr: "" };
  });

  // Restart the running gvite process
  // /gvite/gvite -config /gvite/node_config.json >> /gvite/gvite.log 2>&1 &
  const child = spawn(
    `${script} -config ${path.join(scriptDir, "node_config.json")} >> ${path.join(
      scriptDir,
      "gvite.log"
    )} 2>&1 &`,
    {
      shell: true,
      detached: true,
      cwd: scriptDir,
      env: process.env,
      stdio: "ignore",
    }
  );

  child.unref();

  const out = CSV.parse(result.stdout);

  const balances: SnapshotBalanceMap = {};

  for (const user of out.slice(1)) {
    balances[user[0]] = new BigNumber(user[1]);
  }

  return balances;
}
