// Listener for when any checkbox is clicked.
const handleClick = async (e) => {
    const checkedVal = e.target.checked;
    const extensionId = e.target.id;

    try {
        // Optimistically update the UI if needed
        e.target.disabled = true;

        const { alwaysOn = [] } = await chrome.storage.sync.get("alwaysOn");

        if (checkedVal) {
            const newAlwaysOn = [...alwaysOn, extensionId];
            await chrome.storage.sync.set({ alwaysOn: newAlwaysOn });
            await chrome.management.setEnabled(extensionId, true);
        } else {
            const newAlwaysOn = alwaysOn.filter(id => id !== extensionId);
            await chrome.storage.sync.set({ alwaysOn: newAlwaysOn });
            await chrome.management.setEnabled(extensionId, false);
        }
    } catch (error) {
        console.error("Error updating extension state:", error);
    } finally {
        e.target.disabled = false;
    }
};

async function initializeExtensionList() {
    const { alwaysOn = [] } = await chrome.storage.sync.get("alwaysOn");
    const extensionList = await chrome.management.getAll();
    const extensionElement = document.getElementById("extension-list");

    extensionList.sort((a, b) => a.name.localeCompare(b.name)).forEach(ext => {
        if (ext.id !== chrome.runtime.id && ext.type === "extension") {
            const div = document.createElement("div");
            div.classList.add("item");

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

            div2.appendChild(inputEl);
            div2.appendChild(labelEl);

            const extNamePTag = document.createElement("p");
            extNamePTag.textContent = ext.name;

            div.appendChild(div2);
            div.appendChild(extNamePTag);
            extensionElement.appendChild(div);
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeExtensionList);
