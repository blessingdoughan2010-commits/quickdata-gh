import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import session from "express-session";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "quickdata_final_system",
  resave: false,
  saveUninitialized: false
}));

const DB_FILE = "./db.json";

/* DB */
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* REGISTER */
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

/* LOGIN */
app.post("/api/login", (req, res) => {
  const db = readDB();

  const user = db.customers.find(c => c.id === req.body.customerId);

  if (!user) return res.status(404).json({ error: "Invalid ID" });

  req.session.user = user;

  res.json({ message: "Login successful", user });
});

/* ORDER */
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

  res.json({ order });
});

/* PAYMENT VERIFY */
app.post("/api/payment/verify", (req, res) => {
  const db = readDB();

  const order = db.orders.find(o => o.id === req.body.orderId);
  if (!order) return res.status(404).json({ error: "Not found" });

  order.paymentStatus = "paid";
  order.status = "processing";

  writeDB(db);

  res.json(order);
});

/* MY ORDERS */
app.get("/api/my-orders", (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

/* ADMIN LOGIN */
app.post("/api/admin/login", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "1234") {
    req.session.admin = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

/* PROTECT ADMIN */
function admin(req, res, next) {
  if (!req.session.admin) return res.status(403).end();
  next();
}

/* ORDERS */
app.get("/api/orders", admin, (req, res) => {
  res.json(readDB().orders);
});

/* STATS */
app.get("/api/stats", admin, (req, res) => {
  const db = readDB();

  const totalOrders = db.orders.length;
  const delivered = db.orders.filter(o => o.status === "delivered").length;
  const pending = db.orders.filter(o => o.status !== "delivered").length;
  const revenue = db.orders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + o.price, 0);

  res.json({ totalOrders, delivered, pending, revenue });
});

/* PROMO DRAW */
app.get("/api/promo/draw", (req, res) => {
  const db = readDB();

  const users = db.customers;
  const winner = users[Math.floor(Math.random() * users.length)];

  const result = {
    id: "PROMO-" + Date.now(),
    winnerId: winner.id,
    phone: winner.phone,
    date: new Date()
  };

  db.promos = db.promos || [];
  db.promos.push(result);

  writeDB(db);

  res.json(result);
});

/* AUTO DELIVERY */
function process() {
  const db = readDB();

  db.orders.forEach(o => {
    if (o.paymentStatus === "paid" && o.status === "processing") {
      o.status = "delivered";
    }
  });

  writeDB(db);
}

setInterval(process, 7000);

app.listen(PORT, () => console.log("QuickData GH LIVE 🚀"));