import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./db.json";

// helper
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// CREATE CUSTOMER ID
app.post("/api/register", (req, res) => {
  const db = readDB();

  const customer = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    phone: req.body.phone,
    created: new Date()
  };

  db.customers.push(customer);
  writeDB(db);

  res.json(customer);
});

// PLACE ORDER
app.post("/api/order", (req, res) => {
  const db = readDB();

  const { customerId, network, amount } = req.body;

  const price = amount + 1; // +1 GH markup

  const order = {
    id: uuidv4().slice(0, 6),
    customerId,
    network,
    amount,
    price,
    status: "pending",
    date: new Date()
  };

  db.orders.push(order);
  writeDB(db);

  res.json(order);
});

// GET ORDERS (admin use)
app.get("/api/orders", (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

app.listen(PORT, () => {
  console.log(`QuickData GH running on port ${PORT}`);
});