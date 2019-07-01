// Param values from https://developer.mozilla.org/Add-ons/WebExtensions/API/contextualIdentities/create
const GOOGLE_CONTAINER_NAME = "Google";
const GOOGLE_CONTAINER_COLOR = "blue";
const GOOGLE_CONTAINER_ICON = "circle";
var re = /http(s?):\/\/(www?).google.(com|ad|ae|com.af|com.ag|com.ai|al|am|co.ao|com.ar|as|at|com.au|az|ba|com.bd|be|bf|bg|com.bh|bi|bj|com.bn|com.bo|com.br|bs|bt|co.bw|by|com.bz|ca|cd|cf|cg|ch|ci|co.ck|cl|cm|cn|com.co|co.cr|com.cu|cv|com.cy|cz|de|dj|dk|dm|com.do|dz|com.ec|ee|com.eg|es|com.et|fi|com.fj|fm|fr|ga|ge|gg|com.gh|com.gi|gl|gm|gp|gr|com.gt|gy|com.hk|hn|hr|ht|hu|co.id|ie|co.il|im|co.in|iq|is|it|je|com.jm|jo|co.jp|co.ke|com.kh|ki|kg|co.kr|com.kw|kz|la|com.lb|li|lk|co.ls|lt|lu|lv|com.ly|co.ma|md|me|mg|mk|ml|com.mm|mn|ms|com.mt|mu|mv|mw|com.mx|com.my|co.mz|com.na|com.nf|com.ng|com.ni|ne|nl|no|com.np|nr|nu|co.nz|com.om|com.pa|com.pe|com.pg|com.ph|com.pk|pl|pn|com.pr|ps|pt|com.py|com.qa|ro|ru|rw|com.sa|com.sb|sc|se|com.sg|sh|si|sk|com.sl|sn|so|sm|sr|st|com.sv|td|tg|co.th|com.tj|tk|tl|tm|tn|to|com.tr|tt|com.tw|co.tz|com.ua|co.ug|co.uk|com.uy|co.uz|com.vc|co.ve|vg|co.vi|com.vn|vu|ws|rs|co.za|co.zm|co.zw|cat)\/*/;

function getContexts() {
  return browser.contextualIdentities.query({name: GOOGLE_CONTAINER_NAME});
}

async function setupOrFetchContainer () {
  // use existing Google container, or create one
  const contexts = await browser.contextualIdentities.query({name: GOOGLE_CONTAINER_NAME});
  if (contexts.length > 0) {
    googleCookieStoreId = contexts[0].cookieStoreId;
  } else {
    const context = await browser.contextualIdentities.create({
      name: GOOGLE_CONTAINER_NAME,
      color: GOOGLE_CONTAINER_COLOR,
      icon: GOOGLE_CONTAINER_ICON
    });
    googleCookieStoreId = context.cookieStoreId;
  }
  return googleCookieStoreId
}

async function openGoogleContainerTab(currentTab) {
  // open a new tab in Google container
  googleContextId = await setupOrFetchContainer();
  opt = await browser.storage.local.get("choice");
  if (opt.choice == "manual" && currentTab != "open-google-container") {
    // manual mode, remove the container
    if (currentTab.cookieStoreId != "firefox-default") {
      browser.tabs.remove(currentTab.id);
      return browser.tabs.create({
        url: currentTab.url,
        index: currentTab.index
      })
    }
  }
  return browser.tabs.create({
    cookieStoreId: googleContextId,
    url: "https://www.google.com/"
  })
}

function makeFreeTab(tab, oldTab) {
  // in auto mode remove the container when regex is false
  browser.tabs.remove(tab.tabId);
  browser.tabs.create({
    url: tab.url,
    index: oldTab.index,
    active: oldTab.active
  });
}

async function logTab(requestDetails) {
  // intercept web requests to remove containers in auto mode
  googleContextId = await setupOrFetchContainer();
  opt = await browser.storage.local.get("choice");
  tabInfo = await browser.tabs.get(requestDetails.tabId);
  if (opt.choice == "auto") {
    if (re.test(requestDetails.url) == false && tabInfo.cookieStoreId == googleContextId) {
      makeFreeTab(requestDetails, tabInfo);
    }
  }
}

async function sendSelection (selection, tab) {
  // search text/link selection in container
  googleContextId = await setupOrFetchContainer();
  if ('linkText' in selection){
    selection.selectionText = selection.linkText;
  }
  browser.tabs.create({
    cookieStoreId: googleContextId,
    url: encodeURI("https://www.google.com/search?q=" + selection.selectionText),
    index: tab.index + 1
  });
}

// create contextMenus
browser.contextMenus.create({
  id: 'search-in-container',
  title: 'Search for "%s" in Google Container',
  contexts: ['selection']
});

browser.contextMenus.create({
  id: 'search-link-container',
  title: 'Search link text in Google Container',
  contexts: ['link']
});

// [COMMANDS] register commands
browser.commands.onCommand.addListener(openGoogleContainerTab);
browser.browserAction.onClicked.addListener(openGoogleContainerTab);
browser.contextMenus.onClicked.addListener(sendSelection)
browser.webRequest.onBeforeRequest.addListener(
  logTab,
  {urls: ["<all_urls>"], types: ["main_frame"]}
);
