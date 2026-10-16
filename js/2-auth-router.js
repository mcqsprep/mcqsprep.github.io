// ==========================================
// 2. DATA LOADING, UNIVERSAL PDF RENDERER & AUTHENTICATION
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

function isPdfSectionPath(fullPathStr) {
    let lower = (fullPathStr || "").toLowerCase();
    return (
        lower.includes("ncert book") ||
        lower.includes("pyq") ||
        lower.includes("pdf") ||
        lower.includes("study material") ||
        lower.includes("handwritten note") ||
        lower.includes("syllabus")
    );
}

async function loadCustomTopics() {
    try {
        if (typeof window.updateSplashProgress === 'function') {
            window.updateSplashProgress(45, 'LOADING TOPICS & SYLLABUS...');
        }

        let freshAppData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
        let freshTopicTypes = {};
        let freshOverrides = { deletedPaths: [], editedPaths: {} };

        const [ovResult, topicsResult, sbResult, cpResult] = await Promise.allSettled([
            db.collection("settings").doc("topic_overrides").get(),
            db.collection("custom_topics").get(),
            db.collection("settings").doc("sidebar_config").get(),
            db.collection("settings").doc("custom_practice_config").get()
        ]);

        // 1. Process Topic Overrides
        if (ovResult.status === 'fulfilled' && ovResult.value.exists) {
            let ovData = ovResult.value.data();
            freshOverrides.deletedPaths = Array.isArray(ovData.deletedPaths) ? ovData.deletedPaths : [];
            freshOverrides.editedPaths = ovData.editedPaths || {};
        }
        topicOverrides = freshOverrides;

        Object.keys(topicOverrides.editedPaths || {}).forEach(fullKey => {
            freshTopicTypes[fullKey] = topicOverrides.editedPaths[fullKey];
        });

        // 2. Process Custom Topics
        if (topicsResult.status === 'fulfilled') {
            const snapshot = topicsResult.value;
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
                let current = freshAppData;
                for (let p of pathArr) {
                    if (!current[p]) current[p] = {};
                    current = current[p];
                }
                if (typeof current === 'object' && !Array.isArray(current) && data.name) {
                    if (!current[data.name]) current[data.name] = {};
                    let fullKey = pathArr.length > 0 ? (pathArr.join(" > ") + " > " + data.name) : data.name;
                    let autoIcon = data.icon || (typeof getAutomaticIconForName === 'function' ? getAutomaticIconForName(data.name, data.type) : null);
                    freshTopicTypes[fullKey] = { type: data.type || 'both', icon: autoIcon, docId: doc.id };
                }
            });

            if (shouldCleanGK) {
                if (gkCleanupPromises.length > 0) Promise.allSettled(gkCleanupPromises);
                localStorage.setItem('gk_subtopics_purged_v39', 'true');
            }
        }

        appData = freshAppData;
        customTopicTypes = freshTopicTypes;
        (topicOverrides.deletedPaths || []).forEach(delPath => {
            removePathFromAppData(delPath);
        });

        // Smart Auto-Correction: If any leaf folder (0 subfolders) is inside "NCERT Book" and was left as "both", mark it as "pdf"
        function autoFixPdfLeafTypes(obj, pathArr = []) {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(k => {
                let nextPath = [...pathArr, k];
                let fullStr = nextPath.join(' > ');
                let children = obj[k] && typeof obj[k] === 'object' ? Object.keys(obj[k]) : [];
                if (children.length === 0 && isPdfSectionPath(fullStr)) {
                    if (!customTopicTypes[fullStr] || customTopicTypes[fullStr].type === 'both') {
                        customTopicTypes[fullStr] = {
                            ...(customTopicTypes[fullStr] || {}),
                            type: 'pdf'
                        };
                    }
                } else if (children.length > 0) {
                    autoFixPdfLeafTypes(obj[k], nextPath);
                }
            });
        }
        autoFixPdfLeafTypes(appData, []);

        // 3. Automatic Daily Quiz Challenge Engine
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

        // 4. Process Manual Sidebar Config
        if (sbResult.status === 'fulfilled' && sbResult.value.exists) {
            let sbData = sbResult.value.data();
            window.sidebarConfig.quickLinks = Array.isArray(sbData.quickLinks) ? sbData.quickLinks : [];
            window.sidebarConfig.essentialPractice = Array.isArray(sbData.essentialPractice) ? sbData.essentialPractice : [];
        } else {
            window.sidebarConfig = { quickLinks: [], essentialPractice: [] };
        }

        // 5. Process Manual Custom Practice Config
        if (cpResult.status === 'fulfilled' && cpResult.value.exists && cpResult.value.data().exams) {
            window.customPracticeConfig.exams = cpResult.value.data().exams;
        } else {
            window.customPracticeConfig = { exams: {} };
        }

        try {
            localStorage.setItem('mcqs_boot_cache_v1', JSON.stringify({
                appData: appData,
                customTopicTypes: customTopicTypes,
                topicOverrides: topicOverrides,
                sidebarConfig: window.sidebarConfig,
                customPracticeConfig: window.customPracticeConfig
            }));
        } catch (e) {}

        if (typeof window.updateSplashProgress === 'function') {
            window.updateSplashProgress(82, 'BUILDING DASHBOARD...');
        }

    } catch(e) { console.error("Custom topics loading error:", e); }
}

