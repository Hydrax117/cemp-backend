// Importing required modules
import express from "express";
import connectToDB from "./config/database.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
//const express = require("express");
//const connectToDB = require("./config/database.js");
//const cors = require("cors");
//const userRoutes = require("./routes/userRoutes.js");

require("dotenv").config();
connectToDB();
// Create an Express application
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//API routes
app.use("/api/users", userRoutes);

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
