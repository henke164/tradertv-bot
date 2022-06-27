const Jimp = require('jimp');
const { recognize } = require("node-native-ocr");
const fs = require("fs");

let topLeftStr = "";
let topRightStr = "";
let bottomLeftStr = "";
let bottomRightStr = "";

function cropImage(tempImg, x, y, w, h, name) {
  return new Promise(resolve => {
    Jimp.read(tempImg, (err, image) => {
      image
        .crop(x, y, w, h)
        .invert()
        .grayscale()
        .quality(60)
        .write(name, resolve);
    });
  });
}

async function readTrades(tempImg) {
  const topLeftImage = 'temp/top_left.jpg';
  const topRightImage = 'temp/top_right.jpg';
  const bottomLeftImage = 'temp/bottom_left.jpg';
  const bottomRightImage = 'temp/bottom_right.jpg';

  await cropImage(tempImg, 800, 1385, 740, 50, topLeftImage);
  await cropImage(tempImg, 1845, 1385, 710, 50, topRightImage);
  await cropImage(tempImg, 800, 1385 + 50, 740, 50, bottomLeftImage);
  await cropImage(tempImg, 1845, 1385 + 50, 710, 50, bottomRightImage);

  const leftBuffer = fs.readFileSync(`${__dirname}/${topLeftImage}`);
  const resLeft = await recognize(leftBuffer, {
    output: null
  });

  const rightBuffer = fs.readFileSync(`${__dirname}/${topRightImage}`);
  const resRight = await recognize(rightBuffer, {
    output: null
  });

  let longs = [];
  let shorts = [];
  
  if (!resLeft.includes('|') && !resRight.includes('|')) {
    if (!resLeft.includes('no positions') || !resRight.includes('no positions')) {
      return null;
    }

    return {
      longs,
      shorts
    }
  }

  const leftArr = resLeft.split('\n');
  const rightArr = resRight.split('\n');

  if (leftArr.length < 2 || rightArr.length < 2) {
    return {
      longs,
      shorts,
    }
  }

  longs = [...leftArr[0].split('|'), ...rightArr[0].split('|')];
  shorts = [...leftArr[1].split('|'), ...rightArr[1].split('|')];

  return {
    longs: longs.map(l => l.trim()).filter(l => !!l && l.toLowerCase() !== 'no positions'),
    shorts: shorts.map(s => s.trim()).filter(s => !!s && s.toLowerCase() !== 'no positions'),
  };
}

module.exports = {
  readTrades,
};
