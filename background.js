// Param values from https://developer.mozilla.org/Add-ons/WebExtensions/API/contextualIdentities/create
const GOOGLE_CONTAINER_NAME = "Google";
const GOOGLE_CONTAINER_COLOR = "blue";
const GOOGLE_CONTAINER_ICON = "circle";

function onError(e) {
  console.error(e);
}

function debug(message) {
  console.debug(["[Google Container Shortcut] ", message]);
}

function getContexts() {
  return browser.contextualIdentities.query({name: GOOGLE_CONTAINER_NAME});
}

async function setupOrFetchContainer () {
  // Use existing Google container, or create one
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
  googleContextId = await setupOrFetchContainer();

  if (currentTab.cookieStoreId != "firefox-default") {
    browser.tabs.remove(currentTab.id);
    return browser.tabs.create({
      url: currentTab.url
    })
  }
  console.error('dodis', googleContextId)
  return browser.tabs.create({
    cookieStoreId: googleContextId,
    url: "https://www.google.com/"
  })
}

function tabUpdate(tabId, changeInfo, tabInfo) {
  // var re = *://*.google.???/*;
  var re = /http(s?):\/\/(www?).google.(com|ad|ae|com.af|com.ag|com.ai|al|am|co.ao|com.ar|as|at|com.au|az|ba|com.bd|be|bf|bg|com.bh|bi|bj|com.bn|com.bo|com.br|bs|bt|co.bw|by|com.bz|ca|cd|cf|cg|ch|ci|co.ck|cl|cm|cn|com.co|co.cr|com.cu|cv|com.cy|cz|de|dj|dk|dm|com.do|dz|com.ec|ee|com.eg|es|com.et|fi|com.fj|fm|fr|ga|ge|gg|com.gh|com.gi|gl|gm|gp|gr|com.gt|gy|com.hk|hn|hr|ht|hu|co.id|ie|co.il|im|co.in|iq|is|it|je|com.jm|jo|co.jp|co.ke|com.kh|ki|kg|co.kr|com.kw|kz|la|com.lb|li|lk|co.ls|lt|lu|lv|com.ly|co.ma|md|me|mg|mk|ml|com.mm|mn|ms|com.mt|mu|mv|mw|com.mx|com.my|co.mz|com.na|com.nf|com.ng|com.ni|ne|nl|no|com.np|nr|nu|co.nz|com.om|com.pa|com.pe|com.pg|com.ph|com.pk|pl|pn|com.pr|ps|pt|com.py|com.qa|ro|ru|rw|com.sa|com.sb|sc|se|com.sg|sh|si|sk|com.sl|sn|so|sm|sr|st|com.sv|td|tg|co.th|com.tj|tk|tl|tm|tn|to|com.tr|tt|com.tw|co.tz|com.ua|co.ug|co.uk|com.uy|co.uz|com.vc|co.ve|vg|co.vi|com.vn|vu|ws|rs|co.za|co.zm|co.zw|cat)\/*/;
  // console.error(tabId);
  // console.error(changeInfo);
  // console.error(tabInfo);

  var timeno = (new Date()).getTime() - 10;
  if ('url' in changeInfo && re.test(changeInfo.url) == false) {
    if (tabInfo.cookieStoreId == "firefox-container-6") {
      console.error("not google!");
      browser.tabs.remove(tabInfo.id);
      // browser.browsingData.removeHistory({since:timeno});
      return browser.tabs.create({
        url: tabInfo.url
      })
    }
  }
}

// [COMMANDS] register commands
browser.commands.onCommand.addListener(openGoogleContainerTab);
browser.browserAction.onClicked.addListener(openGoogleContainerTab);
browser.tabs.onUpdated.addListener(tabUpdate);
