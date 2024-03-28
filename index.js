// Importing required modules
const express = require("express");
const database = require("./config/database");

require("dotenv").config();
// Create an Express application
const app = express();

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
database();
