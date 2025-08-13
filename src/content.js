console.log("content loaded");

// Flag to prevent duplicate initialization using the required window.__ope_cs_injected flag
if (!window.__ope_cs_injected) {
    window.__ope_cs_injected = true;
    
    // Inspect mode state
    let inspectModeEnabled = false;
    
    // Overlay element for highlighting
    let overlayElement = null;
    
    // Selected element state
    let selectedElement = null;
    let isElementSelected = false;
    
    // Element selector utilities (included directly to avoid import issues)
    
    /**
     * Generate a unique selector for an element (stub implementation)
     * @param {Element} element - The DOM element to generate a selector for
     * @returns {string} A unique CSS selector
     */
    function getUniqueSelector(element) {
        // Stub implementation - will be enhanced in 1.5
        if (!element || !element.tagName) {
            return '';
        }
        
        // For now, return a basic selector based on tag and class
        let selector = element.tagName.toLowerCase();
        
        if (element.id) {
            selector = '#' + element.id;
        } else if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(cls => cls.trim());
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }
        
        return selector;
    }
    
    /**
     * Generate a breadcrumb path for an element
     * @param {Element} element - The DOM element to generate breadcrumb for
     * @param {number} maxDepth - Maximum depth for the breadcrumb (default: 6)
     * @returns {string} Breadcrumb string like "html > body > main > div.card > h2"
     */
    function generateBreadcrumb(element, maxDepth = 6) {
        if (!element || !element.tagName) {
            return '';
        }
        
        const path = [];
        let currentElement = element;
        let depth = 0;
        
        while (currentElement && currentElement.tagName && depth < maxDepth) {
            let selector = currentElement.tagName.toLowerCase();
            
            // Add ID if available
            if (currentElement.id) {
                selector = '#' + currentElement.id;
            } 
            // Add classes if available and no ID
            else if (currentElement.className && typeof currentElement.className === 'string') {
                const classes = currentElement.className.split(' ').filter(cls => cls.trim());
                if (classes.length > 0) {
                    selector += '.' + classes.join('.');
                }
            }
            
            path.unshift(selector);
            currentElement = currentElement.parentElement;
            depth++;
        }
        
        return path.join(' > ');
    }
    
    // Function to create the overlay element
    function createOverlay() {
        if (overlayElement) return;
        
        overlayElement = document.createElement('div');
        overlayElement.id = 'ope-inspect-overlay';
        overlayElement.style.cssText = `
            position: absolute;
            border: 2px solid #007bff;
            background-color: rgba(0, 123, 255, 0.1);
            pointer-events: none;
            z-index: 999999;
            transition: all 0.1s ease;
            box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
        `;
        
        document.documentElement.appendChild(overlayElement);
        console.log('Inspect overlay created');
    }
    
    // Function to remove the overlay element
    function removeOverlay() {
        if (overlayElement) {
            overlayElement.remove();
            overlayElement = null;
            console.log('Inspect overlay removed');
        }
    }
    
    // Function to update overlay position and size
    function updateOverlay(target) {
        if (!overlayElement || !target || isElementSelected) return;
        
        // Skip if hovering over the side panel or extension elements
        if (target.closest('#ope-inspect-overlay') || 
            target.closest('[data-extension-element]') ||
            target.tagName === 'BODY' ||
            target.tagName === 'HTML') {
            overlayElement.style.display = 'none';
            return;
        }
        
        try {
            const rect = target.getBoundingClientRect();
            
            // Check if element is visible and has dimensions
            if (rect.width > 0 && rect.height > 0 && 
                rect.top >= 0 && rect.left >= 0 &&
                rect.bottom <= window.innerHeight && 
                rect.right <= window.innerWidth) {
                
                overlayElement.style.display = 'block';
                overlayElement.style.left = rect.left + 'px';
                overlayElement.style.top = rect.top + 'px';
                overlayElement.style.width = rect.width + 'px';
                overlayElement.style.height = rect.height + 'px';
            } else {
                overlayElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating overlay:', error);
            overlayElement.style.display = 'none';
        }
    }
    
    // Function to freeze overlay on selected element
    function freezeOverlayOnElement(element) {
        if (!overlayElement || !element) return;
        
        try {
            const rect = element.getBoundingClientRect();
            
            overlayElement.style.display = 'block';
            overlayElement.style.left = rect.left + 'px';
            overlayElement.style.top = rect.top + 'px';
            overlayElement.style.width = rect.width + 'px';
            overlayElement.style.height = rect.height + 'px';
            
            // Change overlay style to indicate selection
            overlayElement.style.border = '2px solid #28a745';
            overlayElement.style.backgroundColor = 'rgba(40, 167, 69, 0.2)';
            overlayElement.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.4)';
            
            console.log('Overlay frozen on selected element');
        } catch (error) {
            console.error('Error freezing overlay:', error);
        }
    }
    
    // Function to unfreeze overlay
    function unfreezeOverlay() {
        if (!overlayElement) return;
        
        // Reset overlay style to normal inspect mode
        overlayElement.style.border = '2px solid #007bff';
        overlayElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        overlayElement.style.boxShadow = '0 0 10px rgba(0, 123, 255, 0.3)';
        
        console.log('Overlay unfrozen');
    }
    
    // Function to deselect current element
    function deselectElement() {
        if (!isElementSelected) return;
        
        selectedElement = null;
        isElementSelected = false;
        unfreezeOverlay();
        
        console.log('Element deselected');
    }
    
    // Mouse move handler for inspect mode
    function handleMouseMove(event) {
        if (!inspectModeEnabled || isElementSelected) return;
        
        const target = event.target;
        updateOverlay(target);
    }
    
    // Click handler for element selection
    function handleClick(event) {
        if (!inspectModeEnabled) return;
        
        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();
        
        const target = event.target;
        
        // Skip if clicking on overlay or extension elements
        if (target.closest('#ope-inspect-overlay') || 
            target.closest('[data-extension-element]') ||
            target.tagName === 'BODY' ||
            target.tagName === 'HTML') {
            return;
        }
        
        // If an element is already selected, deselect it
        if (isElementSelected) {
            deselectElement();
            return;
        }
        
        // Select the new element
        selectedElement = target;
        isElementSelected = true;
        
        // Freeze overlay on selected element
        freezeOverlayOnElement(target);
        
        // Generate selector and breadcrumb
        const selector = getUniqueSelector(target);
        const breadcrumb = generateBreadcrumb(target, 6);
        
        console.log('Element selected:', { selector, breadcrumb, element: target });
        
        // Post message to side panel
        try {
            chrome.runtime.sendMessage({
                type: "NODE_SELECTED",
                selector: selector,
                breadcrumb: breadcrumb
            });
            console.log('Selection message sent to side panel');
        } catch (error) {
            console.error('Failed to send selection message:', error);
        }
    }
    
    // Function to enable inspect mode
    function enableInspectMode() {
        if (inspectModeEnabled) return;
        
        inspectModeEnabled = true;
        createOverlay();
        document.addEventListener('mousemove', handleMouseMove, { capture: true });
        document.addEventListener('click', handleClick, { capture: true });
        console.log('Inspect Mode ENABLED - Element inspection is now active');
    }
    
    // Function to disable inspect mode
    function disableInspectMode() {
        if (!inspectModeEnabled) return;
        
        inspectModeEnabled = false;
        deselectElement();
        removeOverlay();
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        document.removeEventListener('click', handleClick, { capture: true });
        console.log('Inspect Mode DISABLED - Element inspection is now inactive');
    }
    
    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "PING_FROM_BG") {
            console.log("Pong from content script");
        } else if (message.type === "CHECK_CS_STATUS") {
            // Respond to status check to confirm content script is running
            console.log("Content script status check received");
            sendResponse({ status: "running" });
        } else if (message.type === "INSPECT_ENABLE") {
            enableInspectMode();
        } else if (message.type === "INSPECT_DISABLE") {
            disableInspectMode();
        } else if (message.type === "DESELECT_ELEMENT") {
            deselectElement();
        } else if (message.type === "GET_ELEMENT_PROPERTIES") {
            if (selectedElement && isElementSelected) {
                const properties = extractElementProperties(selectedElement);
                console.log('Element properties extracted:', properties);
                
                // Send properties back to the side panel
                try {
                    chrome.runtime.sendMessage({
                        type: "ELEMENT_PROPERTIES",
                        properties: properties
                    });
                    console.log('Element properties sent to side panel');
                } catch (error) {
                    console.error('Failed to send element properties:', error);
                }
            } else {
                console.log('No element selected, cannot extract properties');
            }
        }
    });
    
    // Function to extract computed CSS properties from an element
    function extractElementProperties(element) {
        const computedStyle = window.getComputedStyle(element);
        
        return {
            // Size & Layout
            width: computedStyle.width,
            height: computedStyle.height,
            padding: `${computedStyle.paddingTop} ${computedStyle.paddingRight} ${computedStyle.paddingBottom} ${computedStyle.paddingLeft}`,
            margin: `${computedStyle.marginTop} ${computedStyle.marginRight} ${computedStyle.marginBottom} ${computedStyle.marginLeft}`,
            
            // Colors
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            
            // Typography
            fontFamily: computedStyle.fontFamily,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            lineHeight: computedStyle.lineHeight
        };
    }
    
    console.log("Content script message listener initialized with __ope_cs_injected flag set");
} else {
    console.log("Content script already initialized (__ope_cs_injected flag detected), skipping duplicate setup");
}
