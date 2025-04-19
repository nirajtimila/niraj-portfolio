const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

let logs = [];

app.use(express.json());
app.use(express.static("public"));

app.post("/submit", async (req, res) => {
  const { url } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  logs.push({ id, message: `🚀 Let it begin...` });

  try {
    logs.push({ id, message: `Launching Puppeteer...` });

    // Launch Puppeteer with Heroku-compatible settings
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--single-process',
        '--disable-dev-shm-usage', // To prevent memory issues
        '--remote-debugging-port=9222'
      ],
      executablePath: process.env.CHROMIUM_BIN || await chromium.executablePath, // Use Heroku chromium
      headless: true,
    });

    logs.push({ id, message: `Navigating to site...` });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    logs.push({ id, message: `Page loaded. Performing action...` });

    // Simulate work (replace with real action)
    await new Promise(resolve => setTimeout(resolve, 5000));

    await browser.close();
    logs.push({ id, message: `✅ Done!` });

    res.status(200).json({ success: true, id });
  } catch (err) {
    logs.push({ id, message: `❌ Error: ${err.message}` });
    res.status(500).json({ success: false, error: err.message, id });
  }
});

app.get("/progress", (req, res) => {
  res.json(logs);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