// ==========================================
// UNIVERSAL PDF & STUDY MATERIAL RENDERER + IN-APP READER
// ==========================================
function openInAppMaterialViewer(encodedUrl, encodedTitle) {
    const fileUrl = decodeURIComponent(encodedUrl);
    const title = decodeURIComponent(encodedTitle || "Study Material");

    let existingModal = document.getElementById('inAppPdfViewerModal');
    if (existingModal) existingModal.remove();

    const isImage = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(fileUrl);
    const isGoogleDrive = fileUrl.includes('drive.google.com');

    let viewerEmbedUrl = fileUrl;
    if (isGoogleDrive && fileUrl.includes('/view')) {
        viewerEmbedUrl = fileUrl.replace(/\/view.*$/, '/preview');
    } else if (!isImage && !isGoogleDrive) {
        viewerEmbedUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }

    const modal = document.createElement('div');
    modal.id = 'inAppPdfViewerModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(5,8,17,0.96); z-index:99999; display:flex; flex-direction:column; backdrop-filter:blur(12px);';
    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; background:#0d1527; border-bottom:1px solid rgba(253,184,19,0.3); gap:10px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <span style="font-size:20px;">📄</span>
                <b style="color:#fff; font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${title}</b>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-exam" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:6px 12px; font-size:12px; text-decoration:none; border-radius:8px; font-weight:700;">↗️ Open Direct</a>
                <a href="${fileUrl}" download target="_blank" rel="noopener noreferrer" class="btn-exam btn-yellow-glow" style="padding:6px 12px; font-size:12px; text-decoration:none; border-radius:8px;">⬇️ Download</a>
                <button onclick="document.getElementById('inAppPdfViewerModal').remove()" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.5); color:#ef4444; width:34px; height:34px; border-radius:8px; font-size:18px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>
        </div>
        <div style="flex:1; width:100%; position:relative; overflow:auto; display:flex; align-items:center; justify-content:center;">
            ${isImage
                ? `<img src="${fileUrl}" alt="${title}" style="max-width:96%; max-height:94%; object-fit:contain; border-radius:8px;">`
                : `<iframe src="${viewerEmbedUrl}" style="width:100%; height:100%; border:none; background:#111522;" allowfullscreen></iframe>`
            }
        </div>
    `;
    document.body.appendChild(modal);
}

let _pdfRenderToken = 0;
async function ensureUploadedPdfsVisible(pathArray) {
    if (!Array.isArray(pathArray) || pathArray.length === 0) return;
    let rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash.startsWith('path/')) return;

    const myToken = ++_pdfRenderToken;
    const fullPath = pathArray.join(' > ');

    try {
        // Single-field query so Firestore NEVER requires a composite index
        const snap = await db.collection("content").where("path", "==", fullPath).get();
        if (myToken !== _pdfRenderToken) return;

        let materials = [];
        snap.forEach(doc => {
            let d = doc.data();
            if (d.type === 'material' || d.type === 'pdf' || Boolean(d.fileUrl)) {
                materials.push({ id: doc.id, ...d });
            }
        });

        if (materials.length === 0) return;

        // Sort cleanly by title (supports 01., 02. numbering) or newest timestamp
        materials.sort((a, b) => {
            let tA = (a.title || "").trim();
            let tB = (b.title || "").trim();
            return tA.localeCompare(tB, undefined, { numeric: true, sensitivity: 'base' });
        });

        const mc = document.getElementById('dynamic-content');
        if (!mc) return;

        // Check if js/3-ui-progress.js already rendered these exact PDF links
        const firstUrl = materials[0].fileUrl;
        if (firstUrl && mc.innerHTML.includes(firstUrl) && !mc.querySelector('#universal-pdf-materials-box')) {
            return;
        }

        // Remove any previous injected box before rendering fresh
        const oldBox = document.getElementById('universal-pdf-materials-box');
        if (oldBox) oldBox.remove();

        const cardsHtml = materials.map((item, idx) => {
            let safeTitle = (item.title || `Study Material ${idx + 1}`).replace(/^\d+\.\s*/, '');
            let encodedUrl = encodeURIComponent(item.fileUrl || '');
            let encodedTitle = encodeURIComponent(safeTitle);
            let theme = typeof getAutoTopicTheme === 'function'
                ? getAutoTopicTheme(safeTitle, '📄', idx)
                : { i: '📄', c: '#fdb813', bg: 'rgba(253,184,19,0.15)', border: 'rgba(253,184,19,0.55)', glow: 'rgba(253,184,19,0.22)' };

            return `
            <div style="background:linear-gradient(145deg, ${theme.bg} 0%, rgba(13,21,39,0.96) 85%); border:1.5px solid ${theme.border}; border-left:5px solid ${theme.c}; box-shadow:0 4px 18px ${theme.glow}; border-radius:14px; padding:18px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; transition:transform 0.2s ease;">
                <div style="display:flex; align-items:center; gap:14px; min-width:200px; flex:1;">
                    <div style="width:46px; height:46px; border-radius:12px; background:${theme.bg}; border:1px solid ${theme.border}; color:${theme.c}; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; box-shadow:0 0 12px ${theme.glow};">📄</div>
                    <div>
                        <div style="font-size:16px; font-weight:800; color:#ffffff; line-height:1.35;">${item.title || safeTitle}</div>
                        <div style="font-size:12px; color:#94a3b8; margin-top:4px;">📚 ${pathArray[pathArray.length - 1].replace(/^\d+\.\s*/, '')} • PDF / Study Material</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button type="button" class="btn-exam btn-yellow-glow" onclick="openInAppMaterialViewer('${encodedUrl}', '${encodedTitle}')" style="padding:9px 18px; font-size:13px; border-radius:10px;">📖 Read PDF</button>
                    <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-exam" style="background:rgba(56,189,248,0.14); color:#38bdf8; border:1px solid rgba(56,189,248,0.45); padding:9px 16px; font-size:13px; border-radius:10px; text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:6px;">⬇️ Download</a>
                </div>
            </div>`;
        }).join('');

        const sectionHtml = `
            <div id="universal-pdf-materials-box" class="card page-transition" style="margin-top:16px; border:1px solid rgba(253,184,19,0.35);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
                    <h3 style="margin:0; font-size:18px; color:#fff; display:flex; align-items:center; gap:10px;">
                        <span>📚</span> <span>${pathArray[pathArray.length - 1].replace(/^\d+\.\s*/, '')} — PDFs & Study Materials</span>
                    </h3>
                    <span style="font-size:12px; background:rgba(253,184,19,0.15); color:var(--primary-yellow); border:1px solid rgba(253,184,19,0.35); padding:4px 12px; border-radius:20px; font-weight:700;">${materials.length} Document${materials.length > 1 ? 's' : ''}</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:14px;">
                    ${cardsHtml}
                </div>
            </div>
        `;

        // If #dynamic-content has subfolder tiles (.category-tile), append the PDFs right below them;
        // Otherwise (if it was showing an "empty folder" or wrong MCQ screen), replace with the clean PDF section!
        const hasSubfolderTiles = mc.querySelector('.category-tile') !== null;
        if (hasSubfolderTiles) {
            mc.insertAdjacentHTML('beforeend', sectionHtml);
        } else {
            mc.innerHTML = sectionHtml;
        }
    } catch (err) {
        console.error("PDF Material load error:", err);
    }
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

let _resolveInitialAuth;
const initialAuthReadyPromise = new Promise((resolve) => {
    _resolveInitialAuth = resolve;
});
let _bootSequenceComplete = false;
let _lastAuthUid = undefined;

auth.onAuthStateChanged(async (user) => {
    let newUid = user ? user.uid : null;
    let authChangedAfterBoot = _bootSequenceComplete && (newUid !== _lastAuthUid);
    _lastAuthUid = newUid;

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

        const cachedStreak = localStorage.getItem('mcqs_user_streak_' + user.uid);
        if (cachedStreak !== null) {
            const streakEl = document.getElementById('nav-streak-display');
            if (streakEl) streakEl.innerText = cachedStreak;
        }
        
        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
                let d = doc.data();
                if (d.currentStreak !== undefined) {
                    const streakEl = document.getElementById('nav-streak-display');
                    if (streakEl) streakEl.innerText = d.currentStreak;
                    localStorage.setItem('mcqs_user_streak_' + user.uid, String(d.currentStreak));
                }
                if (d.rating && typeof syncUserRatingUI === 'function') {
                    syncUserRatingUI(d.rating, d.feedback || '');
                }
            }
            db.collection("users").doc(user.uid).set({ 
                displayName: user.displayName, email: user.email, photoURL: user.photoURL, 
                lastLogin: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true }).catch(() => {});
        } catch (e) {}
        
        checkUserNotifications();
        if (typeof loadUserBookmarks === 'function') await loadUserBookmarks();
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

    if (_resolveInitialAuth) {
        _resolveInitialAuth();
        _resolveInitialAuth = null;
    }

    if (authChangedAfterBoot && dataLoaded) {
        handleRouting();
    }
});

async function initApp() { 
    dataLoaded = true; 
    if (!window.location.hash) window.location.hash = '#/home'; 
    
    handleRouting(); 
    
    await Promise.allSettled([
        loadCustomTopics(),
        typeof loadGlobalRating === 'function' ? loadGlobalRating() : Promise.resolve(),
        Promise.race([initialAuthReadyPromise, new Promise(r => setTimeout(r, 1400))])
    ]);

    handleRouting();
    _bootSequenceComplete = true;

    if (typeof window.markAppContentReady === 'function') {
        window.markAppContentReady();
    }
}

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

    essentialPracticeHtml += `
        <a class="action-link colored-link" style="--topic-color:#fdb813; --topic-border:rgba(253,184,19,0.65); --topic-glow:rgba(253,184,19,0.28); --topic-bg:rgba(253,184,19,0.16);" onclick="jumpToSection(['Daily Quiz Challenge'])">
            <span class="link-icon" style="color: #fdb813;">📅</span>
            <span class="link-text">Daily Quiz Challenge</span>
        </a>`;

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
        
        if (isRootHome) {
            currentPath = [];
            if (typeof _renderView === 'function') _renderView();
        } else if (hash === 'custom-setup') {
            if (typeof cwStep1 === 'function') cwStep1();
        } else if (hash.startsWith('path/')) {
            currentPath = hash.replace('path/', '').split('/').filter(Boolean);
            if (typeof _renderView === 'function') _renderView();
            // Automatically check & render any uploaded PDFs at this path (even in parent categories like NCERT Book!)
            ensureUploadedPdfsVisible(currentPath);
        } else if (hash === 'leaderboard') {
            if (typeof _renderLeaderboardOptions === 'function') _renderLeaderboardOptions();
        } else if (hash.startsWith('board/')) {
            if (typeof fetchLiveLeaderboard === 'function') fetchLiveLeaderboard(decodeURIComponent(hash.replace('board/', '')));
        } else if (hash === 'quiz') {
            if (typeof _initiateQuizEngine === 'function') _initiateQuizEngine();
        } else if (hash === 'progress') {
            if (typeof _renderProgressSelection === 'function') _renderProgressSelection();
        } else if (hash.startsWith('progress/')) {
            if (typeof _renderProgressDashboard === 'function') _renderProgressDashboard(decodeURIComponent(hash.split('/')[1]));
        } else if (hash === 'bookmarks') {
            if (typeof _initiateBookmarkQuiz === 'function') _initiateBookmarkQuiz();
        } else if (hash === 'diary') {
            if (typeof _renderDoubtDiary === 'function') _renderDoubtDiary();
        } else if (hash === 'admin') {
            if (typeof _renderAdminLogin === 'function') _renderAdminLogin();
        } else if (hash === 'admin-panel') {
            if (typeof _renderAdminPanel === 'function') _renderAdminPanel();
        }
        
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
