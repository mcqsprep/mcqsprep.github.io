// ==========================================
// 1. SYSTEM INITIALIZATION & CONFIGURATION
// ==========================================

// PWA Install Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'flex';
});

function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            document.getElementById('installAppBtn').style.display = 'none';
        }
        deferredPrompt = null;
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Setup Failed:', err));
    });
}

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
    @keyframes fadeSlideUp { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    .page-transition { animation: fadeSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
    
    .ai-fullscreen-modal { background: #0a0a0f !important; overflow: hidden !important; border: none !important; height: 100dvh !important; max-height: 100dvh !important; box-sizing: border-box; }
    .ai-fullscreen-modal * { box-sizing: border-box; }
    .ai-ambient-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(140px); z-index: 1; }
    .ai-glow-1 { top: -10%; left: -10%; width: 50vw; height: 50vh; background: #6228d7; opacity: 0.3; }
    .ai-glow-2 { bottom: -10%; right: -5%; width: 60vw; height: 60vh; background: #fdb813; opacity: 0.15; }
    .ai-glow-3 { top: 40%; left: 30%; width: 40vw; height: 40vh; background: #ff007f; opacity: 0.15; }
    
    #gemini-chat-history::-webkit-scrollbar { width: 6px; }
    #gemini-chat-history::-webkit-scrollbar-track { background: transparent; }
    #gemini-chat-history::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
    #gemini-chat-history::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
    
    .ai-chat-bubble { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; max-width: 100%; box-sizing: border-box; }
    .ai-chat-bubble p { margin-top: 0; max-width: 100%; overflow-wrap: break-word; }
    .katex-display { max-width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; margin: 10px 0; }
    .katex-display::-webkit-scrollbar { height: 4px; }
    .katex-display::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
    
    #ai-floating-btn { -webkit-user-select: none; -ms-user-select: none; user-select: none; touch-action: none; }
    .bookmarked { background: rgba(253, 184, 19, 0.2) !important; color: var(--primary-yellow) !important; border-color: var(--primary-yellow) !important; }
`;
document.head.appendChild(styleSheet);

function formatTextWithMath(text) {
    if (!text) return "";
    const mathSnippets = [];
    let processedText = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g, function(match) {
        mathSnippets.push(match);
        return `@@MATH_SPAWN_${mathSnippets.length - 1}@@`;
    });
    
    let html = marked.parse(processedText);
    
    mathSnippets.forEach((snippet, i) => {
        html = html.replace(`@@MATH_SPAWN_${i}@@`, snippet);
    });
    return html;
}

const firebaseConfig = { 
    apiKey: "AIzaSyDuletjxV1THjWvWLvO0XqB_z5xBBXLwL8", 
    authDomain: "mcqsprep.firebaseapp.com", 
    projectId: "mcqsprep", 
    storageBucket: "mcqsprep.firebasestorage.app", 
    messagingSenderId: "920181103186", 
    appId: "1:920181103186:web:14c2ba261d4a6163db5d8b" 
};

firebase.initializeApp(firebaseConfig); 
const db = firebase.firestore(); 
const auth = firebase.auth(); 
const provider = new firebase.auth.GoogleAuthProvider();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; 
const CLOUDINARY_PRESET = "mcq_uploads"; 
const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

let appData = { 
    "Daily Quiz Challenge": { "NEET": {}, "General Knowledge": {} }, 
    "NEET": { 
        "NCERT Book": {}, 
        "PYQs": {}, 
        "Practice Paper": {}, 
        "MCQs Practice": { 
            "Botany": {}, "Zoology": {}, "Physics": {}, 
            "Organic Chemistry": {}, "Physical Chemistry": {}, "Inorganic Chemistry": {} 
        }, 
        "Mock Test": {} 
    }, 
    "General Knowledge": { "Current Affairs": {}, "History": {}, "Geography": {} } 
};

let customTopicTypes = {};
let currentUser = null; 
let currentPath = []; 
let dataLoaded = false; 
let userBookmarks = [];

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
        db.collection("users").doc(user.uid).set({ 
            displayName: user.displayName, 
            email: user.email, 
            photoURL: user.photoURL, 
            lastLogin: firebase.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });
        checkUserNotifications();
        loadUserBookmarks();
    } else {
        badge.style.display = 'none'; 
        loginNavBtn.style.display = 'flex'; 
        document.getElementById('profileNotifDot').style.display = 'none';
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

function goHome() { 
    if (window.location.hash === '#/home' || window.location.hash === '') {
        currentPath = [];
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

// ==========================================
// 4. MAIN VIEW RENDERER & AUTO-SORTER
// ==========================================
function _renderView() {
    try {
        const mc = document.getElementById('dynamic-content'); 
        if(!mc) return;
        const bc = document.getElementById('breadcrumb-text');
        if(bc) bc.innerText = currentPath.length === 0 ? "Home" : "Home / " + currentPath.join(" / "); 
        
        let currentLevel = appData;
        for (let node of currentPath) { 
            if(currentLevel[node] !== undefined) {
                currentLevel = currentLevel[node]; 
            } else {
                currentLevel = {}; 
            }
        }

        let isEndpoint = false;
        if (typeof currentLevel === 'string' || Array.isArray(currentLevel) || (typeof currentLevel === 'object' && Object.keys(currentLevel).length === 0)) {
            isEndpoint = true;
        }

        if (isEndpoint) {
            let topicName = currentPath[currentPath.length - 1]; 
            let checkPath = currentPath.join(" > ");
            let isPdfSection = false;
            
            if (customTopicTypes[checkPath] === 'pdf') {
                isPdfSection = true;
            } else if (customTopicTypes[checkPath] !== 'mcq') {
                let triggers = ["mcqs practice", "mock test", "general knowledge", "practice paper", "current affairs", "history", "geography", "daily quiz challenge"];
                let reqQuiz = triggers.some(t => checkPath.toLowerCase().includes(t));
                if (!reqQuiz) isPdfSection = true;
            }
            
            if (!isPdfSection) {
                let studentName = (currentUser && currentUser.displayName) ? currentUser.displayName.split(" ")[0] : "Student";
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 style="color:var(--primary-yellow);">${topicName} Practice</h2>
                    <p style="color:var(--text-muted); margin-bottom:25px;">${!currentUser ? "Sign in to track your scores on the leaderboard!" : `Ready for practice, <span style="color:var(--primary-yellow);">${studentName}</span>?`}</p>
                    <button class="btn-exam" onclick="window.location.hash='#/quiz'" style="background:var(--primary-yellow); color:black; width:200px; margin-right:15px; font-size:16px;">Start Quiz &rarr;</button>
                    <button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; font-size:16px; border:none;">&larr; Go Back</button>
                </div>`;
            } else {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 style="color:var(--primary-yellow);">${topicName} Resources</h2>
                    <p style="color:var(--text-muted);">Materials will appear here once uploaded via the Admin Panel.</p>
                    <button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; margin-top:20px; font-size:16px; border:none;">&larr; Go Back</button>
                </div>`;
            }
            return;
        }

        let title = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1];
        let h = ``;

        if (currentPath.length === 0) {
            h += `
            <div class="card" style="border: 1px solid var(--primary-yellow); background: rgba(253, 184, 19, 0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom: 25px;">
                <div>
                    <h2 style="color:var(--primary-yellow); margin:0 0 5px 0;">⚙️ Custom Practice Engine</h2>
                    <p style="color:var(--text-muted); margin:0; font-size:14px;">Mix subjects, filter by difficulty, and build your ultimate personalized mock test.</p>
                </div>
                <button class="btn-exam" onclick="cwStep1()" style="background:var(--primary-yellow); color:black; font-size:16px; padding:12px 24px; box-shadow:0 4px 15px rgba(253,184,19,0.3); border:none;">Launch Setup 🚀</button>
            </div>`;
        }

        h += `<div class="card"><h2 style="color:var(--primary-yellow);">${title}</h2><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">`;
        
        let keys = Object.keys(currentLevel);
        const difficultyOrder = ["Easy", "Medium", "Hard", "Mixed"];
        
        keys.sort((a, b) => {
            let idxA = difficultyOrder.indexOf(a);
            let idxB = difficultyOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        for (let key of keys) { 
            if (currentPath.length === 0 && key === "Daily Quiz Challenge") continue; 
            let checkPath = currentPath.join(" > ") + (currentPath.length > 0 ? " > " : "") + key;
            let typeLabel = ""; if (customTopicTypes[checkPath] === 'mcq') typeLabel = " 📝"; else if (customTopicTypes[checkPath] === 'pdf') typeLabel = " 📄";
            let safeKey = key.replace(/'/g, "\\'");
            h += `<button class="btn-exam" onclick="navigateTo('${safeKey}')">${key} ${typeLabel}</button>`; 
        }
        
        if (currentPath.length > 0) {
            h += `<button class="btn-exam" onclick="goBack()" style="grid-column: 1 / -1; background: #222; border-color: #444; color: #a0a0a0; margin-top: 10px;">&larr; Go Back</button>`;
        }
        h += `</div></div>`; 
        mc.innerHTML = `<div class="page-transition">${h}</div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(err) { console.error("Render View Error:", err); }
}

// ==========================================
// 5. CUSTOM PRACTICE BUILDER WIZARD
// ==========================================
let cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' };
let customQuizConfig = { exam: '', paths: [], count: 20, level: 'Mixed' };

function getCustomSubjects(exam) {
    let subjects = [];
    let rootNode = exam === 'NEET' ? appData["NEET"]["MCQs Practice"] : appData["General Knowledge"];
    for(let key in rootNode) { subjects.push({ name: key, path: exam === 'NEET' ? `NEET > MCQs Practice > ${key}` : `General Knowledge > ${key}` }); }
    let rootPath = exam === 'NEET' ? "NEET > MCQs Practice" : "General Knowledge";
    for(let customPath in customTopicTypes) {
        if(customPath.startsWith(rootPath) && customPath.split(' > ').length === rootPath.split(' > ').length + 1) {
            let name = customPath.split(' > ').pop();
            if(!subjects.find(s => s.name === name)) subjects.push({ name: name, path: customPath });
        }
    }
    return subjects;
}

function getAllLeafNodes(subjectPaths) {
    let leafs = [];
    const diffKeywords = ['easy', 'medium', 'hard', 'mixed'];
    
    subjectPaths.forEach(subjPath => {
        let depth = subjPath.split(' > ').length;
        
        let parts = subjPath.split(' > '); let curr = appData; let valid = true;
        for(let p of parts) { if(curr[p]) curr = curr[p]; else {valid = false; break;} }
        function traverse(node, pathStr) {
            let hasChildren = false;
            for(let k in node) { if(k === "Daily Quiz Challenge") continue; hasChildren = true; traverse(node[k], pathStr + " > " + k); }
            if(!hasChildren && !diffKeywords.includes(pathStr.split(' > ').pop().toLowerCase())) leafs.push(pathStr);
        }
        if(valid) traverse(curr, subjPath);
        
        for(let customP in customTopicTypes) {
            if(customP.startsWith(subjPath) && customTopicTypes[customP] === 'mcq') {
                let cParts = customP.split(' > ');
                if (cParts.length > depth) {
                    let chapterPath = cParts.slice(0, depth + 1).join(' > ');
                    let chapterName = cParts[depth];
                    if (!diffKeywords.includes(chapterName.toLowerCase()) && !leafs.includes(chapterPath)) {
                        leafs.push(chapterPath);
                    }
                }
            }
        }
    });
    return [...new Set(leafs)].sort();
}

function cwStep1() {
    if(!currentUser) { showAuthModal(); return; }
    document.getElementById('main-sidebar').style.display = 'none';
    cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' };
    document.getElementById('breadcrumb-text').innerText = "Home / Custom Practice Setup";
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 style="color:var(--primary-yellow);">⚙️ Custom Practice Setup</h2>
            <p style="color:var(--text-muted); margin-bottom:25px;">Step 1: Which exam are you preparing for?</p>
            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <button class="btn-exam" onclick="cwStep2('NEET')" style="flex:1; padding:20px; font-size:18px;">🩺 NEET</button>
                <button class="btn-exam" onclick="cwStep2('General Knowledge')" style="flex:1; padding:20px; font-size:18px;">🌍 General Knowledge</button>
            </div>
            <button class="btn-exam" onclick="goHome()" style="margin-top:20px; background:#333; border:none;">&larr; Cancel</button>
        </div>`;
}

function cwStep2(exam) {
    document.getElementById('main-sidebar').style.display = 'none';
    cwState.exam = exam; 
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / ${exam}`;
    let subjects = getCustomSubjects(exam);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 style="color:var(--primary-yellow);">📚 Select Subjects</h2>
            <p style="color:var(--text-muted); margin-bottom:20px;">Choose one or more subjects from ${exam}.</p>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px; margin-bottom:25px;">
                ${subjects.map(s => `<label style="background:#2a2a2a; border:1px solid #444; padding:15px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:10px;"><input type="checkbox" value="${s.path}" class="cw-subj-cb"> <span>${s.name}</span></label>`).join('')}
            </div>
            <div style="display:flex; justify-content:space-between;">
                <button class="btn-exam" onclick="cwStep1()" style="background:#333; border:none;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep2()" style="background:var(--primary-yellow); color:black; border:none;">Next: Select Chapters &rarr;</button>
            </div>
        </div>`;
}

function cwProcessStep2() {
    let cbs = Array.from(document.querySelectorAll('.cw-subj-cb:checked')).map(cb => cb.value);
    if(cbs.length === 0) return showNotification("⚠️ Select at least one subject.");
    cwState.subjects = cbs; 
    cwStep3();
}

function cwStep3() {
    document.getElementById('main-sidebar').style.display = 'none';
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / Chapters`;
    let leafs = getAllLeafNodes(cwState.subjects);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 style="color:var(--primary-yellow);">📑 Select Chapters / Subtopics</h2>
            <p style="color:var(--text-muted); margin-bottom:20px;">Step 3: Pick the specific topics you want to practice.</p>
            <input type="text" id="cwSubtopicSearch" class="input-field" placeholder="🔍 Search chapters..." oninput="cwFilterSubtopics()">
            <div style="margin-bottom:15px;">
                <button onclick="cwSelectAll(true)" style="background:none; border:none; color:var(--primary-yellow); cursor:pointer; font-size:14px;">Select All</button> | 
                <button onclick="cwSelectAll(false)" style="background:none; border:none; color:var(--primary-yellow); cursor:pointer; font-size:14px;">Deselect All</button>
            </div>
            <div id="cw-subtopic-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:10px; max-height:40vh; overflow-y:auto; padding:10px; background:#111; border-radius:8px; border:1px solid #333; margin-bottom:25px;">
                ${leafs.map(l => `<label class="cw-sub-lbl" style="background:#2a2a2a; border:1px solid #444; padding:12px; border-radius:6px; cursor:pointer; display:flex; align-items:flex-start; gap:10px;"><input type="checkbox" value="${l}" class="cw-sub-cb" checked> <span style="font-size:14px;">${l.split(' > ').pop()}<br><span style="font-size:11px; color:#888;">${l}</span></span></label>`).join('')}
            </div>
            <div style="display:flex; justify-content:space-between;">
                <button class="btn-exam" onclick="cwStep2(cwState.exam)" style="background:#333; border:none;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep3()" style="background:var(--primary-yellow); color:black; border:none;">Next: Set Difficulty &rarr;</button>
            </div>
        </div>`;
}

function cwFilterSubtopics() {
    let q = document.getElementById('cwSubtopicSearch').value.toLowerCase();
    document.querySelectorAll('.cw-sub-lbl').forEach(lbl => {
        if(lbl.innerText.toLowerCase().includes(q)) lbl.style.display = 'flex'; else lbl.style.display = 'none';
    });
}

function cwSelectAll(select) {
    document.querySelectorAll('.cw-sub-cb').forEach(cb => { 
        if(cb.closest('.cw-sub-lbl').style.display !== 'none') cb.checked = select; 
    });
}

function cwProcessStep3() {
    let cbs = Array.from(document.querySelectorAll('.cw-sub-cb:checked')).map(cb => cb.value);
    if(cbs.length === 0) return showNotification("⚠️ Select at least one chapter.");
    cwState.subtopics = cbs; 
    cwStep4();
}

function cwStep4() {
    document.getElementById('main-sidebar').style.display = 'none';
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / Configure Quiz`;
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 style="color:var(--primary-yellow);">🎯 Final Setup</h2>
            <p style="color:var(--text-muted);">Step 4: Choose difficulty and number of questions.</p>
            <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:30px; margin-top:20px;">
                <div style="flex:1; min-width:200px;">
                    <label style="color:var(--text-light); font-weight:bold; margin-bottom:10px; display:block;">Difficulty Level:</label>
                    <select id="cwLevel" class="input-field" style="padding:15px; font-size:16px;">
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Mixed">Mixed (All Levels)</option>
                    </select>
                </div>
                <div style="flex:1; min-width:200px;">
                    <label style="color:var(--text-light); font-weight:bold; margin-bottom:10px; display:block;">Total Questions:</label>
                    <input type="number" id="cwCount" class="input-field" value="20" min="5" max="100" style="padding:15px; font-size:16px;">
                </div>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <button class="btn-exam" onclick="cwStep3()" style="background:#333; border:none;">&larr; Back</button>
                <button class="btn-exam" onclick="cwLaunchQuiz()" style="background:var(--correct-green); color:white; font-size:18px; padding:15px 30px; border:none; box-shadow:0 4px 15px rgba(76,175,80,0.4);">🚀 Start Custom Quiz</button>
            </div>
        </div>`;
}

function cwLaunchQuiz() {
    cwState.level = document.getElementById('cwLevel').value; 
    cwState.count = parseInt(document.getElementById('cwCount').value) || 20;
    customQuizConfig.exam = cwState.exam;
    customQuizConfig.paths = cwState.subtopics; 
    customQuizConfig.count = cwState.count; 
    customQuizConfig.level = cwState.level;
    _initiateQuizEngine(true);
}

// ==========================================
// 6. SCALED TRACK PROGRESS, REPORTS & FEEDBACK
// ==========================================
async function getAttemptedIdsForPath(safePath) {
    let ids = [];
    if (currentUser) {
        try {
            const subDoc = await db.collection("users").doc(currentUser.uid).collection("progress").doc(safePath).get();
            if (subDoc.exists && Array.isArray(subDoc.data().attemptedIds)) {
                return subDoc.data().attemptedIds;
            }
            const rootDoc = await db.collection("users").doc(currentUser.uid).get();
            if (rootDoc.exists && Array.isArray(rootDoc.data()[safePath])) {
                let legacyIds = rootDoc.data()[safePath];
                db.collection("users").doc(currentUser.uid).collection("progress").doc(safePath).set({
                    attemptedIds: legacyIds,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});
                return legacyIds;
            }
        } catch(e) { console.error("Error fetching progress:", e); }
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        ids = localProg[safePath] || [];
    }
    return ids;
}

async function saveAttemptedIdsForPath(safePath, newAttemptedIds) {
    if (!newAttemptedIds || newAttemptedIds.length === 0) return;
    if (currentUser) {
        try {
            await db.collection("users").doc(currentUser.uid).collection("progress").doc(safePath).set({
                attemptedIds: firebase.firestore.FieldValue.arrayUnion(...newAttemptedIds),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch(e) { console.error("Error saving progress:", e); }
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        localProg[safePath] = [...(localProg[safePath] || []), ...newAttemptedIds];
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
}

async function resetProgress(safePath) {
    if(!confirm("Are you sure you want to reset your progress for this section?")) return;
    if (currentUser) {
        try {
            await db.collection("users").doc(currentUser.uid).collection("progress").doc(safePath).delete();
            let clearField = {}; clearField[safePath] = firebase.firestore.FieldValue.delete();
            await db.collection("users").doc(currentUser.uid).update(clearField).catch(() => {});
        } catch(e) { console.error("Error resetting progress:", e); }
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        delete localProg[safePath];
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
    showNotification("🔄 Progress reset for this section!");
    _initiateQuizEngine();
}

function _renderProgressSelection() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition" style="text-align:center; padding: 40px 20px;">
            <h2 style="color:var(--primary-yellow); font-size:24px;">📊 Select Analytics Dashboard</h2>
            <p style="color:var(--text-muted); margin-bottom:30px; font-size:14px;">Choose an exam category to view your detailed performance metrics and weak spots.</p>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button class="btn-exam" onclick="window.location.hash='#/progress/NEET_MCQ'" style="width:100%; max-width:250px; padding:15px; font-size:16px;">🩺 NEET MCQs Practice</button>
                <button class="btn-exam" onclick="window.location.hash='#/progress/NEET_MOCK'" style="width:100%; max-width:250px; padding:15px; font-size:16px;">⏱️ NEET Mock Test</button>
                <button class="btn-exam" onclick="window.location.hash='#/progress/GK'" style="width:100%; max-width:250px; padding:15px; font-size:16px;">🌍 GK Analytics</button>
            </div>
            <button class="btn-exam" onclick="goBack()" style="margin-top:30px; background:#333; border:none;">&larr; Back</button>
        </div>
    `;
}

async function _renderProgressDashboard(category) {
    if (!currentUser) return;
    
    let displayCategory = category === 'NEET_MCQ' ? 'NEET MCQs Practice' : (category === 'NEET_MOCK' ? 'NEET Mock Tests' : 'General Knowledge');
    document.getElementById('breadcrumb-text').innerText = `Home / Profile / Progress / ${displayCategory}`;
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card page-transition"><h2>📊 Compiling Diagnostics...</h2></div>`;
    
    try {
        const snap = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get();
        let validDocs = [];
        let tempDocs = [];
        
        snap.forEach(doc => { tempDocs.push(doc.data()); });

        tempDocs.sort((a, b) => {
            let tA = a.timestamp ? a.timestamp.toMillis() : 0;
            let tB = b.timestamp ? b.timestamp.toMillis() : 0;
            return tA - tB;
        });

        tempDocs.forEach(d => {
            let isNeet = d.examCategory === 'NEET' || (d.quizPath && d.quizPath.includes('NEET'));
            let isMock = d.quizPath && d.quizPath.includes('Mock Test');
            
            if (category === 'NEET_MCQ' && isNeet && !isMock) validDocs.push(d);
            else if (category === 'NEET_MOCK' && isNeet && isMock) validDocs.push(d);
            else if (category === 'GK' && !isNeet) validDocs.push(d);
        });

        if (validDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Data Available</h2><p style="color:var(--text-muted); font-size:14px;">You haven't completed any quizzes in the ${displayCategory} category yet.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Back</button></div>`;
            return;
        }

        let totalScore = 0; let totalQuestions = 0; let correctCount = 0; let wrongCount = 0;
        let aggregatedSubs = {}; let accuracyTrend = [];

        validDocs.forEach(d => {
            totalScore += (d.score || 0); 
            totalQuestions += (d.attemptedQuestions || 0);
            
            let c = d.correctCount !== undefined ? d.correctCount : Math.round(((d.accuracy||0)/100) * (d.attemptedQuestions||0));
            let w = d.wrongCount !== undefined ? d.wrongCount : ((d.attemptedQuestions||0) - c);
            
            correctCount += c;
            wrongCount += w;
            accuracyTrend.push(d.accuracy || 0);
            
            if (d.subjectBreakdown) {
                for(let s in d.subjectBreakdown) {
                    if(!aggregatedSubs[s]) aggregatedSubs[s] = { attempts: 0, correct: 0 };
                    aggregatedSubs[s].attempts += d.subjectBreakdown[s].attempts;
                    aggregatedSubs[s].correct += d.subjectBreakdown[s].correct;
                }
            }
        });

        let overallAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        let recentTrend = accuracyTrend.slice(-10);

        let subjectHtml = '';
        let weakSubjects = [];
        let validSubjectsCount = 0;

        Object.keys(aggregatedSubs).sort().forEach(subj => {
            let sData = aggregatedSubs[subj];
            if(sData.attempts > 0) {
                validSubjectsCount++;
                let acc = Math.round((sData.correct / sData.attempts) * 100);
                let color = acc >= 70 ? 'var(--correct-green)' : (acc >= 50 ? 'var(--primary-yellow)' : 'var(--wrong-red)');
                
                if (acc < 50) weakSubjects.push(`${subj} (${acc}%)`);

                subjectHtml += `
                    <div style="margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; font-weight:bold;">
                            <span style="color:var(--text-light);">${subj}</span>
                            <span style="color:${color};">${acc}% <span style="color:#666; font-size:10px; font-weight:normal;">(${sData.correct}/${sData.attempts})</span></span>
                        </div>
                        <div style="width:100%; background:#333; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="width:${acc}%; background:${color}; height:100%; border-radius:4px;"></div>
                        </div>
                    </div>
                `;
            }
        });

        if (validSubjectsCount === 0) subjectHtml = `<p style="color:var(--text-muted); font-size:13px;">Detailed subject analytics generate for new quizzes.</p>`;
        
        let weakSpotsText = weakSubjects.length > 0 
            ? weakSubjects.join(' • ') 
            : "<span style='color:var(--correct-green);'>✅ Excellent! All subjects are >50% accuracy. Keep it up!</span>";

        mc.innerHTML = `
        <div class="card page-transition" style="padding: 20px 15px;">
            <h2 style="color:var(--primary-yellow); margin-top:0; margin-bottom:15px; font-size:22px;">${displayCategory}</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; margin-bottom: 15px;">
                <div style="background:#2a2a2a; padding: 12px 5px; border-radius: 6px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 20px; color: white; font-weight: bold;">${totalQuestions}</div>
                    <div style="color: var(--text-muted); font-size: 10px; text-transform:uppercase; margin-top:2px;">Attempted</div>
                </div>
                <div style="background:#2a2a2a; padding: 12px 5px; border-radius: 6px; text-align:center; border:1px solid var(--correct-green);">
                    <div style="font-size: 20px; color: var(--correct-green); font-weight: bold;">${correctCount}</div>
                    <div style="color: var(--text-muted); font-size: 10px; text-transform:uppercase; margin-top:2px;">Right</div>
                </div>
                <div style="background:#2a2a2a; padding: 12px 5px; border-radius: 6px; text-align:center; border:1px solid var(--wrong-red);">
                    <div style="font-size: 20px; color: var(--wrong-red); font-weight: bold;">${wrongCount}</div>
                    <div style="color: var(--text-muted); font-size: 10px; text-transform:uppercase; margin-top:2px;">Wrong</div>
                </div>
                <div style="background:#2a2a2a; padding: 12px 5px; border-radius: 6px; text-align:center; border:1px solid var(--primary-yellow);">
                    <div style="font-size: 20px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div>
                    <div style="color: var(--text-muted); font-size: 10px; text-transform:uppercase; margin-top:2px;">Overall Mark</div>
                </div>
                <div style="background:#2a2a2a; padding: 12px 5px; border-radius: 6px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 20px; color: white; font-weight: bold;">${overallAccuracy}%</div>
                    <div style="color: var(--text-muted); font-size: 10px; text-transform:uppercase; margin-top:2px;">Accuracy</div>
                </div>
            </div>

            <div style="background:rgba(244, 67, 54, 0.05); border-left:3px solid var(--wrong-red); padding:12px; border-radius:4px; margin-bottom:20px;">
                <div style="color:var(--wrong-red); font-size:11px; font-weight:bold; margin-bottom:5px; text-transform:uppercase;">Needs Improvement</div>
                <div style="font-size:13px; color:var(--text-light); line-height:1.4;">${weakSpotsText}</div>
            </div>

            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <div style="flex:1; min-width:280px; background:#1a1a1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Subject-Wise Mastery</h3>
                    ${subjectHtml}
                </div>

                <div style="flex:1; min-width:280px; background:#1a1a1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Accuracy Trajectory</h3>
                    <canvas id="accuracyChart" style="width:100%; height:160px;"></canvas>
                </div>
            </div>

            <button class="btn-exam" onclick="window.history.back()" style="margin-top:20px; background:#333; border:none; width:100%; max-width:200px;">&larr; Back to Selection</button>
        </div>`;

        setTimeout(() => drawAccuracyChart(recentTrend), 50);

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Back</button></div>`; }
}

function drawAccuracyChart(dataPoints) {
    const canvas = document.getElementById('accuracyChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 160;
    
    ctx.clearRect(0,0,w,h);
    if(dataPoints.length === 0) {
        ctx.fillStyle = '#a0a0a0'; ctx.font = '12px sans-serif';
        ctx.fillText("Not enough data to display chart.", 10, 20); return;
    }
    
    const padding = 20; const maxVal = 100;
    const stepX = (w - padding*2) / Math.max(1, dataPoints.length - 1);
    
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(val => {
        let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w-padding, y); ctx.stroke();
        ctx.fillStyle = '#777'; ctx.font = '10px sans-serif'; ctx.fillText(val+'%', 0, y+3);
    });
    
    if(dataPoints.length > 1) {
        ctx.strokeStyle = '#fdb813'; ctx.lineWidth = 2; ctx.beginPath();
        dataPoints.forEach((val, i) => {
            let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
            if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    
    ctx.fillStyle = '#4CAF50';
    dataPoints.forEach((val, i) => {
        let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    });
}

async function checkUserNotifications() {
    if(!currentUser) return;
    try {
        let hasUnseen = false;
        let reportsSnap = await db.collection("reported_mistakes").where("studentId", "==", currentUser.uid).get();
        reportsSnap.forEach(doc => { let d = doc.data(); if(d.status === 'resolved' && d.seenByStudent === false) hasUnseen = true; });
        let flagsSnap = await db.collection("flagged_doubts").where("studentId", "==", currentUser.uid).get();
        flagsSnap.forEach(doc => { let d = doc.data(); if(d.status === 'resolved' && d.seenByStudent === false) hasUnseen = true; });
        if(hasUnseen) { document.getElementById('profileNotifDot').style.display = 'block'; document.getElementById('reportMenuDot').style.display = 'inline'; }
    } catch(e){}
}

let tempReportTarget = null;
function openReportModal(questionId, qText, qPath) { 
    if(!currentUser) { showAuthModal(); return; }
    tempReportTarget = { id: questionId, text: qText, path: qPath }; 
    document.getElementById('reportModal').style.display = 'flex'; 
}
function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; tempReportTarget = null; }

async function submitReport() {
    if(!currentUser || !tempReportTarget) return;
    const reason = document.getElementById('reportReason').value; 
    const desc = document.getElementById('reportDescription').value;
    const btn = document.querySelector('#reportModal .btn-exam'); btn.innerText = "Submitting..."; btn.disabled = true;
    try {
        await db.collection("reported_mistakes").add({
            studentId: currentUser.uid, studentName: currentUser.displayName,
            questionId: tempReportTarget.id, questionText: tempReportTarget.text, path: tempReportTarget.path,
            reason: reason, description: desc, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("✅ Report submitted to admins!"); 
        closeReportModal(); document.getElementById('reportDescription').value = "";
    } catch(e) { showNotification("❌ Error: " + e.message); }
    btn.innerText = "Submit Report"; btn.disabled = false;
}

async function openUserReportsModal() {
    if(!currentUser) return;
    document.getElementById('userReportsModal').style.display = 'flex';
    document.getElementById('profileNotifDot').style.display = 'none'; document.getElementById('reportMenuDot').style.display = 'none';
    const list = document.getElementById('user-reports-list'); list.innerHTML = `<p style="color:var(--primary-yellow);">Loading reports...</p>`;
    try {
        let html = ''; let count = 0; let allItems = [];
        let reportsSnap = await db.collection("reported_mistakes").where("studentId", "==", currentUser.uid).get();
        reportsSnap.forEach(doc => { allItems.push({ _id: doc.id, _type: 'report', ...doc.data() }); });
        let flagsSnap = await db.collection("flagged_doubts").where("studentId", "==", currentUser.uid).get();
        flagsSnap.forEach(doc => { allItems.push({ _id: doc.id, _type: 'flag', ...doc.data() }); });
        allItems.sort((a, b) => { let tA = a.timestamp ? a.timestamp.toMillis() : 0; let tB = b.timestamp ? b.timestamp.toMillis() : 0; return tB - tA; });
        allItems.forEach(d => {
            count++;
            let badge = d.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 6px; border-radius:4px; font-size:11px;">✅ ${d._type === 'flag' ? 'Reviewed' : 'Fixed'}</span>` : `<span style="background:#555; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">⏳ Pending</span>`;
            let title = d._type === 'flag' ? '⭐ Flagged Doubt' : `<b>${d.reason}</b>`;
            html += `<div style="background:#1a1a1a; padding:12px; border:1px solid #333; border-radius:6px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;">${title} ${badge}</div><p style="font-size:13px; color:var(--text-muted); margin:0;">${d.questionText}</p></div>`;
            if(d.status === 'resolved' && d.seenByStudent === false) { db.collection(d._type === 'flag' ? "flagged_doubts" : "reported_mistakes").doc(d._id).update({seenByStudent: true}); }
        });
        if(count === 0) { list.innerHTML = `<p style="color:var(--text-muted);">You haven't reported any questions yet.</p>`; } else { list.innerHTML = html; }
    } catch(e) { list.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}
function closeUserReportsModal() { document.getElementById('userReportsModal').style.display = 'none'; }

let selectedStars = 0; let userFeedbackDocId = null; 
function updateStarUI(stars) { selectedStars = stars; for(let i=1; i<=5; i++) { document.getElementById('star-'+i).classList.remove('active'); if(i <= stars) document.getElementById('star-'+i).classList.add('active'); } }
async function openFeedbackModal() { 
    if (!currentUser) { showNotification("⚠️ Please sign in to rate."); showAuthModal(); return; }
    document.getElementById('feedbackModal').style.display = 'flex'; 
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).limit(1).get();
        if (!snap.empty) { userFeedbackDocId = snap.docs[0].id; updateStarUI(snap.docs[0].data().rating || 0); document.getElementById('platformFeedbackText').value = snap.docs[0].data().feedback || ""; document.getElementById('submitFeedbackBtn').innerText = "Update Feedback"; } 
        else { userFeedbackDocId = null; updateStarUI(0); document.getElementById('platformFeedbackText').value = ""; document.getElementById('submitFeedbackBtn').innerText = "Submit Feedback"; }
    } catch(e) {}
}
function closeFeedbackModal() { document.getElementById('feedbackModal').style.display = 'none'; }

async function submitPlatformFeedback() {
    if (!currentUser) return; 
    if (selectedStars === 0) { showNotification("⚠️ Please select a star rating!"); return; }
    const feedbackText = document.getElementById('platformFeedbackText').value.trim(); 
    const btn = document.getElementById('submitFeedbackBtn'); 
    btn.innerText = "Submitting..."; btn.disabled = true;
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).limit(1).get();
        let oldRating = 0;
        let isUpdate = !snap.empty;

        if (isUpdate) {
            oldRating = snap.docs[0].data().rating || 0;
            await db.collection("platform_feedback").doc(snap.docs[0].id).update({ 
                rating: selectedStars, 
                feedback: feedbackText, 
                studentName: currentUser.displayName, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            });
            showNotification("✅ Feedback updated!");
        } else { 
            await db.collection("platform_feedback").add({ 
                rating: selectedStars, 
                feedback: feedbackText, 
                studentName: currentUser.displayName, 
                studentId: currentUser.uid, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            }); 
            showNotification("✅ Thank you!"); 
        }

        let ratingDelta = selectedStars - oldRating;
        let countDelta = isUpdate ? 0 : 1;
        await db.collection("settings").doc("platform_stats").set({
            ratingSum: firebase.firestore.FieldValue.increment(ratingDelta),
            ratingCount: firebase.firestore.FieldValue.increment(countDelta),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});

        closeFeedbackModal(); 
        fetchGlobalRating(); 
    } catch(e) { showNotification("❌ Error: " + e.message); }
    btn.innerText = "Submit Feedback"; btn.disabled = false;
}

async function fetchGlobalRating() {
    const display = document.getElementById('global-rating-display'); 
    if(!display) return;
    try {
        const statsDoc = await db.collection("settings").doc("platform_stats").get();
        if (statsDoc.exists) {
            let d = statsDoc.data();
            let count = d.ratingCount || 0;
            let sum = d.ratingSum || 0;
            display.innerText = count > 0 ? (sum / count).toFixed(1) : "5.0";
            return;
        }

        const snapshot = await db.collection("platform_feedback").limit(100).get(); 
        if (snapshot.empty) { display.innerText = "5.0"; return; }
        let total = 0; let count = 0; 
        snapshot.forEach(doc => { total += (doc.data().rating || 5); count++; }); 
        let avg = (total / count).toFixed(1);
        display.innerText = avg;

        db.collection("settings").doc("platform_stats").set({
            ratingSum: total,
            ratingCount: count,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
    } catch(e) { display.innerText = "5.0"; }
}
fetchGlobalRating();

// ==========================================
// 7. GEMINI-STYLE AI CHAT ENGINE
// ==========================================
const aiBtn = document.getElementById('ai-floating-btn');
let pressTimer; let isDragging = false; let startX, startY, initialX, initialY;

aiBtn.addEventListener('mousedown', startPress);
aiBtn.addEventListener('touchstart', startPress, {passive: true});
document.addEventListener('mouseup', endPress);
document.addEventListener('touchend', endPress);
document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag, {passive: false});

function startPress(e) {
    if(e.type === 'touchstart') {
        initialX = e.touches[0].clientX - aiBtn.getBoundingClientRect().left;
        initialY = e.touches[0].clientY - aiBtn.getBoundingClientRect().top;
    } else {
        initialX = e.clientX - aiBtn.getBoundingClientRect().left;
        initialY = e.clientY - aiBtn.getBoundingClientRect().top;
    }
    isDragging = false;
    pressTimer = setTimeout(() => {
        isDragging = true;
        aiBtn.classList.add('draggable');
    }, 500); 
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    let currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    let newLeft = currentX - initialX;
    let newTop = currentY - initialY;
    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft > window.innerWidth - aiBtn.offsetWidth) newLeft = window.innerWidth - aiBtn.offsetWidth;
    if (newTop > window.innerHeight - aiBtn.offsetHeight) newTop = window.innerHeight - aiBtn.offsetHeight;
    
    aiBtn.style.left = newLeft + 'px';
    aiBtn.style.top = newTop + 'px';
    aiBtn.style.right = 'auto';
    aiBtn.style.bottom = 'auto';
}

function endPress(e) {
    clearTimeout(pressTimer);
    if (isDragging) {
        isDragging = false;
        aiBtn.classList.remove('draggable');
    } else if (e.target === aiBtn || aiBtn.contains(e.target)) {
        openAIModal();
    }
}

let cropper = null; let aiChatHistory = []; let lastExtractedQuestion = null;
let pendingBase64Image = null; 

function autoExpandTextarea(field) {
    field.style.height = 'auto';
    field.style.height = Math.min(field.scrollHeight, 250) + 'px';
    if (field.scrollHeight > 250) {
        field.style.overflowY = 'auto';
    } else {
        field.style.overflowY = 'hidden';
    }
}

function toggleAttachMenu() {
    const menu = document.getElementById('ai-attach-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function handleAIPaste(e) {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (!file) continue;
            e.preventDefault(); 
            
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('ai-idle-view').style.display = 'none';
                Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
                    if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
                        child.style.display = 'none';
                    }
                });
                document.getElementById('ai-cropper-view').style.display = 'flex';
                
                const imgNode = document.getElementById('aiCropperImage'); 
                imgNode.src = event.target.result;
                if(cropper) cropper.destroy(); 
                cropper = new Cropper(imgNode, { viewMode: 1, autoCropArea: 0.85, background: false });
            };
            reader.readAsDataURL(file);
            break; 
        }
    }
}

function openAIModal() {
    document.getElementById('aiModal').style.display = 'flex'; 
    document.getElementById('ai-idle-view').style.display = 'flex';
    document.getElementById('ai-cropper-view').style.display = 'none';
    
    const historyContainer = document.getElementById('gemini-chat-history');
    const children = Array.from(historyContainer.children);
    children.forEach(child => {
        if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
            historyContainer.removeChild(child);
        }
    });

    const input = document.getElementById('aiTextInput');
    input.value = '';
    autoExpandTextarea(input);
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    document.getElementById('ai-attach-menu').style.display = 'none';
    clearPendingImage();
    
    aiChatHistory = []; 
    lastExtractedQuestion = null;
}

