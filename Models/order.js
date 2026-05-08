
const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    qty: Number,
    options: Object,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema({
  deviceId: String,
  items: [OrderItemSchema],
  amount: Number, 
  status: { type: String, default: "open" },
  paystackReference: String,
  paymentInit: Object,
  scheduledFor: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
