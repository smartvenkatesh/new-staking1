import mongoose from "mongoose";


const configSchema = new mongoose.Schema({
  currencySymbol: String,
  type: String,
  plans: [
    {
      duration: Number,
      apr: Number,
    },
  ],
});

const Config = mongoose.model("Config",configSchema)

export default Config;