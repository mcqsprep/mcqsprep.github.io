// ==========================================
// 2. DATA LOADING & AUTHENTICATION
// ==========================================

function removePathFromAppData(fullPathStr) {
    let parts = (fullPathStr || "").split(' > ').filter(Boolean);
    if (parts.length === 0) return;
    let curr = appData;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') return;
        curr = curr[parts[i]];
    }
    delete curr[parts[parts.length - 1]];
    delete customTopicTypes[fullPathStr];
}

async function loadCustomTopics() {
    try {
        appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
        customTopicTypes = {};

        // 1. Load Topic Overrides (for edited/deleted built-in folders)
        try {
            const ovDoc = await db.collection("settings").doc("topic_overrides").get();
            if (ovDoc.exists) {
                let ovData = ovDoc.data();
                topicOverrides.deletedPaths = Array.isArray(ovData.deletedPaths) ? ovData.deletedPaths : [];
                topicOverrides.editedPaths = ovData.editedPaths || {};
            } else {
                topicOverrides = { deletedPaths: [], editedPaths: {} };
            }
        } catch (e) {}

        Object.keys(topicOverrides.editedPaths || {}).forEach(fullKey => {
            customTopicTypes[fullKey] = topicOverrides.editedPaths[fullKey];
        });

        (topicOverrides.deletedPaths || []).forEach(delPath => {
            removePathFromAppData(delPath);
        });

        // 2. Load Custom Topics from Firestore
        const snapshot = await db.collection("custom_topics").get();
        let gkCleanupPromises = [];
        let shouldCleanGK = !localStorage.getItem('gk_subtopics_purged_v39');

        snapshot.forEach(doc => {
            let data = doc.data();
            let parentPath = (data.parentPath || "").trim();

            if (shouldCleanGK && (parentPath === "General Knowledge" || parentPath.startsWith("General Knowledge > "))) {
                gkCleanupPromises.push(db.collection("custom_topics").doc(doc.id).delete());
                return;
            }

            let pathArr = parentPath.split(' > ').filter(Boolean);
            let current = appData;
            for (let p of pathArr) {
                if (!current[p]) current[p] = {};
                current = current[p];
            }
            if (typeof current === 'object' && !Array.isArray(current) && data.name) {
                if (!current[data.name]) current[data.name] = {};
                let fullKey = pathArr.length > 0 ? (pathArr.join(" > ") + " > " + data.name) : data.name;
                // Automatically assign a smart icon if none was saved
                let autoIcon = data.icon || (typeof getAutomaticIconForName === 'function' ? getAutomaticIconForName(data.name, data.type) : null);
                customTopicTypes[fullKey] = { type: data.type || 'both', icon: autoIcon, docId: doc.id };
            }
        });

        if (shouldCleanGK) {
            if (gkCleanupPromises.length > 0) await Promise.all(gkCleanupPromises);
            localStorage.setItem('gk_subtopics_purged_v39', 'true');
        }

        // 3. AUTOMATIC DAILY QUIZ CHALLENGE ENGINE:
        // Automatically adds NEET, JEE, General Knowledge, and all future Root Exam Categories under Daily Quiz Challenge
        appData["Daily Quiz Challenge"] = {};
        let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
        let rootExams = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge" && !deletedSet.has(k));

        Object.keys(customTopicTypes).forEach(key => {
            let root = key.split(' > ')[0];
            if (root && root !== "Daily Quiz Challenge" && !deletedSet.has(root) && !rootExams.includes(root)) {
                rootExams.push(root);
                appData[root] = appData[root] || {};
            }
        });

        rootExams.forEach(examKey => {
            appData["Daily Quiz Challenge"][examKey] = {};
            let rootMeta = customTopicTypes[examKey];
            let rootIcon = rootMeta ? rootMeta.icon : null;
            customTopicTypes["Daily Quiz Challenge > " + examKey] = { type: "mcq", icon: rootIcon };
        });

        // 4. Load Manual Sidebar Config (Quick Links & Additional Essential Practice items)
        try {
            const sbDoc = await db.collection("settings").doc("sidebar_config").get();
            if (sbDoc.exists) {
                let sbData = sbDoc.data();
                window.sidebarConfig.quickLinks = Array.isArray(sbData.quickLinks) ? sbData.quickLinks : [];
                window.sidebarConfig.essentialPractice = Array.isArray(sbData.essentialPractice) ? sbData.essentialPractice : [];
            } else {
                window.sidebarConfig = { quickLinks: [], essentialPractice: [] };
            }
        } catch (e) {}

        // 5. Load Manual Custom Practice Config (Subjects & Chapters)
        try {
            const cpDoc = await db.collection("settings").doc("custom_practice_config").get();
            if (cpDoc.exists && cpDoc.data().exams) {
                window.customPracticeConfig.exams = cpDoc.data().exams;
            } else {
                window.customPracticeConfig = { exams: {} };
            }
        } catch (e) {}

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

async function checkUserNotifications() {
    if (!currentUser) return;
    try {
        const snap = await db.collection("reported_mistakes")
            .where("studentId", "==", currentUser.uid)
            .get();
        
        let hasUnseen = false;
        snap.forEach(doc => {
            if (doc.data().seenByStudent === false) hasUnseen = true;
        });

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
    
    handleRouting(); 
    
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
                if (d.rating && typeof syncUserRatingUI === 'function') {
                    syncUserRatingUI(d.rating, d.feedback || '');
                }
            }
            db.collection("users").doc(user.uid).set({ 
                displayName: user.displayName, email: user.email, photoURL: user.photoURL, 
                lastLogin: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
        }).catch(() => {});
        
        checkUserNotifications();
        if (typeof loadUserBookmarks === 'function') loadUserBookmarks();
        if (typeof loadGlobalRating === 'function') loadGlobalRating();
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

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 0);
}

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => showNotification("❌ Sign-in Error: " + err.message)); }
function signOut() { if(confirm("Are you sure you want to sign out?")) auth.signOut(); }

