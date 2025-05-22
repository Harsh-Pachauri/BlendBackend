// src/index.js

import dotenv from "dotenv";
import connectDB from "./db/index.js";
// import { app } from "./app.js";
import app from "./app.js";

dotenv.config({
  path: "./.env"
});

await connectDB(); // assume this connects successfully

export default app; // ✅ NO app.listen()
