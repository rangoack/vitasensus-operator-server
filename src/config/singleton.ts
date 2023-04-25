// import * as vuilder from "@vite/vuilder";
// import * as vitejs from "@vite/vitejs";
const vitejs = require("@vite/vitejs");
const vuilder = require("@vite/vuilder");
// import { ViteAPI } from "@vite/vitejs/distSrc/utils/type";
import {
  VITE_WALLET_ADDRESS,
  VITE_WALLET_PRIVATE_KEY,
  VITASENSUS_TESTNET_CONTRACT_ADDRESS,
  VITASENSUS_MAINNET_CONTRACT_ADDRESS,
  VITE_TESTNET_HTTP_URL,
  VITE_MAINNET_HTTP_URL,
} from "../config/constants";
import abi from "./abi/Vitasensus.json";

let mainNetViteAPI: any;
let testNetViteAPI: any;

export function getViteAPI(network) {
  if (network.toLowerCase() === "mainnet") {
    if (!mainNetViteAPI) {
      mainNetViteAPI = new vitejs.ViteAPI(new vitejs.HTTP_RPC(VITE_MAINNET_HTTP_URL ?? "https://node.vite.net/gvite"), () => {
        console.log('MainNet vite client connected');
      })
    }
    return mainNetViteAPI;
  } else {
    if (!testNetViteAPI) {
      testNetViteAPI = new vitejs.ViteAPI(new vitejs.HTTP_RPC(VITE_TESTNET_HTTP_URL ?? "https://buidl.vite.net/gvite"), () => {
        console.log('TestNet vite client connected');
      })
    }
    return testNetViteAPI;
  }
}

// let contract: vuilder.Contract;
let mainNetContract: any;
let testNetContract: any;
export function getVitasensusContract(network: string) {
  if (network.toLowerCase() === "mainnet") {
    if (!mainNetContract) {
      mainNetContract = newVitasensusContract(network);
    }
    return mainNetContract;
  } else {
    if (!testNetContract) {
      testNetContract = newVitasensusContract(network);
    }
    return testNetContract;
  }
}

function newVitasensusContract(network: string) {
  const contract = new vuilder.Contract(abi.name, abi.byteCode, abi.abi);
  if (network.toLowerCase() === "mainnet") {
    console.log('new contract', abi.name, network, VITASENSUS_MAINNET_CONTRACT_ADDRESS)
    contract.attach(VITASENSUS_MAINNET_CONTRACT_ADDRESS);
    contract.setProvider(getViteAPI(network));
  } else {
    console.log('new contract', abi.name, network, VITASENSUS_TESTNET_CONTRACT_ADDRESS)
    contract.attach(VITASENSUS_TESTNET_CONTRACT_ADDRESS);
    contract.setProvider(getViteAPI(network));
  }

  return contract;
}

// let account: vuilder.UserAccount;
let account: any;
export function getViteAccount(network: string) {
  if (!account) {
    account = new vuilder.UserAccount(VITE_WALLET_ADDRESS);
    account.setPrivateKey(VITE_WALLET_PRIVATE_KEY);
    account._setProvider(getViteAPI(network));
  }

  return account;
}

export function getContractAddress(network: string) {
  if (network.toLowerCase() === "mainnet") {
    return VITASENSUS_MAINNET_CONTRACT_ADDRESS;
  } else {
    return VITASENSUS_TESTNET_CONTRACT_ADDRESS;
  }
}

export function getOperatorAddress(network: string) {
  if (network.toLowerCase() === "mainnet") {
    return VITE_WALLET_ADDRESS;
  } else {
    return VITE_WALLET_ADDRESS;
  }
}

export function getOperatorPrivateKey(network: string) {
  if (network.toLowerCase() === "mainnet") {
    return VITE_WALLET_PRIVATE_KEY;
  } else {
    return VITE_WALLET_PRIVATE_KEY;
  }
}

export function getABI(): any {
  return abi.abi;
}
