// ==========================================
// 2. DATA LOADING & AUTHENTICATION
// ==========================================

// CRITICAL FIX: Global fallbacks prevent the app from crashing on boot!
window.customTopicTypes = window.customTopicTypes || {};
window.currentUser = window.currentUser || null;
window.userBookmarks = window.userBookmarks || [];
window.dataLoaded = window.dataLoaded || false;

async function loadCustomTopics() {
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
                let fullKey = data.parentPath ? (data.parentPath + " > " + data.name) : data.name;
                window.customTopicTypes[fullKey] = data.type; 
            }
        });

        // 🔴 CRITICAL NEW FEATURE: Auto-Inject Admin DB Topics into App Structure!
        // This makes JEE show up in Daily Quizzes, Leaderboards, and Sidebars automatically.
        if (!appData["Daily Quiz Challenge"]) appData["Daily Quiz Challenge"] = {};
        
        let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
        
        Object.keys(window.customTopicTypes).forEach(key => {
            let root = key.split(' > ')[0];
            if(root && !rootKeys.includes(root) && root !== "Daily Quiz Challenge") {
                rootKeys.push(root);
                appData[root] = appData[root] || {}; 
            }
        });

        rootKeys.forEach(k => {
            if (!appData["Daily Quiz Challenge"][k]) {
                appData["Daily Quiz Challenge"][k] = {};
                window.customTopicTypes["Daily Quiz Challenge > " + k] = "mcq"; 
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

function initApp() { 
    window.dataLoaded = true; 
    if (!window.location.hash) window.location.hash = '#/home'; 
    handleRouting(); 
    
    loadCustomTopics().then(() => {
        if(window.location.hash === '#/home' || window.location.hash === '' || window.location.hash === '#/') {
            _renderView(); 
        }
    });
}

auth.onAuthStateChanged((user) => {
    window.currentUser = user; 
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
        window.userBookmarks = [];
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) {
            document.getElementById('authModal').style.display = 'flex';
        }
    }
    if (window.dataLoaded) handleRouting(); 
});

initApp(); 

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => showNotification("❌ Sign-in Error")); }
function signOut() { if(confirm("Are you sure you want to sign out?")) auth.signOut(); }

// ==========================================
// 3. ROUTING ENGINE & DYNAMIC SIDEBAR
// ==========================================
window.addEventListener('hashchange', handleRouting);

function updateBottomNav(hash) {
    document.querySelectorAll('.app-tab').forEach(tab => tab.classList.remove('active'));
    
    if (hash === 'quiz' || hash === 'admin' || hash === 'admin-panel') {
        document.body.classList.add('hide-bottom-bar');
    } else {
        document.body.classList.remove('hide-bottom-bar');
    }

    if (hash === 'admin' || hash === 'admin-panel') {
        document.body.classList.add('admin-mode');
    } else {
        document.body.classList.remove('admin-mode');
    }

    if (!hash || hash === 'home') {
        const homeTab = document.querySelector('.app-tab[onclick="goHome()"]');
        if(homeTab) homeTab.classList.add('active');
    } else if (hash.includes('leaderboard') || hash.includes('board/')) {
        const rankTab = document.querySelector('.app-tab[onclick="window.location.hash=\'#/leaderboard\'"]');
        if(rankTab) rankTab.classList.add('active');
    } else if (hash.startsWith('progress')) {
        const statsTab = document.querySelector('.app-tab[onclick="window.location.hash=\'#/progress\'"]');
        if(statsTab) statsTab.classList.add('active');
    } else if (hash === 'bookmarks') {
        const savedTab = document.querySelector('.app-tab[onclick="window.location.hash=\'#/bookmarks\'"]');
        if(savedTab) savedTab.classList.add('active');
    }
}

function updateSidebarLinks() {
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;

    let rootTopic = null;
    if (currentPath && currentPath.length > 0) rootTopic = currentPath[0]; 

    // Hide sidebar on Root Home, Leaderboards, or Custom Setup screens.
    if (!rootTopic || window.location.hash === '#/home' || window.location.hash.includes('custom-setup') || window.location.hash.includes('leaderboard')) {
        sidebar.style.display = 'none';
        return;
    }
    
    // Dynamically generate Sidebar links based on current folder
    if (appData[rootTopic]) {
        sidebar.style.display = 'block';
        let safeTopic = rootTopic.replace(/'/g, "\\'");

        sidebar.innerHTML = `
        <div class="card sidebar-card">
            <h3 class="section-title">Quick Links</h3>
            <a class="action-link" onclick="jumpToSection(['${safeTopic}', 'NCERT Books'])">
                <span class="link-icon" style="color: #9C27B0;">📚</span>
                <span class="link-text">${rootTopic} NCERT Books</span>
            </a>
            <a class="action-link" onclick="jumpToSection(['${safeTopic}', 'Previous Year Papers'])">
                <span class="link-icon" style="color: #607D8B;">📄</span>
                <span class="link-text">${rootTopic} PYQs</span>
            </a>
        </div>
        <div class="card sidebar-card">
            <h3 class="section-title">Essential Practice</h3>
            <a class="action-link" onclick="jumpToSection(['${safeTopic}', 'MCQs Practice'])">
                <span class="link-icon" style="color: #00BCD4;">📝</span>
                <span class="link-text">Subject-wise MCQs</span>
            </a>
            <a class="action-link" onclick="jumpToSection(['${safeTopic}', 'Mock Test'])">
                <span class="link-icon" style="color: #F44336;">⏱️</span>
                <span class="link-text">Full-Length Mock Tests</span>
            </a>
            <a class="action-link" onclick="jumpToSection(['Daily Quiz Challenge', '${safeTopic}'])">
                <span class="link-icon" style="color: #fdb813;">📅</span>
                <span class="link-text">Daily Quiz Challenge</span>
            </a>
        </div>`;
    } else {
        sidebar.style.display = 'none';
    }
}

function handleRouting() {
    try {
        if(!window.dataLoaded) return; 
        let rawHash = window.location.hash.replace(/^#\/?/, ''); 
        let hash = decodeURIComponent(rawHash);
        
        if (hash === 'admin' || hash === 'admin-panel') {
            document.body.classList.add('admin-mode');
        } else {
            document.body.classList.remove('admin-mode');
        }
        
        let isRootHome = (!hash || hash === 'home');
        
        const backBtn = document.getElementById('dynamic-back-container');
        if (backBtn) backBtn.style.display = isRootHome ? 'none' : 'block';
        
        updateBottomNav(rawHash);
        
        if (isRootHome) { currentPath = []; _renderView(); } 
        else if (hash === 'custom-setup') { cwStep1(); } 
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
        
        if (hash !== 'quiz' && hash !== 'admin' && hash !== 'admin-panel') {
            updateSidebarLinks();
        } else {
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar) sidebar.style.display = 'none';
        }
    } catch (err) {
        console.error("Routing Error:", err);
    }
}

function goHome() { 
    if (window.location.hash === '#/home' || window.location.hash === '') {
        currentPath = [];
        const backBtn = document.getElementById('dynamic-back-container');
        if(backBtn) backBtn.style.display = 'none';
        _renderView();
        updateSidebarLinks();
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
