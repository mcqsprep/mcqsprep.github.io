// ==========================================
// 2. DATA LOADING & AUTHENTICATION
// ==========================================

function isResourceSectionName(name, typeVal = null) {
    if (typeVal === 'pdf') return true;
    let lower = (name || "").replace(/^\d+\.\s*/, '').trim().toLowerCase();
    const resKeywords = ["ncert", "book", "pyq", "previous", "pdf", "note", "material", "syllabus", "formula"];
    return resKeywords.some(k => lower.includes(k));
}

function isPracticeSectionName(name, typeVal = null) {
    let lower = (name || "").replace(/^\d+\.\s*/, '').trim().toLowerCase();
    const pracKeywords = ["practice paper", "sample paper", "model paper", "paper", "mock", "test", "mcqs practice", "quiz"];
    return pracKeywords.some(k => lower.includes(k));
}

async function loadCustomTopics() {
    try {
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

        if (!appData["Daily Quiz Challenge"]) appData["Daily Quiz Challenge"] = {};
        let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");

        Object.keys(customTopicTypes).forEach(key => {
            let root = key.split(' > ')[0];
            if (root && !rootKeys.includes(root) && root !== "Daily Quiz Challenge") {
                rootKeys.push(root);
                appData[root] = appData[root] || {};
            }
        });

        let quickLinksSet = new Set(STANDARD_QUICK_LINKS);
        let essentialPracticeSet = new Set(["Practice Paper", "Mock Test"]);

        // Auto-sync standard Quick Links & Essential Practice sections into EVERY Root Exam (NEET, JEE, GK & future topics)
        rootKeys.forEach(examKey => {
            let rootMeta = customTopicTypes[examKey];
            let rootType = rootMeta ? (typeof rootMeta === 'object' ? rootMeta.type : rootMeta) : 'both';

            // Ensure Daily Quiz Challenge includes every root exam
            if (!appData["Daily Quiz Challenge"][examKey]) {
                appData["Daily Quiz Challenge"][examKey] = {};
                customTopicTypes["Daily Quiz Challenge > " + examKey] = { type: "mcq", icon: null };
            }

            if (rootType !== 'pdf' && rootType !== 'mcq' && typeof appData[examKey] === 'object') {
                STANDARD_QUICK_LINKS.forEach(sec => {
                    if (!appData[examKey][sec]) appData[examKey][sec] = {};
                });
                STANDARD_ESSENTIAL_PRACTICE.forEach(sec => {
                    if (!appData[examKey][sec]) appData[examKey][sec] = {};
                });
            }

            // Scan 2nd-level sections under each exam to auto-discover new Quick Links or Essential Practice sections
            Object.keys(appData[examKey] || {}).forEach(subKey => {
                let fullSubKey = `${examKey} > ${subKey}`;
                let subMeta = customTopicTypes[fullSubKey];
                let subType = subMeta ? (typeof subMeta === 'object' ? subMeta.type : subMeta) : null;

                if (isResourceSectionName(subKey, subType) && !isPracticeSectionName(subKey, subType)) {
                    quickLinksSet.add(subKey);
                } else if (isPracticeSectionName(subKey, subType) && subKey !== "MCQs Practice") {
                    essentialPracticeSet.add(subKey);
                }
            });
        });

        window.dynamicQuickLinks = Array.from(quickLinksSet);
        window.dynamicEssentialPractice = Array.from(essentialPracticeSet);

        // Ensure all discovered Quick Links & Essential Practice sections exist across all root exams
        rootKeys.forEach(examKey => {
            if (typeof appData[examKey] === 'object') {
                window.dynamicQuickLinks.forEach(sec => {
                    if (!appData[examKey][sec]) appData[examKey][sec] = {};
                });
                window.dynamicEssentialPractice.forEach(sec => {
                    if (!appData[examKey][sec]) appData[examKey][sec] = {};
                });
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
// 3. ROUTING ENGINE & GLOBAL HUB SIDEBAR
// ==========================================
window.addEventListener('hashchange', handleRouting);

function openGlobalHub(sectionName) {
    window.activeHubSection = sectionName;
    window.location.hash = '#/hub/' + encodeURIComponent(sectionName);
}

function openExamFromHub(examKey, sectionName) {
    window.activeHubSection = sectionName;
    if (sectionName === "Daily Quiz Challenge") {
        jumpToSection(["Daily Quiz Challenge", examKey]);
    } else {
        jumpToSection([examKey, sectionName]);
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

// Global Quick Links & Essential Practice Sidebar (Works for NEET, JEE, GK & all future root topics)
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

    let quickLinksList = window.dynamicQuickLinks && window.dynamicQuickLinks.length > 0
        ? window.dynamicQuickLinks
        : STANDARD_QUICK_LINKS;

    let essentialList = window.dynamicEssentialPractice && window.dynamicEssentialPractice.length > 0
        ? window.dynamicEssentialPractice
        : ["Practice Paper", "Mock Test"];

    let quickLinksHtml = '';
    let usedColorsQ = new Set();

    quickLinksList.forEach((secName, idx) => {
        let safeSec = secName.replace(/'/g, "\\'");
        let cleanSec = secName.replace(/^\d+\.\s*/, '');
        let theme = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(cleanSec, null, idx, usedColorsQ)
            : { i: "📚", c: "#a855f7", bg: "rgba(168,85,247,0.16)", border: "rgba(168,85,247,0.6)", glow: "rgba(168,85,247,0.24)" };

        quickLinksHtml += `
            <a class="action-link colored-link" style="--topic-color:${theme.c}; --topic-border:${theme.border}; --topic-glow:${theme.glow}; --topic-bg:${theme.bg};" onclick="openGlobalHub('${safeSec}')">
                <span class="link-icon" style="color: ${theme.c};">${theme.i}</span>
                <span class="link-text">${cleanSec}</span>
            </a>`;
    });

    let essentialPracticeHtml = '';
    let usedColorsE = new Set();

    essentialList.forEach((secName, idx) => {
        let safeSec = secName.replace(/'/g, "\\'");
        let cleanSec = secName.replace(/^\d+\.\s*/, '');
        let theme = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(cleanSec, null, idx + 3, usedColorsE)
            : { i: "📝", c: "#06b6d4", bg: "rgba(6,182,212,0.16)", border: "rgba(6,182,212,0.6)", glow: "rgba(6,182,212,0.24)" };

        essentialPracticeHtml += `
            <a class="action-link colored-link" style="--topic-color:${theme.c}; --topic-border:${theme.border}; --topic-glow:${theme.glow}; --topic-bg:${theme.bg};" onclick="openGlobalHub('${safeSec}')">
                <span class="link-icon" style="color: ${theme.c};">${theme.i}</span>
                <span class="link-text">${cleanSec}</span>
            </a>`;
    });

    // Global Daily Challenge Hub across all exams (NEET, JEE, GK & future topics)
    essentialPracticeHtml += `
        <a class="action-link colored-link" style="--topic-color:#fdb813; --topic-border:rgba(253,184,19,0.65); --topic-glow:rgba(253,184,19,0.26); --topic-bg:rgba(253,184,19,0.16);" onclick="openGlobalHub('Daily Quiz Challenge')">
            <span class="link-icon" style="color: #fdb813;">📅</span>
            <span class="link-text">Daily Challenge</span>
        </a>`;

    sidebar.innerHTML = `
    <div class="card sidebar-card">
        <h3 class="section-title">Quick Links</h3>
        ${quickLinksHtml}
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
        if (isRootHome) window.activeHubSection = null;
        
        const bottomBackBtn = document.getElementById('dynamic-back-container');
        if (bottomBackBtn) bottomBackBtn.style.display = 'none';
        
        if (typeof handlePCBackButton === 'function') handlePCBackButton();
        updateBottomNav(rawHash);
        
        if (isRootHome) { currentPath = []; if (typeof _renderView === 'function') _renderView(); } 
        else if (hash === 'custom-setup') { if (typeof cwStep1 === 'function') cwStep1(); } 
        else if (hash.startsWith('hub/')) {
            let hubSection = decodeURIComponent(rawHash.replace('hub/', ''));
            currentPath = [];
            if (typeof _renderHubView === 'function') _renderHubView(hubSection);
        }
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
    window.activeHubSection = null;
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

    if (hash.startsWith('hub/')) {
        goHome();
    } else if (hash.startsWith('path/')) {
        let parts = hash.replace('path/', '').split('/').filter(Boolean);
        // If user entered this exam section from a Global Quick Link / Essential Practice Hub, step back to that Hub
        if (parts.length === 2 && window.activeHubSection && (parts[1] === window.activeHubSection || parts[0] === window.activeHubSection)) {
            openGlobalHub(window.activeHubSection);
            return;
        }
        if (parts.length > 1) {
            parts.pop();
            if (parts.length === 1 && parts[0] === 'Daily Quiz Challenge') {
                openGlobalHub('Daily Quiz Challenge');
            } else {
                jumpToSection(parts);
            }
        } else {
            goHome();
        }
    } else if (hash === 'quiz') {
        if (currentPath && currentPath.length > 0) {
            if (currentPath.length === 2 && currentPath[0] === 'Daily Quiz Challenge') {
                openGlobalHub('Daily Quiz Challenge');
            } else {
                jumpToSection(currentPath);
            }
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
