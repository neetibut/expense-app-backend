const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// After connecting to DB and setting up middleware
const Test = require("./models/Test");

app.get("/test", async (req, res) => {
  try {
    const testDoc = new Test({ name: "Test Document" });
    await testDoc.save();
    res.send("Test document saved to MongoDB");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

const port = process.env.PORT || 5500;

// Routes
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
