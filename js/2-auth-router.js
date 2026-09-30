// ==========================================
// 2. DATA LOADING & AUTHENTICATION
// ==========================================
async function loadCustomTopics() {
    customTopicTypes = {};
    try {
        const snapshot = await db.collection("custom_topics").get();
        snapshot.forEach(doc => {
            let data = doc.data(); 
            let pathArr = (data.parentPath || "").split(' > '); 
            let current = appData;
            for (let p of pathArr) { 
                if (p) { 
                    if (!current[p]) current[p] = {}; 
                    current = current[p]; 
                } 
            }
            if (typeof current === 'object' && !Array.isArray(current) && data.name) {
                if (!current[data.name]) current[data.name] = {};
                customTopicTypes[data.parentPath + " > " + data.name] = data.type; 
            }
        });
    } catch(e) { console.error("Custom topics loading error:", e); }
}

function showAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function skipSignIn() { sessionStorage.setItem('auth_skipped', 'true'); document.getElementById('authModal').style.display = 'none'; }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('active'); }

window.addEventListener('click', function(e) { 
    if (!document.getElementById('userBadge').contains(e.target) && !document.getElementById('profileMenu').contains(e.target)) { 
        document.getElementById('profileMenu').classList.remove('active'); 
    } 
});

async function initApp() { 
    await loadCustomTopics(); 
    dataLoaded = true; 
    if (!window.location.hash) window.location.hash = '#/home'; 
    handleRouting(); 
}

auth.onAuthStateChanged((user) => {
    currentUser = user; 
    const badge = document.getElementById('userBadge'); 
    const loginNavBtn = document.getElementById('loginNavBtn');
    if (user) {
        document.getElementById('userNameDisplay').innerText = user.displayName ? user.displayName.split(" ")[0] : "User";
        if(user.photoURL) { 
            document.getElementById('userPhotoDisplay').src = user.photoURL; 
            document.getElementById('userPhotoDisplay').style.display = 'block'; 
        }
        badge.style.display = 'flex'; 
        loginNavBtn.style.display = 'none'; 
        document.getElementById('authModal').style.display = 'none';
        
        db.collection("users").doc(user.uid).get().then(doc => {
            if(doc.exists) {
                let d = doc.data();
                if(d.currentStreak) document.getElementById('nav-streak-display').innerText = d.currentStreak;
            }
            db.collection("users").doc(user.uid).set({ 
                displayName: user.displayName, 
                email: user.email, 
                photoURL: user.photoURL, 
                lastLogin: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
        });
        
        checkUserNotifications();
        loadUserBookmarks();
    } else {
        badge.style.display = 'none'; 
        loginNavBtn.style.display = 'flex'; 
        document.getElementById('profileNotifDot').style.display = 'none';
        document.getElementById('nav-streak-display').innerText = "0";
        userBookmarks = [];
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) {
            document.getElementById('authModal').style.display = 'flex';
        }
    }
    if (dataLoaded) handleRouting(); 
});

initApp(); 

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => showNotification("❌ Sign-in Error")); }
function signOut() { if(confirm("Are you sure you want to sign out?")) auth.signOut(); }

// ==========================================
// 3. ROUTING ENGINE
// ==========================================
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    try {
        if(!dataLoaded) return; 
        let rawHash = window.location.hash.replace(/^#\/?/, ''); 
        let hash = decodeURIComponent(rawHash);
        
        let isRootHome = (!hash || hash === 'home');
        document.getElementById('main-sidebar').style.display = isRootHome ? 'block' : 'none';
        
        if (isRootHome) { currentPath = []; _renderView(); } 
        else if (hash.startsWith('path/')) { currentPath = hash.replace('path/', '').split('/'); _renderView(); } 
        else if (hash === 'leaderboard') _renderLeaderboardOptions(); 
        else if (hash.startsWith('board/')) fetchLiveLeaderboard(hash.replace('board/', '')); 
        else if (hash === 'quiz') _initiateQuizEngine(); 
        else if (hash === 'progress') _renderProgressSelection(); 
        else if (hash.startsWith('progress/')) _renderProgressDashboard(decodeURIComponent(hash.split('/')[1]));
        else if (hash === 'bookmarks') _initiateBookmarkQuiz();
        else if (hash === 'diary') _renderDoubtDiary(); 
        else if (hash === 'admin') _renderAdminLogin(); 
        else if (hash === 'admin-panel') _renderAdminPanel();
    } catch (err) {
        console.error("Routing Error:", err);
    }
}

// FIXED: Sidebar explicitly commanded to 'block' if returning to the home root
function goHome() { 
    if (window.location.hash === '#/home' || window.location.hash === '') {
        currentPath = [];
        const sidebar = document.getElementById('main-sidebar');
        if(sidebar) sidebar.style.display = 'block';
        _renderView();
    } else {
        window.location.replace(window.location.origin + window.location.pathname + '#/home');
    }
}

function navigateTo(key) { window.location.hash = '#/path/' + encodeURIComponent([...currentPath, key].join('/')).replace(/%2F/g, '/'); }
function jumpToSection(pathArray) { window.location.hash = '#/path/' + encodeURIComponent(pathArray.join('/')).replace(/%2F/g, '/'); }
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }
function goBack() { 
    if (window.history.length > 1 && window.location.hash !== '#/home') {
        window.history.back(); 
    } else {
        goHome();
    }
}
