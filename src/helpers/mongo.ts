import { Document, MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_DB_URL!);

const database = client.db("vitasensus_hub");
export const snapBalances = database.collection<
  { height: string; tokenId: string; balances: { [key: string]: string } } & Document
>("snapshot_balances");
