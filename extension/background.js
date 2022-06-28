const urls = [
  'https://demo-deal.ig.com'
];

function injectTradingScript(tab) {
  console.log("Injecting script");
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (document.getElementById('ig-bot-script')) {
        console.log("Script already initialized");
        return;
      }
      
      var script = document.createElement('script');
      script.setAttribute('id', 'ig-bot-script');
      script.src = chrome.runtime.getURL("botScript.js");
      (document.head || document.documentElement).appendChild(script);
    },
  });
}

function getTabInfo() {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
    for (let i = 0; i < urls.length; i++) {
      if (url.indexOf(urls[i]) === 0) {
        injectTradingScript(tabs[0]);
        break;
      }
    }
  });
}

chrome.tabs.onActivated.addListener(getTabInfo);
chrome.tabs.onUpdated.addListener(getTabInfo);