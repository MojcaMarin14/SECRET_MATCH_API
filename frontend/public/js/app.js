// ============================================
// MAIN APP INITIALIZATION
// ============================================

// Initialize when page loads
window.onload = function() {
    console.log('Secret Match interface loaded');
    
    // Initialize UI based on login state
    initializeUI();
    
    // Show auth tab by default
    if (typeof showTab === 'function') {
        showTab('auth');
    }
};

function initializeUI() {
    // Check if user is logged in
    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        const user = getCurrentUser();
        const token = getUserToken();
        
        if (user && token) {
            document.getElementById('currentUser').textContent = user.name;
            document.getElementById('tokenPreview').textContent = token.substring(0, 20) + '...';
            document.getElementById('userInfo').classList.add('active');
            document.getElementById('userInfo').style.display = 'block';
        }
    }
    
    // Check if admin is logged in
    if (typeof isAdminLoggedIn === 'function' && isAdminLoggedIn()) {
        document.getElementById('assignBtn').disabled = false;
        document.getElementById('statsBtn').disabled = false;
    }
}

// Export ALL functions to global scope
window.initializeUI = initializeUI;