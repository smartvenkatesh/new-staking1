import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import stackingRoutes from "./routes/stackingRoutes.js";

dotenv.config();
const app = express();

app.use(cors())

app.use(express.json());

app.use("/staking", stackingRoutes);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.error(err));

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
