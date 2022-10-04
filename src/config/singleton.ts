import * as vuilder from "@vite/vuilder";
import * as vitejs from "@vite/vitejs";
import { ViteAPI } from "@vite/vitejs/distSrc/utils/type";
import {
  VITASENSUS_CONTRACT_ADDRESS,
  VITE_IPC_URL,
  VITE_HTTP_URL,
  VITE_WALLET_ADDRESS,
  VITE_WALLET_PRIVATE_KEY,
  VITE_SBP_HTTP_URL,
} from "../config/constants";
import abi from "./abi/Vitasensus.json";

let readOnlyViteAPI: ViteAPI;
export function getReadOnlyViteAPI() {
  if (!readOnlyViteAPI)
    readOnlyViteAPI = new vitejs.ViteAPI(
      VITE_IPC_URL
        ? new vitejs.IPC_RPC(VITE_IPC_URL)
        : new vitejs.HTTP_RPC(VITE_HTTP_URL ?? "http://app:48132"),
      () => {
        console.log("ReadOnlyViteAPI Initialized");
      }
    );

  return readOnlyViteAPI;
}

let writeCapableViteAPI: ViteAPI;
export function getWriteCapableViteAPI() {
  if (!writeCapableViteAPI)
    writeCapableViteAPI = new vitejs.ViteAPI(
      new vitejs.HTTP_RPC(VITE_SBP_HTTP_URL),
      () => {
        console.log("WriteCapableViteAPI Initialized");
      }
    );

  return writeCapableViteAPI;
}

let contract: vuilder.Contract;
export function getVitasensusContract() {
  if (!contract) {
    contract = new vuilder.Contract(abi.name, abi.byteCode, abi.abi);
    contract.attach(VITASENSUS_CONTRACT_ADDRESS);
    contract.setProvider(getWriteCapableViteAPI());
  }

  return contract;
}

let account: vuilder.UserAccount;
export function getViteAccount() {
  if (!account) {
    account = new vuilder.UserAccount(VITE_WALLET_ADDRESS);
    account.setPrivateKey(VITE_WALLET_PRIVATE_KEY);
    account._setProvider(getWriteCapableViteAPI());
  }

  return account;
}
