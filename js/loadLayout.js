// js/loadLayout.js
function loadLayout() {
    // Load CSS (if not already loaded)
    if (!document.querySelector('link[href*="layout.css"]')) {
        const layoutCSS = document.createElement('link');
        layoutCSS.rel = 'stylesheet';
        layoutCSS.href = './css/layout.css';
        document.head.appendChild(layoutCSS);
    }
    
    // Load navigation script first
    const navScript = document.createElement('script');
    navScript.src = './js/navigation.js';
    
    // Load header and footer scripts after navigation
    navScript.onload = function() {
        const headerScript = document.createElement('script');
        headerScript.src = './js/header.js';
        
        headerScript.onload = function() {
            const footerScript = document.createElement('script');
            footerScript.src = './js/footer.js';
            document.body.appendChild(footerScript);
        };
        
        document.body.appendChild(headerScript);
    };
    
    document.body.appendChild(navScript);
}

// Initialize layout loading
document.addEventListener('DOMContentLoaded', loadLayout);