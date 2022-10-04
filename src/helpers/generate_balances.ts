import * as vitejs from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import {
  VITE_WALLET_ADDRESS,
  VITE_WALLET_PRIVATE_KEY,
} from "../config/constants";

export async function generateBalances(addresses: string[], tokenId?: string) {
  const api = new vitejs.ViteAPI(
    new vitejs.WS_RPC("ws://0.0.0.0:23457"),
    () => {}
  );
  const privateKey = VITE_WALLET_PRIVATE_KEY;
  const topBoss = new vuilder.UserAccount(VITE_WALLET_ADDRESS);
  topBoss.setPrivateKey(privateKey);
  topBoss._setProvider(api);
  console.log(privateKey);

  for (const address of addresses) {
    await topBoss.sendToken(address, "900000000000000000000000", tokenId);
  }
}
