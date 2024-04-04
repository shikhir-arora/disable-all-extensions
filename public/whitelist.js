// Listener for when any checkbox is clicked.
const handleClick = async (e) => {
  const checkedVal = e.target.checked;
  const extensionId = e.target.id;

  try {
    // Optimistically update the UI if needed
    e.target.disabled = true;

    const { alwaysOn = [] } = await chrome.storage.sync.get("alwaysOn");

    if (checkedVal) {
      // Add the extension to the alwaysOn list if checked
      const newAlwaysOn = [...alwaysOn, extensionId];
      await chrome.storage.sync.set({ alwaysOn: newAlwaysOn });
      // Enable the extension
      await chrome.management.setEnabled(extensionId, true);
    } else {
      // Remove the extension from the alwaysOn list if unchecked
      const newAlwaysOn = alwaysOn.filter((id) => id !== extensionId);
      await chrome.storage.sync.set({ alwaysOn: newAlwaysOn });
      // Do not disable the extension if it's not in the alwaysOn list
    }
  } catch (error) {
    console.error("Error updating extension state:", error);
  } finally {
    // Re-enable the checkbox after the operation completes
    e.target.disabled = false;
  }
};

async function initializeExtensionList() {
  const { alwaysOn = [] } = await chrome.storage.sync.get("alwaysOn");
  const extensionList = await chrome.management.getAll();
  const extensionElement = document.getElementById("extension-list");
  extensionList
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((ext) => {
      if (ext.id !== chrome.runtime.id && ext.type === "extension") {
        const div = document.createElement("div");
        div.classList.add("item");

        const toggleContainer = document.createElement("div");
        toggleContainer.classList.add("toggle-container");

        const div2 = document.createElement("div");
        div2.classList.add("toggle-pill-bw");

        const inputEl = document.createElement("input");
        inputEl.type = "checkbox";
        inputEl.id = ext.id;
        inputEl.name = "check";
        inputEl.checked = alwaysOn.includes(ext.id);
        inputEl.onclick = handleClick;

        const labelEl = document.createElement("label");
        labelEl.setAttribute("for", ext.id);

        const extensionInfo = document.createElement("div");
        extensionInfo.classList.add("extension-info");

        const nameEl = document.createElement("span");
        nameEl.classList.add("extension-name");
        nameEl.textContent = ext.name;

        const versionEl = document.createElement("span");
        versionEl.classList.add("extension-version");
        versionEl.textContent = `Version: ${ext.version}`;

        // Check if the extension is already disabled in Chrome
        if (!ext.enabled) {
          inputEl.disabled = true;
          nameEl.style.color = "#aaa";
          versionEl.style.color = "#aaa";
          labelEl.style.cursor = "not-allowed";
          div.title =
            "This extension was disabled outside this whitelist. Go to chrome://extensions to enable it";
        }

        div2.appendChild(inputEl);
        div2.appendChild(labelEl);

        extensionInfo.appendChild(nameEl);
        extensionInfo.appendChild(versionEl);

        toggleContainer.appendChild(div2);
        toggleContainer.appendChild(extensionInfo);

        div.appendChild(toggleContainer);
        extensionElement.appendChild(div);
      }
    });
}
document.addEventListener("DOMContentLoaded", initializeExtensionList);
