import mongoose from "mongoose";


const configSchema = new mongoose.Schema({
    currencySymbol:String,
    apr:Number,
    duration:[Number],
    type:String
})

const Config = mongoose.model("Config",configSchema)

export default Config;