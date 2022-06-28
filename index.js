const { Server } = require("socket.io");
const { startTradeScraper } = require("./services/tradeScraper");
const { getStockName } = require("./services/stockService");

const url = "https://youtu.be/vPRda_0f9To?t=1706";

const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

async function onNewTradesFound({ buys, sells }) {
  console.log('--New trades--');
  console.log('BUYS:', buys);
  console.log('SELLS:', sells);
  console.log('--------------');
  
  io.send(JSON.stringify({
    trades: [
      ...(await Promise.all(buys.map(async b => ({
        type: b.type,
        direction: 'buy',
        stock: await getStockName(b.key)
      })))).filter(b => b.stock !== null),
      ...(await Promise.all(sells.map(async s => ({
        type: s.type,
        direction: 'sell',
        stock: await getStockName(s.key)
      })))).filter(b => b.stock !== null),
    ]
  }));
}

startTradeScraper(url, onNewTradesFound);