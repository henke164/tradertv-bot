const axios = require('axios');

async function getStockName(stockCode) {
  const res = await axios.get(`https://finance.yahoo.com/quote/${stockCode}`);
  const title = res.data.match(/<title>(.+?(?=\())/)[1];
  if (title.indexOf('Symbol Lookup from Yahoo') === 0) {
    return null;
  }
  return title.trim();
}

module.exports = {
  getStockName,
};
