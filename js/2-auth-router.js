// ==========================================
// 2. DATA LOADING & AUTHENTICATION
// ==========================================

async function loadCustomTopics() {
    try {
        // Reset appData to clean base tree so deleted folders are removed immediately
        appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
        customTopicTypes = {};

        const snapshot = await db.collection("custom_topics").get();
        snapshot.forEach(doc => {
            let data = doc.data();
            let pathArr = (data.parentPath || "").split(' > ').filter(Boolean);
            let current = appData;
            for (let p of pathArr) {
                if (!current[p]) current[p] = {};
                current = current[p];
            }
            if (typeof current === 'object' && !Array.isArray(current) && data.name) {
                if (!current[data.name]) current[data.name] = {};
                let fullKey = pathArr.length > 0 ? (pathArr.join(" > ") + " > " + data.name) : data.name;
                customTopicTypes[fullKey] = { type: data.type || 'both', icon: data.icon || null };
            }
        });

        // Auto-inject ALL root folders (like JEE) into the Daily Quiz Challenge engine
        if (!appData["Daily Quiz Challenge"]) appData["Daily Quiz Challenge"] = {};
        let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");

        Object.keys(customTopicTypes).forEach(key => {
            let root = key.split(' > ')[0];
            if (root && !rootKeys.includes(root) && root !== "Daily Quiz Challenge") {
                rootKeys.push(root);
                appData[root] = appData[root] || {};
            }
        });

        rootKeys.forEach(k => {
            if (!appData["Daily Quiz Challenge"][k]) {
                appData["Daily Quiz Challenge"][k] = {};
                customTopicTypes["Daily Quiz Challenge > " + k] = { type: "mcq", icon: null };
            }
        });

    } catch(e) { console.error("Custom topics loading error:", e); }
}

function showAuthModal() { 
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex'; 
}
function skipSignIn() { 
    sessionStorage.setItem('auth_skipped', 'true'); 
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none'; 
}
function toggleProfileMenu() { 
    const menu = document.getElementById('profileMenu');
    if (menu) menu.classList.toggle('active'); 
}

window.addEventListener('click', function(e) { 
    const badge = document.getElementById('userBadge');
    const menu = document.getElementById('profileMenu');
    if (badge && menu && !badge.contains(e.target) && !menu.contains(e.target)) { 
        menu.classList.remove('active'); 
    } 
});

// Check for resolved reports or doubts to alert the student via the red notification dot
async function checkUserNotifications() {
    if (!currentUser) return;
    try {
        const snap = await db.collection("reported_mistakes")
            .where("studentId", "==", currentUser.uid)
            .where("seenByStudent", "==", false)
            .limit(1)
            .get();
        
        const hasUnseen = !snap.empty;
        const profileDot = document.getElementById('profileNotifDot');
        const reportDot = document.getElementById('reportMenuDot');
        if (profileDot) profileDot.style.display = hasUnseen ? 'block' : 'none';
        if (reportDot) reportDot.style.display = hasUnseen ? 'inline' : 'none';
    } catch (e) {
        console.log("Notification check skipped:", e.message);
    }
}

async function initApp() { 
    dataLoaded = true; 
    if (!window.location.hash) window.location.hash = '#/home'; 
    
    // Initial render so UI mounts immediately
    handleRouting(); 
    
    // Load dynamic Firestore topics and global rating, then refresh active route
    await loadCustomTopics();
    if (typeof loadGlobalRating === 'function') loadGlobalRating();
    handleRouting();
}

auth.onAuthStateChanged((user) => {
    currentUser = user; 
    window.currentUser = user;
    const badge = document.getElementById('userBadge'); 
    const loginNavBtn = document.getElementById('loginNavBtn');
    if (user) {
        const nameEl = document.getElementById('userNameDisplay');
        if (nameEl) nameEl.innerText = user.displayName ? user.displayName.split(" ")[0] : "User";
        if (user.photoURL) { 
            const photoEl = document.getElementById('userPhotoDisplay');
            if (photoEl) {
                photoEl.src = user.photoURL; 
                photoEl.style.display = 'block'; 
            }
        }
        if (badge) badge.style.display = 'flex'; 
        if (loginNavBtn) loginNavBtn.style.display = 'none'; 
        const authModal = document.getElementById('authModal');
        if (authModal) authModal.style.display = 'none';
        
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                let d = doc.data();
                if (d.currentStreak !== undefined) {
                    const streakEl = document.getElementById('nav-streak-display');
                    if (streakEl) streakEl.innerText = d.currentStreak;
                }
            }
            db.collection("users").doc(user.uid).set({ 
                displayName: user.displayName, email: user.email, photoURL: user.photoURL, 
                lastLogin: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
        }).catch(() => {});
        
        checkUserNotifications();
        if (typeof loadUserBookmarks === 'function') loadUserBookmarks();
    } else {
        if (badge) badge.style.display = 'none'; 
        if (loginNavBtn) loginNavBtn.style.display = 'flex'; 
        const notifDot = document.getElementById('profileNotifDot');
        if (notifDot) notifDot.style.display = 'none';
        const streakEl = document.getElementById('nav-streak-display');
        if (streakEl) streakEl.innerText = "0";
        userBookmarks = [];
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) {
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'flex';
        }
    }
    if (dataLoaded) handleRouting(); 
});

