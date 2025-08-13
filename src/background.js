console.log("background loaded");

// Keep track of tabs where content script has been injected
const injectedTabs = new Set();

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PING") {
        console.log("Received PING from side panel, forwarding to active tab");
        
        // Get the active tab and inject content script if needed, then send the ping message
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                
                try {
                    // Only inject if we haven't already injected into this tab
                    if (!injectedTabs.has(tabId)) {
                        console.log("Injecting content script into tab", tabId);
                        await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            files: ['src/content.js']
                        });
                        injectedTabs.add(tabId);
                    } else {
                        console.log("Content script already injected in tab", tabId);
                    }
                    
                    // Send the message immediately since script is already running
                    chrome.tabs.sendMessage(tabId, { type: "PING_FROM_BG" })
                        .then(() => {
                            console.log("PING_FROM_BG sent to active tab");
                        })
                        .catch((error) => {
                            console.error("Failed to send PING_FROM_BG to active tab:", error);
                        });
                    
                } catch (error) {
                    console.error("Failed to inject content script:", error);
                }
            } else {
                console.error("No active tab found");
            }
        });
    }
});
