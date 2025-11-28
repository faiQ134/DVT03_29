// js/navigation.js
// Easy navigation functions for all pages

const Navigation = {
    // Navigate to dashboard
    toDashboard: function() {
        window.location.href = 'index.html';
    },
    
    // Navigate to timeline
    toTimeline: function() {
        window.location.href = 'Timeline2.html';
    },
    
    // Navigate to urban analysis
    toUrban: function() {
        window.location.href = 'urban.html';
    },
    
    // Navigate to enforcement (pie chart)
    toEnforcement: function() {
        window.location.href = 'pie-chart.html';
    },
    
    // Navigate to jurisdictions (map)
    toJurisdiction: function() {
        window.location.href = 'map.html';
    },
    
    // Navigate to speeding (bar chart)
    toSpeeding: function() {
        window.location.href = 'bar.html';
    },
    
    // Generic navigation function
    to: function(page) {
        console.log('Navigating to:', page);
        window.location.href = page;
    },
    
    // Open external links in new window
    setupExternalLinks: function() {
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        externalLinks.forEach(link => {
            if (!link.getAttribute('target')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    },
    
    // Add navigation buttons to any element
    addNavButton: function(element, targetPage, buttonText = 'Explore') {
        if (element) {
            const button = document.createElement('button');
            button.className = 'nav-button';
            button.textContent = buttonText;
            button.onclick = () => this.to(targetPage);
            element.appendChild(button);
        }
    }
};

// Make navigation functions globally available
window.navigateToDashboard = Navigation.toDashboard;
window.navigateToTimeline = Navigation.toTimeline;
window.navigateToUrban = Navigation.toUrban;
window.navigateToEnforcement = Navigation.toEnforcement;
window.navigateToJurisdiction = Navigation.toJurisdiction;
window.navigateToSpeeding = Navigation.toSpeeding;
window.navigateTo = Navigation.to;

// Initialize navigation when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        Navigation.setupExternalLinks();
    });
} else {
    // DOM already loaded
    Navigation.setupExternalLinks();
}

// Debug: Test if navigation is working
console.log('Navigation loaded. Available functions:');
console.log('- navigateToDashboard()');
console.log('- navigateToTimeline()');
console.log('- navigateToUrban()');
console.log('- navigateToEnforcement()');
console.log('- navigateToJurisdiction()');
console.log('- navigateToSpeeding()');
console.log('- navigateTo("page.html")');