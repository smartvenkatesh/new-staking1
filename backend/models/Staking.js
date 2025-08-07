import mongoose from "mongoose";
import { types } from "web3";

const stakingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  amount: { type: Number, required: true },
  network: { type: String, enum: ["ETH", "AVAX"], required: true },
  stakeDate: { type: Date, default: Date.now },
  duration: Number,
  apr:Number,
  type: { type: String, required: true },
  status: { type: String, default: "active" },
  rewards: { type: Number, default: 0 },
  update: { type:Number, default:1}
});

export default mongoose.model("Staking", stakingSchema);

