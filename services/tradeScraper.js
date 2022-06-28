const puppeteer = require('puppeteer');
const fs = require('fs');
const { readTrades } = require('../utilities/readTrades');

const tempFolder= `${__dirname}/../temp`;

const trades = {
  longs: [],
  shorts: []
};

function handleTrades(longs, shorts, onNewTradesFound) {
  const previousState = JSON.parse(JSON.stringify(trades));

  for (let i = 0; i < longs.length; i++) {
    if (!trades.longs.includes(longs[i])) {
      trades.longs.push(longs[i]);
    }
  }

  for (let i = 0; i < shorts.length; i++) {
    if (!trades.shorts.includes(shorts[i])) {
      trades.shorts.push(shorts[i]);
    }
  }

  for (let i = 0; i < trades.longs.length; i++) {
    if (!longs.includes(trades.longs[i])) {
      trades.longs.splice(i, 1);
    }
  }

  for (let i = 0; i < trades.shorts.length; i++) {
    if (!shorts.includes(trades.shorts[i])) {
      trades.shorts.splice(i, 1);
    }
  }
  
  const buys = [];
  const sells = [];
  for (let i = 0; i < trades.longs.length; i++) {
    const key = trades.longs[i];
    if (!previousState.longs.includes(key)) {
      buys.push({
        type: 'LONG',
        key
      });
    }
  }

  for (let i = 0; i < previousState.longs.length; i++) {
    const key = previousState.longs[i];
    if (!trades.longs.includes(key)) {
      sells.push({
        type: 'LONG',
        key
      });
    }
  }

  for (let i = 0; i < trades.shorts.length; i++) {
    const key = trades.shorts[i];
    if (!previousState.shorts.includes(key)) {
      buys.push({
        type: 'SHORT',
        key
      });
    }
  }

  for (let i = 0; i < previousState.shorts.length; i++) {
    const key = previousState.shorts[i];
    if (!trades.shorts.includes(key)) {
      sells.push({
        type: 'SHORT',
        key
      });
    }
  }

  if (buys.length || sells.length) {
    onNewTradesFound({
      buys,
      sells
    });
  }
}

async function run(page, onNewTradesFound) {
  try {
    if (await page.$('#dismiss-button yt-button-renderer')) {
      await page.evaluate(() => {
        document.querySelector('#dismiss-button yt-button-renderer').click();
      });
    }

    if (await page.$('#dismiss-button a')) {
      await page.evaluate(() => {
        document.querySelector('#dismiss-button a').click();
      });
    }

    if (await page.$(".ytp-ad-skip-button")) {
      await page.evaluate(() => {
        document.querySelector('.ytp-ad-skip-button').click();
      });
    }

    await page.evaluate(() => {
      document.querySelector('video').playbackRate = 10;
    });
  } catch {

  }

  await page.screenshot({
    path: `${tempFolder}/screenshot.jpg`
  });

  const res = await readTrades(tempFolder);
  if (res) {
    const { longs, shorts } = res;
    handleTrades(longs, shorts, onNewTradesFound);
  }

  setTimeout(() => run(page, onNewTradesFound), 500);
}

async function startTradeScraper(url, onNewTradesFound) {
  const browser = await puppeteer.launch({
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
    ],
    defaultViewport: null,
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
    headless: true, 
  });

  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('[aria-label="Accept the use of cookies and other data for the purposes described"]');
  await page.click('[aria-label="Accept the use of cookies and other data for the purposes described"]');

  run(page, onNewTradesFound);
};

module.exports = {
  startTradeScraper,
};
