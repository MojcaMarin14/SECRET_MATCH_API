// ============================================
// AUTH FUNCTIONS - REGISTRATION & LOGIN
// ============================================

async function register() {
    const name = document.getElementById('regName')?.value.trim() || '';
    const email = document.getElementById('regEmail')?.value.trim() || '';
    const password = document.getElementById('regPassword')?.value || '';
    const preferences = document.getElementById('regPreferences')?.value.trim() || '';
    
    // Validation
    if (!name || !email || !password) {
        showResult('authResult', ' Vnesite ime, email in geslo', true);
        return;
    }
    
    if (!isValidEmail(email)) {
        showResult('authResult', ' Vnesite veljaven email naslov', true);
        return;
    }
    
    if (!isStrongPassword(password)) {
        showResult('authResult', ' Geslo mora biti vsaj 6 znakov dolgo', true);
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, preferences })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateUserInfo(data.user, data.token);
            
            showResult('authResult', ` Uspešna registracija! Pozdravljen, ${name}!`);
            showTab('match');
        } else {
            showResult('authResult', ` ${data.error || 'Napaka pri registraciji'}`, true);
        }
    } catch (error) {
        showResult('authResult', `Napaka: ${error.message}`, true);
    }
}

async function login() {
    const email = document.getElementById('loginEmail')?.value.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';
    
    // Validation
    if (!email || !password) {
        showResult('authResult', ' Vnesite email in geslo', true);
        return;
    }
    
    if (!isValidEmail(email)) {
        showResult('authResult', ' Vnesite veljaven email naslov', true);
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Update UI
            updateUserInfo(data.user, data.token);
            
            showResult('authResult', ` Uspešna prijava! Pozdravljen, ${data.user.name}!`);
            showTab('match');
        } else {
            showResult('authResult', ` ${data.error || 'Napačni prijavni podatki'}`, true);
        }
    } catch (error) {
        showResult('authResult', ` Napaka: ${error.message}`, true);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    
    // Update UI
    document.getElementById('userInfo').classList.remove('active');
    document.getElementById('userInfo').style.display = 'none';
    
    // Disable admin buttons
    document.getElementById('assignBtn').disabled = true;
    document.getElementById('statsBtn').disabled = true;
    
    // Reset forms
    showRegisterForm();
    clearAuthForms();
    
    showTab('auth');
    showResult('authResult', ' Uspešno odjavljeni.', false);
    // ============================================
// EXPORT AUTH FUNCTIONS TO GLOBAL SCOPE
// ============================================

if (typeof window !== 'undefined') {
    window.register = register;
    window.login = login;
    window.logout = logout;
}
}