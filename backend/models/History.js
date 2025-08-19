import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
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
      stakeAddress:String,
      amount: { type: Number, required: true },
      network: { type: String, enum: ["ETH", "AVAX"], required: true },
      stakeDate: { type: Date, default: Date.now },
      duration: Number,
      apr:Number,
      type: { type: String, required: true },
      status: { type: String, default: "active" },
      rewards: Number,
      update: { type:Number, default:1}
})

const History = mongoose.model("History",historySchema)

export default History;