function closeAIModal() { 
    document.getElementById('aiModal').style.display = 'none'; 
    if(cropper) { cropper.destroy(); cropper = null; } 
}

function handleAIFuzzySuggestions() {
    const raw = document.getElementById('aiTextInput').value.trim().toLowerCase(); 
    const box = document.getElementById('ai-fuzzy-box');
    if(raw.length < 3) { box.style.display = 'none'; return; }
    const tokens = raw.split(/\s+/).filter(w => w.length > 2); let matches = [];
    function scanTree(obj, path=[]) {
        for(let k in obj) { 
            let full = [...path, k]; let kLower = k.toLowerCase(); 
            let hit = tokens.some(t => kLower.includes(t));
            if(hit) matches.push({ type: 'Topic', title: full.join(' > '), text: k });
            if(typeof obj[k] === 'object' && !Array.isArray(obj[k])) scanTree(obj[k], full);
        }
    }
    scanTree(appData);
    if(matches.length === 0) { 
        box.innerHTML = `<div class="ai-fuzzy-item" style="color:var(--text-muted); padding: 12px 16px; font-size: 14px;">No direct syllabus match found — AI will solve autonomously using NCERT references 🌐</div>`; 
    } else { 
        box.innerHTML = matches.slice(0, 5).map(m => `<div class="ai-fuzzy-item" onclick="insertAISuggestion('${m.text.replace(/'/g, "\\'")}')" style="padding: 12px 16px; border-bottom: 1px solid #333; cursor: pointer; display: flex; justify-content: space-between; color: #fff; font-size: 14px; transition: 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'"><span>📚 <b>${m.type}:</b> ${m.title}</span><span style="color:var(--primary-yellow);">Use Topic &rarr;</span></div>`).join(''); 
    }
    box.style.display = 'block';
}

