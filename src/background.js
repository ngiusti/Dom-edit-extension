console.log("background loaded");

// Keep track of tabs where content script has been injected
const injectedTabs = new Set();

// Function to ensure content script is injected into a tab
async function ensureContentScriptInjected(tabId) {
    try {
        // Check if we've already tracked this tab as injected
        if (injectedTabs.has(tabId)) {
            console.log("Content script already tracked as injected in tab", tabId);
            return true;
        }

        // Check if content script is actually running by trying to send a message
        try {
            await chrome.tabs.sendMessage(tabId, { type: "CHECK_CS_STATUS" });
            console.log("Content script already running in tab", tabId);
            injectedTabs.add(tabId);
            return true;
        } catch (error) {
            // Content script not running, need to inject
            console.log("Injecting content script into tab", tabId);
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['src/content.js']
            });
            injectedTabs.add(tabId);
            console.log("Content script successfully injected into tab", tabId);
            return true;
        }
    } catch (error) {
        console.error("Failed to inject content script into tab", tabId, ":", error);
        return false;
    }
}

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PING") {
        console.log("Received PING from side panel, ensuring content script is injected");
        
        // Get the active tab and ensure content script is injected, then send the ping message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                const success = await ensureContentScriptInjected(tabId);
                if (success) {
                    // Send the ping message to the content script
                    try {
                        await chrome.tabs.sendMessage(tabId, { type: "PING_FROM_BG" });
                        console.log("PING_FROM_BG sent to active tab");
                    } catch (error) {
                        console.error("Failed to send PING_FROM_BG to active tab:", error);
                    }
                }
            } else {
                console.error("No active tab found");
            }
        });
    } else if (message.type === "SIDE_PANEL_OPENED") {
        console.log("Side panel opened, ensuring content script is injected");
        
        // Get the active tab and ensure content script is injected
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                await ensureContentScriptInjected(tabs[0].id);
            }
        });
    } else if (message.type === "INSPECT_ENABLE" || message.type === "INSPECT_DISABLE") {
        console.log(`Received ${message.type} from side panel, forwarding to active tab`);
        
        // Get the active tab and forward the inspect message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                const success = await ensureContentScriptInjected(tabId);
                if (success) {
                    // Forward the inspect message to the content script
                    try {
                        await chrome.tabs.sendMessage(tabId, { type: message.type });
                        console.log(`${message.type} message sent to active tab`);
                    } catch (error) {
                        console.error(`Failed to send ${message.type} to active tab:`, error);
                    }
                }
            } else {
                console.error("No active tab found");
            }
        });
    } else if (message.type === "DESELECT_ELEMENT") {
        console.log("Received DESELECT_ELEMENT from side panel, forwarding to active tab");
        
        // Get the active tab and forward the deselect message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                const success = await ensureContentScriptInjected(tabId);
                if (success) {
                    // Forward the deselect message to the content script
                    try {
                        await chrome.tabs.sendMessage(tabId, { type: message.type });
                        console.log("DESELECT_ELEMENT message sent to active tab");
                    } catch (error) {
                        console.error("Failed to send DESELECT_ELEMENT to active tab:", error);
                    }
                }
            } else {
                console.error("No active tab found");
            }
        });
    } else if (message.type === "GET_ELEMENT_PROPERTIES") {
        console.log("Received GET_ELEMENT_PROPERTIES from side panel, forwarding to active tab");
        
        // Get the active tab and forward the properties request message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                const success = await ensureContentScriptInjected(tabId);
                if (success) {
                    // Forward the properties request message to the content script
                    try {
                        await chrome.tabs.sendMessage(tabId, { type: message.type });
                        console.log("GET_ELEMENT_PROPERTIES message sent to active tab");
                    } catch (error) {
                        console.error("Failed to send GET_ELEMENT_PROPERTIES to active tab:", error);
                    }
                }
            } else {
                console.error("No active tab found");
            }
        });
    }
});

// Clean up injected tabs when they're closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (injectedTabs.has(tabId)) {
        injectedTabs.delete(tabId);
        console.log("Removed tab", tabId, "from injected tabs tracking");
    }
});
