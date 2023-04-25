// import cors from "cors";
import bodyParser from "body-parser";
import express from "express";
import balance from "./routes/balance";
import vote from "./routes/vote";
// import sitemap from "express-sitemap-html";
const { v4 } = require('uuid');

const app = express();
// app.use(cors());

/* Middlewares */
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running in ${PORT}`);
});

/* Endpoints */
balance(app);
vote(app);

// sitemap.swagger("Vitasensus operator server", app); // available at /api-docs

// for test vercel
app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});

module.exports = app;
