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

async function openGoogleContainerTab() {
  googleContextId = await setupOrFetchContainer();

  return browser.tabs.create({
    cookieStoreId: googleContextId
  })
}

// [COMMANDS] register commands
browser.commands.onCommand.addListener(openGoogleContainerTab);
browser.browserAction.onClicked.addListener(openGoogleContainerTab)
