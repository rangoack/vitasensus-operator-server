import { Express } from "express";
import { body, param } from "express-validator";
import { validate } from "../middlemen/validators";
import * as vitejs from "@vite/vitejs";
import { verifySignature } from "../helpers/crypto";
import {
  getVitasensusContract,
  getViteAccount,
  getReadOnlyViteAPI,
} from "../config/singleton";
import { getAddressBalanceForTokenAtHeight } from "../functions/balances";
import BigNumber from "bignumber.js";

export type TokenInfo = {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  tokenId: string;
  maxSupply: string;
  ownerBurnOnly: false;
  isReIssuable: false;
  index: number;
  isOwnerBurnOnly: false;
};

export default function (app: Express) {
  app.put(
    "/vote/:spaceId/:proposalId",
    validate([
      body("choiceIndex")
        .isInt()
        .toInt()
        .custom((input) => input >= 0),
      body("signature").isBase64(),
      param("spaceId")
        .isInt()
        .toInt()
        .custom((input) => input >= 0),
      param("proposalId")
        .isInt()
        .toInt()
        .custom((input) => input >= 0),
      body("publicKey").isBase64(),
    ]),
    async (req, res) => {
      const { choiceIndex, signature, publicKey } = req.body;
      const { spaceId, proposalId } = req.params;

      const message = `Sign this message to confirm your vote

Space ID: ${spaceId}
Proposal ID: ${proposalId}
Choice index: ${choiceIndex}`;

      console.log(message);

      if (!verifySignature(message, signature, publicKey)) {
        return res.status(403).json({ error: "Invalid signature" });
      }

      const address = vitejs.wallet.getAddressFromPublicKey(
        vitejs.utils._Buffer.from(publicKey, "base64").toString("hex")
      );
      const contract = getVitasensusContract();
      const account = getViteAccount();

      const [, , tokenId] =
        (await contract.query("getSpaceExternal", [spaceId])) ?? [];
      const [, , , , , snapshot, choices] =
        (await contract.query("getSpaceProposal", [spaceId, proposalId])) ?? [];

      if (choiceIndex >= choices.length) {
        return res.status(403).json({ error: "Invalid choice" });
      }
      const [hasVoted] =
        (await contract.query("hasVoted", [spaceId, proposalId, address])) ??
        [];

      if (hasVoted) {
        return res.status(409).json({ error: "User already voted" });
      }

      let votingPower = await getAddressBalanceForTokenAtHeight(
        address,
        tokenId,
        snapshot
      );
      const viteAPI = getReadOnlyViteAPI();
      const tokenInfo: TokenInfo = await viteAPI.request(
        "contract_getTokenInfoById",
        tokenId
      );

      votingPower = votingPower
        .div(new BigNumber(10).pow(tokenInfo.decimals))
        .integerValue(BigNumber.ROUND_DOWN);

      if (!votingPower.isPositive() || votingPower.isZero()) {
        return res
          .status(403)
          .json({ error: "No voting power available for user" });
      }

      await contract.call(
        "voteOnProposal",
        [spaceId, proposalId, address, choiceIndex, votingPower.toString(10)],
        { caller: account }
      );

      return res.status(201).json({ message: "Vote created successfully" });
    }
  );
}
