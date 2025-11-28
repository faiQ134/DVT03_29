// js/footer.js
function createFooter() {
    const footerHTML = `
       
            
            <div class="footer-bottom">
                <p>&copy; 2025 Speeding Data Story - DV 29 | Data Visualisation Project</p>
                <p>SIGN-OFF</p>
            </div>
        </footer>
    `;
    
    // Insert footer at the end of body
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}

// Initialize footer when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFooter);
} else {
    // DOM already loaded
    createFooter();
}