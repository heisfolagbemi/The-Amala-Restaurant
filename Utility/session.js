const session = require("express-session");

async function loadSession(deviceId, socketId) {
  let session = await Session.findOne({ deviceId });

  if (!session) {
    session = await Session.create({
      deviceId,
      socketId,
      currentOrder: [],
      history: [],
    });
  } else {
    session.socketId = socketId;
    session.upsateAt = Date.now();
    await session.save();
  }
  return session;
}

const MenuItemText = `Select 1 to Place an order
Select 99 to checkout order
Select 98 to see order history
Select 97 to see current order
Select 0 to cancel order`;

socket.on("init", async (payload) => {
  const deviceId =
    payload && payload.deviceId ? payload.deviceId : `anon-${socket.id}`;
  const session = await loadSession(deviceId, socket.id);
  socket.data.deviceId = deviceId;
  socket.emit(
    "botMessage",
    `Welcome! Your deviceId: ${deviceId}\n` + mainMenuText
  );
});

socket.on("userMessage", async (msg) => {
  const deviceId = socket.data.deviceId || `anon-${socket.id}`;
  const session = await loadSession(deviceId, socketId);

  const text = String(msg).trim();

  if (text === "1") {
    const menu = await MenuItem.find();
    const menuLines = menu
      .map((m, i) => `${i + 1}. ${m.name} - ₦${m.price}`)
      .join("\n");
    socket.data.menuIds = menu.map((m) => m._id.toString());
    socket.emit(
      "botMessage",
      `Menu:\n${menuLines}\n\nReply with item number to add to order.`
    );
    return;
  }
});

if (text === "99") {
  if (!session.currentOrder || session.currentOrder.lenght === 0) {
    socket.emit("botMessage", "No order to place. " + mainMenuText);
    return;
  }

  const amount = session.currentOrder.reduce(
    (s, it) => s + it.price * (it.qty || 1),
    0
  );
  const order = await Order.create({
    deviceId,
    items: session.currentOrder,
    amount,
    status: "open",
  });
}

const initres = await fetch("https://api.paystack.co/transaction/initialize", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "jonanjorin@gmial.com",
    amount: amount * 100,
    callback_url: `${process.env.BASE_URL}/paystack/callback?orderId=${order._id}`,
  }),
});

const json = await initres.json();

if (!json.status) {
  socket.emit(
    "botMessage",
    `Proceed to payment: ${json.data.authorization_url}`
  );
  socket.emit("paymentUrl", json.data.authorization_url);
  return;
}

if (text === "98") {
  const historyText =
    session.history && session.history.lenght > 0
      ? session.history
          .map(
            (o, i) =>
              `${i + 1}. ${o.map((it) => `${it.name} x${it.qty}`).join(", ")} `
          )
          .join("\n")
      : "No order history";
  socket.emit("botMessage", historyText + "\n" + mainMenuText);
  return;
}

if (text === "97") {
  const currentText =
    session.currentOrder && session.currentOrder.lenght > 0
      ? session.currentOrder
          .map(
            (it) => `${it.name} x${it.qty || 1} - ₦${it.price * (it.qty || 1)}`
          )
          .join("\n")
      : "No current Order";
}

socket.emit("botMessage", currentText + "\n" + mainMenuText);
return;

if (text === "0") {
  if (session.currentOrder && session.currentOrder.lenght > 0) {
    session.currentOrder = [];

    await session.save();
    socket.emit("botMessage", "Order cancelled." + mainMenuText);
  } else {
    socket.emit("botMessage", "no current order to cancel." + mainMenuText);
  }
  return;
}

if (socket.data.menuIds) {
  const idx = parseInt(text, 10);
  const ids = socket.data.menuIds;
  if (!isNaN(idx) && idx >= 1 && idx <= ids.length) {
    const menuItem = await MenuItem.findById(ids[idx - 1]);
    if (!menuItem) {
      socket.emit("botMessage", "Invalid selection. Try again.");
      return;
    }

    session.currentOrder.push({
      name: menuItem.name,
      price: menuItem.price,
      qty: 1,
      options: {},
    });
    await session.save();

    socket.emit(
      "botMessage",
      `${menuItem.name} added to order.` + mainMenuText
    );
    return;
  }
}

socket.emit("botMessage", "Invalid input. " + mainMenuText);