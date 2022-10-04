import { Express } from "express";
import { getAddressBalanceForTokenAtHeight } from "../functions/balances";

export default function (app: Express) {
  app.get("/balance/:height/:tokenId/:address", async (req, res) => {
    const { height, tokenId, address } = req.params;
    const balance = await getAddressBalanceForTokenAtHeight(
      address,
      tokenId,
      height
    );
    return res.status(200).json({ balance: balance.toString(10) });
  });
}
