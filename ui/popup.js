console.log("popup loaded");

document.addEventListener('DOMContentLoaded', () => {
    const openSidePanelButton = document.getElementById('openSidePanel');
    
    openSidePanelButton.addEventListener('click', async () => {
        try {
            // Get the current window to open the side panel
            const currentWindow = await chrome.windows.getCurrent();
            await chrome.sidePanel.open({ windowId: currentWindow.id });
            console.log('Side panel opened successfully');
        } catch (error) {
            console.error('Failed to open side panel:', error);
        }
    });
});
