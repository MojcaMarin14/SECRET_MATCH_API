// ============================================
// EMERGENCY FUNCTION DEFINITIONS
// ============================================

console.log('🔧 admin.js is loading...');

// Emergency definitions if functions aren't exported properly
(function() {
    // Preveri če adminLogin že obstaja
    if (typeof window.adminLogin === 'undefined') {
        console.log('⚠️ adminLogin not defined, creating emergency function');
        
        window.adminLogin = async function() {
            console.log(' EMERGENCY adminLogin called');
            
            const email = document.getElementById('adminEmail')?.value || '';
            const password = document.getElementById('adminPassword')?.value || '';
            
            console.log('Trying to login with:', email);
            
            try {
                const response = await fetch(API_URL + '/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.user && data.user.isAdmin) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('adminToken', data.token);
                    
                    // Enable buttons
                    document.getElementById('assignBtn').disabled = false;
                    document.getElementById('resetBtn').disabled = false;
                    document.getElementById('statsBtn').disabled = false;
                    
                    alert(` Admin prijava uspešna! Dobrodošel, ${data.user.name}`);
                    return true;
                } else {
                    alert(' Napaka pri prijavi: ' + (data.error || 'Nepravilni podatki'));
                    return false;
                }
            } catch (error) {
                alert(' Napaka: ' + error.message);
                return false;
            }
        };
        
        console.log('Emergency adminLogin created');
    }
    
    // Emergency registerAdmin
    if (typeof window.registerAdmin === 'undefined') {
        console.log(' registerAdmin not defined, creating emergency function');
        
        window.registerAdmin = async function() {
            const email = document.getElementById('adminEmail')?.value || '';
            const password = document.getElementById('adminPassword')?.value || '';
            
            if (!email || !password) {
                alert(' Vnesite email in geslo');
                return;
            }
            
            try {
                const response = await fetch(API_URL + '/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Administrator',
                        email: email,
                        password: password,
                        isAdmin: true
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert(` Admin račun ustvarjen za ${email}`);
                } else {
                    alert(' Napaka: ' + (data.error || 'Napaka pri registraciji'));
                }
            } catch (error) {
                alert(' Napaka: ' + error.message);
            }
        };
        
        console.log('✅ Emergency registerAdmin created');
    }
})();
// ============================================
// EMAIL NOTIFICATION FUNCTION 
// ============================================


