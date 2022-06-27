const puppeteer = require('puppeteer');
const fs = require('fs');

const { readTrades } = require('./readTrades');

const tempImg = `${__dirname}/temp/img.jpg`;

const trades = {
  longs: [],
  shorts: []
};

function setTrades(longs, shorts) {
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
  
  fs.writeFileSync('./trades.json', JSON.stringify(trades));
}

async function run(page) {
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
    path: tempImg
  });

  const res = await readTrades(tempImg);
  if (res) {
    const { longs, shorts } = res;
    setTrades(longs, shorts);
  }

  setTimeout(() => run(page), 0);
}

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
    ],
    defaultViewport: null,
    headless: true
  });
  const page = await browser.newPage();
  
  await page.goto('https://www.youtube.com/watch?v=1K9zLQHKvi0');
  await page.waitForSelector('[aria-label="Accept the use of cookies and other data for the purposes described"]');
  await page.click('[aria-label="Accept the use of cookies and other data for the purposes described"]');

  run(page);
})();
