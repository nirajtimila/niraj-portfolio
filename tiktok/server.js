const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve HTML from 'public' folder if it exists, otherwise return a 404
const publicFolderPath = path.join(__dirname, 'public');
if (fs.existsSync(publicFolderPath)) {
  app.use(express.static(publicFolderPath)); 
} else {
  console.warn('Public folder not found.');
}

// Global variables to store logs and client response
let clientRes = null;
let logs = [];

// Endpoint for serving logs to the client in real-time
app.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clientRes = res;

  const sendLog = (log) => {
    res.write(`data: ${log}\n\n`);
  };

  logs.forEach(sendLog);
});

// Utility function to log messages
function pushLog(message) {
  console.log(message); // Log to the terminal
  logs.push(message);
  if (clientRes) clientRes.write(`data: ${message}\n\n`); // Send log to client
}

// API endpoint to handle the submission of the TikTok link
app.post('/submit', async (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ message: "TikTok link is required" });

  let browser;

  try {
    logs = []; // Reset logs for each new submission
    pushLog("🚀 Let it begin...");

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    pushLog("🌐 Navigating to site...");
    await page.goto('https://leofame.com/free-tiktok-views', { waitUntil: 'domcontentloaded' });

    pushLog("📝 Typing TikTok link...");
    await page.waitForSelector('input[name="free_link"]', { timeout: 10000 });
    await page.type('input[name="free_link"]', link);

    pushLog("🚀 Submitting...");
    await page.click('button[type="submit"]');

    pushLog("⏳ Waiting for progress...");
    await page.waitForSelector('.progress-bar', { timeout: 60000 });

    for (let progress = 0; progress <= 100; progress += 2) {
      pushLog(`Progress: ${progress}%`);
      if (clientRes) {
        clientRes.write(`data: Progress: ${progress}%\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    await page.waitForFunction(() => {
      const el = document.querySelector('.progress-bar');
      return el && (el.innerText.includes("100") || el.style.width === "100%");
    }, { timeout: 60000 });

    pushLog("✅ Progress complete. Finalizing...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    pushLog("🔍 Checking result...");
    const popupStatus = await page.evaluate(() => {
      const popup = document.querySelector('.swal2-popup.swal2-modal.swal2-icon-success.swal2-show');
      if (!popup) return 'No Popup';
      const icon = popup.querySelector('.swal2-icon');
      if (icon && icon.classList.contains('swal2-icon-error')) return 'Error';
      if (popup.classList.contains('swal2-icon-success')) return 'Success';
      return 'Unknown';
    });

    await browser.close();

    if (popupStatus === 'Success') {
      pushLog("🎉 Success: Views added!");
      return res.json({ message: "✅ Success: Views successfully added!" });
    } else if (popupStatus === 'Error') {
      pushLog("❌ Error: Submission failed.");
      return res.json({ message: "⚠️ Error: Try again later." });
    } else {
      pushLog("❔ Unknown popup status.");
      return res.json({ message: "⚠️ Error: Try again later." });
    }

  } catch (err) {
    if (browser) await browser.close();
    pushLog(`❌ Error: ${err.message}`);
    return res.status(500).json({ message: "❌ Automation error: " + err.message });
  }
});

// ✅ Listen on all interfaces and dynamic port for cloud deployment (Heroku)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
