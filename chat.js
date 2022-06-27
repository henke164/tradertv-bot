const puppeteer = require('puppeteer');

let messages = [];

async function fetchNew(context) {
  const elements = await context.evaluate(() => {
    const el = document.querySelectorAll("yt-live-chat-text-message-renderer");
    return [...el].map(e => {
      return {
        id: e.getAttribute('id'),
        name: e.querySelector('#author-name').textContent,
        text: e.querySelector('#message').textContent
      }
    });
  });
  const diff = elements.filter(x => !messages.map(e => e.id).includes(x.id));
  messages = elements;
  return diff;
}

async function run(context) {
  const msg = await fetchNew(context);
  const regex = /(\$[A-Z]+) (\d*\.\d*)/g;
  
  const longSignal = msg.filter(m => m.name === 'Bears Vs. Bulls ' && 
    m.text.indexOf('LONG: ') > -1)[0];

  if (longSignal) {
    const longs = longSignal.text.match(regex);
    console.log("LONG", longs);
  }

  const shortSignal = msg.filter(m => m.name === 'Bears Vs. Bulls ' && 
    m.text.indexOf('SHORT: ') > -1)[0];

  if (shortSignal) {
    const shorts = shortSignal.text.match(regex);
    console.log("SHORT", shorts);
  }
  setTimeout(() => run(context), 1500);
}

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    headless: false
  });
  const page = await browser.newPage();
  
  await page.goto('https://www.youtube.com/watch?v=M2abw-eh_JI');
  await page.waitForSelector('[aria-label="Accept the use of cookies and other data for the purposes described"]');
  await page.click('[aria-label="Accept the use of cookies and other data for the purposes described"]');

  await page.waitForTimeout(3000);

  const elementHandle = await page.waitForSelector('#chat iframe');
  const frame = await elementHandle.contentFrame();
  const context = await frame.executionContext();

  run(context);
})();
