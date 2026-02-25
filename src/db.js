const mongoose = require("mongoose");

async function initDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/labourDB";
  // avoid multiple connections on hot reload
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB Connected");
  }
}

function getDB() {
  // keep for compatibility; returns mongoose instance
  return mongoose;
}

mongoose.connection.on("error", console.error.bind(console, "❌ MongoDB connection error:"));

module.exports = { mongoose, initDB, getDB };