// CRITICAL FIX: Wait until all script files (3-ui, 4-quiz, 5-ai, 6-admin) are parsed before running initApp()
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 0);
}

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => showNotification("❌ Sign-in Error: " + err.message)); }
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

// SMART SIDEBAR: Adapts to NEET, JEE, General Knowledge, and any new custom Root Category
function updateSidebarLinks() {
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;

    let hash = window.location.hash.replace(/^#\/?/, '');

    if (hash.includes('custom-setup') || hash.includes('leaderboard') || hash.includes('board/') || hash.includes('progress') || hash.includes('bookmarks') || hash.includes('quiz') || hash.includes('admin') || hash === 'diary') {
        sidebar.style.display = 'none';
        return;
    }

    let rootTopic = "NEET";
    if (currentPath && currentPath.length > 0 && currentPath[0] !== "Daily Quiz Challenge") {
        rootTopic = currentPath[0];
    } else {
        const rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
        if (rootKeys.length > 0) rootTopic = rootKeys[0];
    }

    sidebar.style.display = 'block';
    let safeTopic = rootTopic.replace(/'/g, "\\'");

    let quickLinksHtml = '';
    let essentialPracticeHtml = '';

    if (appData[rootTopic]) {
        const subKeys = Object.keys(appData[rootTopic]);

        let bookKey = subKeys.find(k => k.toLowerCase().includes('ncert') || k.toLowerCase().includes('book') || k.toLowerCase().includes('note'));
        let pyqKey = subKeys.find(k => k.toLowerCase().includes('pyq') || k.toLowerCase().includes('previous') || k.toLowerCase().includes('paper'));
        let mcqKey = subKeys.find(k => k.toLowerCase().includes('mcq') || k.toLowerCase().includes('practice'));
        let mockKey = subKeys.find(k => k.toLowerCase().includes('mock') || k.toLowerCase().includes('test'));

        if (bookKey) {
            let safeBookKey = bookKey.replace(/'/g, "\\'");
            quickLinksHtml += `
                <a class="action-link" onclick="jumpToSection(['${safeTopic}', '${safeBookKey}'])">
                    <span class="link-icon" style="color: #9C27B0;">📚</span>
                    <span class="link-text">${bookKey.replace(/^\d+\.\s*/, '')}</span>
                </a>`;
        }
        if (pyqKey) {
            let safePyqKey = pyqKey.replace(/'/g, "\\'");
            quickLinksHtml += `
                <a class="action-link" onclick="jumpToSection(['${safeTopic}', '${safePyqKey}'])">
                    <span class="link-icon" style="color: #607D8B;">📄</span>
                    <span class="link-text">${pyqKey.replace(/^\d+\.\s*/, '')}</span>
                </a>`;
        }

        // Dynamic Fallback: If a custom category doesn't use standard book/pyq names, list its top sub-folders
        if (!bookKey && !pyqKey && subKeys.length > 0) {
            subKeys.slice(0, 3).forEach(k => {
                let safeK = k.replace(/'/g, "\\'");
                let cleanK = k.replace(/^\d+\.\s*/, '');
                let iconObj = typeof getSmartIcon === 'function' ? getSmartIcon(cleanK) : null;
                quickLinksHtml += `
                    <a class="action-link" onclick="jumpToSection(['${safeTopic}', '${safeK}'])">
                        <span class="link-icon">${iconObj ? iconObj.i : '📂'}</span>
                        <span class="link-text">${cleanK}</span>
                    </a>`;
            });
        }

        if (mcqKey) {
            let safeMcqKey = mcqKey.replace(/'/g, "\\'");
            essentialPracticeHtml += `
                <a class="action-link" onclick="jumpToSection(['${safeTopic}', '${safeMcqKey}'])">
                    <span class="link-icon" style="color: #00BCD4;">📝</span>
                    <span class="link-text">${mcqKey.replace(/^\d+\.\s*/, '')}</span>
                </a>`;
        }
        if (mockKey) {
            let safeMockKey = mockKey.replace(/'/g, "\\'");
            essentialPracticeHtml += `
                <a class="action-link" onclick="jumpToSection(['${safeTopic}', '${safeMockKey}'])">
                    <span class="link-icon" style="color: #F44336;">⏱️</span>
                    <span class="link-text">${mockKey.replace(/^\d+\.\s*/, '')}</span>
                </a>`;
        }
    }

    essentialPracticeHtml += `
        <a class="action-link" onclick="jumpToSection(['Daily Quiz Challenge', '${safeTopic}'])">
            <span class="link-icon" style="color: #fdb813;">📅</span>
            <span class="link-text">Daily Challenge (${rootTopic.replace(/^\d+\.\s*/, '')})</span>
        </a>`;

    sidebar.innerHTML = `
    <div class="card sidebar-card">
        <h3 class="section-title">Quick Links</h3>
        ${quickLinksHtml || '<p style="color:var(--text-muted); font-size:13px;">Select a category to view resources</p>'}
    </div>
    <div class="card sidebar-card">
        <h3 class="section-title">Essential Practice</h3>
        ${essentialPracticeHtml}
    </div>`;
}

function handleRouting() {
    try {
        if (!dataLoaded) return; 
        let rawHash = window.location.hash.replace(/^#\/?/, ''); 
        let hash = decodeURIComponent(rawHash);
        
        if (hash === 'admin' || hash === 'admin-panel') document.body.classList.add('admin-mode');
        else document.body.classList.remove('admin-mode');
        
        let isRootHome = (!hash || hash === 'home');
        
        const backBtn = document.getElementById('dynamic-back-container');
        if (backBtn) backBtn.style.display = isRootHome ? 'none' : 'block';
        
        updateBottomNav(rawHash);
        
        if (isRootHome) { currentPath = []; if (typeof _renderView === 'function') _renderView(); } 
        else if (hash === 'custom-setup') { if (typeof cwStep1 === 'function') cwStep1(); } 
        else if (hash.startsWith('path/')) { currentPath = hash.replace('path/', '').split('/').filter(Boolean); if (typeof _renderView === 'function') _renderView(); } 
        else if (hash === 'leaderboard') { if (typeof _renderLeaderboardOptions === 'function') _renderLeaderboardOptions(); } 
        else if (hash.startsWith('board/')) { if (typeof fetchLiveLeaderboard === 'function') fetchLiveLeaderboard(decodeURIComponent(hash.replace('board/', ''))); } 
        else if (hash === 'quiz') { if (typeof _initiateQuizEngine === 'function') _initiateQuizEngine(); } 
        else if (hash === 'progress') { if (typeof _renderProgressSelection === 'function') _renderProgressSelection(); } 
        else if (hash.startsWith('progress/')) { if (typeof _renderProgressDashboard === 'function') _renderProgressDashboard(decodeURIComponent(hash.split('/')[1])); }
        else if (hash === 'bookmarks') { if (typeof _initiateBookmarkQuiz === 'function') _initiateBookmarkQuiz(); }
        else if (hash === 'diary') { if (typeof _renderDoubtDiary === 'function') _renderDoubtDiary(); } 
        else if (hash === 'admin') { if (typeof _renderAdminLogin === 'function') _renderAdminLogin(); } 
        else if (hash === 'admin-panel') { if (typeof _renderAdminPanel === 'function') _renderAdminPanel(); }
        
        updateSidebarLinks();
    } catch (err) { console.error("Routing Error:", err); }
}

function goHome() { 
    if (window.location.hash === '#/home' || window.location.hash === '') {
        currentPath = [];
        const backBtn = document.getElementById('dynamic-back-container');
        if(backBtn) backBtn.style.display = 'none';
        if (typeof _renderView === 'function') _renderView();
        updateSidebarLinks();
    } else {
        window.location.hash = '#/home';
    }
}

function navigateTo(key) { window.location.hash = '#/path/' + [...currentPath, key].map(encodeURIComponent).join('/'); }
function jumpToSection(pathArray) { window.location.hash = '#/path/' + pathArray.map(encodeURIComponent).join('/'); }
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }
function goBack() { 
    if (window.history.length > 1 && window.location.hash !== '#/home') { window.history.back(); } 
    else { goHome(); }
}
