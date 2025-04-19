const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML from 'public' folder

let clientRes = null;
let logs = [];

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

  // Clean up if client disconnects
  req.on('close', () => {
    console.log("👋 Client disconnected from progress stream.");
    clientRes = null;
  });
});

function pushLog(message) {
  console.log(message); // Log to terminal
  logs.push(message);
  if (clientRes) clientRes.write(`data: ${message}\n\n`);
}

app.post('/submit', async (req, res) => {
  const { link } = req.body;
  console.log("📩 Received request body:", req.body);

  if (!link) {
    pushLog("❌ Missing TikTok link.");
    return res.status(400).json({ message: "TikTok link is required" });
  }

  let browser;
  logs = []; // Reset logs for this session

  try {
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

    pushLog("⏳ Waiting for progress bar...");
    await page.waitForSelector('.progress-bar', { timeout: 60000 });

    for (let progress = 0; progress <= 100; progress += 2) {
      pushLog(`Progress: ${progress}%`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Wait for actual completion (in browser)
    await page.waitForFunction(() => {
      const el = document.querySelector('.progress-bar');
      return el && (el.innerText.includes("100") || el.style.width === "100%");
    }, { timeout: 60000 });

    pushLog("✅ Progress complete. Finalizing...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    pushLog("🔍 Checking result...");
    const popupStatus = await page.evaluate(() => {
      try {
        const popup = document.querySelector('.swal2-popup.swal2-modal.swal2-icon-success.swal2-show');
        if (!popup) return 'No Popup';
        const icon = popup.querySelector('.swal2-icon');
        if (icon && icon.classList.contains('swal2-icon-error')) return 'Error';
        if (popup.classList.contains('swal2-icon-success')) return 'Success';
        return 'Unknown';
      } catch (e) {
        return 'Eval Error';
      }
    });

    await browser.close();

    switch (popupStatus) {
      case 'Success':
        pushLog("🎉 Success: Views added!");
        return res.json({ message: "✅ Success: Views successfully added!" });
      case 'Error':
        pushLog("❌ Error: Submission failed.");
        return res.json({ message: "⚠️ Error: Try again later." });
      case 'Eval Error':
        pushLog("❌ Error in evaluating result status.");
        return res.status(500).json({ message: "⚠️ Unable to check result status." });
      default:
        pushLog("❔ Unknown popup status.");
        return res.json({ message: "⚠️ Error: Try again later." });
    }

  } catch (err) {
    if (browser) await browser.close();
    pushLog(`❌ Caught Exception: ${err.message}`);
    return res.status(500).json({ message: "❌ Automation error: " + err.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`)
);
