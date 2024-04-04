import { disableExtensions, enableExtensions, allExtensionInfo, updateIconState } from "./utils/functions.js";

/**
 * Type definitions
 * @typedef {Object} TExtension
 * @property {string} description - The description of the extension.
 * @property {boolean} enabled - Indicates if the extension is currently enabled.
 * @property {string} homepageUrl - The homepage URL of the extension.
 * @property {string[]} hostPermissions - The host permissions of the extension.
 * @property {Object[]} icons - The icons of the extension.
 * @property {number} icons.size - The size of the icon.
 * @property {string} icons.url - The URL of the icon.
 * @property {string} id - The ID of the extension.
 * @property {string} installType - The install type of the extension.
 * @property {boolean} isApp - Indicates if the extension is an app.
 * @property {boolean} mayDisable - Indicates if the extension can be disabled.
 * @property {string} name - The name of the extension.
 * @property {boolean} offlineEnabled - Indicates if the extension is enabled offline.
 * @property {string} optionsUrl - The URL to the extension's options page.
 * @property {string[]} permissions - The permissions of the extension.
 * @property {string} shortName - The short name of the extension.
 * @property {string} type - The type of the extension.
 * @property {string} updateUrl - The URL for the extension's update manifest.
 * @property {string} version - The version of the extension.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const isolationBtn = document.getElementById("isolation-btn");
    const customDialog = document.getElementById("custom-dialog");
    const dialogBox = document.getElementById("dialog-box");
    const dialogMessage = document.getElementById("dialog-message");
    const confirmButtons = document.getElementById("confirm-buttons");
    const confirmYes = document.getElementById("confirm-yes");
    const confirmNo = document.getElementById("confirm-no");

    // Initialize and prepare the state of extensions
    async function initialize() {
        const extensions = (await chrome.management.getAll()).filter(ext => ext.id !== chrome.runtime.id && ext.type === "extension");
        const { enabledExts, disabledExts } = allExtensionInfo(extensions);
        await chrome.storage.local.set({
            lastEnabledExts: enabledExts.map(ext => ext.id),
            lastDisabledExts: disabledExts.map(ext => ext.id)
        });
    }

    await initialize();

    isolationBtn.addEventListener("click", async () => {
        isolationBtn.style.display = "none";
        confirmButtons.style.display = "flex";
        dialogBox.style.display = "block";
        confirmYes.style.display = "block";
        confirmNo.style.display = "block";

        console.log("Starting isolation Mode.");
        const extensions = (await chrome.management.getAll()).filter(ext => ext.id !== chrome.runtime.id && ext.type === "extension");
        const result = await isolationMode(extensions);

        console.log("Isolation Mode complete.");
        console.log("Found problematic extension:", result.name);

        // Display the result to the user
        displayResult(result);

        // Restore the extensions to their original state
        const { lastEnabledExts, lastDisabledExts } = await chrome.storage.local.get(["lastEnabledExts", "lastDisabledExts"]);
        enableExtensions(extensions.filter(ext => lastEnabledExts.includes(ext.id)));
        disableExtensions(extensions.filter(ext => lastDisabledExts.includes(ext.id)));

        isolationBtn.style.display = "block";
        confirmButtons.style.display = "none";
    });

    async function isolationMode(extensionList, step = 0) {
        console.log(`Isolation Mode running in step ${step}`);
        if (extensionList.length <= 1) {
            return extensionList[0];
        }

        const halfIndex = Math.floor(extensionList.length / 2);
        const half1 = extensionList.slice(0, halfIndex);
        const half2 = extensionList.slice(halfIndex);

        enableExtensions(half1);
        disableExtensions(half2);

        const response = await getUserFeedback(half1);
        disableExtensions(half1); // Prepare for the next step

        const nextHalf = response ? half1 : half2;
        return isolationMode(nextHalf, step + 1);
    }

    async function getUserFeedback(firstHalf) {
        dialogMessage.innerHTML = firstHalf.length === 1 ? "This extension has been enabled. Are you still having issues?" : "These extensions have been enabled. Are you still having issues?";
        dialogMessage.appendChild(createExtensionList(firstHalf));

        return new Promise((resolve) => {
            customDialog.style.display = "block";
            confirmYes.onclick = () => {
                customDialog.style.display = "none";
                resolve(true);
            };
            confirmNo.onclick = () => {
                customDialog.style.display = "none";
                resolve(false);
            };
        });
    }

    function createExtensionList(extensions) {
        const container = document.createElement('div');
        container.classList.add('extension-container');
        extensions.forEach(extension => {
            const div = document.createElement('div');
            div.style.display = "flex";
            div.style.gap = "0.2em";

            const iconImg = document.createElement('img');
            iconImg.src = extension.icons[0]?.url || "./images/chrome-32.png";
            iconImg.alt = 'Extension Icon';
            iconImg.style.width = "25px";
            iconImg.style.height = "25px";

            const nameDiv = document.createElement('div');
            nameDiv.textContent = extension.name;

            div.appendChild(iconImg);
            div.appendChild(nameDiv);
            container.appendChild(div);
        });
        dialogMessage.appendChild(container);
    }

    function displayResult(extension) {
        dialogMessage.innerHTML = `The extension possibly causing issues is: <strong>${extension.name}</strong>`;
        customDialog.style.display = "block";
        confirmButtons.style.display = "none"; // Hide confirm buttons after displaying the result
    }
});
