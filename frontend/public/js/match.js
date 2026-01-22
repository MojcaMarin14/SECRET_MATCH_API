// ============================================
// MATCH FUNCTIONS
// ============================================

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
        showResult('matchResult', data.message || data.error, !response.ok);
    } catch (error) {
        showResult('matchResult', ` Napaka: ${error.message}`, true);
    }
}
async function viewMatch() {
    if (!isLoggedIn()) {
        showResult('matchResult', ' Najprej se prijavite', true);
        return;
    }
    
    try {
        console.log(' Calling /match/view...');
        
        const response = await fetch(API_URL + '/match/view', {
            headers: {
                'Authorization': 'Bearer ' + getUserToken()
            }
        });
        
        console.log(' Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log(' Response data:', data);
        
        if (response.ok && data.yourMatch) {
            console.log(' Match found:', data.yourMatch);
            displayMatchCard(data.yourMatch);
            showResult('matchResult', '');
        } else {
            console.log(' Error from backend:', data);
            hideMatchCard();
            showResult('matchResult', data.error || 'Pari še niso dodeljeni', !response.ok);
        }
    } catch (error) {
        console.error(' Fetch error:', error);
        hideMatchCard();
        showResult('matchResult', ` Napaka: ${error.message}`, true);
    }
}

function displayMatchCard(match) {
    const matchCard = document.getElementById('matchCard');
    const matchName = document.getElementById('matchName');
    const matchEmail = document.getElementById('matchEmail');
    const matchPreferences = document.getElementById('matchPreferences');
    
    matchName.textContent = match.name;
    matchEmail.textContent = ` ${match.email}`;
    
    if (match.preferences) {
        matchPreferences.textContent = ` ${match.preferences}`;
        matchPreferences.style.display = 'block';
    } else {
        matchPreferences.style.display = 'none';
    }
    
    matchCard.style.display = 'block';
}

function hideMatchCard() {
    document.getElementById('matchCard').style.display = 'none';

}
// ============================================
// EXPORT MATCH FUNCTIONS TO GLOBAL SCOPE
// ============================================

if (typeof window !== 'undefined') {
    window.joinEvent = joinEvent;
    window.viewMatch = viewMatch;
    window.displayMatchCard = displayMatchCard;
    window.hideMatchCard = hideMatchCard;
}