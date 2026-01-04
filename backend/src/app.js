import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { connectTosocket } from "./controllers/socketManager.js"; // <-- Named import
import userRoutes from "./routes/users.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectTosocket(server); // <-- Use the named function

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);

app.set("port", process.env.PORT || 8080);

app.get("/home", (req, res) => {
  return res.json({ Hello: "world" });
});

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://krakesh82023:a0uPC50cGtG4eoA8@cluster0.e8cixgd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ Mongo Connected");
    server.listen(app.get("port"), () => {
      console.log(` App is Listening on port ${app.get("port")}`);
    });
  } catch (err) {
    console.error(" DB Connection Error:", err.message);
    process.exit(1);
  }
};

start();
