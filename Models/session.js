const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    qty: { type: Number, default: 1 },
    options: { type: Object, default: {} },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema({
  deviceId: { type: String, index: true },
  socketId: String,
  currentOrder: { type: [OrderItemSchema], default: [] },
  history: { type: [Object], default: [] }, 
  inMenu: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", SessionSchema);
