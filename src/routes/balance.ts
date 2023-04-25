import { Express } from "express";
import { getAddressBalanceForTokenAtHeight } from "../functions/balances";

export default function (app: Express) {
  app.get("/api/balance/:network/:height/:tokenId/:address", async (req, res) => {
    const { network, height, tokenId, address } = req.params;
    const balance = await getAddressBalanceForTokenAtHeight(
      network,
      address,
      tokenId,
      height
    );
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    return res.status(200).json({ balance: balance.toString(10) });
  });
}
