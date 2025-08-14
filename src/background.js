console.log("background loaded");

// Keep track of tabs where content script has been injected
const injectedTabs = new Set();

// Function to ensure content script is injected into a tab
async function ensureContentScriptInjected(tabId) {
    try {
        // Always try to inject the content script first, regardless of tracking
        console.log("Injecting content script into tab", tabId);
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content.js']
        });
        
        // Wait a bit for the content script to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify the content script is running
        try {
            await chrome.tabs.sendMessage(tabId, { type: "CHECK_CS_STATUS" });
            console.log("Content script successfully injected and verified in tab", tabId);
            injectedTabs.add(tabId);
            return true;
        } catch (error) {
            console.error("Content script injection failed verification in tab", tabId, ":", error);
            return false;
        }
    } catch (error) {
        console.error("Failed to inject content script into tab", tabId, ":", error);
        return false;
    }
}

// Function to send message to content script with retry logic
async function sendMessageToContentScript(tabId, message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
            console.log(`Message ${message.type} sent to tab ${tabId} successfully`);
            return true;
        } catch (error) {
            console.warn(`Attempt ${attempt}/${maxRetries} failed for ${message.type}:`, error.message);
            
            if (attempt < maxRetries) {
                // Wait before retry and re-inject content script
                await new Promise(resolve => setTimeout(resolve, 200 * attempt));
                await ensureContentScriptInjected(tabId);
            } else {
                console.error(`Failed to send ${message.type} after ${maxRetries} attempts:`, error);
                return false;
            }
        }
    }
    return false;
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
                    await sendMessageToContentScript(tabId, { type: "PING_FROM_BG" });
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
                    await sendMessageToContentScript(tabId, { type: message.type });
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
                    await sendMessageToContentScript(tabId, { type: message.type });
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
                    await sendMessageToContentScript(tabId, { type: message.type });
                }
            } else {
                console.error("No active tab found");
            }
        });
    } else if (message.type === "GET_INSPECT_MODE_STATE") {
        console.log("Received GET_INSPECT_MODE_STATE from side panel, forwarding to active tab");
        
        // Get the active tab and forward the inspect mode state request message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                const success = await ensureContentScriptInjected(tabId);
                if (success) {
                    // Forward the inspect mode state request message to the content script
                    await sendMessageToContentScript(tabId, { type: message.type });
                }
            } else {
                console.error("No active tab found");
            }
        });
    } else if (message.type === "HEARTBEAT") {
        // Handle heartbeat from content script to maintain connection
        console.log("Received heartbeat from content script");
        // No response needed, just maintaining connection
    }
});

// Clean up injected tabs when they're closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (injectedTabs.has(tabId)) {
        injectedTabs.delete(tabId);
        console.log("Removed tab", tabId, "from injected tabs tracking");
    }
});

// Handle tab updates (page refreshes, navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && injectedTabs.has(tabId)) {
        console.log("Tab", tabId, "updated, removing from injected tabs tracking");
        injectedTabs.delete(tabId);
        // The content script will be re-injected when needed
    }
});
