async function waitForSelector(selector, alternative) {
  return new Promise(resolve => {
    const ival = setInterval(() => {
      if (document.querySelector(selector) || document.querySelector(alternative)) {
        clearTimeout(ival);
        resolve();
      }
    }, 100);
  });
}

async function doKeyPress(element) {
  var ev = new KeyboardEvent('keyup', {
    altKey:false,
    bubbles: true,
    cancelBubble: false, 
    cancelable: true,
    charCode: 0,
    code: "Enter",
    composed: true,
    ctrlKey: false,
    currentTarget: null,
    defaultPrevented: true,
    detail: 0,
    eventPhase: 0,
    isComposing: false,
    isTrusted: true,
    key: "Enter",
    keyCode: 13,
    location: 0,
    metaKey: false,
    repeat: false,
    returnValue: false,
    shiftKey: false,
    type: "keyup",
    which: 13
  });

  element.dispatchEvent(ev);
}

async function buyLong(name) {
  await buy(name, true);
}

async function buyShort(name) {
  await buy(name, false);
}

async function buy(name, isLong) {
  if (!document.querySelector('.ig-search-input-wrapper')) {
    document.querySelector('.platform-navigation_menu-item--search').click();
  }

  await waitForSelector('.ig-search-input-wrapper input');
  document.querySelector('.ig-search-input-wrapper input').value = name;
  doKeyPress(document.querySelector('.ig-search-input-wrapper input'));

  await waitForSelector('.browse-results-grid li', '.ig-browse.ig-browse--search .ig-grid_empty');
  if (document.querySelector('.ig-browse.ig-browse--search .ig-grid_empty')) {
    return;
  }

  document.querySelector('.browse-results-grid li').click();

  await waitForSelector('[data-automation="DEAL_NOW"]');

  if (!document.querySelector('.ticket-form')) {
    document.querySelector('[data-automation="DEAL_NOW"]').click();
  }

  let element = isLong ? '.ig-ticket-price-button--buy' : '.ig-ticket-price-button--sell';

  await waitForSelector(element);

  await waitForSelector(".numeric-input-with-incrementors.ember-view input");

  $(".numeric-input-with-incrementors.ember-view input:first").val("2");
  $(".ig-ticket-size-field .numeric-input-with-incrementors_increment").mousedown();
  $(".ig-ticket-size-field .numeric-input-with-incrementors_increment").mouseup();

  document.querySelector(element).click();

  let waitForElement = isLong ? '.btn-price-buy-selected' : '.btn-price-sell-selected';
  await waitForSelector(waitForElement);

  return new Promise(resolve => {
    setTimeout(() => {
      $('[data-automation="ig-action-submit-button"]').click();
      setTimeout(() => {
        $('[data-automation="closeFlyout"]').click();
        resolve();
      }, 100);
    }, 500);
  });
}

async function sell(name) {
  const positionElements = document.querySelectorAll('[data-automation="ig-positions"] li .cell-market-name_name');
  const positions = [...positionElements];

  const searchArr = name.toLowerCase().split(' ');
  for (let i = 0; i < positions.length; i++) {
    const positionArr = positions[i].textContent.toLowerCase().replace('\n', '').trim().split(' ');
    const intersection = searchArr.filter(element => positionArr.includes(element));
    if (intersection.length > 0) {
      positions[i].parentElement.parentElement.parentElement.querySelector('[data-automation="close"] button').click();
    }
  }
}

let tradeQueue = [];
const ioScriptElement = document.createElement('script');
ioScriptElement.setAttribute('src', 'https://cdn.socket.io/4.5.0/socket.io.min.js')
document.head.append(ioScriptElement);
ioScriptElement.onload = function() {
  const socket = io("ws://localhost:3000");
  socket.on("message", async (msg) => {
    const { trades } = JSON.parse(msg);
    tradeQueue.push(...trades);
  });
}

async function handleQueue() {
  if (tradeQueue.length === 0) {
    return setTimeout(handleQueue, 500);
  }
  const trade = tradeQueue.splice(0, 1)[0];

  console.log('handle', trade);
  if (trade.direction === 'buy') {
    if (trade.type === 'LONG') {
      await buyLong(trade.stock);
    } else {
      await buyShort(trade.stock);
    }
  } else {
    await sell(trade.stock);

  }

  setTimeout(handleQueue, 100);
}

handleQueue();