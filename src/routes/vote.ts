import { Express } from "express";
import { body, param } from "express-validator";
import { validate } from "../middlemen/validators";
import * as vitejs from "@vite/vitejs";
import { verifySignature } from "../helpers/crypto";
import {
  getVitasensusContract,
  getViteAccount,
  getViteAPI,
  getContractAddress,
  getOperatorAddress,
  getOperatorPrivateKey,
  getABI,
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
    "/api/vote/:network/:spaceId/:proposalId",
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
      req.setTimeout(5*60*60*1000);
      const { choiceIndex, signature, publicKey } = req.body;
      const { network, spaceId, proposalId } = req.params;
      console.log(req.params, req.body)

      const message = `Sign this message to confirm your vote

Space ID: ${spaceId}
Proposal ID: ${proposalId}
Choice index: ${choiceIndex}`;

      console.log(message);

      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      if (!verifySignature(message, signature, publicKey)) {
        return res.status(403).json({ error: "Invalid signature" });
      }

      const address = vitejs.wallet.getAddressFromPublicKey(
        // vitejs.utils._Buffer.from(publicKey, "base64").toString("hex")
        Buffer.from(publicKey, "base64").toString("hex")
      );
      console.log('address', address);

      const contract = getVitasensusContract(network);
      const account = getViteAccount(network);

      const [, , tokenId] =
        (await contract.query("getSpaceExternal", [spaceId])) ?? [];
      const [, , , , , snapshot, choices] =
        (await contract.query("getSpaceProposal", [spaceId, proposalId])) ?? [];
      console.log(tokenId, snapshot, choices)

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
        network,
        address,
        tokenId,
        snapshot
      );
      const viteClient = getViteAPI(network);
      const tokenInfo: TokenInfo = await viteClient.request(
        "contract_getTokenInfoById",
        tokenId
      );

      votingPower = votingPower
        .div(new BigNumber(10).pow(tokenInfo.decimals))
        .integerValue(BigNumber.ROUND_DOWN);

      console.log(`${address} voting power is ${votingPower}`)

      if (!votingPower.isPositive() || votingPower.isZero()) {
        return res
          .status(403)
          .json({ error: "No voting power available for user" });
      }

      // await contract.call(
      //   "voteOnProposal",
      //   [spaceId, proposalId, address, choiceIndex, votingPower.toString(10)],
      //   { caller: account }
      // );
      //
      let sendBlock: any;
      try {
        const opAddress = getOperatorAddress(network);
        const params = [spaceId, proposalId, address, choiceIndex, votingPower.toString(10)];
        console.log(`[Vite Client][sendBlock][voteOnProposal][params=${JSON.stringify(params)}]`);
        const ab = new vitejs.accountBlock.AccountBlock({
          blockType: vitejs.constant.BlockType.TransferRequest,
          address: opAddress,
          toAddress: getContractAddress(network),
          tokenId,
          amount: '0',
          fee: '0',
          data: encodeContractRequestData('voteOnProposal', params),
        });
        console.log(`[Vite Client][sendBlock][voteOnProposal][accountBlock]`, ab.accountBlock);

        ab.setProvider(viteClient);
        ab.setPrivateKey(getOperatorPrivateKey(network))
        // const quotaInfo = await viteClient.request("contract_getQuotaByAccount", opAddress);
        sendBlock = await ab.autoSend();
        console.log(`[Vite Client][sendBlock][voteOnProposal][hash=${sendBlock.hash}]`);

        let isSendBlockConfirmed = false;
        await waitFor(async () => {
          sendBlock = await viteClient.request('ledger_getAccountBlockByHash', sendBlock.hash);
          if (sendBlock.confirmedHash && !isSendBlockConfirmed) {
            isSendBlockConfirmed = true;
            console.log(`[Vite Client][sendBlock][voteOnProposal][confirmedHash=${sendBlock.confirmedHash}]`)
          }
          // wating receiveBlockHash
          if (!sendBlock.confirmedHash || !sendBlock.receiveBlockHash) {
            return false;
          }
          return true;
        }, 500, 75 * 1000);

        // get receiveBlock first
        let receiveBlock: any = await viteClient.request('ledger_getAccountBlockByHash', sendBlock.receiveBlockHash);
        console.log(`[Vite Client][receiveBlock][voteOnProposal][hash=${receiveBlock.hash}]`);
        // Awaiting confirmation
        await waitFor(async () => {
          receiveBlock = await viteClient.request('ledger_getAccountBlockByHash', receiveBlock.hash);
          if (!receiveBlock.confirmedHash) {
            return false;
          } else {
            console.log(`[Vite Client][receiveBlock][viteOnprosal][confirmedHash=${receiveBlock.confirmedHash}]`);
            return true;
          }
        });

        // check hash block correctly.
        if (receiveBlock.blockType !== 4 && receiveBlock.blockType !== 5 || !receiveBlock.data) {
          throw new Error('Bad receive block');
        }

        const receiveBlockDataBytes = Buffer.from(receiveBlock.data, 'base64');
        if (receiveBlockDataBytes.length !== 33) {
          throw new Error('Bad data in receive block');
        }
        // parse error code from data in receive block
        const errorCode = receiveBlockDataBytes[32];
        switch (errorCode) {
          case 1:
            throw new Error('Block revert');
          case 2:
            throw new Error('Maximum call stack size exceeded');
        }
        return res.status(201).json({ message: "Vote created successfully" });
      } catch (error: any) {
        console.log(error);
        return res.status(400).json({ error: error.message });
      }

    }
  );
}

function encodeContractRequestData(funcName: string, inputValues: string[]): string {
  const abi = getABI();
  const abiItem: any = abi.find((x: any) => x.name === funcName);
  const data = vitejs.abi.encodeFunctionCall(abiItem , inputValues, abiItem.name);
  return Buffer.from(data, 'hex').toString('base64');
}

function decodeContractResponseData(funcName: string, rawRet: string) {
  const abi = getABI();
  const abiItem: any = abi.find((x: any) => x.name === funcName);
  const data = vitejs.abi.decodeFunctionOutput(
    abiItem,
    Buffer.from(rawRet, 'base64').toString('hex'),
  );
  const outputs: any[] = [];
  abiItem.outputs.forEach((output: any, idx: number) => {
    outputs.push(Object.assign({}, output, {
      value: data[idx],
    }))
  });
  return outputs;
}

async function waitFor(condition: () => Promise<boolean>, interval: number = 500, timeout: number = 30 * 1000): Promise<void> {
  const startTime = Date.now();
  while (true) {
    if (await condition()) {
      break;
    }
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for execute reply (${timeout/1000}s)`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

