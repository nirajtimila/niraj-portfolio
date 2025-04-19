const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Example route where you launch Puppeteer
app.post('/submit', async (req, res) => {
  console.log('🚀 Let it begin...');

  try {
    // Launch Puppeteer with specific args for Heroku
    const browser = await puppeteer.launch({
      headless: true,  // Run in headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--single-process',
        '--disable-dev-shm-usage',  // Add this line to reduce memory usage on Heroku
        '--remote-debugging-port=9222'
      ],
    });

    const page = await browser.newPage();
    
    // Add your Puppeteer logic here, like navigating to a page and interacting with it
    await page.goto('https://example.com');
    const title = await page.title();
    console.log('Page Title:', title);

    await browser.close();
    
    res.status(200).send('Request processed successfully');
  } catch (err) {
    console.error('Error launching Puppeteer:', err);
    res.status(500).send('Something went wrong!');
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