// ==========================================
// 3. ROUTING ENGINE & SIDEBAR RENDERER
// ==========================================
window.addEventListener('hashchange', handleRouting);

function openSidebarItem(encodedPath) {
    let fullPath = decodeURIComponent(encodedPath);
    let pathArr = fullPath.split(' > ').filter(Boolean);
    if (pathArr.length > 0) {
        jumpToSection(pathArr);
    }
}

function updateBottomNav(hash) {
    document.querySelectorAll('.app-tab').forEach(tab => tab.classList.remove('active'));
    
    if (hash === 'quiz' || hash === 'custom-setup' || hash === 'admin' || hash === 'admin-panel') {
        document.body.classList.add('hide-bottom-bar');
        document.body.classList.add('hide-ai-btn');
    } else {
        document.body.classList.remove('hide-bottom-bar');
        document.body.classList.remove('hide-ai-btn');
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

// FIXED (Requirement 1):
// - Quick Links: 100% manually controlled from Admin Panel
// - Essential Practice: ALWAYS includes automatic "Daily Quiz Challenge" (which auto-lists NEET, JEE, GK & future topics) + any manual items added by Admin
function updateSidebarLinks() {
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;

    let hash = window.location.hash.replace(/^#\/?/, '');
    let isRootHome = (!hash || hash === 'home') && (!currentPath || currentPath.length === 0);

    if (!isRootHome) {
        sidebar.style.display = 'none';
        return;
    }

    sidebar.style.display = 'block';

    let quickLinksList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.quickLinks))
        ? window.sidebarConfig.quickLinks
        : [];

    let essentialList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.essentialPractice))
        ? window.sidebarConfig.essentialPractice
        : [];

    let quickLinksHtml = '';
    let usedColorsQ = new Set();

    quickLinksList.forEach((item, idx) => {
        let displayTitle = (item.title || item.path.split(' > ').pop() || '').replace(/^\d+\.\s*/, '');
        let encodedPath = encodeURIComponent(item.path);
        let theme = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(displayTitle, item.icon || null, idx, usedColorsQ)
            : { i: "📚", c: "#a855f7", bg: "rgba(168,85,247,0.16)", border: "rgba(168,85,247,0.6)", glow: "rgba(168,85,247,0.24)" };

        quickLinksHtml += `
            <a class="action-link colored-link" style="--topic-color:${theme.c}; --topic-border:${theme.border}; --topic-glow:${theme.glow}; --topic-bg:${theme.bg};" onclick="openSidebarItem('${encodedPath}')">
                <span class="link-icon" style="color: ${theme.c};">${theme.i}</span>
                <span class="link-text">${displayTitle}</span>
            </a>`;
    });

    let essentialPracticeHtml = '';
    let usedColorsE = new Set(["#fdb813"]);

    // 1. Automatic Daily Quiz Challenge (Always present in Essential Practice without Admin setup)
    essentialPracticeHtml += `
        <a class="action-link colored-link" style="--topic-color:#fdb813; --topic-border:rgba(253,184,19,0.65); --topic-glow:rgba(253,184,19,0.28); --topic-bg:rgba(253,184,19,0.16);" onclick="jumpToSection(['Daily Quiz Challenge'])">
            <span class="link-icon" style="color: #fdb813;">📅</span>
            <span class="link-text">Daily Quiz Challenge</span>
        </a>`;

    // 2. Any additional items manually added to Essential Practice via Admin Panel
    essentialList.forEach((item, idx) => {
        if (item.path === 'Daily Quiz Challenge') return;
        let displayTitle = (item.title || item.path.split(' > ').pop() || '').replace(/^\d+\.\s*/, '');
        let encodedPath = encodeURIComponent(item.path);
        let theme = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(displayTitle, item.icon || null, idx + 4, usedColorsE)
            : { i: "📝", c: "#06b6d4", bg: "rgba(6,182,212,0.16)", border: "rgba(6,182,212,0.6)", glow: "rgba(6,182,212,0.24)" };

        essentialPracticeHtml += `
            <a class="action-link colored-link" style="--topic-color:${theme.c}; --topic-border:${theme.border}; --topic-glow:${theme.glow}; --topic-bg:${theme.bg};" onclick="openSidebarItem('${encodedPath}')">
                <span class="link-icon" style="color: ${theme.c};">${theme.i}</span>
                <span class="link-text">${displayTitle}</span>
            </a>`;
    });

    sidebar.innerHTML = `
    <div class="card sidebar-card">
        <h3 class="section-title">Quick Links</h3>
        ${quickLinksHtml || '<p style="color:var(--text-muted); font-size:12.5px; margin:0;">No quick links added yet.</p>'}
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
        
        const bottomBackBtn = document.getElementById('dynamic-back-container');
        if (bottomBackBtn) bottomBackBtn.style.display = 'none';
        
        if (typeof handlePCBackButton === 'function') handlePCBackButton();
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
    if (typeof currentTimer !== 'undefined' && currentTimer) clearInterval(currentTimer);
    document.body.classList.remove('hide-ai-btn');
    document.body.classList.remove('hide-bottom-bar');
    if (window.location.hash === '#/home' || window.location.hash === '') {
        currentPath = [];
        if (typeof _renderView === 'function') _renderView();
        updateSidebarLinks();
        if (typeof handlePCBackButton === 'function') handlePCBackButton();
    } else {
        window.location.hash = '#/home';
    }
}

function navigateTo(key) { window.location.hash = '#/path/' + [...currentPath, key].map(encodeURIComponent).join('/'); }
function jumpToSection(pathArray) { window.location.hash = '#/path/' + pathArray.map(encodeURIComponent).join('/'); }
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }

function goBack() { 
    if (typeof currentTimer !== 'undefined' && currentTimer) clearInterval(currentTimer);
    let rawHash = window.location.hash.replace(/^#\/?/, '');
    let hash = decodeURIComponent(rawHash);

    if (hash.startsWith('path/')) {
        let parts = hash.replace('path/', '').split('/').filter(Boolean);
        if (parts.length > 1) {
            parts.pop();
            jumpToSection(parts);
        } else {
            goHome();
        }
    } else if (hash === 'quiz') {
        if (currentPath && currentPath.length > 0) {
            jumpToSection(currentPath);
        } else {
            goHome();
        }
    } else if (hash.startsWith('board/')) {
        window.location.hash = '#/leaderboard';
    } else if (hash.startsWith('progress/')) {
        window.location.hash = '#/progress';
    } else {
        goHome();
    }
}
