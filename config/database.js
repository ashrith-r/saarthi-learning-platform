
import mongoose from "mongoose"; 
import config from "../config/config.js";

const {MONGO_URL} = config;
async function connectDB()
{
 await mongoose.connect(MONGO_URL);
 console.log("Database connected Successfully!")
}

export default connectDB

