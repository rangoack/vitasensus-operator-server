import * as dotenv from "dotenv"; 
dotenv.config();
export const VITE_TOKEN_ID = "tti_5649544520544f4b454e6e40";
export const VITE_WALLET_PRIVATE_KEY = process.env.VITE_WALLET_PRIVATE_KEY!;
export const VITE_WALLET_ADDRESS = process.env.VITE_WALLET_ADDRESS!;

export const VITASENSUS_TESTNET_CONTRACT_ADDRESS = process.env.VITASENSUS_TESTNET_CONTRACT_ADDRESS!;
export const VITASENSUS_MAINNET_CONTRACT_ADDRESS = process.env.VITASENSUS_MAINNET_CONTRACT_ADDRESS!;

export const VITE_TESTNET_HTTP_URL = process.env.VITE_TESTNET_HTTP_URL;
export const VITE_MAINNET_HTTP_URL = process.env.VITE_MAINNET_HTTP_URL;
