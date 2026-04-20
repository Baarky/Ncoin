import pkg from "pg";
import { ENV } from "./env.js";
  
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected");
    client.release();
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
};