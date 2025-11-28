// js/header.js
function createHeader() {
    const headerHTML = `
        <header class="main-header">
            <nav class="navbar">
                <div class="nav-brand">
                    <h1>Speeding Data Story</h1>
                </div>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a href="index.html" class="nav-link">Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a href="timeline.html" class="nav-link">Timeline</a>
                    </li>
                    <li class="nav-item">
                        <a href="urban.html" class="nav-link">Urban Analysis</a>
                    </li>
                    <li class="nav-item">
                        <a href="enforcement.html" class="nav-link">Enforcement</a>
                    </li>
                    <li class="nav-item">
                        <a href="jurisdiction.html" class="nav-link">Jurisdictions</a>
                    </li>
                </ul>
                <div class="nav-toggle">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </nav>
        </header>
    `;
    
    // Insert header at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // Add mobile menu functionality
    setupMobileMenu();
}

function setupMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menu && toggle) {
                menu.classList.remove('active');
                toggle.classList.remove('active');
            }
        });
    });
}

// Highlight current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize header when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        createHeader();
        highlightCurrentPage();
    });
} else {
    // DOM already loaded
    createHeader();
    highlightCurrentPage();
}