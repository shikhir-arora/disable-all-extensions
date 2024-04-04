/**
 * @typedef {object} TExtension
 * @property {string} description
 * @property {boolean} enabled
 * @property {string} homepageUrl
 * @property {string[]} hostPermissions
 * @property {object[]} icons
 * @property {number} icons.size
 * @property {string} icons.url
 * @property {string} id
 * @property {string} installType
 * @property {boolean} isApp
 * @property {boolean} mayDisable
 * @property {string} name
 * @property {boolean} offlineEnabled
 * @property {string} optionsUrl
 * @property {string[]} permissions
 * @property {string} shortName
 * @property {string} type
 * @property {string} updateUrl
 * @property {string} version
 */

/**
 * Disables all Extensions from a given Array of objects.
 * @param {TExtension[]} extensionsList
 */
const disableExtensions = (extensionList) => {
  if (!extensionList?.length) {
    return;
  }

  for (const ext of extensionList) {
    if (ext.id !== chrome.runtime.id) {
      chrome.management.setEnabled(ext.id, false);
    }
  }
};

/**
 * Enables extensions from a given Array of objects.
 * @param {TExtension[]} extensionsList
 */
const enableExtensions = (extensionList) => {
  if (!extensionList?.length) {
    return;
  }

  for (const ext of extensionList) {
    chrome.management.setEnabled(ext.id, true);
  }
};

/**
 * Get enabled and disabled extensions from an array of extension objects.
 * @param {TExtension[]} extensionList
 * @returns {{enabledExts: TExtension[], disabledExts: TExtension[]}} An object with arrays of enabled and disabled extensions.
 */
const allExtensionInfo = (extensionList) => {
  const enabledExts = [];
  const disabledExts = [];

  for (const ext of extensionList) {
    if (ext.type === "extension") {
      const { description, enabled, id, icons, name } = ext;

      if (enabled) {
        enabledExts.push({ description, enabled, id, icons, name });
      } else {
        disabledExts.push({ description, enabled, id, icons, name });
      }
    }
  }
  return { enabledExts, disabledExts };
};

/**
 * Updates the extension's icon based on the application state.
 */
const updateIconState = () => {
  chrome.storage.local.get(
    ["isDisablingOtherExts"],
    async ({ isDisablingOtherExts }) => {
      if (isDisablingOtherExts) {
        await chrome.action.setIcon({
          path: { 16: "../public/images/appOn_16.png" },
        });
      } else {
        await chrome.action.setIcon({
          path: { 16: "../public/images/appOff_16.png" },
        });
      }
    },
  );
};

/**
 * Debounces a function with a specified delay in milliseconds.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
  let timerId;

  return function () {
    const context = this;
    const args = arguments;

    clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

export {
  disableExtensions,
  enableExtensions,
  allExtensionInfo,
  updateIconState,
  debounce,
};