function insertAISuggestion(text) { 
    const input = document.getElementById('aiTextInput');
    input.value = text + ": "; 
    autoExpandTextarea(input);
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    input.focus(); 
}

function handleAIImageUpload(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('ai-idle-view').style.display = 'none';
        
        Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
            if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
                child.style.display = 'none';
            }
        });
        document.getElementById('ai-cropper-view').style.display = 'flex';
        
        const imgNode = document.getElementById('aiCropperImage'); 
        imgNode.src = event.target.result;
        if(cropper) cropper.destroy(); 
        cropper = new Cropper(imgNode, { viewMode: 1, autoCropArea: 0.85, background: false });
    };
    reader.readAsDataURL(file);
}

function cancelCropper() { 
    if(cropper) { cropper.destroy(); cropper = null; } 
    document.getElementById('ai-cropper-view').style.display = 'none'; 
    
    Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
        if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
            child.style.display = 'block';
        }
    });
    if (aiChatHistory.length === 0) document.getElementById('ai-idle-view').style.display = 'flex';
    
    document.getElementById('aiImageInput').value = ""; 
    document.getElementById('aiCameraInput').value = ""; 
}

function confirmCropAndSolve() {
    if(!cropper) return; 
    const canvas = cropper.getCroppedCanvas(); 
    pendingBase64Image = canvas.toDataURL('image/jpeg').split(',')[1]; 
    
    cancelCropper(); 
    
    document.getElementById('ai-input-image-preview').src = "data:image/jpeg;base64," + pendingBase64Image;
    document.getElementById('ai-image-preview-container').style.display = 'block';
    document.getElementById('aiTextInput').focus();
}

function clearPendingImage() {
    pendingBase64Image = null;
    document.getElementById('ai-image-preview-container').style.display = 'none';
}

function editUserMessage(btn) {
    const rawText = btn.getAttribute('data-text');
    const inputEl = document.getElementById('aiTextInput');
    inputEl.value = rawText;
    autoExpandTextarea(inputEl);
    inputEl.focus();
}

