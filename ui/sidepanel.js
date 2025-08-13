console.log("sidepanel loaded");

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabSections = document.querySelectorAll('.tab-section');
    const pingButton = document.getElementById('pingButton');
    
    // Add click event listeners to all tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and sections
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            button.classList.add('active');
            const targetSection = document.getElementById(targetTab);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Add click event listener for Ping button
    pingButton.addEventListener('click', async () => {
        try {
            await chrome.runtime.sendMessage({ type: "PING" });
            console.log('Ping message sent to background');
        } catch (error) {
            console.error('Failed to send ping message:', error);
        }
    });
});
