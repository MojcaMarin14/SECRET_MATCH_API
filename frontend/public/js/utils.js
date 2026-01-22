// ============================================
// GLOBALNE SPREMENLJIVKE IN POMOŽNE FUNKCIJE
// ============================================

const API_URL = 'http://localhost:3000';

// Show messages
function showResult(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="message ${isError ? 'error' : 'success'}">
                ${message}
            </div>
        `;
        element.style.display = 'block';
        
        // Samodejno skrij sporočilo po 5 sekundah
        if (!isError) {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Check if admin is logged in
function isAdminLoggedIn() {
    return !!localStorage.getItem('adminToken');
}

// Get user token
function getUserToken() {
    return localStorage.getItem('token');
}

// Get admin token
function getAdminToken() {
    return localStorage.getItem('adminToken');
}

// Get current user data
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate password strength
function isStrongPassword(password) {
    return password.length >= 6;
}

// Tab switching
function showTab(tabId) {
    console.log('Switching to tab:', tabId);
    
    // All tab IDs
    const tabElementIds = ['authTab', 'matchTab', 'adminTab', 'apiTab'];
    
    // Hide all tab contents
    tabElementIds.forEach(id => {
        const tabContent = document.getElementById(id);
        if (tabContent) {
            tabContent.classList.remove('active');
            tabContent.style.display = 'none';
        }
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabId + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tabs .tab');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabId}'`)) {
            btn.classList.add('active');
        }
    });
}

// Auth forms toggle
function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authResult').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authResult').style.display = 'none';
}

// Clear auth forms
function clearAuthForms() {
    // Clear registration form
    document.getElementById('regName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPreferences').value = '';
    
    // Clear login form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

// Update user info display
function updateUserInfo(user, token) {
    document.getElementById('currentUser').textContent = user.name;
    document.getElementById('tokenPreview').textContent = token.substring(0, 20) + '...';
    document.getElementById('userInfo').classList.add('active');
    document.getElementById('userInfo').style.display = 'block';
}

// Show loading state on button
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.innerHTML = '<span class="loading"></span> Prosim počakajte...';
        button.disabled = true;
    } else {
        button.innerHTML = button.getAttribute('data-original-text') || button.textContent;
        button.disabled = false;
    }
    // ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================

if (typeof window !== 'undefined') {
    window.showTab = showTab;
    window.showLoginForm = showLoginForm;
    window.showRegisterForm = showRegisterForm;
    window.isLoggedIn = isLoggedIn;
    window.isAdminLoggedIn = isAdminLoggedIn;
    window.getUserToken = getUserToken;
    window.getAdminToken = getAdminToken;
    window.getCurrentUser = getCurrentUser;
    window.showResult = showResult;
    window.clearAuthForms = clearAuthForms;
    window.updateUserInfo = updateUserInfo;
    window.setButtonLoading = setButtonLoading;
}
}