function appendChatBubble(role, htmlContent, rawText = "") {
    const historyContainer = document.getElementById('gemini-chat-history');
    
    if (role === 'user') {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `align-self: flex-end; max-width: 85%; display: flex; align-items: flex-end; gap: 8px; margin-bottom: 5px;`;
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Edit';
        editBtn.setAttribute('data-text', rawText.replace(/"/g, '&quot;'));
        editBtn.style.cssText = `background: rgba(255,255,255,0.1); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; font-size: 13px;`;
        wrapper.onmouseover = () => editBtn.style.opacity = '1';
        wrapper.onmouseout = () => editBtn.style.opacity = '0';
        editBtn.onclick = () => editUserMessage(editBtn);

        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.style.cssText = `background: rgba(40, 40, 42, 0.9); backdrop-filter: blur(10px); color: white; padding: 14px 18px; border-radius: 20px 20px 0 20px; font-size: 15px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 5px 15px rgba(0,0,0,0.3);`;
        bubble.innerHTML = htmlContent;

        wrapper.appendChild(editBtn);
        wrapper.appendChild(bubble);
        historyContainer.appendChild(wrapper);
        
    } else if (role === 'loading') {
        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.id = 'ai-typing-indicator';
        bubble.style.cssText = `background: transparent; color: var(--primary-yellow); padding: 10px 0; max-width: 85%; align-self: flex-start; font-size: 15px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px;`;
        bubble.innerHTML = `<span style="font-size: 20px; animation: pulse 1s infinite;">🤖</span> <i id="loading-text-msg">${htmlContent}</i>`;
        historyContainer.appendChild(bubble);
        
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.style.cssText = `background: transparent; color: #e3e3e3; padding: 0; max-width: 100%; align-self: flex-start; font-size: 15px; line-height: 1.6; margin-bottom: 15px;`;
        bubble.innerHTML = htmlContent;
        historyContainer.appendChild(bubble);
        
        renderMathInElement(bubble, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
    }
    
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

async function handleAISend() {
    const inputEl = document.getElementById('aiTextInput');
    let text = inputEl.value.trim();
    
    if (!text && !pendingBase64Image) return; 
    if (!text && pendingBase64Image) text = "Please solve the question in this image.";
    
    inputEl.value = '';
    autoExpandTextarea(inputEl);
    document.getElementById('ai-fuzzy-box').style.display = 'none';
    document.getElementById('ai-idle-view').style.display = 'none';
    
    let displayHtml = text;
    if (pendingBase64Image) {
        displayHtml = `<img src="data:image/jpeg;base64,${pendingBase64Image}" style="max-height:120px; border-radius:8px; margin-bottom:10px; display:block; border:1px solid #444;">` + text;
    }
    
    appendChatBubble('user', displayHtml, text);
    
    let isVision = !!pendingBase64Image;
    let currentImg = pendingBase64Image;
    clearPendingImage(); 
    
    if (aiChatHistory.length === 0 || isVision) {
        if (!isVision) {
            try {
                const cacheSnap = await db.collection("ai_doubt_diary").where("questionText", "==", text).limit(1).get();
                if (!cacheSnap.empty) {
                    const cachedData = cacheSnap.docs[0].data();
                    const syntheticPayload = { extractedQuestion: cachedData.questionText, subject: cachedData.subject, solution: cachedData.solution, searchKeywords: [] };
                    renderAISolution(syntheticPayload, true); 
                    return; 
                }
            } catch(e) {}
        }
        
        let payload = isVision ? { mode: 'solve', text: text, image: currentImg, mimeType: 'image/jpeg' } : { mode: 'solve', text: text };
        await callAIWorker(payload, 3, text);
    } else {
        aiChatHistory.push({ role: 'user', text: text });
        await callAIWorker({ mode: 'chat', text: text, conversationHistory: aiChatHistory.slice(0, -1) }, 3, text);
    }
}

async function callAIWorker(payload, retries = 3, originalUserText = "") {
    appendChatBubble('loading', 'Analyzing your query...');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if(attempt > 1) {
                const indicatorText = document.getElementById('loading-text-msg');
                if (indicatorText) indicatorText.innerHTML = `<span style="color:var(--wrong-red);">High demand, retrying... (Attempt ${attempt}/${retries})</span>`;
            }

            const res = await fetch(AI_WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json(); 
            if(data.error) throw new Error(data.error);

            if (payload.mode === 'solve') { 
                renderAISolution(data, false); 
            } else {
                const indicator = document.getElementById('ai-typing-indicator');
                if (indicator) indicator.remove();
                
                aiChatHistory.push({ role: 'model', text: data.reply }); 
                
                let bubbleId = 'msg_' + Date.now();
                window.chatDoubts = window.chatDoubts || {};
                window.chatDoubts[bubbleId] = { q: originalUserText, a: data.reply };
                
                let parsedHTML = formatTextWithMath(data.reply);
                let saveBtnHTML = `<div style="margin-top:15px;"><button onclick="saveChatDoubt('${bubbleId}', this)" style="background:rgba(253, 184, 19, 0.1); color:var(--primary-yellow); padding: 8px 15px; border: 1px solid rgba(253,184,19,0.4); border-radius:20px; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.background='var(--primary-yellow)'; this.style.color='black';" onmouseout="this.style.background='rgba(253, 184, 19, 0.1)'; this.style.color='var(--primary-yellow)';"><span>📔</span> Save Explanation to Doubt Diary</button></div>`;
                
                appendChatBubble('model', parsedHTML + saveBtnHTML);
            }
            return; 
        } catch(e) {
            let errorMsg = e.message.toLowerCase();
            let isHighDemand = errorMsg.includes("high demand") || errorMsg.includes("overloaded") || errorMsg.includes("503") || errorMsg.includes("429");
            
            if (isHighDemand && attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 2500));
            } else {
                const indicator = document.getElementById('ai-typing-indicator');
                if (indicator) indicator.remove();
                showNotification("❌ AI Error: " + e.message); 
                appendChatBubble('model', `<div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--wrong-red); padding: 12px; border-radius: 4px;"><span style="color:var(--wrong-red);">❌ AI Error: ${e.message}</span></div>`);
                return; 
            }
        }
    }
}

async function renderAISolution(data, isCached = false) {
    const typingIndicator = document.getElementById('ai-typing-indicator');
    if (typingIndicator) typingIndicator.remove();
    
    lastExtractedQuestion = data; 
    aiChatHistory = [{ role: 'user', text: "Solve this: " + data.extractedQuestion }];
    
    let html = ``;
    
    if (isCached) {
        html += `<div style="border: 1px solid rgba(253, 184, 19, 0.3); background: rgba(253, 184, 19, 0.1); padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; display: inline-block;"><div><b style="color:var(--primary-yellow);">⚡ Instant Cache Match!</b> <span style="font-size:12px; color:var(--text-muted); margin-left:10px;">Served from Firebase</span></div></div><br>`;
    } else {
        const isFound = await checkDatabaseForQuestion(data.searchKeywords);
        if (isFound) { 
            html += `<div style="border: 1px solid rgba(76, 175, 80, 0.3); background: rgba(76, 175, 80, 0.1); padding: 12px 18px; border-radius: 8px; margin-bottom: 15px; display: inline-block;"><div><b style="color:var(--correct-green);">✅ Verified Match in MCQsPrep!</b><br><span style="font-size:13px; color:var(--text-light);">${isFound.path}</span></div><button onclick="closeAIModal(); jumpToSection(${JSON.stringify(isFound.path.split(' > ')).replace(/"/g, "'")}); window.location.hash='#/quiz';" style="margin-top:12px; background:var(--correct-green); border:none; padding:8px 16px; color:white; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px;">Go Practice 🚀</button></div><br>`; 
        } else { 
            html += `<div style="border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; font-size: 13px; color: #ccc; display: inline-block;">🌐 <b>Curriculum Knowledge Base Solution:</b> Solved autonomously using verified NCERT syllabus standards.</div><br>`; 
        }
    }
    
    let solutionMarkdown = `**Extracted Question:** ${data.extractedQuestion}\n\n**Core Concept:** ${data.solution.keyConcept}\n\n**Step-by-Step Explanation:**\n${data.solution.stepByStep}\n\n**Final Conclusion & Answer:** ${data.solution.finalAnswer}`;
    aiChatHistory.push({ role: 'model', text: solutionMarkdown }); 
    
    let parsedHTML = formatTextWithMath(solutionMarkdown);
    html += `<div style="margin-bottom: 15px;">${parsedHTML}</div>`;
    html += `<button onclick="saveToDoubtDiary()" style="background:rgba(253, 184, 19, 0.1); color:var(--primary-yellow); padding: 8px 15px; border: 1px solid rgba(253,184,19,0.4); border-radius:20px; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.background='var(--primary-yellow)'; this.style.color='black';" onmouseout="this.style.background='rgba(253, 184, 19, 0.1)'; this.style.color='var(--primary-yellow)';"><span>📔</span> Save Explanation to Doubt Diary</button>`;

    appendChatBubble('model', html);
}

async function saveChatDoubt(bubbleId, btnEl) {
    if (!currentUser) { showAuthModal(); return; }
    let data = window.chatDoubts[bubbleId];
    if (!data) return;
    
    btnEl.innerText = "Saving..."; 
    btnEl.disabled = true;
    
    try {
        await db.collection("ai_doubt_diary").add({
            userId: currentUser.uid,
            questionText: data.q,
            subject: lastExtractedQuestion ? lastExtractedQuestion.subject : "Follow-up Doubt",
            solution: {
                keyConcept: "AI Chat Conversation",
                stepByStep: data.a,
                finalAnswer: "Review details above."
            },
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        btnEl.innerHTML = "✅ Saved to Diary";
        btnEl.style.background = "var(--correct-green)";
        btnEl.style.color = "white";
        btnEl.style.borderColor = "var(--correct-green)";
        showNotification("📔 Follow-up saved to your Doubt Diary!");
    } catch(e) {
        btnEl.innerText = "❌ Failed to Save";
        showNotification("❌ Error: " + e.message);
    }
}

async function checkDatabaseForQuestion(keywords) {
    if(!keywords || keywords.length === 0) return null;
    try {
        const snap = await db.collection("content").where("type", "==", "mcq").limit(100).get(); 
        let foundDoc = null;
        snap.forEach(doc => { 
            const qText = doc.data().question.toLowerCase(); 
            let matchCount = 0; 
            keywords.forEach(k => { if (qText.includes(k.toLowerCase())) matchCount++; }); 
            if (matchCount >= Math.min(3, keywords.length)) foundDoc = doc.data(); 
        });
        return foundDoc;
    } catch(e) { return null; }
}

async function saveToDoubtDiary() {
    if (!currentUser) { showAuthModal(); return; } 
    if (!lastExtractedQuestion) return;
    try { 
        await db.collection("ai_doubt_diary").add({ userId: currentUser.uid, questionText: lastExtractedQuestion.extractedQuestion, subject: lastExtractedQuestion.subject, solution: lastExtractedQuestion.solution, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
        showNotification("📔 Saved to your Doubt Diary!"); 
    } catch(e) { showNotification("❌ Failed to save: " + e.message); }
}

async function _renderDoubtDiary() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Doubt Diary";
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card page-transition"><h2>📔 Loading Doubt Diary...</h2></div>`;
    try {
        const snap = await db.collection("ai_doubt_diary").where("userId", "==", currentUser.uid).orderBy("timestamp", "desc").limit(30).get();
        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { 
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>📔 Doubt Diary Empty</h2><p style="color:var(--text-muted);">Use the ✨ Ask AI feature to scan questions and save explanations here for rapid revision.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
            return; 
        }
        
        let html = `<div class="card page-transition"><h2 style="color:var(--primary-yellow);">📔 Your Saved Explanations</h2><p style="color:var(--text-muted); margin-bottom:20px;">Review your previously solved doubts here.</p>`;
        items.forEach(d => {
            let dateStr = d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleDateString() : '';
            let md = `**Core Concept:** ${d.solution.keyConcept}\n\n**Step-by-Step:**\n${d.solution.stepByStep}\n\n**Final Answer:** ${d.solution.finalAnswer}`;
            html += `<div style="background:#1a1a1a; border-left: 4px solid var(--primary-yellow); padding: 15px; border-radius: 6px; margin-bottom: 20px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${d.subject}</span><span style="font-size:12px; color:var(--text-muted);">${dateStr}</span></div><p style="font-weight:bold; font-size:16px;">Q: ${d.questionText}</p><button onclick="toggleViewAnswer('diary_sol_${d.id}')" style="background:#333; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">👁️ Show Solution</button><div id="diary_sol_${d.id}" class="katex-render-target" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #333; line-height:1.6; font-size:15px;">${formatTextWithMath(md)}</div></div>`;
        });
        html += `<button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
        mc.innerHTML = html;
        document.querySelectorAll('.katex-render-target').forEach(el => { renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] }); });
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}

// ==========================================
// 8. SEARCH ENGINE & LEADERBOARD
// ==========================================
function openSearch() { document.getElementById('searchWrapper').classList.add('active'); document.getElementById('searchInput').focus(); }
function closeSearch() { document.getElementById('searchWrapper').classList.remove('active'); document.getElementById('searchInput').value = ''; document.getElementById('searchSuggestions').style.display = 'none'; }
function delayCloseSearch() { setTimeout(closeSearch, 250); }

function handleLiveSearch() { 
    const query = document.getElementById('searchInput').value.trim().toLowerCase(); 
    const dropdown = document.getElementById('searchSuggestions');
    if(query === "") { dropdown.style.display = 'none'; return; }
    
    let results = [];
    function searchDB(obj, q, path = []) { 
        for (let key in obj) { 
            let current = [...path, key]; 
            if (key.toLowerCase().includes(q)) results.push({pathArray: current, matchWord: key}); 
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) searchDB(obj[key], q, current); 
        } 
    }
    searchDB(appData, query);
    
    if(results.length > 0) { 
        dropdown.innerHTML = results.slice(0, 8).map(res => { 
            const cleanPath = JSON.stringify(res.pathArray).replace(/"/g, "'"); 
            let regex = new RegExp(`(${query})`, 'gi');
            let highlightedText = res.pathArray.map(part => part.replace(regex, "<span class='highlight-match'>$1</span>")).join(" <span style='color:var(--text-muted);font-size:12px;'>&rarr;</span> ");
            return `<div class="suggestion-item" onclick="jumpToSection(${cleanPath}); closeSearch();">🔍 <span>${highlightedText}</span></div>`; 
        }).join(''); 
    } else { 
        dropdown.innerHTML = `<div class="suggestion-item" style="color: var(--text-muted);">No results match "${query}"</div>`; 
    }
    dropdown.style.display = 'block';
}

function _renderLeaderboardOptions() { 
    document.getElementById('breadcrumb-text').innerText = "Home / Leaderboard"; 
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 style="color:var(--primary-yellow);">🏆 Global Leaderboards</h2>
            <p style="color:var(--text-muted); margin-bottom: 20px;">Select a category to view the top 10 scores.</p>
            <div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--wrong-red); padding: 12px; margin-bottom: 25px; border-radius: 4px;">
                <span style="color: var(--wrong-red); font-weight: bold;">⚠️ CAUTION:</span> <span style="color: var(--text-light); font-size: 14px;">Only signed-in users will have their scores recorded and displayed on the leaderboard.</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                <button class="btn-exam" onclick="window.location.hash='#/board/NEET > MCQs Practice'">1. NEET PRACTICE</button>
                <button class="btn-exam" onclick="window.location.hash='#/board/NEET > Mock Test'">2. MOCK TEST</button>
                <button class="btn-exam" onclick="window.location.hash='#/board/General Knowledge'">3. GENERAL KNOWLEDGE</button>
            </div>
        </div>`; 
}

async function fetchLiveLeaderboard(pathPrefix) { 
    const mainContent = document.getElementById('dynamic-content');
    if (!currentUser) { 
        mainContent.innerHTML = `<div class="card page-transition"><h2>🏆 Fetching Leaderboard...</h2><div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--wrong-red); padding: 15px; margin: 20px 0; border-radius: 4px;"><span style="color: var(--wrong-red); font-weight: bold;">⚠️ ACCESS DENIED:</span> <span style="color: var(--text-light); font-size: 14px;">You must be signed in with Google to view the global leaderboards.</span></div><button class="btn-exam" onclick="window.history.back()" style="background:#333; border:none;">&larr; Back</button></div>`; 
        return; 
    }

    mainContent.innerHTML = `<div class="card page-transition"><h2>🏆 Fetching Leaderboard...</h2></div>`;
    try {
        const userSnapshot = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get();
        let totalQuestions = 0; let totalTests = 0; let myBestScore = -99999; let myBestData = null;
        userSnapshot.forEach(doc => {
            let data = doc.data();
            if (data.quizPath && data.quizPath.startsWith(pathPrefix)) {
                totalTests++; totalQuestions += (data.attemptedQuestions || 0);
                if (data.score > myBestScore) { myBestScore = data.score; myBestData = data; }
            }
        });

        let isMockTest = pathPrefix.includes('Mock Test'); let thresholdMet = false; let requiredText = ""; let progressText = "";
        if (isMockTest) { thresholdMet = (totalTests >= 5); requiredText = "5 Full Mock Tests"; progressText = `${totalTests} / 5 Tests Completed`; } 
        else { thresholdMet = (totalQuestions >= 100); requiredText = "100 Practice Questions"; progressText = `${totalQuestions} / 100 Questions Attempted`; }

        if (!thresholdMet) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 style="color: var(--primary-yellow); font-size: 28px; margin-bottom: 10px;">🔒 Leaderboard Locked</h2><p style="color: var(--text-muted); font-size: 15px; max-width: 500px; margin: 0 auto 20px auto; line-height: 1.5;">To ensure competitive integrity, you must attempt a minimum of <b style="color: white;">${requiredText}</b> in this specific category before unlocking the global rankings.</p><div style="background: #2a2a2a; border: 1px solid var(--border-color); padding: 15px 25px; border-radius: 8px; display: inline-block; margin-bottom: 30px;"><span style="color: var(--primary-yellow); font-weight: bold; margin-right: 10px;">Your Progress:</span> <span style="color: white; font-weight: bold;">${progressText}</span></div><br><button class="btn-exam" onclick="window.history.back()" style="background:#333; border:none;">&larr; Back to Categories</button></div>`; return;
        }

        const boardSnapshot = await db.collection("leaderboards")
            .where("quizPath", ">=", pathPrefix)
            .where("quizPath", "<=", pathPrefix + "\uf8ff")
            .orderBy("quizPath")
            .orderBy("score", "desc")
            .limit(10)
            .get();
            
        let html = `<div class="card page-transition"><h2 style="color:var(--primary-yellow);">🏆 Top 10: ${pathPrefix.split(' > ').pop()}</h2><div style="overflow-x:auto;"><table><tr><th>Rank</th><th>Student</th><th>Score</th><th>Accuracy</th><th>Time</th></tr>`;
        let inTop10 = false; let docs = [];
        boardSnapshot.forEach(doc => docs.push(doc.data()));
        
        for(let i = 0; i < docs.length; i++) { 
            let data = docs[i]; 
            let medal = (i === 0) ? "🥇 " : ((i === 1) ? "🥈 " : ((i === 2) ? "🥉 " : (i + 1) + ". "));
            let isMe = (data.userId === currentUser.uid); 
            if (isMe) inTop10 = true;
            let rowStyle = isMe ? `style="background: rgba(253, 184, 19, 0.15);"` : "";
            html += `<tr ${rowStyle}><td>${medal}</td><td><b>${data.userName}</b> ${isMe ? '<span style="color:var(--primary-yellow); font-size:12px; margin-left:5px;">(You)</span>' : ''}</td><td style="color:var(--correct-green); font-weight:bold;">${data.score}</td><td>${data.accuracy}%</td><td>${data.timeStr}</td></tr>`;
        }
        html += `</table></div>`;

        if (!inTop10 && myBestData) { html += `<div style="margin-top: 30px; background: #2a2a2a; border: 1px solid var(--border-color); border-left: 4px solid var(--primary-yellow); padding: 20px; border-radius: 4px;"><h4 style="margin: 0 0 15px 0; color: var(--primary-yellow); font-size: 18px;">Your Personal Best</h4><div style="display: flex; gap: 30px; flex-wrap: wrap;"><div><span style="color:var(--text-muted); font-size:13px;">Global Rank</span><br><b style="font-size:20px; color: white;">${myRank}</b></div><div><span style="color:var(--text-muted); font-size:13px;">Best Score</span><br><b style="font-size:20px; color:var(--correct-green);">${myBestData.score}</b></div><div><span style="color:var(--text-muted); font-size:13px;">Accuracy</span><br><b style="font-size:20px; color: white;">${myBestData.accuracy}%</b></div><div><span style="color:var(--text-muted); font-size:13px;">Total Tests Attempted</span><br><b style="font-size:20px; color: white;">${totalTests}</b></div></div></div>`; }
        html += `<button class="btn-exam" onclick="window.history.back()" style="margin-top:25px; background:#333; border:none;">&larr; Back to Categories</button></div>`;
        mainContent.innerHTML = html;

    } catch(e) { mainContent.innerHTML = `<div class="card"><h2 style="color:var(--wrong-red);">Error</h2><p>${e.message}</p></div>`; }
}

function showNotification(message) { 
    const notif = document.getElementById('notification'); 
    notif.innerText = message; 
    notif.style.display = 'block'; 
    setTimeout(() => { notif.style.display = 'none'; }, 3000); 
}

// ==========================================
// 9. SCALED QUIZ ENGINE, PERSISTENCE & BOOKMARKS
// ==========================================
let quizState = { questions: [], currentIndex: 0, userAnswers: {}, showAnswerTriggered: {}, flaggedDoubts: {}, viewedQuestions: [], timer: null, secondsPassed: 0, isTimerPaused: false, isCustom: false };

async function loadUserBookmarks() {
    if (!currentUser) return;
    try {
        const snap = await db.collection("users").doc(currentUser.uid).collection("bookmarks").get();
        userBookmarks = [];
        snap.forEach(doc => userBookmarks.push(doc.id));
    } catch(e) {}
}

async function toggleBookmark(questionId) {
    if (!currentUser) { showAuthModal(); return; }
    const btn = document.getElementById('bookmarkBtn_' + questionId);
    const isBookmarked = userBookmarks.includes(questionId);
    try {
        if (isBookmarked) {
            await db.collection("users").doc(currentUser.uid).collection("bookmarks").doc(questionId).delete();
            userBookmarks = userBookmarks.filter(id => id !== questionId);
            if(btn) { btn.innerHTML = "🔖 Bookmark"; btn.classList.remove('bookmarked'); }
            showNotification("Removed from Bookmarks.");
        } else {
            await db.collection("users").doc(currentUser.uid).collection("bookmarks").doc(questionId).set({ savedAt: firebase.firestore.FieldValue.serverTimestamp() });
            userBookmarks.push(questionId);
            if(btn) { btn.innerHTML = "🔖 Bookmarked"; btn.classList.add('bookmarked'); }
            showNotification("Added to Bookmarks!");
        }
    } catch(e) { showNotification("❌ Error: " + e.message); }
}

async function _initiateBookmarkQuiz() {
    if (!currentUser) { showAuthModal(); return; }
    const mainContent = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Bookmarks"; 
    mainContent.innerHTML = `<div class="card page-transition"><div style="font-size:40px; text-align:center; margin-bottom:15px;">🔖</div><h2 style="color:var(--primary-yellow); text-align:center;">Loading Bookmarks...</h2></div>`;

    try {
        if (userBookmarks.length === 0) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Bookmarks Found</h2><p style="color:var(--text-muted);">You haven't bookmarked any questions yet. Click the 🔖 Bookmark button during a quiz to save questions here for revision.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Go Back</button></div>`;
            return;
        }

        let availableQuestions = [];
        const batches = [];
        for (let i = 0; i < userBookmarks.length; i += 10) { batches.push(userBookmarks.slice(i, i + 10)); }
        
        for (let b of batches) {
            const snap = await db.collection("content").where(firebase.firestore.FieldPath.documentId(), "in", b).get();
            snap.forEach(doc => { availableQuestions.push({ id: doc.id, ...doc.data() }); });
        }

        if (availableQuestions.length === 0) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>Error</h2><p>Could not load bookmarked questions.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Go Back</button></div>`;
            return;
        }

        quizState.questions = availableQuestions;
        quizState.isCustom = true; 
        quizState.currentIndex = 0; quizState.userAnswers = {}; quizState.showAnswerTriggered = {}; quizState.flaggedDoubts = {}; quizState.viewedQuestions = []; quizState.secondsPassed = 0; quizState.isTimerPaused = false;
        
        clearInterval(quizState.timer);
        quizState.timer = setInterval(() => {
            if (!quizState.isTimerPaused) { 
                quizState.secondsPassed++; 
                let disp = document.getElementById('quizTimeDisplay'); 
                if(disp) disp.innerText = formatTime(quizState.secondsPassed); 
                if (quizState.secondsPassed % 5 === 0) saveQuizSession();
            }
        }, 1000);
        
        saveQuizSession();
        _renderQuizQuestion();

    } catch (e) {
        mainContent.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p><button class="btn-exam" onclick="goBack()">&larr; Go Back</button></div>`;
    }
}

function saveQuizSession() {
    if (!quizState || !quizState.questions || quizState.questions.length === 0) return;
    const sessionData = {
        path: currentPath,
        customConfig: customQuizConfig,
        state: {
            questions: quizState.questions,
            currentIndex: quizState.currentIndex,
            userAnswers: quizState.userAnswers,
            showAnswerTriggered: quizState.showAnswerTriggered,
            flaggedDoubts: quizState.flaggedDoubts,
            viewedQuestions: quizState.viewedQuestions,
            secondsPassed: quizState.secondsPassed,
            isCustom: quizState.isCustom
        },
        userId: currentUser ? currentUser.uid : 'anonymous'
    };
    localStorage.setItem('mcq_active_session', JSON.stringify(sessionData));
}

function clearQuizSession() {
    localStorage.removeItem('mcq_active_session');
}

async function _initiateQuizEngine(isCustomLaunch = false) {
    const pathString = currentPath.join(' > ');

    // Session Persistence Check
    const savedSessionStr = localStorage.getItem('mcq_active_session');
    if (savedSessionStr) {
        try {
            const savedSession = JSON.parse(savedSessionStr);
            let isSameUser = savedSession.userId === (currentUser ? currentUser.uid : 'anonymous');
            let isSamePath = false;
            
            if (isCustomLaunch && savedSession.state.isCustom) {
                isSamePath = JSON.stringify(savedSession.customConfig) === JSON.stringify(customQuizConfig);
            } else if (!isCustomLaunch && !savedSession.state.isCustom) {
                isSamePath = JSON.stringify(savedSession.path) === JSON.stringify(currentPath);
            }

            if (isSameUser && isSamePath) {
                if (confirm("You have an unfinished quiz in progress!\n\nClick 'OK' to resume where you left off, or 'Cancel' to start a fresh quiz.")) {
                    Object.assign(quizState, savedSession.state);
                    quizState.isTimerPaused = false;
                    
                    document.getElementById('breadcrumb-text').innerText = "Home / " + (isCustomLaunch ? "Custom Quiz" : pathString + " / Active Quiz"); 
                    
                    clearInterval(quizState.timer);
                    quizState.timer = setInterval(() => {
                        if (!quizState.isTimerPaused) { 
                            quizState.secondsPassed++; 
                            let disp = document.getElementById('quizTimeDisplay'); 
                            if(disp) disp.innerText = formatTime(quizState.secondsPassed); 
                            if (quizState.secondsPassed % 5 === 0) saveQuizSession();
                        }
                    }, 1000);
                    
                    _renderQuizQuestion();
                    return; 
                } else {
                    clearQuizSession();
                }
            } else {
                clearQuizSession();
            }
        } catch(e) { clearQuizSession(); }
    }

    document.getElementById('breadcrumb-text').innerText = "Home / " + (isCustomLaunch ? "Custom Quiz" : pathString + " / Active Quiz"); 
    const mainContent = document.getElementById('dynamic-content');
    mainContent.innerHTML = `<div class="card page-transition"><div style="font-size:40px; text-align:center; margin-bottom:15px;">⚙️</div><h2 style="color:var(--primary-yellow); text-align:center;">Building Your Quiz...</h2><p style="text-align:center; color:var(--text-muted);">Fetching and filtering unattempted questions from the database...</p></div>`;

    try {
        let isDailyQuiz = currentPath[0] === 'Daily Quiz Challenge';
        let availableQuestions = []; 
        let totalQuestionsInDB = 0;

        if (isCustomLaunch) {
            let unattempted = [];
            for (const p of customQuizConfig.paths) {
                let pSafe = "prog_" + p.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g, '_');
                let pathAttempted = await getAttemptedIdsForPath(pSafe);

                const snap = await db.collection("content")
                    .where("path", ">=", p)
                    .where("path", "<=", p + "\uf8ff")
                    .limit(50)
                    .get();

                snap.forEach(doc => {
                    let d = doc.data();
                    if (d.type === 'mcq' && !pathAttempted.includes(doc.id)) {
                        let isLevelMatch = customQuizConfig.level === 'Mixed' || 
                                           d.level === customQuizConfig.level || 
                                           (!d.level && customQuizConfig.level === 'Mixed') ||
                                           d.path.toLowerCase().includes(customQuizConfig.level.toLowerCase());
                        
                        if (isLevelMatch && !unattempted.find(u => u.id === doc.id)) {
                            unattempted.push({id: doc.id, ...d});
                        }
                    }
                });
            }

            let finalSelection = [];
            let totalNeeded = customQuizConfig.count;

            if (customQuizConfig.exam === 'NEET') {
                let bot = unattempted.filter(q => q.path.includes('Botany')).sort(()=>0.5-Math.random());
                let zoo = unattempted.filter(q => q.path.includes('Zoology')).sort(()=>0.5-Math.random());
                let phy = unattempted.filter(q => q.path.includes('Physics')).sort(()=>0.5-Math.random());
                let chem = unattempted.filter(q => q.path.includes('Chemistry')).sort(()=>0.5-Math.random());

                let targetEach = Math.floor(totalNeeded / 4);
                let remainder = totalNeeded % 4;

                let targets = { bot: targetEach, zoo: targetEach, phy: targetEach, chem: targetEach };
                let keys = ['bot', 'zoo', 'phy', 'chem'];
                for(let i=0; i<remainder; i++) targets[keys[i]]++;

                let pools = { bot, zoo, phy, chem };

                for (let key of keys) {
                    let take = Math.min(targets[key], pools[key].length);
                    finalSelection.push(...pools[key].slice(0, take));
                    pools[key] = pools[key].slice(take);
                    targets[key] -= take;
                }

                let leftoverNeed = keys.reduce((sum, k) => sum + targets[k], 0);
                if (leftoverNeed > 0) {
                    let remainingQuestions = [];
                    for(let k of keys) remainingQuestions.push(...pools[k]);
                    remainingQuestions = remainingQuestions.sort(()=>0.5-Math.random());
                    finalSelection.push(...remainingQuestions.slice(0, leftoverNeed));
                }
            } else {
                let subjectsPresent = [...new Set(unattempted.map(q => {
                    let parts = q.path.split(' > ');
                    return parts.length > 1 ? parts[1] : parts[0]; 
                }))];

                if (subjectsPresent.length > 0) {
                    let targetEach = Math.floor(totalNeeded / subjectsPresent.length);
                    let remainder = totalNeeded % subjectsPresent.length;

                    let pools = {};
                    subjectsPresent.forEach(s => pools[s] = unattempted.filter(q => q.path.includes(s)).sort(()=>0.5-Math.random()));

                    let targets = {};
                    subjectsPresent.forEach((s, i) => targets[s] = targetEach + (i < remainder ? 1 : 0));

                    for (let s of subjectsPresent) {
                        let take = Math.min(targets[s], pools[s].length);
                        finalSelection.push(...pools[s].slice(0, take));
                        pools[s] = pools[s].slice(take);
                        targets[s] -= take;
                    }

                    let leftoverNeed = subjectsPresent.reduce((sum, s) => sum + targets[s], 0);
                    if (leftoverNeed > 0) {
                        let remainingQuestions = [];
                        for(let s of subjectsPresent) remainingQuestions.push(...pools[s]);
                        remainingQuestions = remainingQuestions.sort(()=>0.5-Math.random());
                        finalSelection.push(...remainingQuestions.slice(0, leftoverNeed));
                    }
                } else {
                    finalSelection = unattempted.sort(()=>0.5-Math.random()).slice(0, totalNeeded);
                }
            }

            totalQuestionsInDB = unattempted.length;
            availableQuestions = finalSelection.sort(()=>0.5-Math.random()).slice(0, customQuizConfig.count);
            quizState.questions = availableQuestions;
            quizState.isCustom = true;

        } else if (isDailyQuiz) {
            let targetPrefix = currentPath[1] === "NEET" ? "NEET" : "General Knowledge";
            let dailyAttempted = await getAttemptedIdsForPath("prog_daily_challenge");
            
            if (currentPath[1] === "NEET") {
                const subjs = ["Botany", "Zoology", "Physics", "Chemistry"];
                for (let subj of subjs) {
                    let sPath = `NEET > MCQs Practice > ${subj}`;
                    let sSnap = await db.collection("content")
                        .where("path", ">=", sPath)
                        .where("path", "<=", sPath + "\uf8ff")
                        .limit(20)
                        .get();
                    
                    let sUnattempted = [];
                    sSnap.forEach(doc => {
                        let d = doc.data();
                        if (d.type === 'mcq' && !dailyAttempted.includes(doc.id)) sUnattempted.push({id: doc.id, ...d});
                    });
                    availableQuestions.push(...sUnattempted.sort(() => 0.5 - Math.random()).slice(0, 5));
                }
                totalQuestionsInDB = 20; 
            } else { 
                let gSnap = await db.collection("content")
                    .where("path", ">=", "General Knowledge")
                    .where("path", "<=", "General Knowledge\uf8ff")
                    .limit(50)
                    .get();
                let gUnattempted = [];
                gSnap.forEach(doc => {
                    let d = doc.data();
                    if (d.type === 'mcq' && !dailyAttempted.includes(doc.id)) gUnattempted.push({id: doc.id, ...d});
                });
                availableQuestions = gUnattempted.sort(() => 0.5 - Math.random()).slice(0, 20); 
                totalQuestionsInDB = 20;
            }
            quizState.questions = availableQuestions.sort(() => Math.random() - 0.5);
            quizState.isCustom = false;

        } else {
            let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
            let previouslyAttemptedIds = await getAttemptedIdsForPath(safePath);

            let randSeed = Math.random();
            let snapshot = await db.collection("content")
                .where("path", ">=", pathString)
                .where("path", "<=", pathString + "\uf8ff")
                .where("randomKey", ">=", randSeed)
                .limit(50)
                .get();

            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.type === 'mcq') {
                    totalQuestionsInDB++;
                    if (!previouslyAttemptedIds.includes(doc.id)) {
                        availableQuestions.push({ id: doc.id, ...data });
                    }
                }
            });

            if (availableQuestions.length < 20) {
                let fallbackSnap = await db.collection("content")
                    .where("path", ">=", pathString)
                    .where("path", "<=", pathString + "\uf8ff")
                    .limit(80)
                    .get();

                fallbackSnap.forEach(doc => {
                    let data = doc.data();
                    if (data.type === 'mcq') {
                        totalQuestionsInDB++;
                        if (!previouslyAttemptedIds.includes(doc.id) && !availableQuestions.find(q => q.id === doc.id)) {
                            availableQuestions.push({ id: doc.id, ...data });
                        }
                    }
                });
            }

            quizState.questions = availableQuestions.sort(() => Math.random() - 0.5);
            quizState.isCustom = false;
        }

        if (availableQuestions.length === 0) { 
            if(isCustomLaunch) mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find any unattempted questions matching your selected chapters and difficulty level.</p><button class="btn-exam" onclick="goHome()" style="background:#333; border:none;">&larr; Go Back</button></div>`;
            else if(totalQuestionsInDB === 0) mainContent.innerHTML = `<div class="card page-transition"><h2>No Questions Available</h2><p style="color:var(--text-muted);">Not enough questions available in the database for this section.</p><button class="btn-exam" onclick="goHome()" style="background:#333; border:none;">&larr; Go Back</button></div>`; 
            else {
                let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
                mainContent.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 style="color: var(--primary-yellow); font-size: 28px; margin-bottom: 15px;">🎉 Section Completed!</h2><p style="color: var(--text-muted); font-size: 16px; margin-bottom: 25px;">You have successfully attempted all available questions in this section.</p><div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;"><button class="btn-exam" onclick="resetProgress('${safePath}')" style="background: #333; color: white; border:none;">🔄 Reset My Progress</button><button class="btn-exam" onclick="window.history.back()" style="background:#333; border:none;">&larr; Explore Other Topics</button></div></div>`;
            }
            return; 
        }
        
        quizState.currentIndex = 0; quizState.userAnswers = {}; quizState.showAnswerTriggered = {}; quizState.flaggedDoubts = {}; quizState.viewedQuestions = []; quizState.secondsPassed = 0; quizState.isTimerPaused = false;
        
        clearInterval(quizState.timer);
        quizState.timer = setInterval(() => {
            if (!quizState.isTimerPaused) { 
                quizState.secondsPassed++; 
                let disp = document.getElementById('quizTimeDisplay'); 
                if(disp) disp.innerText = formatTime(quizState.secondsPassed); 
                if (quizState.secondsPassed % 5 === 0) saveQuizSession();
            }
        }, 1000);
        saveQuizSession();
        _renderQuizQuestion();
    } catch (error) { mainContent.innerHTML = `<div class="card"><h2>Error</h2><p>${error.message}</p><button class="btn-exam" onclick="goBack()">&larr; Go Back</button></div>`; }
}

