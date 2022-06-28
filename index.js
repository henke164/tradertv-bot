const { Server } = require("socket.io");
const { startTradeScraper } = require("./services/tradeScraper");

const url = "https://youtu.be/vPRda_0f9To?t=1706";

const io = new Server(3000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

function onNewTradesFound({ buys, sells }) {
  console.log('--New trades--');
  console.log('BUYS:', buys);
  console.log('SELLS:', sells);
  console.log('--------------');
  io.send(JSON.stringify({
    buys,
    sells,
  }));
}

startTradeScraper(url, onNewTradesFound);