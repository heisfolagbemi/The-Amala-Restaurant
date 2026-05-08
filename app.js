require("dotenv").config();
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const axios = require("axios");

const MenuItem = require("./Models/menuItem");
const Order = require("./Models/order");
const Session = require("./Models/session");

const app = express();
app.use(express.static("frontend"));
app.use(express.json());

const server = http.createServer(app);
const io = socketio(server);

mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" MongoDB connected"))
  .catch((error) => {
    console.error(" MongoDB error:", error);
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
    console.log(" Sample menu seeded");
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
  console.log(" New WebSocket connection");

  socket.emit("botMessage", "Welcome to RestaurantBot! " + menuText);

  socket.on("disconnect", () => {
    console.log(" WebSocket disconnected");
  });

  socket.on("userMessage", async (msg) => {
    console.log(` Message from user: ${msg}`);
    msg = msg.toString().trim();

    let userSession = await Session.findOne({ socketId: socket.id });
    if (!userSession) {
      userSession = await Session.create({
        socketId: socket.id,
        currentOrder: [],
        history: [],
      });
    }

    if (msg === "1") {
      const items = await MenuItem.find();
      let response = "🍴 Menu:\n";
      items.forEach((item, index) => {
        response += `${index + 1}. ${item.name} - ₦${item.price}\n`;
      });
      response += "\n👉 Send the item number to add it to your order.";
      socket.emit("botMessage", response);
      return;
    }

<<<<<<< HEAD
    if (
      !isNaN(msg) &&
      parseInt(msg) > 0 &&
      !["99", "98", "97", "0"].includes(msg)
    ) {
      const items = await MenuItem.find();
      const index = parseInt(msg) - 1;
      if (items[index]) {
        userSession.currentOrder.push(items[index]);
        await userSession.save();
        socket.emit(
          "botMessage",
          ` ${items[index].name} added to your order.\n\n${menuText}`,
        );
      } else {
        socket.emit("botMessage", " Invalid selection.\n\n" + menuText);
      }
      return;
    }
=======
    if (!isNaN(msg) && parseInt(msg) > 0 && !["99","98","97","0"].includes(msg)) {
  const items = await MenuItem.find();
  const index = parseInt(msg) - 1;
  if (items[index]) {
    userSession.currentOrder.push(items[index]);
    await userSession.save();
    socket.emit(
      "botMessage",
      ` ${items[index].name} added to your order.\n\n${menuText}`
    );
  } else {
    socket.emit("botMessage", " Invalid selection.\n\n" + menuText);
  }
  return;
}
>>>>>>> 61f3b2610b336e6f7b96f7d61abbcb32be42ea28

    if (msg === "99") {
      if (userSession.currentOrder.length === 0) {
        socket.emit("botMessage", " No order to place.\n\n" + menuText);
        return;
      }

      const total = userSession.currentOrder.reduce(
        (sum, i) => sum + Number(i.price),
<<<<<<< HEAD
        0,
=======
        0
>>>>>>> 61f3b2610b336e6f7b96f7d61abbcb32be42ea28
      );

      const order = await Order.create({
        items: userSession.currentOrder,
        total,
      });

      userSession.history.push(order);
      userSession.currentOrder = [];
      await userSession.save();

      try {
<<<<<<< HEAD
        const totalAmount = Math.floor(total * 100);
=======
        const totalAmount = Math.floor(total * 100); 
>>>>>>> 61f3b2610b336e6f7b96f7d61abbcb32be42ea28
        console.log("totalAmount sent to Paystack:", totalAmount);

        const response = await axios.post(
          "https://api.paystack.co/transaction/initialize",
          {
            email: "jonanjorin@gmail.com",
            amount: totalAmount,
            callback_url: `${process.env.BASE_URL}/paystack/callback`,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          },
        );

        const authUrl = response.data.data.authorization_url;
        socket.emit(
          "botMessage",
<<<<<<< HEAD
          ` Your total is ₦${total}.\nPlease pay here:\n${authUrl}`,
=======
          ` Your total is ₦${total}.\nPlease pay here:\n${authUrl}`
>>>>>>> 61f3b2610b336e6f7b96f7d61abbcb32be42ea28
        );
      } catch (error) {
        console.error(
          " Paystack init error:",
<<<<<<< HEAD
          error.response?.data || error.message,
=======
          error.response?.data || error.message
>>>>>>> 61f3b2610b336e6f7b96f7d61abbcb32be42ea28
        );
        socket.emit(
          "botMessage",
          " Payment initialization failed. Try again later.",
        );
      }
      return;
    }


    
    if (msg === "98") {
      if (userSession.history.length === 0) {
        socket.emit("botMessage", " No past orders.\n\n" + menuText);
      } else {
        let history = " Order History:\n";
        userSession.history.forEach((ord, idx) => {
          history += `${idx + 1}. ${ord.items
            .map((i) => i.name)
            .join(", ")} - ₦${ord.total}\n`;
        });
        socket.emit("botMessage", history + "\n\n" + menuText);
      }
      return;
    }

    
    if (msg === "97") {
      if (userSession.currentOrder.length === 0) {
        socket.emit("botMessage", " No current order.\n\n" + menuText);
      } else {
        let orderText = " Current order:\n";
        userSession.currentOrder.forEach((item, idx) => {
          orderText += `${idx + 1}. ${item.name} - ₦${item.price}\n`;
        });
        socket.emit("botMessage", orderText + "\n\n" + menuText);
      }
      return;
    }

    
    if (msg === "0") {
      userSession.currentOrder = [];
      await userSession.save();
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
      },
    );

    if (response.data.data.status === "success") {
      res.send(" Payment successful! Return to chatbot.");
    } else {
      res.send(" Payment failed or incomplete.");
    }
  } catch (error) {
    console.error(" Verify error:", error.response?.data || error.message);
    res.send(" Error verifying payment.");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
