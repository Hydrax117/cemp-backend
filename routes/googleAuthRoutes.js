// const express = require("express");
import { Router } from "express";
import axios from "axios";
const router = Router();

const CLIENT_ID =
  "654568835248-7s7e5tfapjk5r7j6od4ejrffgb13g9db.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5173/login";

// Initiates the Google Login flow
router.get("/auth/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(url);
});

// Callback URL for handling the Google Login response
router.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for access token
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token, id_token } = data;

    // Use access_token or id_token to fetch user profile
    const { data: profile } = await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    // Code to handle user authentication and retrieval using the profile data

    res.redirect("/");
  } catch (error) {
    console.error("Error:", error.response.data.error);
    res.redirect("/login");
  }
});

// Logout route
router.get("/logout", (req, res) => {
  // Code to handle user logout
  res.redirect("/login");
});

export default router;
