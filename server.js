const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

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
// Define Routes
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));

const port = process.env.PORT || 5500;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