window.sendNotifications = async function() {
    console.log('📧 sendNotifications called');
    
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    
    if (!adminToken) {
        alert(' Najprej se prijavite kot admin!');
        return;
    }
    
    // Preveri če so pari dodeljeni
    try {
        const statsRes = await fetch(API_URL + '/match/stats', {
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        
        if (!statsRes.ok) {
            const errorData = await statsRes.json();
            alert(' Napaka pri preverjanju statistik: ' + (errorData.error || 'Unknown error'));
            return;
        }
        
        const stats = await statsRes.json();
        console.log('📊 Stats for email check:', stats);
        
        // POPRAVEK: Uporabi pairingsAssigned, ne assignedPairs
        if (!stats.pairingsAssigned) {
            alert(' Pari še niso dodeljeni!\n\nNajprej pojdite na "Dodeli pare" gumb.');
            return;
        }
        
        // Preveri tudi če ima dovolj udeležencev
        if (!stats.participantsCount || stats.participantsCount < 2) {
            alert(' Premalo udeležencev!\n\nPotrebujemo vsaj 2 uporabnika za email obvestila.');
            return;
        }
        
    } catch (error) {
        console.error('Stats check error:', error);
        alert(' Napaka pri preverjanju stanja: ' + error.message);
        return;
    }
    
    if (!confirm(` Pošljem email obvestila vsem udeležencem?\n\nTo bo poslalo osebna obvestila vsem uporabnikom z njihovim dodeljenim match-om.\n\nEmail bo poslan iz: alyssa.star14@gmail.com`)) {
        return;
    }
    
    console.log('📤 Starting email notifications...');
    
    try {
        const response = await fetch(API_URL + '/match/notify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + adminToken,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        console.log('Email response:', data);
        
        if (response.ok) {
            let message = ` ${data.message}\n\n`;
            message += ` Statistika:\n`;
            message += `• Poslano: ${data.sent} emailov\n`;
            message += `• Ni uspelo: ${data.failed || 0}\n`;
            message += `• Skupaj: ${data.total || 0} uporabnikov\n`;
            
            if (data.sentTo && data.sentTo.length > 0) {
                message += `\n Emaili poslani na:\n`;
                data.sentTo.slice(0, 5).forEach(email => {
                    message += `• ${email}\n`;
                });
                if (data.sentTo.length > 5) {
                    message += `• ... in še ${data.sentTo.length - 5} drugih\n`;
                }
            }
            
            if (data.testMode) {
                message += `\n  TEST MODE: Emaili niso bili resnično poslani.`;
                message += `\n Dodajte emailService.js za resnične emaile.`;
            }
            
            alert(message);
            
            // Prikaži v admin rezultatih
            const adminResult = document.getElementById('adminResult');
            if (adminResult) {
                adminResult.innerHTML = `<div class="status success">${message.replace(/\n/g, '<br>')}</div>`;
                adminResult.style.display = 'block';
            }
            
        } else {
            alert(` ${data.error || 'Napaka pri pošiljanju emailov'}\n\n${data.details || ''}`);
        }
        
    } catch (error) {
        console.error('Email send error:', error);
        alert(`Napaka: ${error.message}`);
    }
};
// ============================================
// UPDATE BUTTON STATES ON PAGE LOAD
// ============================================

// Funkcija za preverjanje admin statusa in posodabljanje gumbov
function updateAdminButtons() {
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const adminUserStr = localStorage.getItem('adminUser') || localStorage.getItem('user');
    
    let isAdmin = false;
    
    if (adminToken && adminUserStr) {
        try {
            const adminUser = JSON.parse(adminUserStr);
            isAdmin = adminUser && adminUser.isAdmin === true;
        } catch (e) {
            console.log('Error parsing user data:', e);
        }
    }
    
    console.log(` Admin status: ${isAdmin ? 'Logged in' : 'Not logged in'}`);
    
    const assignBtn = document.getElementById('assignBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statsBtn = document.getElementById('statsBtn');
    const notifyBtn = document.getElementById('notifyBtn');
    
    if (assignBtn) assignBtn.disabled = !isAdmin;
    if (resetBtn) resetBtn.disabled = !isAdmin;
    if (statsBtn) statsBtn.disabled = !isAdmin;
    if (notifyBtn) notifyBtn.disabled = !isAdmin;
}

// Zaženi ko se stran naloži
document.addEventListener('DOMContentLoaded', function() {
    console.log(' Page loaded, checking admin status...');
    updateAdminButtons();
    
    // Preveri če je admin že prijavljen
    const adminToken = localStorage.getItem('adminToken');
    const adminUserStr = localStorage.getItem('adminUser');
    
    if (adminToken && adminUserStr) {
        try {
            const adminUser = JSON.parse(adminUserStr);
            if (adminUser && adminUser.isAdmin) {
                console.log(` Admin already logged in: ${adminUser.name}`);
                
                // Posodobi email polje v admin formi
                const adminEmailInput = document.getElementById('adminEmail');
                if (adminEmailInput && adminUser.email) {
                    adminEmailInput.value = adminUser.email;
                }
            }
        } catch (e) {
            console.log('Error checking admin status:', e);
        }
    }
});

// ============================================
// POMOŽNE FUNKCIJE ZA MATCH OPERACIJE
// ============================================


// Emergency definicije za assignMatches, če ne obstajajo
if (typeof window.assignMatches === 'undefined') {
    window.assignMatches = async function() {
        const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        if (!adminToken) {
            alert('Najprej se prijavite kot admin!');
            return;
        }
        
        if (!confirm(' Dodelim pare med vsemi udeleženci?\n\nVsak bo dobil naključnega partnerja.')) {
            return;
        }
        
        try {
            const response = await fetch(API_URL + '/match/assign', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + adminToken,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(` ${data.message || 'Pari uspešno dodeljeni!'}`);
                
                // Osveži gumbe
                setTimeout(updateAdminButtons, 500);
            } else {
                alert(`${data.error || 'Napaka pri dodeljevanju parov'}`);
            }
        } catch (error) {
            alert(` Napaka: ${error.message}`);
        }
    };
}

// Emergency definicija za getStats
if (typeof window.getStats === 'undefined') {
    window.getStats = async function() {
        const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
        
        if (!adminToken) {
            alert(' Najprej se prijavite kot admin!');
            return;
        }
        
        try {
            const response = await fetch(API_URL + '/match/stats', {
                headers: { 'Authorization': 'Bearer ' + adminToken }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                let statsMessage = `📊 Statistika dogodka:\n\n`;
                statsMessage += `• Skupaj uporabnikov: ${data.totalUsers || 0}\n`;
                statsMessage += `• Pridruženih dogodku: ${data.joinedUsers || 0}\n`;
                statsMessage += `• Dodeljenih parov: ${data.assignedPairs || 0}\n`;
                statsMessage += `• Status: ${data.pairingsAssigned ? '✅ Dodeljeno' : '⏳ Čaka'}\n`;
                
                alert(statsMessage);
            } else {
                alert(` ${data.error || 'Napaka pri pridobivanju statistik'}`);
            }
        } catch (error) {
            alert(` Napaka: ${error.message}`);
        }
    };
}
// ============================================
// ADMIN HELPER FUNCTIONS
// ============================================

function isAdminLoggedIn() {
    try {
        const adminToken = localStorage.getItem('adminToken');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (adminToken && user && user.isAdmin === true) {
            return true;
        }
        
        const token = localStorage.getItem('token');
        if (token && user && user.isAdmin === true) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

function getAdminToken() {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        return adminToken;
    }
    
    return localStorage.getItem('token');
}

// ============================================
// USER DATA REFRESH FUNCTIONS
// ============================================

async function refreshUserData() {
    console.log(' Refreshing user data from server...');
    
    if (!isLoggedIn()) {
        console.log('User not logged in');
        return;
    }
    
    try {
        const token = getUserToken();
        
       
        const response = await fetch(API_URL + '/users/profile', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('📡 Profile response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📦 Refreshed user data:', data);
            
            // Pridobi userData iz odgovora
            const userData = data.user || data;
            
            // Posodobi localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Posodobi UI
            updateUIWithUserData(userData);
            
            console.log(' User data refreshed');
            return true;
        } else {
            console.log(' Failed to refresh user data, trying fallback...');
            
            // Fallback: Pridobi match podatke direktno
            return await refreshUserDataFallback();
        }
    } catch (error) {
        console.error(' Refresh error:', error);
        return false;
    }
}

async function refreshUserDataFallback() {
    console.log(' Trying fallback refresh method...');
    
    try {
        // Poskusi direktno dobiti match podatke
        const matchResponse = await fetch(API_URL + '/match/view', {
            headers: {
                'Authorization': 'Bearer ' + getUserToken()
            }
        });
        
        if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            console.log(' Match view fallback data:', matchData);
            
            if (matchData.yourMatch) {
                console.log('User has a match in fallback');
                
                // Posodobi localStorage z match podatki
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                currentUser.assignedMatch = {
                    userId: 'temp',
                    name: matchData.yourMatch.name,
                    email: matchData.yourMatch.email,
                    preferences: matchData.yourMatch.preferences || ''
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Prikaži match
                if (typeof displayMatchCard === 'function') {
                    displayMatchCard(matchData.yourMatch);
                    console.log(' Match displayed from fallback');
                }
                
                return true;
            } else {
                console.log(' No match in fallback');
                return false;
            }
        } else {
            console.log(' Fallback also failed');
            return false;
        }
    } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return false;
    }
}

function updateUIWithUserData(userData) {
    console.log(' Updating UI with user data');
    
    // Posodobi prikazano ime uporabnika
    const currentUserSpan = document.getElementById('currentUser');
    if (currentUserSpan && userData.name) {
        currentUserSpan.textContent = userData.name;
    }
    
    // Preveri, če je uporabnik pridružen dogodku
    if (userData.hasJoinedEvent) {
        console.log(' User has joined event');
    }
    
    // Preveri, če ima uporabnik dodeljenega para
    if (userData.assignedMatch && userData.assignedMatch.userId) {
        console.log(' User has a match');
        setTimeout(() => {
            if (typeof viewMatch === 'function') {
                viewMatch();
            }
        }, 500);
    }
    
    // Posodobi admin gumbe če je admin
    if (userData.isAdmin) {
        console.log(' User is admin, updating admin buttons');
        
        const assignBtn = document.getElementById('assignBtn');
        const resetBtn = document.getElementById('resetBtn');
        const statsBtn = document.getElementById('statsBtn');
        
        if (assignBtn) assignBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
        if (statsBtn) statsBtn.disabled = false;
        
        setTimeout(() => {
            if (typeof getStats === 'function') {
                getStats();
            }
        }, 1000);
    }
}function triggerGlobalRefreshForAllUsers(eventType) {
    console.log(` Triggering global refresh for: ${eventType}`);
    
    // 1. Shrani čas zadnjega update-a v localStorage (to trigger-a 'storage' event)
    const updateTime = Date.now();
    localStorage.setItem('lastGlobalUpdate', updateTime.toString());
    localStorage.setItem('globalEventType', eventType);
    
    // 2. Broadcast drugim tabom (če jih ima uporabnik odprtih)
    if (typeof BroadcastChannel !== 'undefined') {
        try {
            const channel = new BroadcastChannel('secret-match-updates');
            channel.postMessage({
                type: 'globalUpdate',
                eventType: eventType,
                timestamp: updateTime
            });
            console.log(' Broadcasted to other tabs');
        } catch (e) {
            console.log(' BroadcastChannel not supported');
        }
    }
    
    // 3. Trigger custom event za ta tab
    window.dispatchEvent(new CustomEvent('globalDataUpdate', {
        detail: {
            eventType: eventType,
            timestamp: updateTime,
            source: 'adminAction'
        }
    }));
    
    // 4. Show notification
    showMatchUpdateNotification(eventType === 'matchesAssigned' ? 'update' : 'reset');
    
    console.log(' Global refresh triggered');
}

// ============================================
// MAIN ADMIN FUNCTIONS
// ============================================

async function assignMatches() {
    if (!isAdminLoggedIn()) {
        showResult('adminResult', ' Najprej se prijavite kot admin', true);
        return;
    }
    
    try {
        // Preveri stanje pred dodelitvijo
        const statsRes = await fetch(API_URL + '/match/stats', {
            headers: { 'Authorization': 'Bearer ' + getAdminToken() }
        });
        
        const statsData = await statsRes.json();
        
        if (statsRes.ok && statsData.pairingsAssigned) {
            // Pari so že dodeljeni - vprašaj za potrditev
            if (!confirm(' Pari so ŽE dodeljeni! \n\nŽelite resetirati in dodeliti znova?\n\nStari pari bodo izgubljeni!')) {
                return;
            }
            
            // Najprej reset, potem assign
            const resetRes = await fetch(API_URL + '/match/reset', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getAdminToken(),
                    'Content-Type': 'application/json'
                }
            });
            
            const resetData = await resetRes.json();
            if (!resetRes.ok) {
                showResult('adminResult', ` ${resetData.error}`, true);
                return;
            }
            
            showResult('adminResult', ' Pari resetirani. Zdaj dodeljujem nove pare...', false);
            
            // Obvesti vse uporabnike o resetu
            broadcastToAllUsers('matchReset');
            
            if (typeof refreshUserData === 'function') {
                setTimeout(refreshUserData, 500);
            }
        }
        
        // Dodeli pare
        const response = await fetch(API_URL + '/match/assign', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getAdminToken(),
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            showResult('adminResult', ` ${data.message}`, false);
             triggerGlobalRefreshForAllUsers('matchesAssigned');
            
            // Obvesti vse uporabnike
            broadcastToAllUsers('matchesAssigned');
            
            if (typeof refreshUserData === 'function') {
                setTimeout(refreshUserData, 500);
            }
            
            // Avtomatsko osveži statistiko
            setTimeout(() => {
                getStats();
                showMatchUpdateNotification();
            }, 1000);
        } else {
            showResult('adminResult', ` ${data.error}`, true);
        }
        
    } catch (error) {
        showResult('adminResult', `Napaka: ${error.message}`, true);
    }
}

async function resetMatches() {
    console.log('🎯 resetMatches() called');
    
    if (!isAdminLoggedIn()) {
        console.log(' Admin not logged in');
        showResult('adminResult', ' Najprej se prijavite kot admin', true);
        return;
    }
    
    console.log(' Admin is logged in');
    
    if (!confirm('  RESETIRANJE PAROV\n\nRes želite resetirati VSE pare?\n\nTo ne morete razveljaviti! Vsi obstoječi pari bodo izgubljeni.')) {
        console.log(' Reset cancelled by user');
        return;
    }
    
    console.log(' User confirmed reset');
    
    try {
        const token = getAdminToken();
        
        const response = await fetch(API_URL + '/match/reset', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(' Reset successful');
            showResult('adminResult', ` ${data.message || 'Pari uspešno resetirani!'}`, false);
            triggerGlobalRefreshForAllUsers('matchReset');
            
            // Obvesti vse uporabnike
            broadcastToAllUsers('matchReset');
            
            if (typeof refreshUserData === 'function') {
                setTimeout(refreshUserData, 500);
            }
            
            // Refresh stats and enable assign button
            if (document.getElementById('assignBtn')) {
                document.getElementById('assignBtn').disabled = false;
            }
            
            showMatchUpdateNotification('reset');
            
            setTimeout(() => {
                console.log('🔄 Refreshing stats...');
                getStats();
            }, 1000);
            
        } else {
            console.log(' Reset failed');
            showResult('adminResult', ` ${data.error || 'Napaka pri resetiranju'}`, true);
        }
    } catch (error) {
        console.error('💥 Reset error:', error);
        showResult('adminResult', ` Napaka: ${error.message}`, true);
    }
}

async function getStats() {
    console.log(' getStats() called');
    
    if (!isAdminLoggedIn()) {
        console.log(' Admin not logged in');
        showResult('adminResult', ' Najprej se prijavite kot admin', true);
        return;
    }
    
    console.log(' Admin is logged in');
    
    try {
        const response = await fetch(API_URL + '/match/stats', {
            headers: {
                'Authorization': 'Bearer ' + getAdminToken()
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(' Stats received:', data);
            displayStats(data);
            
            if (document.getElementById('assignBtn')) {
                document.getElementById('assignBtn').disabled = data.pairingsAssigned;
            }
        } else {
            console.log('Stats failed:', data);
            showResult('adminResult', ` ${data.error}`, true);
        }
    } catch (error) {
        console.error(' Stats error:', error);
        showResult('adminResult', ` Napaka: ${error.message}`, true);
    }
}

function displayStats(stats) {
    const statsHTML = `
        <h3> Statistika dogodka</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <strong>Ime dogodka:</strong> ${stats.eventName || 'Secret Match'}
            </div>
            <div class="stat-item">
                <strong>Število udeležencev:</strong> ${stats.participantsCount || 0}
            </div>
            <div class="stat-item">
                <strong>Pari dodeljeni:</strong> ${stats.pairingsAssigned ? ' Da' : ' Ne'}
            </div>
            ${stats.lastAssigned ? `
            <div class="stat-item">
                <strong>Zadnje dodeljevanje:</strong> ${new Date(stats.lastAssigned).toLocaleString('sl-SI')}
            </div>
            ` : ''}
        </div>
        ${stats.participants && stats.participants.length > 0 ? `
            <h4>Udeleženci (${stats.participants.length}):</h4>
            <div class="participants-list">
                ${stats.participants.map(p => `
                    <div class="participant">
                        <strong>${p.name}</strong> (${p.email})
                        ${p.preferences ? `<br><small> ${p.preferences}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : '<p>Ni udeležencev.</p>'}
    `;
    
    const adminResult = document.getElementById('adminResult');
    adminResult.innerHTML = statsHTML;
    adminResult.style.display = 'block';
}

// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

function showMatchUpdateNotification(type = 'update') {
    const messages = {
        'update': ' Pari so bili dodeljeni! Kliknite "Poglej svoj match" za ogled.',
        'reset': ' Pari so bili resetirani. Čakajte na novo dodelitev.',
        'join': ' Uspešno ste se pridružili dogodku!'
    };
    
    const message = messages[type] || messages['update'];
    
    const notification = document.createElement('div');
    notification.id = 'matchNotification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(to right, #4CAF50, #45a049);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🎁</span>
            <div>
                <strong>Secret Match Obvestilo</strong>
                <div style="font-size: 14px; margin-top: 5px;">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">
                ×
            </button>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 8000);
}

function broadcastToAllUsers(event) {
    console.log(` Broadcasting event: ${event}`);
    
    localStorage.setItem('lastMatchUpdate', Date.now().toString());
    localStorage.setItem('matchEvent', event);
    
    window.dispatchEvent(new CustomEvent('matchUpdated', { 
        detail: { event, timestamp: Date.now() }
    }));
}

// ============================================
// EVENT LISTENERS FOR REAL-TIME UPDATES
// ============================================

window.addEventListener('storage', function(event) {
    if (event.key === 'lastMatchUpdate') {
        console.log(' Storage change detected:', event.key);
        
        const eventType = localStorage.getItem('matchEvent');
        
        if (eventType === 'matchesAssigned') {
            console.log(' New matches assigned! Refreshing...');
            showMatchUpdateNotification('update');
            
            if (isLoggedIn()) {
                setTimeout(() => {
                    if (typeof refreshUserData === 'function') {
                        refreshUserData();
                    }
                    if (typeof viewMatch === 'function') {
                        viewMatch();
                    }
                }, 1000);
            }
        } else if (eventType === 'matchReset') {
            console.log(' Matches reset!');
            showMatchUpdateNotification('reset');
            
            if (typeof hideMatchCard === 'function') {
                hideMatchCard();
            }
        }
    }
});

window.addEventListener('matchUpdated', function(event) {
    console.log(' Match updated event received:', event.detail);
    showMatchUpdateNotification(event.detail.event === 'matchesAssigned' ? 'update' : 'reset');
});

function setupPeriodicRefresh() {
    console.log('Setting up aggressive periodic refresh...');
    
    // 1. Osveži vsakih 10 sekund (ne 30)
    setInterval(() => {
        if (isLoggedIn()) {
            console.log(' Aggressive periodic refresh...');
            refreshUserData();
        }
    }, 10000); // 10 sekund
    
    // 2. Preveri za globalne update-e vsake 2 sekundi
    setInterval(() => {
        const lastUpdate = localStorage.getItem('lastGlobalUpdate');
        if (lastUpdate) {
            const updateTime = parseInt(lastUpdate);
            const now = Date.now();
            
            // Če je bil global update v zadnjih 30 sekundah
            if (now - updateTime < 30000) {
                console.log(' Recent global update detected, refreshing...');
                if (isLoggedIn() && typeof refreshUserData === 'function') {
                    refreshUserData();
                }
            }
        }
    }, 2000); // 2 sekundi
    
    // 3. Osveži ob fokusu okna
    window.addEventListener('focus', () => {
        console.log('🔍 Window focused, forcing refresh...');
        setTimeout(() => {
            if (isLoggedIn() && typeof refreshUserData === 'function') {
                refreshUserData();
            }
        }, 500);
    });
}

// ============================================
// ADMIN PAGE LOAD CHECK FUNCTION
// ============================================

function checkAdminOnPageLoad() {
    console.log(' Checking admin status on page load...');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    console.log(' User from storage:', user);
    console.log(' Token exists:', !!token);
    console.log(' Admin token exists:', !!adminToken);
    console.log(' User is admin:', user.isAdmin);
    
    const assignBtn = document.getElementById('assignBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statsBtn = document.getElementById('statsBtn');
    
    console.log(' Button elements found:', {
        assignBtn: !!assignBtn,
        resetBtn: !!resetBtn,
        statsBtn: !!statsBtn
    });
    
    if (user && (user.isAdmin === true) && (token || adminToken)) {
        console.log('👑 Admin already logged in, enabling buttons...');
        
        if (assignBtn) assignBtn.disabled = false;
        if (resetBtn) resetBtn.disabled = false;
        if (statsBtn) statsBtn.disabled = false;
        
        setTimeout(() => {
            if (typeof getStats === 'function') {
                getStats();
            }
        }, 1500);
        
    } else {
        console.log('👤 Not admin or not logged in, keeping buttons disabled');
        
        if (assignBtn) assignBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
        if (statsBtn) statsBtn.disabled = true;
    }
}

// ============================================
// EXTRA FUNCTIONS
// ============================================

async function forceViewMatch() {
    console.log(' Force checking match...');
    
    if (!isLoggedIn()) {
        console.log(' User not logged in');
        showResult('matchResult', ' Najprej se prijavite', true);
        return;
    }
    
    try {
        const token = getUserToken();
        
        // Direktno pokliči /match/view
        const response = await fetch(API_URL + '/match/view', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        console.log('Match view response status:', response.status);
        
        const data = await response.json();
        console.log('Match view data:', data);
        
        if (response.ok && data.yourMatch) {
            console.log(' Match found!');
            
            // Shrani v localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.assignedMatch = {
                userId: 'temp',
                name: data.yourMatch.name,
                email: data.yourMatch.email,
                preferences: data.yourMatch.preferences || ''
            };
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Prikaži match card
            if (typeof displayMatchCard === 'function') {
                displayMatchCard(data.yourMatch);
                showResult('matchResult', '🎉 Ugotovljen nov match!', false);
            }
            
            return true;
        } else {
            console.log(' No match or error:', data.error);
            
            // Počisti match če obstaja
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser.assignedMatch) {
                currentUser.assignedMatch = null;
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                if (typeof hideMatchCard === 'function') {
                    hideMatchCard();
                }
            }
            
            showResult('matchResult', data.error || 'Pari še niso dodeljeni', true);
            return false;
        }
    } catch (error) {
        console.error(' Force view error:', error);
        showResult('matchResult', ` Napaka: ${error.message}`, true);
        return false;
    }
}

async function joinEvent() {
    if (!isLoggedIn()) {
        showResult('matchResult', ' Najprej se prijavite', true);
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/match/join', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + getUserToken(),
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('matchResult', data.message || ' Uspešno pridruženo!', false);
            
            setTimeout(() => {
                if (typeof refreshUserData === 'function') {
                    refreshUserData();
                }
                showMatchUpdateNotification('join');
            }, 500);
            
        } else {
            showResult('matchResult', data.error || ' Napaka', true);
        }
    } catch (error) {
        showResult('matchResult', ` Napaka: ${error.message}`, true);
    }
}

// ============================================
// SINGLE EXPORT BLOCK AT THE END
// ============================================

(function() {
    console.log('🔗 Exporting admin functions to window...');
    
    const functionsToExport = {
        adminLogin: adminLogin,
        registerAdmin: registerAdmin,
        assignMatches: assignMatches,
        resetMatches: resetMatches,
        getStats: getStats,
        displayStats: displayStats,
        checkAdminOnPageLoad: checkAdminOnPageLoad,
        isAdminLoggedIn: isAdminLoggedIn,
        getAdminToken: getAdminToken,
        refreshUserData: refreshUserData,
        updateUIWithUserData: updateUIWithUserData,
        showMatchUpdateNotification: showMatchUpdateNotification,
        broadcastToAllUsers: broadcastToAllUsers,
        setupPeriodicRefresh: setupPeriodicRefresh,
        forceViewMatch: forceViewMatch,
        joinEvent: joinEvent
    };
    
    Object.keys(functionsToExport).forEach(funcName => {
        if (typeof functionsToExport[funcName] === 'function') {
            window[funcName] = functionsToExport[funcName];
            console.log(` Exported: ${funcName}`);
        }
    });
    
    console.log(' All admin functions exported');
})();
// ============================================
// TEST ALL ENDPOINTS FUNCTION
// ============================================

window.testAllEndpoints = async function() {
    console.log(' Testing all API endpoints...');
    
    const results = [];
    const testUser = {
        name: 'Test User ' + Date.now(),
        email: 'test' + Date.now() + '@test.com',
        password: 'test123'
    };
    
    let authToken = '';
    let testUserId = '';
    
    try {
        // 1. Test registration
        results.push('1.  Testing /users/register...');
        const registerRes = await fetch(API_URL + '/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        
        const registerData = await registerRes.json();
        if (registerRes.ok) {
            results.push('    Registration SUCCESS');
            testUserId = registerData.user?._id || 'unknown';
        } else {
            results.push(`    Registration FAILED: ${registerData.error || 'Unknown error'}`);
        }
        
        // 2. Test login
        results.push('2.  Testing /users/login...');
        const loginRes = await fetch(API_URL + '/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        
        const loginData = await loginRes.json();
        if (loginRes.ok) {
            results.push('    Login SUCCESS');
            authToken = loginData.token;
            
            // Store token for other tests
            localStorage.setItem('testToken', authToken);
            localStorage.setItem('testUser', JSON.stringify(loginData.user));
        } else {
            results.push(`    Login FAILED: ${loginData.error || 'Unknown error'}`);
        }
        
        // 3. Test join event (if logged in)
        if (authToken) {
            results.push('3.  Testing /match/join...');
            const joinRes = await fetch(API_URL + '/match/join', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json'
                }
            });
            
            const joinData = await joinRes.json();
            if (joinRes.ok) {
                results.push('    Join event SUCCESS');
            } else {
                results.push(`    Join event FAILED: ${joinData.error || 'Unknown error'}`);
            }
        }
        
        // 4. Test view match (will fail if no matches assigned)
        if (authToken) {
            results.push('4.  Testing /match/view...');
            const viewRes = await fetch(API_URL + '/match/view', {
                headers: { 'Authorization': 'Bearer ' + authToken }
            });
            
            const viewData = await viewRes.json();
            if (viewRes.ok) {
                results.push('    View match SUCCESS');
            } else {
                results.push(`  iew match: ${viewData.error || 'No matches yet (expected)'}`);
            }
        }
        
        // 5. Test API docs endpoint
        results.push('5. 📚 Testing /api endpoint...');
        const apiRes = await fetch(API_URL + '/api');
        const apiData = await apiRes.json();
        if (apiRes.ok) {
            results.push('   API docs SUCCESS');
        } else {
            results.push(`   API docs FAILED: ${apiData.error || 'Unknown error'}`);
        }
        
        // 6. Test match stats (with admin token if available)
        const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (adminToken) {
            results.push('6.  Testing /match/stats (admin)...');
            const statsRes = await fetch(API_URL + '/match/stats', {
                headers: { 'Authorization': 'Bearer ' + adminToken }
            });
            
            const statsData = await statsRes.json();
            if (statsRes.ok) {
                results.push('    Stats SUCCESS');
                results.push(`      • Participants: ${statsData.participantsCount || 0}`);
                results.push(`      • Pairings assigned: ${statsData.pairingsAssigned ? 'YES' : 'NO'}`);
            } else {
                results.push(`    Stats FAILED: ${statsData.error || 'Not admin (expected)'}`);
            }
        }
        
        // 7. Test match/test endpoint
        results.push('7. 🧪 Testing /match/test...');
        const testRes = await fetch(API_URL + '/match/test');
        const testData = await testRes.json();
        if (testRes.ok) {
            results.push('    Test endpoint SUCCESS');
        } else {
            results.push(`    Test endpoint FAILED: ${testData.error || 'Unknown error'}`);
        }
        
        // 8. Cleanup test user (optional)
        results.push('8.  Test cleanup...');
        results.push('    Test user created: ' + testUser.email);
        results.push('   Test token generated: ' + (authToken ? 'YES' : 'NO'));
        
        // Show results
        const resultDiv = document.getElementById('apiResult') || document.getElementById('adminResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="status success">
                    <h3> API Test Results</h3>
                    <pre>${results.join('\n')}</pre>
                    <p><strong>Test user:</strong> ${testUser.email}</p>
                    <p><strong>Token generated:</strong> ${authToken ? ' YES' : ' NO'}</p>
                </div>
            `;
            resultDiv.style.display = 'block';
        } else {
            // Alert with results
            alert(' API TEST RESULTS:\n\n' + results.join('\n'));
        }
        
        console.log(' All endpoint tests completed');
        
    } catch (error) {
        results.push(` ERROR: ${error.message}`);
        alert('Test failed: ' + error.message);
    }
};

// ============================================
// SIMPLER VERSION (just basic connectivity test)
// ============================================

window.testConnection = async function() {
    console.log('🔗 Testing API connection...');
    
    try {
        // Test basic API endpoint
        const response = await fetch(API_URL + '/api');
        const data = await response.json();
        
        if (response.ok) {
            alert(` API Connection SUCCESS!\n\nServer: ${API_URL}\nMessage: ${data.message}\nVersion: ${data.version}`);
            
            // Show endpoints
            let endpoints = ' Available Endpoints:\n';
            if (data.endpoints) {
                endpoints += '\n Auth:\n';
                endpoints += Object.entries(data.endpoints.auth).map(([key, val]) => `  • ${val}`).join('\n');
                
                endpoints += '\n\n Match:\n';
                endpoints += Object.entries(data.endpoints.match).map(([key, val]) => `  • ${val}`).join('\n');
            }
            
            console.log(endpoints);
            
        } else {
            alert(` API Error: ${data.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        alert(` Connection failed!\n\nError: ${error.message}\n\nMake sure:\n1. Server is running\n2. URL: ${API_URL}\n3. No CORS issues`);
    }
};

// ============================================
// AUTO-INITIALIZATION
// ============================================

setTimeout(() => {
    console.log(' Auto-initializing admin functions...');
    
    if (typeof checkAdminOnPageLoad === 'function') {
        checkAdminOnPageLoad();
    } else {
        console.error(' checkAdminOnPageLoad not defined!');
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.isAdmin) {
            document.getElementById('assignBtn').disabled = false;
            document.getElementById('resetBtn').disabled = false;
            document.getElementById('statsBtn').disabled = false;
            
        }
    }
}, 100);