function toggleFlag() {
    quizState.flaggedDoubts[quizState.currentIndex] = !quizState.flaggedDoubts[quizState.currentIndex];
    const btn = document.getElementById('flagDoubtBtn');
    if(quizState.flaggedDoubts[quizState.currentIndex]) { btn.classList.add('flagged'); btn.innerText = '⭐ Flagged'; }
    else { btn.classList.remove('flagged'); btn.innerText = '⭐ Flag for Review'; }
}

function _renderQuizQuestion() {
    const mainContent = document.getElementById('dynamic-content');
    if (!quizState.viewedQuestions.includes(quizState.currentIndex)) { quizState.viewedQuestions.push(quizState.currentIndex); }

    const q = quizState.questions[quizState.currentIndex];
    let multiText = q.correctAnswers.length > 1 ? `<span style="color:var(--primary-yellow); font-size:12px;">(Select all that apply)</span>` : "";
    let selectedNow = quizState.userAnswers[quizState.currentIndex] || []; 
    let hasPeeked = quizState.showAnswerTriggered[quizState.currentIndex]; let isFlagged = quizState.flaggedDoubts[quizState.currentIndex];
    let isBookmarked = userBookmarks.includes(q.id);
    quizState.isTimerPaused = !!hasPeeked;

    let paletteHtml = '<div class="question-palette">';
    for(let i=0; i<quizState.questions.length; i++) {
        let isAttempted = quizState.userAnswers[i] && quizState.userAnswers[i].length > 0;
        let bg = quizState.currentIndex === i ? 'var(--primary-yellow)' : (isAttempted ? '#4CAF50' : '#2a2a2a');
        let color = quizState.currentIndex === i ? '#000' : '#fff';
        let flagStar = quizState.flaggedDoubts[i] ? '⭐' : '';
        paletteHtml += `<button onclick="jumpToQuestion(${i})" style="width:35px; height:35px; border-radius:5px; border:1px solid var(--border-color); background:${bg}; color:${color}; font-weight:bold; cursor:pointer;">${i+1}${flagStar}</button>`;
    }
    paletteHtml += '</div>';

    let optionsHtml = Object.keys(q.options).sort().map(key => {
        if(!q.options[key]) return ''; 
        let isSelected = selectedNow.includes(key); let extraClass = '';
        if (hasPeeked) { if (q.correctAnswers.includes(key)) extraClass = 'correct'; else if (isSelected) extraClass = 'wrong'; } 
        else if (isSelected) { extraClass = 'selected'; }
        return `<div class="quiz-option ${extraClass}" onclick="toggleOptionSelection('${key}', ${q.correctAnswers.length > 1})"><b style="margin-right:15px; color:var(--text-muted);">${key}.</b> <span class="katex-render-target">${q.options[key]}</span></div>`;
    }).join('');

    let html = `
        <div class="card">
            <div class="quiz-header">
                <span style="color:var(--text-muted);">Question ${quizState.currentIndex + 1} ${multiText}</span>
                <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
                    <button class="report-btn" onclick="openReportModal('${q.id}', '${q.question.replace(/'/g, "\\'")}', '${q.path}')">🚨 Report Mistake</button>
                    <button id="flagDoubtBtn" class="flag-btn ${isFlagged ? 'flagged' : ''}" onclick="toggleFlag()">${isFlagged ? '⭐ Flagged' : '⭐ Flag for Review'}</button>
                    <button id="bookmarkBtn_${q.id}" class="flag-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark('${q.id}')">${isBookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}</button>
                    <span class="quiz-timer">⏱ <span id="quizTimeDisplay">${formatTime(quizState.secondsPassed)}</span></span>
                </div>
            </div>
            ${paletteHtml}
            ${quizState.isCustom ? `<div style="margin-bottom:15px;"><span class="badge-path">${q.path}</span> <span style="font-size:11px; color:#aaa; margin-left:10px;">Lvl: ${q.level||'Mixed'}</span></div>` : ''}
            ${q.imageUrl ? `<img src="${q.imageUrl}" class="quiz-image">` : ''}
            <div class="quiz-question-text katex-render-target">${q.question}</div>
            <div id="optionsContainer">${optionsHtml}</div>
            <div class="quiz-explanation katex-render-target" style="display:${hasPeeked ? 'block' : 'none'}"><b>Explanation:</b><br><span id="expText">${q.explanation || "No explanation provided."}</span></div>
            <div class="nav-buttons-row">
                <div style="display:flex; gap:10px;"><button class="btn-exam" onclick="_prevQuestion()" ${quizState.currentIndex === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>&larr; Prev</button><button class="btn-exam" onclick="_nextQuestion()" ${quizState.currentIndex === quizState.questions.length - 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Next / Skip &rarr;</button></div>
                <div style="display:flex; gap:10px;"><button class="btn-exam" onclick="checkAnswer()" style="background:#333; border:none; ${hasPeeked ? 'display:none;' : ''}">Check Answer</button><button class="btn-exam" onclick="finishQuiz()" style="background:var(--wrong-red); border:none; color:white;">Finish Quiz</button></div>
            </div>
        </div>`;
    mainContent.innerHTML = html;
    
    document.querySelectorAll('.katex-render-target').forEach(el => {
        renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
    });
    
    saveQuizSession();
}

