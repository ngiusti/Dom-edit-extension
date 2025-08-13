console.log("popup loaded");

document.addEventListener('DOMContentLoaded', () => {
    const openSidePanelButton = document.getElementById('openSidePanel');
    
    openSidePanelButton.addEventListener('click', async () => {
        try {
            // Get the current window to open the side panel
            const currentWindow = await chrome.windows.getCurrent();
            await chrome.sidePanel.open({ windowId: currentWindow.id });
            console.log('Side panel opened successfully');
            
            // Ensure content script is injected into the active tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                try {
                    await chrome.runtime.sendMessage({ type: "PING" });
                    console.log('Content script injection triggered via popup');
                } catch (error) {
                    console.error('Failed to trigger content script injection:', error);
                }
            }
        } catch (error) {
            console.error('Failed to open side panel:', error);
        }
    });
});
