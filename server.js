import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./db.json";

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- REGISTER ---------------- */
app.post("/api/register", (req, res) => {
  const db = readDB();

  const customer = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    phone: req.body.phone
  };

  db.customers.push(customer);
  writeDB(db);

  res.json(customer);
});

/* ---------------- ORDER ---------------- */
app.post("/api/order", (req, res) => {
  const db = readDB();

  const order = {
    id: "ORD-" + uuidv4().slice(0, 6).toUpperCase(),
    customerId: req.body.customerId,
    network: req.body.network,
    amount: req.body.amount,
    price: req.body.amount + 1,
    status: "pending",
    date: new Date()
  };

  db.orders.push(order);
  writeDB(db);

  res.json(order);
});

/* ---------------- GET ORDERS ---------------- */
app.get("/api/orders", (req, res) => {
  res.json(readDB().orders);
});

/* ---------------- UPDATE STATUS ---------------- */
app.put("/api/order/:id", (req, res) => {
  const db = readDB();

  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });

  order.status = req.body.status;
  writeDB(db);

  res.json(order);
});

app.listen(PORT, () => console.log("QuickData GH Pro running"));