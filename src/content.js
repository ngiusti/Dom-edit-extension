console.log("content loaded");

// Flag to prevent duplicate initialization
if (!window.contentScriptInitialized) {
    window.contentScriptInitialized = true;
    
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "PING_FROM_BG") {
            console.log("Pong from content script");
        }
    });
    
    console.log("Content script message listener initialized");
} else {
    console.log("Content script already initialized, skipping duplicate setup");
}
