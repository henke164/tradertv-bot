const Jimp = require('jimp');
const { recognize } = require("node-native-ocr");
const fs = require("fs");

let trades = {
  longs1: {},
  longs2: {},
  shorts1: {},
  shorts2: {},
};

function removeUnseen(trade) {
  if (Object.keys(trade).length === 0) {
    return;
  }

  let oldestUpdate;
  let newestUpdate;
  for (let i = 0; i < Object.keys(trade).length; i++) {
    const key = Object.keys(trade)[i];
    const updateTime = trade[key];

    if (!oldestUpdate || oldestUpdate.time > updateTime) {
      oldestUpdate = {
        key,
        time: updateTime,
      }
    }
    if (!newestUpdate || newestUpdate.time < updateTime) {
      newestUpdate = {
        key,
        time: updateTime,
      }
    }
  }

  const diff = newestUpdate.time - oldestUpdate.time;
  if (diff > 60000) {
    delete trade[oldestUpdate.key];
  }
}

function getTrades(txt, isMarquee) {
  const marqueeregex = /\| ([A-Z]{3,6}) \d*\.\d* |/g;
  const defaultregex = /([A-Z]{3,6}) \d*\.\d* |/g;
  const regex = isMarquee ? marqueeregex : defaultregex;

  const matches = txt.match(regex);
  if (!matches) {
    return [];
  }

  return matches.map(
    m => m.replace(/\|/g, '')
    .replace(/\d*\.\d*/, '')
    .trim()
  ).filter(m => m !== '');
}

async function isMarquee(c) {
  for (let i = 0; i < 32; i++) {
    const color = await c.getPixelColor(i, 25);
    if (color < 1000000000) {
      return false;
    }
  }
  return true;
}

function cropImage(tempImg, x, y, w, h, name) {
  return new Promise(resolve => {
    Jimp.read(tempImg, async (err, image) => {
      const c = await image
        .crop(x, y, w, h)
        .invert()
        .grayscale()
        .quality(60)
        .write(name);

      resolve(c);
    });
  });
}

async function readTrades(tempImg) {
  const topLeftImage = 'temp/top_left.jpg';
  const topRightImage = 'temp/top_right.jpg';
  const bottomLeftImage = 'temp/bottom_left.jpg';
  const bottomRightImage = 'temp/bottom_right.jpg';

  const tlCroppedImage = await cropImage(tempImg, 800, 1385, 740, 50, topLeftImage);
  const trCroppedImage = await cropImage(tempImg, 1845, 1385, 710, 50, topRightImage);
  const blCroppedImage = await cropImage(tempImg, 800, 1385 + 50, 740, 50, bottomLeftImage);
  const brCroppedImage = await cropImage(tempImg, 1845, 1385 + 50, 710, 50, bottomRightImage);

  const tlMarquee = await isMarquee(tlCroppedImage);
  const trMarquee = await isMarquee(trCroppedImage);
  const blMarquee = await isMarquee(blCroppedImage);
  const brMarquee = await isMarquee(brCroppedImage);

  const tlTxt = await recognize(fs.readFileSync(`${__dirname}/${topLeftImage}`));
  const trTxt = await recognize(fs.readFileSync(`${__dirname}/${topRightImage}`));
  const blTxt = await recognize(fs.readFileSync(`${__dirname}/${bottomLeftImage}`));
  const brTxt = await recognize(fs.readFileSync(`${__dirname}/${bottomRightImage}`));
  
  const longs1 = getTrades(tlTxt, tlMarquee);
  longs1.forEach(long => {
    trades.longs1[long] = Date.now();
  });

  const longs2 = getTrades(trTxt, trMarquee);
  longs2.forEach(long => {
    trades.longs2[long] = Date.now();
  });

  const shorts1 = getTrades(blTxt, blMarquee);
  shorts1.forEach(short => {
    trades.shorts1[short] = Date.now();
  });

  const shorts2 = getTrades(brTxt, brMarquee);
  shorts2.forEach(short => {
    trades.shorts2[short] = Date.now();
  });

  removeUnseen(trades.longs1);
  removeUnseen(trades.longs2);
  removeUnseen(trades.shorts1);
  removeUnseen(trades.shorts2);

  // Remove no positions

  console.log(trades);
  return {
    longs: [],
    shorts: [],
  };
}

module.exports = {
  readTrades,
};
