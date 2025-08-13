console.log("sidepanel loaded");

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabSections = document.querySelectorAll('.tab-section');
    const pingButton = document.getElementById('pingButton');
    const inspectToggle = document.getElementById('inspectToggle');
    
    // Notify background script that side panel has opened to trigger content script injection
    chrome.runtime.sendMessage({ type: "SIDE_PANEL_OPENED" })
        .then(() => {
            console.log('Side panel opened message sent to background');
        })
        .catch((error) => {
            console.error('Failed to send side panel opened message:', error);
        });
    
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
    
    // Add change event listener for Inspect Mode toggle
    inspectToggle.addEventListener('click', async () => {
        const isEnabled = inspectToggle.checked;
        const messageType = isEnabled ? "INSPECT_ENABLE" : "INSPECT_DISABLE";
        
        try {
            // Send message to background script to forward to content script
            await chrome.runtime.sendMessage({ type: messageType });
            console.log(`Inspect Mode ${isEnabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error(`Failed to send ${messageType} message:`, error);
        }
    });
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "NODE_SELECTED") {
            console.log('Node selected message received:', message);
            displaySelectedElement(message.selector, message.breadcrumb);
            
            // Request detailed CSS properties from the content script
            requestElementProperties();
        } else if (message.type === "ELEMENT_PROPERTIES") {
            console.log('Element properties received:', message.properties);
            displayElementProperties(message.properties);
        }
    });
    
    // Function to request element properties from content script
    function requestElementProperties() {
        chrome.runtime.sendMessage({ type: "GET_ELEMENT_PROPERTIES" })
            .then(() => {
                console.log('Element properties request sent');
            })
            .catch((error) => {
                console.error('Failed to request element properties:', error);
            });
    }
    
    // Function to display selected element information
    function displaySelectedElement(selector, breadcrumb) {
        const inspectSection = document.getElementById('inspect');
        if (!inspectSection) return;
        
        // Remove existing selection display if any
        const existingDisplay = inspectSection.querySelector('.selection-display');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        // Create selection display
        const selectionDisplay = document.createElement('div');
        selectionDisplay.className = 'selection-display';
        selectionDisplay.innerHTML = `
            <h4>Selected Element</h4>
            <div class="selection-info">
                <div class="info-group">
                    <label>Selector:</label>
                    <code class="selector-code">${selector}</code>
                </div>
                <div class="info-group">
                    <label>Breadcrumb:</label>
                    <code class="breadcrumb-code">${breadcrumb}</code>
                </div>
            </div>
            <button id="deselectButton" class="action-button secondary">Deselect Element</button>
        `;
        
        // Insert after the toggle container
        const toggleContainer = inspectSection.querySelector('.toggle-container');
        if (toggleContainer) {
            toggleContainer.parentNode.insertBefore(selectionDisplay, toggleContainer.nextSibling);
        }
        
        // Add deselect button functionality
        const deselectButton = selectionDisplay.querySelector('#deselectButton');
        deselectButton.addEventListener('click', () => {
            // Send deselect message to content script
            chrome.runtime.sendMessage({ type: "DESELECT_ELEMENT" })
                .then(() => {
                    console.log('Deselect message sent to content script');
                    selectionDisplay.remove();
                    // Also remove properties display
                    const propertiesDisplay = inspectSection.querySelector('.properties-display');
                    if (propertiesDisplay) {
                        propertiesDisplay.remove();
                    }
                })
                .catch((error) => {
                    console.error('Failed to send deselect message:', error);
                });
        });
        
        console.log('Selection display updated with:', { selector, breadcrumb });
    }
    
    // Function to display element properties
    function displayElementProperties(properties) {
        const inspectSection = document.getElementById('inspect');
        if (!inspectSection) return;
        
        // Remove existing properties display if any
        const existingProperties = inspectSection.querySelector('.properties-display');
        if (existingProperties) {
            existingProperties.remove();
        }
        
        // Create properties display
        const propertiesDisplay = document.createElement('div');
        propertiesDisplay.className = 'properties-display';
        
        let propertiesHTML = `
            <h4>Element Properties</h4>
            <div class="properties-grid">
        `;
        
        // Size properties
        propertiesHTML += `
            <div class="property-group">
                <h5>Size & Layout</h5>
                <div class="property-item">
                    <span class="property-label">Width:</span>
                    <span class="property-value">${properties.width}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Height:</span>
                    <span class="property-value">${properties.height}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Padding:</span>
                    <span class="property-value">${properties.padding}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Margin:</span>
                    <span class="property-value">${properties.margin}</span>
                </div>
            </div>
        `;
        
        // Color properties
        propertiesHTML += `
            <div class="property-group">
                <h5>Colors</h5>
                <div class="property-item">
                    <span class="property-label">Color:</span>
                    <span class="property-value color-preview" style="background-color: ${properties.color}">${properties.color}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Background:</span>
                    <span class="property-value color-preview" style="background-color: ${properties.backgroundColor}">${properties.backgroundColor}</span>
                </div>
            </div>
        `;
        
        // Font properties
        propertiesHTML += `
            <div class="property-group">
                <h5>Typography</h5>
                <div class="property-item">
                    <span class="property-label">Font Family:</span>
                    <span class="property-value">${properties.fontFamily}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Font Size:</span>
                    <span class="property-value">${properties.fontSize}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Font Weight:</span>
                    <span class="property-value">${properties.fontWeight}</span>
                </div>
                <div class="property-item">
                    <span class="property-label">Line Height:</span>
                    <span class="property-value">${properties.lineHeight}</span>
                </div>
            </div>
        `;
        
        propertiesHTML += `
            </div>
        `;
        
        propertiesDisplay.innerHTML = propertiesHTML;
        
        // Insert after the selection display
        const selectionDisplay = inspectSection.querySelector('.selection-display');
        if (selectionDisplay) {
            selectionDisplay.parentNode.insertBefore(propertiesDisplay, selectionDisplay.nextSibling);
        }
        
        console.log('Properties display updated with:', properties);
    }
});
