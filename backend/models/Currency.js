import mongoose from "mongoose";

const currencySchema = new mongoose.Schema({
  currencySymbol: { type: String, required: true },
  currencyName: { type: String, required: true },
  minimumStake: { type: Number, required: true },
  currencyImage: { type: String, required: true },
  validator: {
    type: String,
    default: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
});

const Currency = mongoose.model("Currency", currencySchema);

export default Currency;