function toggleOptionSelection(optKey, isMulti) {
    if(quizState.showAnswerTriggered[quizState.currentIndex]) return;
    let currentSelections = quizState.userAnswers[quizState.currentIndex] || [];
    if (!isMulti) { currentSelections = [optKey]; } else {
        if (currentSelections.includes(optKey)) { currentSelections = currentSelections.filter(k => k !== optKey); } else { currentSelections.push(optKey); }
    }
    quizState.userAnswers[quizState.currentIndex] = currentSelections; _renderQuizQuestion();
}

function checkAnswer() {
    let currentSelections = quizState.userAnswers[quizState.currentIndex] || [];
    if(currentSelections.length === 0) { showNotification("⚠ Select an option first!"); return; }
    quizState.showAnswerTriggered[quizState.currentIndex] = true; _renderQuizQuestion();
}

function jumpToQuestion(index) { quizState.currentIndex = index; _renderQuizQuestion(); }
function _nextQuestion() { if(quizState.currentIndex < quizState.questions.length - 1) { quizState.currentIndex++; _renderQuizQuestion(); } }
function _prevQuestion() { if(quizState.currentIndex > 0) { quizState.currentIndex--; _renderQuizQuestion(); } }
function formatTime(totalSeconds) { const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

window.showReviewTab = function(tabName) {
    ['correct', 'wrong', 'skipped'].forEach(t => { document.getElementById('review-' + t).style.display = 'none'; document.getElementById('tab-btn-' + t).classList.remove('active'); });
    document.getElementById('review-' + tabName).style.display = 'block'; document.getElementById('tab-btn-' + tabName).classList.add('active');
};

window.toggleViewAnswer = function(id) { let el = document.getElementById(id); el.style.display = el.style.display === 'none' ? 'block' : 'none'; };

function buildReviewItemHtml(q, index, type, userAnsArray) {
    let optionsHtml = ''; let optKeys = Object.keys(q.options).sort();
    for(let key of optKeys) {
        let isUser = userAnsArray.includes(key); let isCorr = q.correctAnswers.includes(key); let bgClass = ''; let icon = '';
        if (type !== 'skipped') { if (isCorr) { bgClass = 'background: rgba(76, 175, 80, 0.1); border-color: var(--correct-green);'; icon = '✅ '; } else if (isUser && !isCorr) { bgClass = 'background: rgba(244, 67, 54, 0.1); border-color: var(--wrong-red);'; icon = '❌ '; } }
        optionsHtml += `<div style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 8px; ${bgClass}"><b>${icon}${key}.</b> <span class="katex-render-target">${q.options[key]}</span></div>`;
    }
    let exp = q.explanation ? `<div class="katex-render-target" style="margin-top:10px; color:var(--text-muted); font-size:14px;"><b>Explanation:</b> ${q.explanation}</div>` : '';
    let img = q.imageUrl ? `<img src="${q.imageUrl}" style="max-height:150px; border-radius:6px; margin-bottom:10px; display:block;">` : '';
    
    let borderColor = type === 'correct' ? 'var(--correct-green)' : (type === 'wrong' ? 'var(--wrong-red)' : 'var(--primary-yellow)');
    return `
        <div class="review-item" style="border-left: 4px solid ${borderColor};">
            <p style="margin-top:0; font-size: 16px;"><b>Q${index + 1}:</b> <span class="katex-render-target">${q.question}</span></p>
            ${img} ${optionsHtml}
            ${type === 'skipped' ? `<button onclick="toggleViewAnswer('ans_div_${q.id}')" style="background:#333; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; margin-top:10px;">👁️ View Answer</button><div id="ans_div_${q.id}" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #333;"><p style="color:var(--correct-green); margin:0 0 10px 0;"><b>Correct Answer:</b> ${q.correctAnswers.join(', ')}</p>${exp}</div>` : `<p style="color:var(--correct-green); margin:15px 0 5px 0;"><b>Correct Answer:</b> ${q.correctAnswers.join(', ')}</p>${exp}`}
        </div>
    `;
}

async function finishQuiz() {
    clearInterval(quizState.timer); 
    clearQuizSession();
    
    let attempted = 0; let totalScore = 0; let correctCount = 0; let wrongCount = 0;
    let sessionAttemptedIds = []; let skippedCount = 0; let isDailyQuiz = currentPath[0] === 'Daily Quiz Challenge';
    let correctHtml = ''; let wrongHtml = ''; let skippedHtml = ''; let flaggedListHtml = '';
    
    let isNeetSection = isDailyQuiz ? (currentPath[1] === "NEET") : (currentPath[0] === "NEET");
    if(quizState.isCustom) {
        isNeetSection = customQuizConfig.exam === 'NEET';
    }

    let subjectBreakdown = {};

    quizState.questions.forEach((q, index) => {
        let userAnsArray = quizState.userAnswers[index] || []; let isAttempted = userAnsArray.length > 0; let isCorrect = false; let isViewed = quizState.viewedQuestions.includes(index);
        if (isAttempted) { attempted++; sessionAttemptedIds.push(q.id); let userAnsStr = userAnsArray.sort().join(','); let correctAnsStr = q.correctAnswers.sort().join(','); if (userAnsStr === correctAnsStr) { isCorrect = true; correctCount++; } }
        if (isAttempted && !isCorrect) wrongCount++;
        if (isAttempted) { if (isCorrect) correctHtml += buildReviewItemHtml(q, index, 'correct', userAnsArray); else wrongHtml += buildReviewItemHtml(q, index, 'wrong', userAnsArray); } 
        else if (isViewed) { skippedCount++; skippedHtml += buildReviewItemHtml(q, index, 'skipped', []); }

        if (isNeetSection) { if (isCorrect) totalScore += 4; else if (isAttempted && !isCorrect) totalScore -= 1; } else { if (isCorrect) totalScore += 1; }

        let subj = "Other";
        if (q.path.includes("Botany")) subj = "Botany";
        else if (q.path.includes("Zoology")) subj = "Zoology";
        else if (q.path.includes("Physics")) subj = "Physics";
        else if (q.path.includes("Chemistry")) subj = "Chemistry";
        else if (q.path.includes("History")) subj = "History";
        else if (q.path.includes("Geography")) subj = "Geography";
        else if (q.path.includes("Current Affairs")) subj = "Current Affairs";
        
        if (!subjectBreakdown[subj]) subjectBreakdown[subj] = { attempts: 0, correct: 0 };
        if (isAttempted) {
            subjectBreakdown[subj].attempts++;
            if (isCorrect) subjectBreakdown[subj].correct++;
        }

        if(quizState.flaggedDoubts[index]) {
            flaggedListHtml += `<div style="background:#2a2a2a; border-left:4px solid var(--primary-yellow); padding:15px; margin-bottom:15px; text-align:left;"><p style="margin-top:0;"><b>Q:</b> ${q.question}</p><p style="color:var(--text-muted); font-size:14px;"><b>Explanation:</b> ${q.explanation || 'None'}</p></div>`;
            if (currentUser) { db.collection("flagged_doubts").add({ studentId: currentUser.uid, studentName: currentUser.displayName, questionId: q.id, questionText: q.question, path: q.path, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }
        }
    });

    // Subcollection Progress Persistence
    if (sessionAttemptedIds.length > 0) {
        if (!isDailyQuiz && !quizState.isCustom) {
            let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
            await saveAttemptedIdsForPath(safePath, sessionAttemptedIds);
        } else if (quizState.isCustom) {
            let grouped = {};
            quizState.questions.forEach((q) => {
                if(sessionAttemptedIds.includes(q.id)) {
                    let safePath = "prog_" + q.path.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g, '_');
                    if(!grouped[safePath]) grouped[safePath] = [];
                    grouped[safePath].push(q.id);
                }
            });
            for (let safeP in grouped) {
                await saveAttemptedIdsForPath(safeP, grouped[safeP]);
            }
        } else if (isDailyQuiz) {
            await saveAttemptedIdsForPath("prog_daily_challenge", sessionAttemptedIds);
        }
    }

    let accuracy = attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100); 
    let timeStr = formatTime(quizState.secondsPassed); 
    let examCategory = isNeetSection ? "NEET" : "General Knowledge";
    let pathString = quizState.isCustom ? `Custom Practice - ${examCategory}` : currentPath.join(' > '); 
    let studentName = currentUser ? currentUser.displayName.split(" ")[0] : "Student";

    if (currentUser && attempted > 0 && !isDailyQuiz) { 
        db.collection("leaderboards").add({ 
            userId: currentUser.uid, 
            userName: currentUser.displayName, 
            quizPath: pathString, 
            examCategory: examCategory,
            score: totalScore, 
            accuracy: accuracy, 
            timeStr: timeStr, 
            attemptedQuestions: attempted, 
            correctCount: correctCount,
            wrongCount: wrongCount,
            subjectBreakdown: subjectBreakdown,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        }); 
    }

    let scoreCardsHtml = '';
    if (isNeetSection) {
        scoreCardsHtml = `<div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${attempted * 4}</div><div style="color: var(--text-muted); font-size: 14px;">Total Marks</div><div style="color: var(--text-muted); font-size: 11px; margin-top:5px;">(${attempted}x4)</div></div><div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1; border: 1px solid var(--primary-yellow);"><div style="font-size: 32px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div><div style="color: var(--text-muted); font-size: 14px;">Obtained Mark</div><div style="color: var(--text-muted); font-size: 11px; margin-top:5px;">(${correctCount}x4) - ${wrongCount}</div></div>`;
    } else {
        scoreCardsHtml = `<div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1; border: 1px solid var(--primary-yellow);"><div style="font-size: 32px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div><div style="color: var(--text-muted); font-size: 14px;">Total Score</div></div>`;
    }

    const mainContent = document.getElementById('dynamic-content');
    mainContent.innerHTML = `
        <div class="card page-transition" style="text-align: center;">
            <h2 style="font-size: 32px; color: var(--primary-yellow); margin-bottom: 5px;">Test Complete!</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Great effort, ${studentName}! Here is your final breakdown.</p>
            ${isDailyQuiz ? `<div style="background:rgba(253, 184, 19, 0.1); border-left:4px solid var(--primary-yellow); padding:10px; margin-bottom:20px; border-radius:4px; font-size:14px; text-align:left;"><b style="color:var(--primary-yellow);">Daily Challenge Note:</b> This score is temporary and is not added to the global leaderboard. Come back tomorrow for 20 new questions!</div>` : ''}
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap; margin-bottom: 40px;">
                ${scoreCardsHtml}
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${attempted}</div><div style="color: var(--text-muted); font-size: 14px;">Attempted</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: var(--correct-green); font-weight: bold;">${accuracy}%</div><div style="color: var(--text-muted); font-size: 14px;">Accuracy</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${timeStr}</div><div style="color: var(--text-muted); font-size: 14px;">Time Taken</div></div>
            </div>
            <h3 style="margin-top:20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); text-align: left;">📊 Detailed Analysis</h3>
            <div class="review-tabs"><button class="review-tab-btn" onclick="showReviewTab('correct')" style="color:var(--correct-green);">✅ Correct (${correctCount})</button><button class="review-tab-btn" onclick="showReviewTab('wrong')" style="color:var(--wrong-red);">❌ Wrong (${wrongCount})</button><button class="review-tab-btn" onclick="showReviewTab('skipped')" style="color:var(--primary-yellow);">⏭️ Skipped (${skippedCount})</button></div>
            <div id="review-correct" style="display:block;">${correctHtml || '<p>No correct answers.</p>'}</div>
            <div id="review-wrong" style="display:none;">${wrongHtml || '<p>No wrong answers!</p>'}</div>
            <div id="review-skipped" style="display:none;">${skippedHtml || '<p>No skipped questions.</p>'}</div>
            ${flaggedListHtml !== '' ? `<h3 style="text-align:left; color:var(--primary-yellow); margin-top: 40px;">⭐ Sent to Admin</h3>${flaggedListHtml}` : ''}
            <button class="btn-exam" onclick="window.history.back()" style="width: 250px; margin-top:30px; background:#333; border:none;">&larr; Exit to Dashboard</button>
        </div>
    `;
    
    document.querySelectorAll('.katex-render-target, .review-item').forEach(el => {
        renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
    });
}

// ==========================================
// 10. SCALED ADMIN PANEL & PAGINATION
// ==========================================
let adminCurrentTab = 'topics'; let adminNewTopicPath = []; let adminSelectedPath = []; let adminManageSelectedPath = []; 
let lastManageDoc = null;
let isFetchingManageContent = false;

function _renderAdminLogin() { 
    document.getElementById('breadcrumb-text').innerText = "Security / Admin Login"; 
    document.getElementById('dynamic-content').innerHTML = `
    <div class="card page-transition" style="max-width: 400px; margin: 0 auto; text-align: center;">
        <h2>🔒 Restricted Access</h2>
        <input type="password" id="adminPassInput" class="input-field" style="margin: 0 auto 15px auto;" placeholder="Password">
        <button id="loginBtn" class="btn-exam" onclick="verifyAdmin()" style="width: 100%; max-width: 300px; background-color: var(--primary-yellow); color: black; border: none;">Login to Admin</button>
    </div>`; 
}

async function verifyAdmin() {
    const inputPass = document.getElementById('adminPassInput').value; 
    const btn = document.getElementById('loginBtn'); 
    btn.innerText = "Verifying..."; btn.disabled = true;
    try { 
        const doc = await db.collection("settings").doc("admin_auth").get(); 
        let correctPass = "mcqs2026"; 
        if (doc.exists && doc.data().password) correctPass = doc.data().password;
        if (inputPass === correctPass) { 
            sessionStorage.setItem('admin_verified', 'true'); 
            window.location.hash = '#/admin-panel'; 
            showNotification("✅ Admin Access Granted"); 
        } else { 
            showNotification("❌ Incorrect Password"); 
        }
    } catch (e) { showNotification("❌ Verification error: " + e.message); }
    btn.innerText = "Login to Admin"; btn.disabled = false;
}

function _renderAdminPanel() {
    if (!sessionStorage.getItem('admin_verified')) { window.location.hash = '#/admin'; return; }
    document.getElementById('breadcrumb-text').innerText = "Admin Dashboard";
    
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <h2 style="color: var(--primary-yellow); margin:0;">🛠️ Admin Control Center</h2>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="admin-tab-btn ${adminCurrentTab === 'topics' ? 'active' : ''}" onclick="switchAdminTab('topics')">📁 Folders</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'upload' ? 'active' : ''}" onclick="switchAdminTab('upload')">➕ Upload</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'manage' ? 'active' : ''}" onclick="switchAdminTab('manage')">📋 Manage</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'reports' ? 'active' : ''}" onclick="switchAdminTab('reports')">🚨 Reports</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👥 Users</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'doubts' ? 'active' : ''}" onclick="switchAdminTab('doubts')">🚩 Doubts</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">⚙️ Settings</button>
                </div>
            </div>
            
            <div id="admin-upload-view" style="display:${adminCurrentTab === 'upload' ? 'block' : 'none'};">
                <div style="background: #2a2a2a; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <h4 style="margin-top:0; margin-bottom:10px;">Upload Content: Select Target Folder</h4>
                    <div id="dynamic-path-selectors" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
                    <div id="upload-path-display" style="margin-top:10px; font-size:14px; color:var(--correct-green);">
                        <b>Uploading Content To:</b> <span id="upload-path-text" style="color:white;">None</span>
                    </div>
                </div>
                <div id="upload-form-area" style="display:none;">
                    <div class="admin-row" style="margin-bottom: 25px;">
                        <span style="font-weight: bold;">Resource Type:</span>
                        <select id="admResourceType" class="input-field" onchange="toggleAdminFormType()" style="max-width: 300px;">
                            <option value="mcq">Multiple Choice Question</option>
                            <option value="pdf">Study Material (PDF / Image)</option>
                        </select>
                    </div>
                    <div id="admin-mcq-form">
                        <textarea id="admQuestion" class="input-field" style="max-width: 100%;" placeholder="Type your question here..."></textarea>
                        <div class="admin-row">
                            <div>
                                <label style="color:var(--text-muted); font-size:14px;">Attach Image (Optional):</label>
                                <input type="file" id="admQImage" class="input-field" accept="image/*">
                            </div>
                            <div>
                                <label style="color:var(--text-muted); font-size:14px;">Difficulty Level:</label>
                                <select id="admDifficulty" class="input-field">
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                    <option value="Mixed">Mixed (Default)</option>
                                </select>
                            </div>
                        </div>
                        <div class="admin-row">
                            <input type="text" id="admOptA" class="input-field" placeholder="Option A">
                            <input type="text" id="admOptB" class="input-field" placeholder="Option B">
                        </div>
                        <div class="admin-row">
                            <input type="text" id="admOptC" class="input-field" placeholder="Option C">
                            <input type="text" id="admOptD" class="input-field" placeholder="Option D">
                        </div>
                        <div class="admin-checkbox-group" style="margin-bottom: 15px;">
                            <span style="font-weight: bold; width: 140px;">Correct Answer(s):</span>
                            <label><input type="checkbox" value="A" class="admCorrectCb"> A</label>
                            <label><input type="checkbox" value="B" class="admCorrectCb"> B</label>
                            <label><input type="checkbox" value="C" class="admCorrectCb"> C</label>
                            <label><input type="checkbox" value="D" class="admCorrectCb"> D</label>
                        </div>
                        <textarea id="admExplanation" class="input-field" style="max-width: 100%; min-height: 60px;" placeholder="Explanation for the correct answer (Optional)..."></textarea>
                    </div>
                    <div id="admin-pdf-form" style="display:none; background: #2a2a2a; padding: 20px; border-radius: 8px;">
                        <input type="text" id="admPdfTitle" class="input-field" placeholder="Document Title (e.g. Chapter 1 Notes)">
                        <label style="color:white; display:block; margin-bottom:10px;">Select File (PDF or Image):</label>
                        <input type="file" id="admPdfFile" class="input-field" accept=".pdf, image/*">
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 20px; max-width: 450px;">
                        <button id="uploadBtn" class="btn-exam" onclick="processAdminUpload()" style="background-color: #4CAF50; color: white; border: none; flex: 2;">☁️ Upload to Database</button>
                        <button class="btn-exam" onclick="clearAdminUploadForm()" style="background-color: var(--wrong-red); color: white; border: none; flex: 1;">🧹 Clear Form</button>
                    </div>
                </div>
            </div>
            
            <div id="admin-topics-view" style="display:${adminCurrentTab === 'topics' ? 'block' : 'none'};">
                <div style="background: rgba(253, 184, 19, 0.05); padding: 20px; border-radius: 8px; border: 1px solid var(--primary-yellow); margin-bottom: 25px;">
                    <h4 style="margin-top:0; color:var(--primary-yellow);">📁 Create New Topic Folder</h4>
                    <label style="color:white; font-size:13px;">1. Select Parent Path:</label>
                    <div id="dynamic-new-path-selectors" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
                    <div id="new-topic-path-display" style="margin-top:10px; font-size:14px; color:var(--primary-yellow);">
                        <b>Selected Parent Path:</b> <span id="new-topic-path-text" style="color:white;">None</span>
                    </div>
                    <div class="admin-row" style="margin-top: 15px;">
                        <div>
                            <label style="color:white; font-size:13px;">2. Folder Name:</label>
                            <input type="text" id="newFolderName" class="input-field" placeholder="e.g. Molecular Genetics">
                        </div>
                        <div>
                            <label style="color:white; font-size:13px;">3. Expected Content Type:</label>
                            <select id="newFolderType" class="input-field">
                                <option value="mcq">📝 MCQs Practice</option>
                                <option value="pdf">📄 PDF / Image Material</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn-exam" onclick="createCustomTopic()" style="background-color:var(--primary-yellow); color:black; border:none; width:100%; max-width:200px;">+ Add Subtopic</button>
                </div>
                
                <h4 style="color:var(--primary-yellow); margin-top:30px;">Active Custom Folders</h4>
                <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
                    <select id="adminTopicPathFilter" class="input-field" onchange="filterAdminTopics()" style="flex:1; min-width:200px; margin-bottom:0;">
                        <option value="ALL">All Paths</option>
                    </select>
                    <input type="text" id="adminTopicSearch" class="input-field" placeholder="🔍 Search folders by name..." oninput="filterAdminTopics()" style="flex:2; min-width:200px; margin-bottom:0;">
                </div>
                <div id="admin-topic-list-container"></div>
            </div>

            <div id="admin-manage-view" style="display:${adminCurrentTab === 'manage' ? 'block' : 'none'};">
                <div style="background: #2a2a2a; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <h4 style="margin-top:0; margin-bottom:10px; color:var(--text-muted);">Filter Content by Folder (Optional)</h4>
                    <div id="manage-path-selectors" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;"></div>
                    <button class="btn-exam" onclick="loadContentForManagement(false)" style="background:var(--primary-yellow); color:black; border:none; padding:10px 15px; width:100%; max-width:250px;">🔍 Fetch Filtered Content</button>
                </div>
                <div id="manage-content-list">
                    <p style="color:var(--text-muted);">Select a folder and click Fetch to load items.</p>
                </div>
            </div>

            <div id="admin-reports-view" style="display:${adminCurrentTab === 'reports' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminReports()" style="margin-bottom:15px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Reports</button>
                <div id="reports-list-container"></div>
            </div>

            <div id="admin-users-view" style="display:${adminCurrentTab === 'users' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminUsers()" style="margin-bottom:15px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Students List</button>
                <div id="users-table-container" style="overflow-x:auto;"></div>
            </div>

            <div id="admin-doubts-view" style="display:${adminCurrentTab === 'doubts' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminDoubts()" style="margin-bottom:15px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Flagged Doubts</button>
                <div id="doubts-list-container"></div>
            </div>

            <div id="admin-settings-view" style="display:${adminCurrentTab === 'settings' ? 'block' : 'none'};">
                <div style="display:flex; gap:20px; flex-wrap:wrap;">
                    <div style="background: #2a2a2a; padding: 25px; border-radius: 6px; flex:1; min-width: 300px;">
                        <h3 style="margin-top:0; margin-bottom:20px;">Change Admin Password</h3>
                        <input type="password" id="newAdminPass" class="input-field" placeholder="Enter New Password (Min 6 chars)">
                        <input type="password" id="confirmAdminPass" class="input-field" placeholder="Confirm New Password">
                        <button class="btn-exam" onclick="changeAdminPassword()" style="background:var(--primary-yellow); color:black; border:none; width:100%;">Update Password</button>
                    </div>

                    <div style="background: #2a2a2a; padding: 25px; border-radius: 6px; flex:1; min-width: 300px; border:1px solid #444;">
                        <h3 style="margin-top:0; margin-bottom:10px; color:var(--correct-green);">⚡ Database Scalability Tool</h3>
                        <p style="color:var(--text-muted); font-size:13px; line-height:1.5; margin-bottom:20px;">
                            Batch indexes existing MCQs with <code>randomKey</code> attributes so the quiz engine can perform sub-second random selections at scale.
                        </p>
                        <button id="btnMigrateKeys" class="btn-exam" onclick="runRandomKeyMigration()" style="background:#4CAF50; color:white; border:none; width:100%;">⚡ Index MCQs with Random Keys</button>
                    </div>
                </div>
            </div>
        </div>`;
        
    if (adminCurrentTab === 'upload') { _buildAdminSelectors(); }
    else if (adminCurrentTab === 'topics') { _buildAdminNewTopicSelectors(); loadAdminTopicsList(); }
    else if (adminCurrentTab === 'manage') { _buildManageSelectors(); loadContentForManagement(false); }
    else if (adminCurrentTab === 'reports') loadAdminReports();
    else if (adminCurrentTab === 'users') loadAdminUsers();
    else if (adminCurrentTab === 'doubts') loadAdminDoubts();
}

function switchAdminTab(tab) { adminCurrentTab = tab; _renderAdminPanel(); }

function toggleAdminFormType() {
    let val = document.getElementById('admResourceType').value;
    document.getElementById('admin-mcq-form').style.display = val === 'mcq' ? 'block' : 'none';
    document.getElementById('admin-pdf-form').style.display = val === 'pdf' ? 'block' : 'none';
}

function clearAdminUploadForm() {
    if(!confirm("Are you sure you want to clear all typed fields?")) return;
    document.getElementById('admQuestion').value = ""; document.getElementById('admQImage').value = ""; document.getElementById('admExplanation').value = "";
    document.getElementById('admOptA').value = ""; document.getElementById('admOptB').value = ""; document.getElementById('admOptC').value = ""; document.getElementById('admOptD').value = "";
    document.querySelectorAll('.admCorrectCb').forEach(cb => cb.checked = false); document.getElementById('admPdfTitle').value = ""; document.getElementById('admPdfFile').value = ""; document.getElementById('admDifficulty').value = "Mixed";
    showNotification("🧹 Form cleared!");
}

let globalTopicsData = [];
async function loadAdminTopicsList() {
    const container = document.getElementById('admin-topic-list-container'); 
    container.innerHTML = `<p>Loading folders...</p>`;
    try {
        const snap = await db.collection("custom_topics").get();
        globalTopicsData = [];
        snap.forEach(doc => globalTopicsData.push({ id: doc.id, ...doc.data() }));
        globalTopicsData.sort((a,b) => (a.parentPath || "").localeCompare(b.parentPath || ""));
        
        let paths = [...new Set(globalTopicsData.map(t => t.parentPath))].sort();
        let filterDropdown = document.getElementById('adminTopicPathFilter');
        if (filterDropdown) {
            filterDropdown.innerHTML = `<option value="ALL">All Paths</option>` + paths.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        
        renderAdminTopicsList(globalTopicsData);
    } catch(e) { container.innerHTML = `<p>Error: ${e.message}</p>`; }
}

function renderAdminTopicsList(topicsArray) {
    const container = document.getElementById('admin-topic-list-container');
    if(topicsArray.length === 0) { container.innerHTML = `<p>No custom folders found matching criteria.</p>`; return; }
    let html = '';
    topicsArray.forEach(d => {
        let cleanName = d.name.replace(/'/g, "\\'");
        html += `
        <div style="background:#2a2a2a; border:1px solid #444; border-radius:6px; padding:12px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 10px;">
            <div>
                <span style="color:var(--text-muted); font-size:12px;">Path: ${d.parentPath}</span><br>
                <b style="font-size:16px;">📁 ${d.name}</b> <span style="font-size:11px; background:#444; padding:2px 6px; border-radius:4px;">${d.type}</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="openEditTopicModal('${d.id}', '${cleanName}', '${d.type}')" style="background:#2196F3; border:none; color:white; padding:6px 12px; border-radius:4px; cursor:pointer;">Edit</button>
                <button onclick="deleteCustomTopic('${d.id}')" style="background:var(--wrong-red); border:none; color:white; padding:6px 12px; border-radius:4px; cursor:pointer;">Delete</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function filterAdminTopics() {
    let q = document.getElementById('adminTopicSearch').value.toLowerCase();
    let pathFilter = document.getElementById('adminTopicPathFilter') ? document.getElementById('adminTopicPathFilter').value : 'ALL';
    
    let filtered = globalTopicsData.filter(t => {
        let matchesSearch = t.name.toLowerCase().includes(q) || t.parentPath.toLowerCase().includes(q);
        let matchesPath = pathFilter === 'ALL' || t.parentPath === pathFilter;
        return matchesSearch && matchesPath;
    });
    renderAdminTopicsList(filtered);
}

function openEditTopicModal(id, name, type) {
    document.getElementById('editTopicId').value = id;
    document.getElementById('editTopicName').value = name;
    document.getElementById('editTopicType').value = type;
    document.getElementById('editTopicModal').style.display = 'flex';
}

function closeEditTopicModal() { document.getElementById('editTopicModal').style.display = 'none'; }

async function saveEditedTopic() {
    let id = document.getElementById('editTopicId').value;
    let name = document.getElementById('editTopicName').value.trim();
    let type = document.getElementById('editTopicType').value;
    if(!name) return alert("Folder name is required.");
    try {
        await db.collection("custom_topics").doc(id).update({ name: name, type: type });
        closeEditTopicModal(); showNotification("✅ Folder updated!");
        loadAdminTopicsList(); await loadCustomTopics();
    } catch(e) { alert("Error: " + e.message); }
}

async function deleteCustomTopic(docId) {
    if(!confirm("Are you sure? This will remove the folder from the app menu (Note: MCQs inside it won't be deleted).")) return;
    try { await db.collection("custom_topics").doc(docId).delete(); showNotification("✅ Folder deleted"); loadAdminTopicsList(); await loadCustomTopics(); } catch(e){}
}

function _buildAdminNewTopicSelectors() {
    const container = document.getElementById('dynamic-new-path-selectors'); 
    if (!container) return;
    
    let html = ''; 
    let currentObj = appData;
    
    for (let i = 0; i <= adminNewTopicPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        
        if (currentObj && typeof currentObj === 'object' && Object.keys(currentObj).length === 0 && i === adminNewTopicPath.length) break;
        
        html += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminNewTopicPathChange(event, ${i})">`;
        html += `<option value="">-- Stop Here / Select Child --</option>`;
        
        for (let key in currentObj) { 
            if (key === "Daily Quiz Challenge") continue; 
            let selected = (adminNewTopicPath[i] === key) ? 'selected' : '';
            html += `<option value="${key}" ${selected}>${key}</option>`; 
        }
        html += `</select>`;
        
        if (adminNewTopicPath[i] && currentObj[adminNewTopicPath[i]]) { 
            currentObj = currentObj[adminNewTopicPath[i]]; 
        } else { 
            break; 
        }
    }
    container.innerHTML = html;
    
    let pathTextSpan = document.getElementById('new-topic-path-text');
    if (pathTextSpan) {
        pathTextSpan.innerText = adminNewTopicPath.length > 0 ? adminNewTopicPath.join(' > ') : 'Root (Please select at least one)';
    }
}

function handleAdminNewTopicPathChange(event, depth) {
    const val = event.target.value;
    if (val === "") {
        adminNewTopicPath = adminNewTopicPath.slice(0, depth);
    } else {
        adminNewTopicPath = adminNewTopicPath.slice(0, depth);
        adminNewTopicPath.push(val);
    }
    _buildAdminNewTopicSelectors(); 
}
        
async function createCustomTopic() {
    if (adminNewTopicPath.length === 0) {
        showNotification("⚠️ Please select a parent path.");
        return;
    }
    const folderNameInput = document.getElementById('newFolderName');
    const folderName = folderNameInput.value.trim();
    if (!folderName) {
        showNotification("⚠️ Folder name is required.");
        return;
    }
    const folderType = document.getElementById('newFolderType').value;
    
    try {
        const fullPath = adminNewTopicPath.join(' > ');
        await db.collection("custom_topics").add({ 
            parentPath: fullPath, 
            name: folderName, 
            type: folderType, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        showNotification("✅ Subtopic Created Successfully!"); 
        folderNameInput.value = ""; 
        await loadCustomTopics(); 
        _buildAdminNewTopicSelectors(); 
        loadAdminTopicsList();
    } catch(error) { 
        alert("⚠️ ERROR: " + error.message); 
    }
}

function _buildAdminSelectors() {
    const container = document.getElementById('dynamic-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminSelectedPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        if (currentObj && typeof currentObj === 'object' && Object.keys(currentObj).length === 0 && i === adminSelectedPath.length) break;
        html += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminPathChange(event, ${i})"><option value="" ${!adminSelectedPath[i] ? 'selected' : ''}>-- Upload Here / Select Child --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminSelectedPath[i] && currentObj[adminSelectedPath[i]]) { currentObj = currentObj[adminSelectedPath[i]]; } else { break; }
    }
    container.innerHTML = html;
    const formArea = document.getElementById('upload-form-area'); if(formArea) formArea.style.display = (adminSelectedPath.length > 0) ? 'block' : 'none';
    
    let uploadTextSpan = document.getElementById('upload-path-text');
    if (uploadTextSpan) {
        uploadTextSpan.innerText = adminSelectedPath.length > 0 ? adminSelectedPath.join(' > ') : 'Please select at least one path';
    }
}

function handleAdminPathChange(event, depth) { 
    if (event.target.value === "") adminSelectedPath = adminSelectedPath.slice(0, depth);
    else { adminSelectedPath = adminSelectedPath.slice(0, depth); adminSelectedPath.push(event.target.value); }
    _buildAdminSelectors(); 
}

function _buildManageSelectors() {
    const container = document.getElementById('manage-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminManageSelectedPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        html += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleManagePathChange(event, ${i})"><option value="" ${!adminManageSelectedPath[i] ? 'selected' : ''}>-- All --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminManageSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminManageSelectedPath[i] && currentObj[adminManageSelectedPath[i]]) { currentObj = currentObj[adminManageSelectedPath[i]]; } else { break; }
    }
    container.innerHTML = html;
}

function handleManagePathChange(event, depth) {
    if(event.target.value === "") adminManageSelectedPath = adminManageSelectedPath.slice(0, depth);
    else { adminManageSelectedPath = adminManageSelectedPath.slice(0, depth); adminManageSelectedPath.push(event.target.value); }
    _buildManageSelectors();
}

async function uploadFileToCloudinary(file) {
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_PRESET);
    const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'File upload failed');
    return data.secure_url;
}

async function processAdminUpload() {
    const type = document.getElementById('admResourceType').value; 
    const targetPathString = adminSelectedPath.join(' > '); 
    const btn = document.getElementById('uploadBtn'); 
    btn.innerText = "Uploading... Please wait"; btn.disabled = true;

    try {
        if (type === 'mcq') {
            const question = document.getElementById('admQuestion').value.trim();
            const options = { A: document.getElementById('admOptA').value.trim(), B: document.getElementById('admOptB').value.trim(), C: document.getElementById('admOptC').value.trim(), D: document.getElementById('admOptD').value.trim() };
            const correctCbs = document.querySelectorAll('.admCorrectCb:checked'); let correctAnswers = Array.from(correctCbs).map(cb => cb.value);
            const explanation = document.getElementById('admExplanation').value.trim(); const imageFile = document.getElementById('admQImage').files[0];
            const level = document.getElementById('admDifficulty').value;
            if (!question || !options.A || !options.B || correctAnswers.length === 0) throw new Error("Question, Option A, Option B, and Correct Answer are required.");
            let imageUrl = null; if (imageFile) imageUrl = await uploadFileToCloudinary(imageFile); 
            
            let randomKey = Math.random();

            await db.collection("content").add({ 
                type: 'mcq', 
                path: targetPathString, 
                level: level, 
                question: question, 
                options: options, 
                correctAnswers: correctAnswers, 
                explanation: explanation, 
                imageUrl: imageUrl, 
                randomKey: randomKey,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            });
            clearAdminUploadForm();
        } else if (type === 'pdf') {
            const title = document.getElementById('admPdfTitle').value.trim(); const file = document.getElementById('admPdfFile').files[0];
            if (!title || !file) throw new Error("Title and File are required for Study Materials.");
            const fileUrl = await uploadFileToCloudinary(file);
            await db.collection("content").add({ type: 'material', path: targetPathString, title: title, fileUrl: fileUrl, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            document.getElementById('admPdfTitle').value = ""; document.getElementById('admPdfFile').value = "";
        }
        showNotification("✅ Upload Successful!");
    } catch(error) { alert("⚠️ ERROR: " + error.message); }
    btn.innerText = "☁️ Upload to Database"; btn.disabled = false;
}

let loadedItemsCache = {};
async function loadContentForManagement(isNextPage = false) {
    if (isFetchingManageContent) return;
    const listEl = document.getElementById('manage-content-list'); 

    if (!isNextPage) {
        listEl.innerHTML = `<p style="color:var(--primary-yellow);">Fetching items from database...</p>`;
        loadedItemsCache = {};
        lastManageDoc = null;
    } else {
        const loadMoreBtn = document.getElementById('btn-load-more-manage');
        if (loadMoreBtn) { loadMoreBtn.innerText = "Loading more..."; loadMoreBtn.disabled = true; }
    }
    isFetchingManageContent = true;

    try {
        let query = db.collection("content");
        if (adminManageSelectedPath.length > 0) { 
            const prefixPath = adminManageSelectedPath.join(' > '); 
            query = query.where("path", ">=", prefixPath).where("path", "<=", prefixPath + "\uf8ff"); 
        } else { 
            query = query.orderBy("timestamp", "desc"); 
        }

        if (isNextPage && lastManageDoc) {
            query = query.startAfter(lastManageDoc);
        }

        query = query.limit(20);
        const snapshot = await query.get();

        if (snapshot.empty) {
            if (!isNextPage) {
                listEl.innerHTML = `<p style="color:var(--text-muted);">No items found in this folder.</p>`;
            } else {
                const loadMoreBtn = document.getElementById('btn-load-more-manage');
                if (loadMoreBtn) { loadMoreBtn.innerText = "No more items to load"; loadMoreBtn.disabled = true; }
            }
            isFetchingManageContent = false;
            return;
        }

        lastManageDoc = snapshot.docs[snapshot.docs.length - 1];

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data(); 
            loadedItemsCache[doc.id] = data;
            if (data.type === 'mcq') {
                let answersStr = (data.correctAnswers || []).join(', ');
                let lvlBadge = data.level ? `<span style="margin-left:10px; background:#444; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">${data.level}</span>` : '';
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#252525; border:1px solid #333; border-radius:8px; padding:15px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${data.path || 'Uncategorized'}</span>${lvlBadge}<div style="display:flex; gap:8px;"><button class="btn-exam" onclick="openEditModal('${doc.id}')" style="padding:4px 10px; font-size:12px; background:#2196F3; border:none;">✏️ Edit</button><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:4px 10px; font-size:12px; background:var(--wrong-red); border:none;">🗑️ Delete</button></div></div><div style="font-weight:bold; margin-bottom:8px;">${data.question}</div>${data.imageUrl ? `<img src="${data.imageUrl}" style="max-height:80px; border-radius:4px; margin-bottom:8px; display:block;">` : ''}<div style="font-size:13px; color:var(--text-muted); line-height:1.4;">A: ${data.options?.A || '-'} | B: ${data.options?.B || '-'} | C: ${data.options?.C || '-'} | D: ${data.options?.D || '-'}</div><div style="margin-top:6px; font-size:13px; color:var(--correct-green);">Correct: ${answersStr}</div></div>`;
            } else {
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#252525; border:1px solid #333; border-radius:8px; padding:15px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${data.path || 'Uncategorized'}</span><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:4px 10px; font-size:12px; background:var(--wrong-red); border:none;">🗑️ Delete</button></div><div style="font-weight:bold; margin-bottom:5px;">📄 ${data.title}</div><a href="${data.fileUrl}" target="_blank" style="color:var(--primary-yellow); font-size:13px;">View Document &rarr;</a></div>`;
            }
        });

        const oldLoadBtn = document.getElementById('load-more-manage-container');
        if (oldLoadBtn) oldLoadBtn.remove();

        const loadMoreHtml = snapshot.docs.length >= 20 ? `
            <div id="load-more-manage-container" style="text-align:center; margin-top:20px; margin-bottom:10px;">
                <button id="btn-load-more-manage" class="btn-exam" onclick="loadContentForManagement(true)" style="background:#333; border:1px solid #555; width:220px; font-size:14px;">📄 Load More (20)</button>
            </div>` : '';

        if (!isNextPage) {
            let titleMsg = adminManageSelectedPath.length > 0 ? `<p style="color:white; font-size:14px; margin-bottom:15px;">Showing results for: <b>${adminManageSelectedPath.join(' > ')}</b></p>` : `<p style="color:white; font-size:14px; margin-bottom:15px;">Showing recent uploads (Page 1):</p>`;
            listEl.innerHTML = titleMsg + `<div id="manage-items-list-body">${html}</div>` + loadMoreHtml;
        } else {
            document.getElementById('manage-items-list-body').insertAdjacentHTML('beforeend', html);
            listEl.insertAdjacentHTML('beforeend', loadMoreHtml);
        }
    } catch(e) { listEl.innerHTML = `<p style="color:var(--wrong-red);">Error loading items: ${e.message}</p>`; }
    isFetchingManageContent = false;
}

async function runRandomKeyMigration() {
    if(!confirm("This will scan un-indexed MCQs in the database and assign a randomKey so the quiz engine can perform random selections at scale. Proceed?")) return;
    const btn = document.getElementById('btnMigrateKeys');
    if (btn) { btn.innerText = "Indexing in progress..."; btn.disabled = true; }
    try {
        let snap = await db.collection("content").where("type", "==", "mcq").limit(400).get();
        let batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            if (doc.data().randomKey === undefined) {
                batch.update(doc.ref, { randomKey: Math.random() });
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
            showNotification(`✅ Successfully indexed ${count} MCQs with random keys!`);
        } else {
            showNotification("✅ All scanned MCQs are already indexed!");
        }
    } catch(e) {
        showNotification("❌ Migration error: " + e.message);
    }
    if (btn) { btn.innerText = "⚡ Index MCQs with Random Keys"; btn.disabled = false; }
}

async function deleteContentItem(docId) {
    if(!confirm("Are you sure you want to permanently delete this item?")) return;
    try { await db.collection("content").doc(docId).delete(); document.getElementById("item_" + docId).remove(); showNotification("🗑️ Item deleted successfully!"); } 
    catch(e) { showNotification("❌ Delete failed: " + e.message); }
}

function openEditModal(docId) {
    const data = loadedItemsCache[docId]; if(!data) return;
    document.getElementById('editDocId').value = docId; document.getElementById('editQuestion').value = data.question || '';
    document.getElementById('editOptA').value = data.options?.A || ''; document.getElementById('editOptB').value = data.options?.B || '';
    document.getElementById('editOptC').value = data.options?.C || ''; document.getElementById('editOptD').value = data.options?.D || '';
    document.getElementById('editExplanation').value = data.explanation || '';
    if(data.level) document.getElementById('editDifficulty').value = data.level; else document.getElementById('editDifficulty').value = 'Mixed';
    const correct = data.correctAnswers || [];
    document.querySelectorAll('.editCorrectCb').forEach(cb => { cb.checked = correct.includes(cb.value); });
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

async function saveEditedMCQ() {
    const docId = document.getElementById('editDocId').value;
    const question = document.getElementById('editQuestion').value.trim();
    const options = { A: document.getElementById('editOptA').value.trim(), B: document.getElementById('editOptB').value.trim(), C: document.getElementById('editOptC').value.trim(), D: document.getElementById('editOptD').value.trim() };
    const correctAnswers = Array.from(document.querySelectorAll('.editCorrectCb:checked')).map(cb => cb.value);
    const explanation = document.getElementById('editExplanation').value.trim();
    const level = document.getElementById('editDifficulty').value;

    if(!question || !options.A || !options.B || correctAnswers.length === 0) { alert("Question, Options A/B, and Correct Answer required."); return; }
    try {
        let updatePayload = { question: question, options: options, correctAnswers: correctAnswers, explanation: explanation, level: level };
        if (loadedItemsCache[docId] && loadedItemsCache[docId].randomKey === undefined) {
            updatePayload.randomKey = Math.random();
        }
        await db.collection("content").doc(docId).update(updatePayload);
        closeEditModal(); showNotification("✅ Changes saved!"); loadContentForManagement(false);
    } catch(e) { showNotification("❌ Update failed: " + e.message); }
}

async function changeAdminPassword() {
    const p1 = document.getElementById('newAdminPass').value; const p2 = document.getElementById('confirmAdminPass').value;
    if(p1.length < 6) { showNotification("⚠️ Password must be at least 6 characters."); return; }
    if(p1 !== p2) { showNotification("❌ Passwords do not match!"); return; }
    try { await db.collection("settings").doc("admin_auth").set({ password: p1 }); document.getElementById('newAdminPass').value = ""; document.getElementById('confirmAdminPass').value = ""; showNotification("✅ Password changed successfully!"); } 
    catch(e) { showNotification("❌ Error updating password: " + e.message); }
}

async function loadAdminReports() {
    const container = document.getElementById('reports-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching reported mistakes...</p>`;
    try {
        const snapshot = await db.collection("reported_mistakes").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<p style='color:var(--correct-green);'>✅ No mistakes reported! Everything is clean.</p>"; return; }
        
        let html = '';
        items.forEach(data => {
            let stat = data.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 8px; border-radius:12px; font-size:12px;">✅ Resolved</span>` : `<span style="background:#555; color:white; padding:2px 8px; border-radius:12px; font-size:12px;">⏳ Pending</span>`;
            html += `<div class="content-item-card" style="border-left: 4px solid var(--wrong-red); background:#252525; padding:15px; margin-bottom:15px; border-radius:8px;"><div class="content-item-header"><span class="badge-path">${data.path || 'Unknown Path'}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="margin: 10px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 4px; display:flex; justify-content:space-between;"><div><p style="color:var(--wrong-red); margin:0 0 5px 0;"><b>Issue:</b> ${data.reason}</p><p style="margin:0; font-size:14px;"><b>Details:</b> ${data.description || 'No description provided.'}</p></div>${stat}</div><p style="margin:5px 0 10px 0; font-size:12px; color:var(--text-muted);">Reported by: ${data.studentName}</p><div style="background:#1a1a1a; padding:10px; border-radius:4px; font-size:14px; margin:10px 0;"><b>Question Content:</b><br>${data.questionText}</div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button onclick="openEditModalFromReport('${data.questionId}')" style="padding:6px 12px; background:#2196F3; border:none; border-radius:4px; color:white; cursor:pointer;">✏️ Edit MCQ in Database</button><button onclick="resolveReport('${data.id}')" style="padding:6px 12px; background:var(--correct-green); border:none; border-radius:4px; color:white; cursor:pointer;" ${data.status==='resolved'?'disabled':''}>✅ Mark Resolved (Notifies User)</button></div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function resolveReport(reportDocId) {
    if(confirm("Mark this report as resolved? The student will be notified.")) { 
        await db.collection("reported_mistakes").doc(reportDocId).update({status: 'resolved', seenByStudent: false}); 
        loadAdminReports(); showNotification("✅ Report marked as resolved."); 
    }
}

async function openEditModalFromReport(questionId) {
    try {
        let doc = await db.collection("content").doc(questionId).get();
        if (doc.exists) { loadedItemsCache[questionId] = doc.data(); openEditModal(questionId); } 
        else { showNotification("❌ This question no longer exists in the database."); }
    } catch (e) { showNotification("❌ Error fetching question: " + e.message); }
}

async function loadAdminUsers() {
    const container = document.getElementById('users-table-container'); 
    container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching students and feedback...</p>`;
    try {
        const feedbackSnap = await db.collection("platform_feedback").limit(100).get();
        let feedbacks = {};
        feedbackSnap.forEach(doc => {
            let d = doc.data();
            feedbacks[d.studentId] = { rating: d.rating, feedback: d.feedback };
        });

        const snapshot = await db.collection("users").orderBy("lastLogin", "desc").limit(100).get();
        let html = `<table style="width:100%; text-align:left;"><tr><th>Name</th><th>Email</th><th>Last Login</th><th>Rating</th><th>Feedback</th></tr>`;
        snapshot.forEach(doc => { 
            let d = doc.data();
            let uid = doc.id;
            let fb = feedbacks[uid] || { rating: '-', feedback: '-' };
            let stars = fb.rating !== '-' ? '⭐'.repeat(fb.rating) : '-';
            html += `<tr>
                <td>${d.displayName || 'Unknown'}</td>
                <td>${d.email || '-'}</td>
                <td>${d.lastLogin ? d.lastLogin.toDate().toLocaleString() : "Unknown"}</td>
                <td style="color:var(--primary-yellow);">${stars}</td>
                <td style="max-width:200px; font-size:13px; color:var(--text-muted);">${fb.feedback}</td>
            </tr>`; 
        });
        container.innerHTML = html + `</table>`;
    } catch(e) { container.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function loadAdminDoubts() {
    const container = document.getElementById('doubts-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching doubts...</p>`;
    try {
        const snapshot = await db.collection("flagged_doubts").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<p>No flagged questions!</p>"; return; }
        
        let html = '';
        items.forEach(data => { 
            let stat = data.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 8px; border-radius:12px; font-size:12px;">✅ Reviewed</span>` : `<span style="background:#555; color:white; padding:2px 8px; border-radius:12px; font-size:12px;">⏳ Pending</span>`;
            html += `<div class="content-item-card" style="background:#252525; padding:15px; margin-bottom:15px; border-radius:8px;"><div class="content-item-header"><span class="badge-path">${data.path}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="display:flex; justify-content:space-between; margin-top:10px;"><p style="color:var(--primary-yellow); margin:5px 0;"><b>Flagged by:</b> ${data.studentName}</p>${stat}</div><div style="background:#1a1a1a; padding:10px; border-radius:4px; font-size:14px; margin:10px 0;">${data.questionText}</div><button onclick="resolveDoubt('${data.id}')" style="margin-top:10px; padding:5px 10px; background:var(--correct-green); border:none; border-radius:4px; color:white; cursor:pointer;" ${data.status==='resolved'?'disabled':''}>Mark Reviewed (Notifies User)</button></div>`; 
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function resolveDoubt(docId) { 
    if(confirm("Mark this doubt as reviewed? Student will be notified.")) { 
        await db.collection("flagged_doubts").doc(docId).update({status: 'resolved', seenByStudent: false}); 
        loadAdminDoubts(); 
    } 
}
