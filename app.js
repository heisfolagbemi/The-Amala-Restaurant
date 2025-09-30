require("dotenv").config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios");

const MenuItem = require("./Models/menuItem");
const Order = require("./Models/order");
const Session = require("./Models/session.");

const app = express();
app.use(express.static("frontend"));
app.use(express.json());

const server = http.createServer(app);
const io = socketio(server);

// ========== MONGO CONNECTION ==========
mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((error) => {
    console.error("❌ MongoDB error:", error);
    process.exit(1);
  });


async function ensureMenu() {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    await MenuItem.create([
      {
        name: "Amala Combo",
        description: "Amala, Ewedu and Gbegiri, assorted meat",
        price: 12000,
        options: [
          {
            name: "Customize your Combo",
            choices: ["without Gbegiri", "with Ewedu"],
          },
        ],
      },
      {
        name: "Rice Combo",
        description: "Jollof and Fried rice, protein and salad",
        price: 6000,
        options: [
          { name: "Customize your combo", choices: ["small", "large"] },
        ],
      },
      {
        name: "Soda",
        description: "Soft drink",
        price: 1000,
        options: [{ name: "Flavor", choices: ["Fanta", "Pepsi", "Water"] }],
      },
    ]);
    console.log("🍽️ Sample menu seeded");
  }
}
ensureMenu();


const menuText = `
Select an option:
1 Place an order
99 Checkout order
98 See order history
97 See current order
0 Cancel order
`;

io.on("connection", (socket) => {
  console.log("✅ New WebSocket connection");

  socket.emit("botMessage", "Welcome to RestaurantBot! " + menuText);

  socket.on("disconnect", () => {
    console.log(" WebSocket disconnected");
  });

  socket.on("userMessage", async (msg) => {
    console.log(`Message from user: ${msg}`);
    msg = msg.toString().trim();

    let session = await Session.findOne({ socketId: socket.id });
    if (!session) {
      session = await Session.create({
        socketId: socket.id,
        currentOrder: [],
        orderHistory: [],
      });
    }

    // 1. Place order
    if (msg === "1") {
      const items = await MenuItem.find();
      let response = "🍴 Menu:\n";
      items.forEach((item, index) => {
        response += `${index + 1}. ${item.name} - ₦${item.price}\n`;
      });
      response += "\nSend the item number to add it to your order.";
      socket.emit("botMessage", response);
      return;
    }

    if (!isNaN(msg) && parseInt(msg) > 0) {
      const items = await MenuItem.find();
      const index = parseInt(msg) - 1;
      if (items[index]) {
        session.currentOrder.push(items[index]);
        await session.save();
        socket.emit(
          "botMessage",
          `${items[index].name} added to your order ✅\n\n${menuText}`
        );
      } else {
        socket.emit("botMessage", " Invalid selection.\n\n" + menuText);
      }
      return;
    }

    if (msg === "99") {
      if (session.currentOrder.length === 0) {
        socket.emit("botMessage", " No order to place.\n\n" + menuText);
        return;
      }

      const order = await Order.create({
        items: session.currentOrder,
        total: session.currentOrder.reduce((sum, i) => sum + i.price, 0),
      });
      session.orderHistory.push(order);
      await session.save();

      try {
        const response = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: "test@example.com", 
            amount: order.total * 100, 
            callback_url: `${process.env.BASE_URL}/paystack/callback`,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        const authUrl = response.data.data.authorization_url;
        socket.emit(
          "botMessage",
          ` Your total is ₦${order.total}.\nPlease pay using this link:\n${authUrl}`
        );
      } catch (error) {
        console.error(
          "Paystack init error:",
          error.response?.data || error.message
        );
        socket.emit(
          "botMessage",
          " Payment initialization failed. Try again later."
        );
      }
      return;
    }

    if (msg === "98") {
      if (session.orderHistory.length === 0) {
        socket.emit("botMessage", " No past orders.\n\n" + menuText);
      } else {
        let history = " Order History:\n";
        session.orderHistory.forEach((ord, idx) => {
          history += `${idx + 1}. ${ord.items
            .map((i) => i.name)
            .join(", ")} - ₦${ord.total}\n`;
        });
        socket.emit("botMessage", history + "\n\n" + menuText);
      }
      return;
    }

    if (msg === "97") {
      if (session.currentOrder.length === 0) {
        socket.emit("botMessage", " No current order.\n\n" + menuText);
      } else {
        let orderText = " Current order:\n";
        session.currentOrder.forEach((item, idx) => {
          orderText += `${idx + 1}. ${item.name} - ₦${item.price}\n`;
        });
        socket.emit("botMessage", orderText + "\n\n" + menuText);
      }
      return;
    }

    if (msg === "0") {
      session.currentOrder = [];
      await session.save();
      socket.emit("botMessage", " Order cancelled.\n\n" + menuText);
      return;
    }

    socket.emit("botMessage", " Invalid option.\n\n" + menuText);
  });
});

app.get("/paystack/callback", async (req, res) => {
  const reference = req.query.reference;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (response.data.data.status === "success") {
      res.send(" Payment successful! Return to chatbot.");
    } else {
      res.send(" Payment failed or incomplete.");
    }
  } catch (error) {
    console.error("Verify error:", error.response?.data || error.message);
    res.send(" Error verifying payment.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
