import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import balance from "./src/routes/balance";
import vote from "./src/routes/vote";
import sitemap from "express-sitemap-html"

const app = express();
app.use(cors());

/* Middlewares */
app.use(bodyParser.json());

app.listen(process.env.PORT, () => {
  console.log(
    `Server is running!`
  );
});

/* Endpoints */
balance(app);
vote(app);

sitemap.swagger('Vitasensus operator server', app) // available at /api-docs
