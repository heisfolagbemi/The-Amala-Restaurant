const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema({
  name: String,
  choices: [String],
});

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  options: [OptionSchema], // ✅ supports objects now
});

module.exports = mongoose.model("MenuItem", MenuItemSchema);
