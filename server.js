import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./db.json";

/* ---------------- DB HELPERS ---------------- */
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- REGISTER CUSTOMER ---------------- */
app.post("/api/register", (req, res) => {
  const db = readDB();

  const customer = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    phone: req.body.phone,
    createdAt: new Date()
  };

  db.customers.push(customer);
  writeDB(db);

  res.json(customer);
});

/* ---------------- CREATE ORDER ---------------- */
app.post("/api/order", (req, res) => {
  const db = readDB();

  const order = {
    id: "ORD-" + uuidv4().slice(0, 6).toUpperCase(),
    customerId: req.body.customerId,
    network: req.body.network,
    amount: req.body.amount,
    price: req.body.amount + 1,

    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date()
  };

  db.orders.push(order);
  writeDB(db);

  res.json({
    message: "Order received",
    order
  });
});

/* ---------------- PAYMENT VERIFY (MOCK READY) ---------------- */
app.post("/api/payment/verify", (req, res) => {
  const db = readDB();

  const order = db.orders.find(o => o.id === req.body.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.paymentStatus = "paid";
  order.status = "processing";

  writeDB(db);

  res.json({
    message: "Payment confirmed",
    order
  });
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

/* ---------------- AUTOMATION ENGINE ---------------- */
function processOrders() {
  const db = readDB();

  db.orders.forEach(order => {
    if (order.paymentStatus === "paid" && order.status === "processing") {
      order.status = "delivered";
      console.log("✅ Auto delivered:", order.id);
    }
  });

  writeDB(db);
}

setInterval(processOrders, 8000);

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log("🚀 QuickData GH Business System running");
});