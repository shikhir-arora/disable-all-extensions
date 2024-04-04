import {
  allExtensionInfo,
  updateIconState,
  enableExtensions,
  disableExtensions,
  debounce,
} from "../public/utils/functions.js";

const CTX_MENU_IDS = {
  whitelistID: "open-whitelist",
  isolationID: "isolation",
};
let isolationTabId;

// Update the icon based on the extension's state
updateIconState();

// Ensure the extension's state is updated on browser startup
chrome.runtime.onStartup.addListener(() => {
  updateIconState();
});

const handleToggleExtensions = () => {
  chrome.storage.sync.get(["alwaysOn"], ({ alwaysOn = [] }) => {
    chrome.storage.local.get(
      ["isDisablingOtherExts", "lastEnabledExts"],
      async (data) => {
        const extensionList = await chrome.management.getAll();
        const notWhitelistedExts = extensionList.filter(
          (ext) => !alwaysOn.includes(ext.id) && ext.id !== chrome.runtime.id,
        );
        const { enabledExts, disabledExts } = allExtensionInfo(extensionList);

        if (data.isDisablingOtherExts) {
          enableExtensions(
            data.lastEnabledExts
              .map((extId) => extensionList.find((ext) => ext.id === extId))
              .filter((ext) => ext),
          );
          chrome.storage.local.set(
            { isDisablingOtherExts: false },
            updateIconState,
          );
        } else {
          chrome.storage.local.set(
            { lastEnabledExts: enabledExts.map((ext) => ext.id) },
            () => {
              disableExtensions(notWhitelistedExts);
              chrome.storage.local.set(
                { isDisablingOtherExts: true },
                updateIconState,
              );
            },
          );
        }
      },
    );
  });
};

// Handle click "spam"
const debouncedClickHandler = debounce(handleToggleExtensions, 50);

chrome.action.onClicked.addListener(() => {
  debouncedClickHandler();
});

// Setup context menus on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Open whitelist",
    contexts: ["action"], // Updated to "action" for clarity and specificity
    id: CTX_MENU_IDS.whitelistID,
  });

  chrome.contextMenus.create({
    title: "Isolation Mode",
    contexts: ["action"],
    id: CTX_MENU_IDS.isolationID,
  });
});

// Handle clicks on context menu items
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === CTX_MENU_IDS.whitelistID) {
    chrome.tabs.create({ url: "../public/index.html" });
  } else if (info.menuItemId === CTX_MENU_IDS.isolationID) {
    chrome.tabs.create({ url: "../public/isolation.html" }, (tab) => {
      isolationTabId = tab.id;
    });
  }
});

// Restore extensions to their previous state when the isolation mode tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === isolationTabId) {
    const { lastEnabledExts, lastDisabledExts } =
      await chrome.storage.local.get(["lastEnabledExts", "lastDisabledExts"]);
    const allExts = await chrome.management.getAll();
    enableExtensions(allExts.filter((ext) => lastEnabledExts.includes(ext.id)));
    disableExtensions(
      allExts.filter((ext) => lastDisabledExts.includes(ext.id)),
    );
  }
});
