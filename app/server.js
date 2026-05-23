const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const serverPort = process.env.PORT || 3000;
const dbUri = process.env.MONGO_URI || "mongodb://mongo:27017/store";

let database;
let itemsCollection;

const seedItems = [
  { name: "Laptop", price: 1200 },
  { name: "Phone", price: 800 }
];

async function initDatabase() {
  const client = new MongoClient(dbUri);
  let attempt = 0;
  while (attempt < 30) {
    try {
      await client.connect();
      database = client.db();
      itemsCollection = database.collection("products");
      const itemCount = await itemsCollection.countDocuments();
      if (itemCount === 0) {
        await itemsCollection.insertMany(seedItems);
      }
      return;
    } catch (err) {
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error("MongoDB connection failed");
}

function buildHtml(products) {
  const items = products
    .map((p) => `<li>${p.name} $${p.price}</li>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Online Marketplace</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #1a1a2e; }
    ul { line-height: 1.8; font-size: 1.1rem; }
  </style>
</head>
<body>
  <h1>Online Marketplace</h1>
  <ul>${items}</ul>
</body>
</html>`;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/products", async (req, res) => {
  const products = await itemsCollection.find({}).toArray();
  res.json(products);
});

app.get("/", async (req, res) => {
  const products = await itemsCollection.find({}).toArray();
  res.type("html").send(buildHtml(products));
});

initDatabase()
  .then(() => {
    app.listen(serverPort, "0.0.0.0", () => {
      console.log(`Server listening on ${serverPort}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
