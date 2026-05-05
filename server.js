import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import session from "express-session";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "quickdata_secret",
  resave: false,
  saveUninitialized: true
}));

const DB_FILE = "./db.json";

/* ---------------- DB ---------------- */
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

/* ---------------- LOGIN ---------------- */
app.post("/api/login", (req, res) => {
  const db = readDB();

  const user = db.customers.find(c => c.id === req.body.customerId);

  if (!user) return res.status(404).json({ error: "Invalid ID" });

  req.session.user = user;

  res.json({ message: "Login successful", user });
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
    paymentStatus: "unpaid",
    createdAt: new Date()
  };

  db.orders.push(order);
  writeDB(db);

  res.json({ message: "Order created", order });
});

/* ---------------- PAYMENT VERIFY ---------------- */
app.post("/api/payment/verify", (req, res) => {
  const db = readDB();

  const order = db.orders.find(o => o.id === req.body.orderId);

  if (!order) return res.status(404).json({ error: "Order not found" });

  order.paymentStatus = "paid";
  order.status = "processing";

  writeDB(db);

  res.json({ message: "Payment confirmed", order });
});

/* ---------------- CUSTOMER ORDERS ---------------- */
app.get("/api/my-orders", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const db = readDB();

  const orders = db.orders.filter(
    o => o.customerId === req.session.user.id
  );

  res.json(orders);
});

/* ---------------- ALL ORDERS (ADMIN) ---------------- */
app.get("/api/orders", (req, res) => {
  res.json(readDB().orders);
});

/* ---------------- UPDATE ORDER ---------------- */
app.put("/api/order/:id", (req, res) => {
  const db = readDB();

  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) return res.status(404).json({ error: "Not found" });

  order.status = req.body.status;

  writeDB(db);

  res.json(order);
});

/* ---------------- SUPPORT BOT ---------------- */
app.post("/api/support", (req, res) => {
  const msg = req.body.message.toLowerCase();

  let reply = "Sorry, I don't understand.";

  if (msg.includes("price")) {
    reply = "Data starts from GH₵4 depending on network.";
  }

  if (msg.includes("order")) {
    reply = "Go to order page and use your Customer ID.";
  }

  if (msg.includes("time")) {
    reply = "Orders are delivered within 1–2 minutes.";
  }

  res.json({ reply });
});

/* ---------------- REVENUE ---------------- */
app.get("/api/revenue", (req, res) => {
  const db = readDB();

  const delivered = db.orders.filter(o => o.status === "delivered");

  const revenue = delivered.reduce((sum, o) => sum + o.price, 0);

  res.json({
    totalOrders: delivered.length,
    revenue
  });
});

/* ---------------- AUTO ENGINE ---------------- */
function sendWhatsApp(phone, message) {
  console.log("📲 WhatsApp:", phone, message);
}

function processOrders() {
  const db = readDB();

  db.orders.forEach(order => {
    if (order.paymentStatus === "paid" && order.status === "processing") {
      order.status = "delivered";

      const customer = db.customers.find(c => c.id === order.customerId);

      if (customer) {
        sendWhatsApp(
          customer.phone,
          `✅ Order ${order.id} delivered successfully.`
        );
      }
    }
  });

  writeDB(db);
}

setInterval(processOrders, 8000);

/* ---------------- START ---------------- */
app.listen(PORT, () => {
  console.log("🚀 QuickData GH PRO SYSTEM RUNNING");
});