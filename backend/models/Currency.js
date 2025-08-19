import mongoose from "mongoose";

const currencySchema = new mongoose.Schema({
  currencySymbol: String,
  currencyName: String,
});

const Currency = mongoose.model("Currency", currencySchema);

export default Currency;
