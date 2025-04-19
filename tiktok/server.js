const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");

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

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath || process.env.CHROMIUM_BIN,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    logs.push({ id, message: `Navigating to ${url}...` });

    await page.goto(url, { waitUntil: "networkidle2" });

    // Simulate doing something
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await browser.close();
    logs.push({ id, message: `✅ Done!` });

    res.status(200).json({ success: true, id });
  } catch (err) {
    logs.push({ id, message: `❌ Automation error: ${err.message}` });
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/progress", (req, res) => {
  res.json(logs);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
