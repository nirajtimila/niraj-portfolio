const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.post("/submit", async (req, res) => {
  const { url } = req.body;
  let logs = [];

  try {
    logs.push("Launching browser...");
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath || '/usr/bin/google-chrome',
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Simulate action
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
    logs.push("✅ Done!");
    res.status(200).json({ success: true, logs });
  } catch (error) {
    logs.push(`❌ Automation error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message, logs });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
