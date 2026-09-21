const firebaseConfig = { apiKey: "AIzaSyDuletjxV1THjWvWLvO0XqB_z5xBBXLwL8", authDomain: "mcqsprep.firebaseapp.com", projectId: "mcqsprep", storageBucket: "mcqsprep.firebasestorage.app", messagingSenderId: "920181103186", appId: "1:920181103186:web:14c2ba261d4a6163db5d8b" };
firebase.initializeApp(firebaseConfig); const db = firebase.firestore(); const auth = firebase.auth(); const provider = new firebase.auth.GoogleAuthProvider();
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; const CLOUDINARY_PRESET = "mcq_uploads";
const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

let appData = { "Daily Quiz Challenge": { "NEET": {}, "General Knowledge": {} }, "NEET": { "NCERT Book": {}, "PYQs": {}, "Practice Paper": {}, "MCQs Practice": { "Botany": {}, "Zoology": {}, "Physics": {}, "Organic Chemistry": {}, "Physical Chemistry": {}, "Inorganic Chemistry": {} }, "Mock Test": {} }, "General Knowledge": { "Current Affairs": {}, "History": {}, "Geography": {} } };
let customTopicTypes = {};

async function loadCustomTopics() {
    customTopicTypes = {};
    try {
        const snapshot = await db.collection("custom_topics").orderBy("timestamp").get();
        snapshot.forEach(doc => {
            let data = doc.data(); let pathArr = data.parentPath.split(' > '); let current = appData;
            for (let p of pathArr) { if (!current[p]) current[p] = {}; current = current[p]; }
            if (typeof current === 'object' && !Array.isArray(current)) {
                if (!current[data.name]) current[data.name] = {}; let fullPath = data.parentPath + " > " + data.name; customTopicTypes[fullPath] = data.type; 
            }
        });
    } catch(e) { console.error(e); }
}

let currentUser = null; let currentPath = []; let dataLoaded = false; 

function showAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function skipSignIn() { sessionStorage.setItem('auth_skipped', 'true'); document.getElementById('authModal').style.display = 'none'; }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('active'); }
window.addEventListener('click', function(e) { if (!document.getElementById('userBadge').contains(e.target) && !document.getElementById('profileMenu').contains(e.target)) { let menu = document.getElementById('profileMenu'); if (menu) menu.classList.remove('active'); } });

// INITIALIZE APP
async function initApp() {
    await loadCustomTopics();
    dataLoaded = true;
    if (!window.location.hash) window.location.hash = '#/home';
    handleRouting();
}

auth.onAuthStateChanged((user) => {
    currentUser = user; const badge = document.getElementById('userBadge'); const loginNavBtn = document.getElementById('loginNavBtn');
    if (user) {
        document.getElementById('userNameDisplay').innerText = user.displayName.split(" ")[0];
        if(user.photoURL) { document.getElementById('userPhotoDisplay').src = user.photoURL; document.getElementById('userPhotoDisplay').style.display = 'block'; }
        badge.style.display = 'flex'; loginNavBtn.style.display = 'none'; document.getElementById('authModal').style.display = 'none';
        db.collection("users").doc(user.uid).set({ displayName: user.displayName, email: user.email, photoURL: user.photoURL, lastLogin: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        checkUserNotifications();
    } else {
        badge.style.display = 'none'; loginNavBtn.style.display = 'flex'; document.getElementById('profileNotifDot').style.display = 'none';
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) { document.getElementById('authModal').style.display = 'flex'; }
    }
    if (dataLoaded) handleRouting(); 
});

initApp(); 

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => { showNotification("❌ Sign-in Error: " + err.message); }); }
function signOut() { if(confirm("Are you sure you want to sign out?")) auth.signOut(); }

window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    try {
        if(!dataLoaded) return; 
        let hash = decodeURIComponent(window.location.hash.replace('#/', ''));
        let isRootHome = (!hash || hash === 'home');
        
        document.getElementById('main-sidebar').style.display = isRootHome ? 'block' : 'none';

        if (!hash || hash === 'home') { currentPath = []; _renderView(); } 
        else if (hash.startsWith('path/')) { currentPath = hash.replace('path/', '').split('/'); _renderView(); } 
        else if (hash === 'leaderboard') { _renderLeaderboardOptions(); } 
        else if (hash.startsWith('board/')) { fetchLiveLeaderboard(hash.replace('board/', '')); } 
        else if (hash === 'quiz') { _initiateQuizEngine(); }
        else if (hash === 'progress') { _renderProgress(); }
        else if (hash === 'streak') { _renderStreak(); }
        else if (hash === 'diary') { _renderDoubtDiary(); }
        else if (hash === 'admin') { _renderAdminLogin(); }
        else if (hash === 'admin-panel') { _renderAdminPanel(); }
    } catch (err) {
        console.error("Routing Error:", err);
    }
}

function goHome() { window.location.hash = '#/home'; }
function navigateTo(key) { window.location.hash = '#/path/' + [...currentPath, key].join('/'); }
function jumpToSection(pathArray) { window.location.hash = '#/path/' + pathArray.join('/'); }
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }
function goBack() { window.history.back(); }

// --- STREAK LOGIC ---
let activeTime = 0; let streakLogged = false;
setInterval(() => { 
    let todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (currentUser && !localStorage.getItem('streak_' + todayStr)) { 
        activeTime++; 
        if (activeTime >= 300) { 
            localStorage.setItem('streak_' + todayStr, 'true');
            logStreakActivity(todayStr); 
        } 
    } 
}, 1000);

async function logStreakActivity(todayStr) {
    try { 
        await db.collection("users").doc(currentUser.uid).set({ activeDates: firebase.firestore.FieldValue.arrayUnion(todayStr) }, { merge: true }); 
        showNotification("🔥 Daily Streak Updated! (+1)"); 
    } catch(e) {}
}

function calculateStreak(datesArray) {
    if (!datesArray || datesArray.length === 0) return 0;
    let sorted = [...new Set(datesArray)].sort().reverse(); 
    let todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    let yDate = new Date(); yDate.setDate(yDate.getDate() - 1);
    let yesterdayStr = new Date(yDate.getTime() - (yDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) return 0;
    let streak = 0; let currDate = new Date();
    if (!sorted.includes(todayStr)) currDate.setDate(currDate.getDate() - 1); 
    for(let i=0; i<365; i++) {
        let dStr = new Date(currDate.getTime() - (currDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (sorted.includes(dStr)) { streak++; currDate.setDate(currDate.getDate() - 1); } else break;
    }
    return streak;
}

async function _renderStreak() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Streak";
    const mc = document.getElementById('dynamic-content'); mc.innerHTML = `<div class="card"><h2>🔥 Fetching Streak...</h2></div>`;
    try {
        let doc = await db.collection("users").doc(currentUser.uid).get();
        let dates = doc.exists ? (doc.data().activeDates || []) : [];
        let streak = calculateStreak(dates);
        let datesHtml = `<ul style="list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:10px;">`;
        [...new Set(dates)].sort().reverse().slice(0, 14).forEach(d => { datesHtml += `<li style="background:#2a2a2a; padding:8px 12px; border-radius:6px; border:1px solid var(--correct-green); color:var(--correct-green); font-weight:bold;">✅ ${d}</li>`; });
        datesHtml += `</ul>`;
        mc.innerHTML = `<div class="card" style="text-align:center;"><h2 style="color:var(--primary-yellow);">🔥 Daily Streak</h2><div style="font-size: 80px; margin: 20px 0;">🔥</div><div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">${streak} Day${streak !== 1 ? 's' : ''}</div><p style="color:var(--text-muted); font-size:14px; margin-bottom:30px;"><i>Spend at least 5 minutes practicing daily to maintain your streak!</i></p>${dates.length > 0 ? datesHtml : ''}<button class="btn-exam" onclick="goBack()" style="margin-top:20px;">Back</button></div>`;
    } catch(e) {}
}

// --- TRACK PROGRESS ---
async function _renderProgress() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    const mc = document.getElementById('dynamic-content'); mc.innerHTML = `<div class="card"><h2>📊 Fetching Progress...</h2></div>`;
    try {
        const snap = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get();
        let totalScore = 0; let totalQuestions = 0; let testCount = 0; let accuracySum = 0;
        snap.forEach(doc => {
            let data = doc.data(); totalScore += (data.score || 0); totalQuestions += (data.attemptedQuestions || 0);
            accuracySum += (data.accuracy || 0); testCount++;
        });
        let avgAccuracy = testCount > 0 ? Math.round(accuracySum / testCount) : 0;
        
        mc.innerHTML = `
        <div class="card">
            <h2 style="color:var(--primary-yellow);">📊 Overall Progress</h2>
            <div style="display:flex; gap:15px; flex-wrap:wrap; margin-top:20px;">
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align:center; border:1px solid var(--border-color);"><div style="font-size: 32px; color: white; font-weight: bold;">${testCount}</div><div style="color: var(--text-muted); font-size: 14px;">Total Quizzes Taken</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align:center; border:1px solid var(--border-color);"><div style="font-size: 32px; color: var(--correct-green); font-weight: bold;">${avgAccuracy}%</div><div style="color: var(--text-muted); font-size: 14px;">Avg. Accuracy</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; flex: 1; min-width: 150px; text-align:center; border:1px solid var(--primary-yellow);"><div style="font-size: 32px; color: var(--primary-yellow); font-weight: bold;">${totalQuestions}</div><div style="color: var(--text-muted); font-size: 14px;">Questions Solved</div></div>
            </div>
            <button class="btn-exam" onclick="goBack()" style="margin-top:30px;">Back</button>
        </div>`;
    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

// --- NOTIFICATIONS & REPORTS ---
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
    const reason = document.getElementById('reportReason').value; const desc = document.getElementById('reportDescription').value;
    const btn = document.querySelector('#reportModal .btn-exam'); btn.innerText = "Submitting..."; btn.disabled = true;
    try {
        await db.collection("reported_mistakes").add({
            studentId: currentUser.uid, studentName: currentUser.displayName,
            questionId: tempReportTarget.id, questionText: tempReportTarget.text, path: tempReportTarget.path,
            reason: reason, description: desc, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("✅ Report submitted to admins!"); closeReportModal();
        document.getElementById('reportDescription').value = "";
    } catch(e) { showNotification("❌ Error: " + e.message); }
    btn.innerText = "Submit Report"; btn.disabled = false;
}

async function openUserReportsModal() {
    if(!currentUser) return;
    document.getElementById('userReportsModal').style.display = 'flex';
    document.getElementById('profileNotifDot').style.display = 'none'; document.getElementById('reportMenuDot').style.display = 'none';
    const list = document.getElementById('user-reports-list'); 
    list.innerHTML = `<p style="color:var(--primary-yellow);">Loading reports...</p>`;
    
    try {
        let html = ''; let count = 0; let allItems = [];
        
        let reportsSnap = await db.collection("reported_mistakes").where("studentId", "==", currentUser.uid).get();
        reportsSnap.forEach(doc => { allItems.push({ _id: doc.id, _type: 'report', ...doc.data() }); });
        
        let flagsSnap = await db.collection("flagged_doubts").where("studentId", "==", currentUser.uid).get();
        flagsSnap.forEach(doc => { allItems.push({ _id: doc.id, _type: 'flag', ...doc.data() }); });

        allItems.sort((a, b) => {
            let tA = a.timestamp ? a.timestamp.toMillis() : 0;
            let tB = b.timestamp ? b.timestamp.toMillis() : 0;
            return tB - tA; 
        });

        allItems.forEach(d => {
            count++;
            let badge = d.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 6px; border-radius:4px; font-size:11px;">✅ ${d._type === 'flag' ? 'Reviewed' : 'Fixed'}</span>` : `<span style="background:#555; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">⏳ Pending</span>`;
            let title = d._type === 'flag' ? '⭐ Flagged Doubt' : `<b>${d.reason}</b>`;
            html += `<div style="background:#1a1a1a; padding:12px; border:1px solid #333; border-radius:6px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;">${title} ${badge}</div><p style="font-size:13px; color:var(--text-muted); margin:0;">${d.questionText}</p></div>`;
            
            if(d.status === 'resolved' && d.seenByStudent === false) {
                let col = d._type === 'flag' ? "flagged_doubts" : "reported_mistakes";
                db.collection(col).doc(d._id).update({seenByStudent: true});
            }
        });

        if(count === 0) { list.innerHTML = `<p style="color:var(--text-muted);">You haven't reported any questions yet.</p>`; } 
        else { list.innerHTML = html; }
    } catch(e) { list.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}
function closeUserReportsModal() { document.getElementById('userReportsModal').style.display = 'none'; }

// --- ASK AI (DRAG AND DROP) LOGIC ---
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
    }, 500); // 500ms to activate drag
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    let currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    aiBtn.style.left = (currentX - initialX) + 'px';
    aiBtn.style.top = (currentY - initialY) + 'px';
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

function openAIModal() {
    document.getElementById('aiModal').style.display = 'flex'; document.getElementById('ai-input-view').style.display = 'block';
    document.getElementById('ai-cropper-view').style.display = 'none'; document.getElementById('ai-loading-view').style.display = 'none';
    document.getElementById('ai-chat-view').style.display = 'none'; document.getElementById('ai-idle-view').style.display = 'flex';
    document.getElementById('aiTextInput').value = '';
    document.getElementById('ai-fuzzy-box').style.display = 'none'; document.getElementById('ai-chat-history').innerHTML = '';
    aiChatHistory = []; lastExtractedQuestion = null;
}

function closeAIModal() { document.getElementById('aiModal').style.display = 'none'; if(cropper) { cropper.destroy(); cropper = null; } }

function handleAIFuzzySuggestions() {
    const raw = document.getElementById('aiTextInput').value.trim().toLowerCase(); const box = document.getElementById('ai-fuzzy-box');
    if(raw.length < 3) { box.style.display = 'none'; return; }
    const tokens = raw.split(/\s+/).filter(w => w.length > 2); let matches = [];
    function scanTree(obj, path=[]) {
        for(let k in obj) { let full = [...path, k]; let kLower = k.toLowerCase(); let hit = tokens.some(t => kLower.includes(t));
            if(hit) matches.push({ type: 'Topic', title: full.join(' > '), text: k });
            if(typeof obj[k] === 'object' && !Array.isArray(obj[k])) scanTree(obj[k], full);
        }
    }
    scanTree(appData);
    if(matches.length === 0) { box.innerHTML = `<div class="ai-fuzzy-item" style="color:var(--text-muted);">No direct syllabus match found — AI will solve autonomously using NCERT references 🌐</div>`; } 
    else { box.innerHTML = matches.slice(0, 5).map(m => `<div class="ai-fuzzy-item" onclick="insertAISuggestion('${m.text.replace(/'/g, "\\'")}')"><span>📚 <b>${m.type}:</b> ${m.title}</span><span style="font-size:12px; color:var(--primary-yellow);">Use Topic &rarr;</span></div>`).join(''); }
    box.style.display = 'block';
}

function insertAISuggestion(text) { document.getElementById('aiTextInput').value = text + ": "; document.getElementById('ai-fuzzy-box').style.display = 'none'; document.getElementById('aiTextInput').focus(); }

function handleAIImageUpload(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('ai-input-view').style.display = 'none'; document.getElementById('ai-cropper-view').style.display = 'flex';
        const imgNode = document.getElementById('aiCropperImage'); imgNode.src = event.target.result;
        if(cropper) cropper.destroy(); cropper = new Cropper(imgNode, { viewMode: 1, autoCropArea: 0.85, background: false });
    };
    reader.readAsDataURL(file);
}

function cancelCropper() { if(cropper) { cropper.destroy(); cropper = null; } document.getElementById('ai-cropper-view').style.display = 'none'; document.getElementById('ai-input-view').style.display = 'block'; document.getElementById('aiImageInput').value = ""; document.getElementById('aiCameraInput').value = ""; }

async function confirmCropAndSolve() {
    if(!cropper) return; const canvas = cropper.getCroppedCanvas(); const base64Image = canvas.toDataURL('image/jpeg').split(',')[1]; 
    document.getElementById('ai-cropper-view').style.display = 'none'; document.getElementById('ai-input-view').style.display = 'block';
    await callAIWorker({ image: base64Image, mimeType: 'image/jpeg', mode: 'solve' });
}

async function processAIText() {
    const text = document.getElementById('aiTextInput').value.trim(); if(!text) return showNotification("⚠️ Please type a question.");
    document.getElementById('ai-fuzzy-box').style.display = 'none';
    document.getElementById('ai-idle-view').style.display = 'none';
    document.getElementById('ai-loading-view').style.display = 'flex';
    
    try {
        const cacheSnap = await db.collection("ai_doubt_diary").where("questionText", "==", text).limit(1).get();
        if (!cacheSnap.empty) {
            const cachedData = cacheSnap.docs[0].data();
            const syntheticPayload = { extractedQuestion: cachedData.questionText, subject: cachedData.subject, solution: cachedData.solution, searchKeywords: [] };
            renderAISolution(syntheticPayload, true); return; 
        }
    } catch(e) { console.warn("Cache check skipped"); }

    await callAIWorker({ text: text, mode: 'solve' });
}

async function callAIWorker(payload) {
    document.getElementById('ai-idle-view').style.display = 'none';
    document.getElementById('ai-loading-view').style.display = 'flex';
    try {
        const res = await fetch(AI_WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json(); if(data.error) throw new Error(data.error);

        if (payload.mode === 'solve') { renderAISolution(data, false); } 
        else {
            document.getElementById('ai-loading-view').style.display = 'none'; document.getElementById('ai-chat-view').style.display = 'flex';
            aiChatHistory.push({ role: 'model', text: data.reply }); let parsedHTML = marked.parse(data.reply);
            const chatDiv = document.createElement('div'); chatDiv.className = 'ai-chat-bubble'; chatDiv.innerHTML = parsedHTML;
            document.getElementById('ai-chat-history').appendChild(chatDiv);
            renderMathInElement(chatDiv, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
            document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight;
        }
    } catch(e) { document.getElementById('ai-loading-view').style.display = 'none'; document.getElementById('ai-idle-view').style.display = 'flex'; showNotification("❌ AI Error: " + e.message); }
}

async function renderAISolution(data, isCached = false) {
    document.getElementById('ai-loading-view').style.display = 'none'; 
    document.getElementById('ai-chat-view').style.display = 'flex';
    
    lastExtractedQuestion = data; aiChatHistory = [{ role: 'user', text: "Solve this: " + data.extractedQuestion }];
    
    let html = `<div class="ai-chat-bubble user-bubble"><b>Extracted Question:</b><br>${data.extractedQuestion}</div>`;
    
    if (isCached) {
        html += `<div class="ai-match-card" style="border-color: var(--primary-yellow); background: rgba(253, 184, 19, 0.15);"><div><b style="color:var(--primary-yellow);">⚡ Instant Cache Match!</b><br><span style="font-size:13px; color:var(--text-light);">Served from Firebase (Zero API Cost)</span></div></div>`;
    } else {
        const isFound = await checkDatabaseForQuestion(data.searchKeywords);
        if (isFound) { html += `<div class="ai-match-card"><div><b style="color:var(--correct-green);">✅ Verified Match in MCQsPrep!</b><br><span style="font-size:13px; color:var(--text-light);">${isFound.path}</span></div><button class="btn-exam" onclick="closeAIModal(); jumpToSection(${JSON.stringify(isFound.path.split(' > ')).replace(/"/g, "'")}); window.location.hash='#/quiz';" style="background:var(--correct-green); border:none; padding:8px 14px; color:white; border-radius:6px;">Go Practice 🚀</button></div>`; } 
        else { html += `<div style="background: rgba(253, 184, 19, 0.1); border: 1px solid rgba(253, 184, 19, 0.4); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: #eee;">🌐 <b>Curriculum Knowledge Base Solution:</b> Solved autonomously using verified NCERT syllabus standards.</div>`; }
    }
    
    let solutionMarkdown = `**Subject:** ${data.subject}\n\n**Core Concept:** ${data.solution.keyConcept}\n\n**Step-by-Step Explanation:**\n${data.solution.stepByStep}\n\n**Final Conclusion & Answer:** ${data.solution.finalAnswer}`;
    aiChatHistory.push({ role: 'model', text: solutionMarkdown }); let parsedHTML = marked.parse(solutionMarkdown);
    html += `<div class="ai-chat-bubble" id="ai-sol-bubble">${parsedHTML}</div>`;
    html += `<button class="btn-exam" onclick="saveToDoubtDiary()" style="background:rgba(255,255,255,0.08); color:var(--primary-yellow); width:100%; margin-bottom:15px; border: 1px solid var(--primary-yellow); border-radius:8px;">📔 Save Explanation to Doubt Diary</button>`;

    const historyContainer = document.getElementById('ai-chat-history'); historyContainer.innerHTML = html;
    renderMathInElement(document.getElementById('ai-sol-bubble'), { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
}

async function sendAIFollowUp() {
    const inputEl = document.getElementById('aiFollowUpInput'); const text = inputEl.value.trim(); if(!text) return;
    aiChatHistory.push({ role: 'user', text: text });
    const chatDiv = document.createElement('div'); chatDiv.className = 'ai-chat-bubble user-bubble'; chatDiv.innerText = text;
    document.getElementById('ai-chat-history').appendChild(chatDiv); document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight; inputEl.value = '';

    const typingDiv = document.createElement('div'); typingDiv.className = 'ai-chat-bubble'; typingDiv.id = 'ai-typing-indicator'; typingDiv.innerText = "Analyzing follow-up..."; document.getElementById('ai-chat-history').appendChild(typingDiv);
    await callAIWorker({ mode: 'chat', text: text, conversationHistory: aiChatHistory.slice(0, -1) });
    document.getElementById('ai-typing-indicator')?.remove();
}

async function checkDatabaseForQuestion(keywords) {
    if(!keywords || keywords.length === 0) return null;
    try {
        const snap = await db.collection("content").where("type", "==", "mcq").limit(100).get(); let foundDoc = null;
        snap.forEach(doc => { const qText = doc.data().question.toLowerCase(); let matchCount = 0; keywords.forEach(k => { if (qText.includes(k.toLowerCase())) matchCount++; }); if (matchCount >= Math.min(3, keywords.length)) foundDoc = doc.data(); });
        return foundDoc;
    } catch(e) { return null; }
}

async function saveToDoubtDiary() {
    if (!currentUser) { showAuthModal(); return; } if (!lastExtractedQuestion) return;
    try { await db.collection("ai_doubt_diary").add({ userId: currentUser.uid, questionText: lastExtractedQuestion.extractedQuestion, subject: lastExtractedQuestion.subject, solution: lastExtractedQuestion.solution, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("📔 Saved to your Doubt Diary!"); } 
    catch(e) { showNotification("❌ Failed to save: " + e.message); }
}

async function _renderDoubtDiary() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Doubt Diary";
    const mc = document.getElementById('dynamic-content'); mc.innerHTML = `<div class="card"><h2>📔 Loading Doubt Diary...</h2></div>`;
    try {
        const snap = await db.collection("ai_doubt_diary").where("userId", "==", currentUser.uid).get();
        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(items.length === 0) { mc.innerHTML = `<div class="card" style="text-align:center;"><h2>📔 Doubt Diary Empty</h2><p style="color:var(--text-muted);">Use the ✨ Ask AI feature to scan questions and save explanations here for rapid revision.</p><button class="btn-exam" onclick="goBack()">Back</button></div>`; return; }
        
        let html = `<div class="card"><h2 style="color:var(--primary-yellow);">📔 Your Saved Explanations</h2><p style="color:var(--text-muted); margin-bottom:20px;">Review your previously solved doubts here.</p>`;
        items.forEach(d => {
            let dateStr = d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleDateString() : '';
            let md = `**Core Concept:** ${d.solution.keyConcept}\n\n**Step-by-Step:**\n${d.solution.stepByStep}\n\n**Final Answer:** ${d.solution.finalAnswer}`;
            html += `<div style="background:#1a1a1a; border-left: 4px solid var(--primary-yellow); padding: 15px; border-radius: 6px; margin-bottom: 20px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${d.subject}</span><span style="font-size:12px; color:var(--text-muted);">${dateStr}</span></div><p style="font-weight:bold; font-size:16px;">Q: ${d.questionText}</p><button onclick="toggleViewAnswer('diary_sol_${d.id}')" style="background:#333; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">👁️ Show Solution</button><div id="diary_sol_${d.id}" class="katex-render-target" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #333; line-height:1.6; font-size:15px;">${marked.parse(md)}</div></div>`;
        });
        html += `<button class="btn-exam" onclick="goBack()">Back</button></div>`; mc.innerHTML = html;
        document.querySelectorAll('.katex-render-target').forEach(el => { renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] }); });
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}

let selectedStars = 0; let userFeedbackDocId = null; 
function updateStarUI(stars) { selectedStars = stars; for(let i=1; i<=5; i++) { document.getElementById('star-'+i).classList.remove('active'); if(i <= stars) document.getElementById('star-'+i).classList.add('active'); } }
async function openFeedbackModal() { 
    if (!currentUser) { showNotification("⚠️ Please sign in to rate."); showAuthModal(); return; }
    document.getElementById('feedbackModal').style.display = 'flex'; 
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get();
        if (!snap.empty) { userFeedbackDocId = snap.docs[0].id; updateStarUI(snap.docs[0].data().rating || 0); document.getElementById('platformFeedbackText').value = snap.docs[0].data().feedback || ""; document.getElementById('submitFeedbackBtn').innerText = "Update Feedback"; } 
        else { userFeedbackDocId = null; updateStarUI(0); document.getElementById('platformFeedbackText').value = ""; document.getElementById('submitFeedbackBtn').innerText = "Submit Feedback"; }
    } catch(e) {}
}
function closeFeedbackModal() { document.getElementById('feedbackModal').style.display = 'none'; }
async function submitPlatformFeedback() {
    if (!currentUser) return; if (selectedStars === 0) { showNotification("⚠️ Please select a star rating!"); return; }
    const feedbackText = document.getElementById('platformFeedbackText').value.trim(); const btn = document.getElementById('submitFeedbackBtn'); btn.innerText = "Submitting..."; btn.disabled = true;
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get();
        if (!snap.empty) {
            await db.collection("platform_feedback").doc(snap.docs[0].id).update({ rating: selectedStars, feedback: feedbackText, studentName: currentUser.displayName, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            if (snap.docs.length > 1) { for(let i = 1; i < snap.docs.length; i++) await db.collection("platform_feedback").doc(snap.docs[i].id).delete(); }
            showNotification("✅ Feedback updated!");
        } else { await db.collection("platform_feedback").add({ rating: selectedStars, feedback: feedbackText, studentName: currentUser.displayName, studentId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("✅ Thank you!"); }
        closeFeedbackModal(); fetchGlobalRating(); 
    } catch(e) { showNotification("❌ Error: " + e.message); }
    btn.innerText = "Submit Feedback"; btn.disabled = false;
}

async function fetchGlobalRating() {
    const display = document.getElementById('global-rating-display'); if(!display) return;
    try {
        const snapshot = await db.collection("platform_feedback").get(); if (snapshot.empty) { display.innerText = "5.0"; return; }
        let total = 0; let count = 0; snapshot.forEach(doc => { total += doc.data().rating; count++; }); display.innerText = (total / count).toFixed(1);
    } catch(e) { display.innerText = "5.0"; }
}

let adminSelectedPath = []; let adminManageSelectedPath = []; let adminNewTopicPath = []; let adminCurrentTab = 'upload'; 

function _renderAdminLogin() { document.getElementById('breadcrumb-text').innerText = "Security / Admin Login"; document.getElementById('dynamic-content').innerHTML = `<div class="card" style="max-width: 400px; margin: 0 auto; text-align: center;"><h2>🔒 Restricted Access</h2><input type="password" id="adminPassInput" class="input-field" style="margin: 0 auto 15px auto;" placeholder="Password"><button id="loginBtn" class="btn-exam" onclick="verifyAdmin()" style="width: 100%; max-width: 300px; background-color: var(--primary-yellow); color: black; border: none;">Login to Admin</button></div>`; }

async function verifyAdmin() {
    const inputPass = document.getElementById('adminPassInput').value; const btn = document.getElementById('loginBtn'); btn.innerText = "Verifying..."; btn.disabled = true;
    try { const doc = await db.collection("settings").doc("admin_auth").get(); let correctPass = "mcqs2026"; if (doc.exists && doc.data().password) correctPass = doc.data().password;
        if (inputPass === correctPass) { sessionStorage.setItem('admin_verified', 'true'); window.location.hash = '#/admin-panel'; showNotification("✅ Admin Access Granted"); } else { showNotification("❌ Incorrect Password"); }
    } catch (e) { showNotification("❌ Verification error: " + e.message); }
    btn.innerText = "Login to Admin"; btn.disabled = false;
}

function _renderAdminPanel() {
    if (!sessionStorage.getItem('admin_verified')) { window.location.hash = '#/admin'; return; }
    document.getElementById('breadcrumb-text').innerText = "Admin Dashboard";
    
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <h2 style="color: var(--primary-yellow); margin:0;">🛠️ Admin Control Center</h2>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="admin-tab-btn ${adminCurrentTab === 'upload' ? 'active' : ''}" onclick="switchAdminTab('upload')">➕ Upload</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'manage' ? 'active' : ''}" onclick="switchAdminTab('manage')">📋 Manage</button>
                    <button class="admin-tab-btn ${adminCurrentTab === 'topics' ? 'active' : ''}" onclick="switchAdminTab('topics')">📁 Folders</button>
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
                                    <option value="Mixed">Mixed (Default)</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
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
                    <div class="admin-row" style="margin-top: 15px;">
                        <div>
                            <label style="color:white; font-size:13px;">2. New Folder Name:</label>
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
                <input type="text" id="adminTopicSearch" class="input-field" placeholder="🔍 Search folders by name or path..." oninput="filterAdminTopics()">
                <div id="admin-topic-list-container"></div>
            </div>

            <div id="admin-manage-view" style="display:${adminCurrentTab === 'manage' ? 'block' : 'none'};">
                <div style="background: #2a2a2a; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <h4 style="margin-top:0; margin-bottom:10px; color:var(--text-muted);">Filter Content by Folder (Optional)</h4>
                    <div id="manage-path-selectors" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;"></div>
                    <button class="btn-exam" onclick="loadContentForManagement()" style="background:var(--primary-yellow); color:black; border:none; padding:10px 15px; width:100%; max-width:250px;">🔍 Fetch Filtered Content</button>
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
                <div style="background: #2a2a2a; padding: 25px; border-radius: 6px; max-width: 400px;">
                    <h3 style="margin-top:0; margin-bottom:20px;">Change Admin Password</h3>
                    <input type="password" id="newAdminPass" class="input-field" placeholder="Enter New Password (Min 6 chars)">
                    <input type="password" id="confirmAdminPass" class="input-field" placeholder="Confirm New Password">
                    <button class="btn-exam" onclick="changeAdminPassword()" style="background:var(--primary-yellow); color:black; border:none; width:100%;">Update Password</button>
                </div>
            </div>
        </div>`;
        
    if (adminCurrentTab === 'upload') { _buildAdminSelectors(); }
    else if (adminCurrentTab === 'topics') { _buildAdminNewTopicSelectors(); loadAdminTopicsList(); }
    else if (adminCurrentTab === 'manage') { _buildManageSelectors(); loadContentForManagement(); }
    else if (adminCurrentTab === 'reports') loadAdminReports();
    else if (adminCurrentTab === 'users') loadAdminUsers();
    else if (adminCurrentTab === 'doubts') loadAdminDoubts();
}

function switchAdminTab(tab) { adminCurrentTab = tab; _renderAdminPanel(); }

let globalTopicsData = [];
async function loadAdminTopicsList() {
    const container = document.getElementById('admin-topic-list-container'); container.innerHTML = `<p>Loading folders...</p>`;
    try {
        const snap = await db.collection("custom_topics").get();
        globalTopicsData = [];
        snap.forEach(doc => globalTopicsData.push({ id: doc.id, ...doc.data() }));
        globalTopicsData.sort((a,b) => (a.parentPath || "").localeCompare(b.parentPath || ""));
        renderAdminTopicsList(globalTopicsData);
    } catch(e) { container.innerHTML = `<p>Error: ${e.message}</p>`; }
}

function renderAdminTopicsList(topicsArray) {
    const container = document.getElementById('admin-topic-list-container');
    if(topicsArray.length === 0) { container.innerHTML = `<p>No custom folders found.</p>`; return; }
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
    let filtered = globalTopicsData.filter(t => t.name.toLowerCase().includes(q) || t.parentPath.toLowerCase().includes(q));
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
    const container = document.getElementById('dynamic-new-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminNewTopicPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        if (currentObj && Object.keys(currentObj).length === 0 && i === adminNewTopicPath.length) break;
        html += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminNewTopicPathChange(event, ${i})"><option value="" ${!adminNewTopicPath[i] ? 'selected' : ''}>-- Stop Here / Select Child --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminNewTopicPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminNewTopicPath[i] && currentObj[adminNewTopicPath[i]]) { currentObj = currentObj[adminNewTopicPath[i]]; } else { break; }
    }
    container.innerHTML = html;
    let pathDisplay = document.getElementById('new-topic-path-display');
    if(!pathDisplay) container.insertAdjacentHTML('afterend', `<div id="new-topic-path-display" style="margin-top:10px; font-size:14px; color:var(--primary-yellow);"><b>Selected Parent Path:</b> <span id="new-topic-path-text" style="color:white;">None</span></div>`);
    document.getElementById('new-topic-path-text').innerText = adminNewTopicPath.length > 0 ? adminNewTopicPath.join(' > ') : 'Root (Please select at least one)';
}

function handleAdminNewTopicPathChange(event, depth) {
    if(event.target.value === "") adminNewTopicPath = adminNewTopicPath.slice(0, depth);
    else { adminNewTopicPath = adminNewTopicPath.slice(0, depth); adminNewTopicPath.push(event.target.value); }
    _buildAdminNewTopicSelectors(); 
}

async function createCustomTopic() {
    if (adminNewTopicPath.length === 0) return showNotification("⚠️ Please select a parent path.");
    const folderName = document.getElementById('newFolderName').value.trim();
    if (!folderName) return showNotification("⚠️ Folder name is required.");
    try {
        await db.collection("custom_topics").add({ parentPath: adminNewTopicPath.join(' > '), name: folderName, type: document.getElementById('newFolderType').value, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        showNotification("✅ Subtopic Created Successfully!"); document.getElementById('newFolderName').value = ""; await loadCustomTopics(); _buildAdminNewTopicSelectors(); loadAdminTopicsList();
    } catch(e) { alert("⚠️ ERROR: " + e.message); }
}

async function loadAdminReports() {
    const container = document.getElementById('reports-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching reported mistakes...</p>`;
    try {
        const snapshot = await db.collection("reported_mistakes").get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(items.length === 0) { container.innerHTML = "<p style='color:var(--correct-green);'>✅ No mistakes reported! Everything is clean.</p>"; return; }
        
        let html = '';
        items.forEach(data => {
            let stat = data.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 8px; border-radius:12px; font-size:12px;">✅ Resolved</span>` : `<span style="background:#555; color:white; padding:2px 8px; border-radius:12px; font-size:12px;">⏳ Pending</span>`;
            html += `<div class="content-item-card" style="border-left: 4px solid var(--wrong-red);"><div class="content-item-header"><span class="badge-path">${data.path || 'Unknown Path'}</span><span style="font-size:12px; color:var(--text-muted);">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="margin: 10px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 4px; display:flex; justify-content:space-between;"><div><p style="color:var(--wrong-red); margin:0 0 5px 0;"><b>Issue:</b> ${data.reason}</p><p style="margin:0; font-size:14px;"><b>Details:</b> ${data.description || 'No description provided.'}</p></div>${stat}</div><p style="margin:5px 0 10px 0; font-size:12px; color:var(--text-muted);">Reported by: ${data.studentName}</p><div style="background:#1a1a1a; padding:10px; border-radius:4px; font-size:14px; margin-bottom:10px;"><b>Question Content:</b><br>${data.questionText}</div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button onclick="openEditModalFromReport('${data.questionId}')" style="padding:6px 12px; background:#2196F3; border:none; border-radius:4px; color:white; cursor:pointer;">✏️ Edit MCQ in Database</button><button onclick="resolveReport('${data.id}')" style="padding:6px 12px; background:var(--correct-green); border:none; border-radius:4px; color:white; cursor:pointer;" ${data.status==='resolved'?'disabled':''}>✅ Mark Resolved (Notifies User)</button></div></div>`;
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
    const container = document.getElementById('users-table-container'); container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching students...</p>`;
    try {
        const snapshot = await db.collection("users").orderBy("lastLogin", "desc").get();
        let html = `<table><tr><th>Name</th><th>Email</th><th>Last Login</th></tr>`;
        snapshot.forEach(doc => { html += `<tr><td>${doc.data().displayName}</td><td>${doc.data().email}</td><td>${doc.data().lastLogin ? doc.data().lastLogin.toDate().toLocaleString() : "Unknown"}</td></tr>`; });
        container.innerHTML = html + `</table>`;
    } catch(e) { container.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function loadAdminDoubts() {
    const container = document.getElementById('doubts-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow);">Fetching doubts...</p>`;
    try {
        const snapshot = await db.collection("flagged_doubts").get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(items.length === 0) { container.innerHTML = "<p>No flagged questions!</p>"; return; }
        
        let html = '';
        items.forEach(data => { 
            let stat = data.status === 'resolved' ? `<span style="background:var(--correct-green); color:white; padding:2px 8px; border-radius:12px; font-size:12px;">✅ Reviewed</span>` : `<span style="background:#555; color:white; padding:2px 8px; border-radius:12px; font-size:12px;">⏳ Pending</span>`;
            html += `<div class="content-item-card"><div class="content-item-header"><span class="badge-path">${data.path}</span><span style="font-size:12px; color:var(--text-muted);">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="display:flex; justify-content:space-between;"><p style="color:var(--primary-yellow); margin:5px 0;"><b>Flagged by:</b> ${data.studentName}</p>${stat}</div><div style="background:#1a1a1a; padding:10px; border-radius:4px; font-size:14px;">${data.questionText}</div><button onclick="resolveDoubt('${data.id}')" style="margin-top:10px; padding:5px 10px; background:var(--correct-green); border:none; border-radius:4px; color:white; cursor:pointer;" ${data.status==='resolved'?'disabled':''}>Mark Reviewed (Notifies User)</button></div>`; 
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function resolveDoubt(docId) { if(confirm("Mark this doubt as reviewed? Student will be notified.")) { await db.collection("flagged_doubts").doc(docId).update({status: 'resolved', seenByStudent: false}); loadAdminDoubts(); } }

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

function _buildAdminSelectors() {
    const container = document.getElementById('dynamic-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminSelectedPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        if (currentObj && Object.keys(currentObj).length === 0 && i === adminSelectedPath.length) break;
        html += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminPathChange(event, ${i})"><option value="" ${!adminSelectedPath[i] ? 'selected' : ''}>-- Upload Here / Select Child --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminSelectedPath[i] && currentObj[adminSelectedPath[i]]) { currentObj = currentObj[adminSelectedPath[i]]; } else { break; }
    }
    container.innerHTML = html;
    const formArea = document.getElementById('upload-form-area'); if(formArea) formArea.style.display = (adminSelectedPath.length > 0) ? 'block' : 'none';
    let pathDisplay = document.getElementById('upload-path-display');
    if(!pathDisplay) container.insertAdjacentHTML('afterend', `<div id="upload-path-display" style="margin-top:10px; font-size:14px; color:var(--correct-green);"><b>Uploading Content To:</b> <span id="upload-path-text" style="color:white;">None</span></div>`);
    document.getElementById('upload-path-text').innerText = adminSelectedPath.length > 0 ? adminSelectedPath.join(' > ') : 'Please select at least one path';
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
    const type = document.getElementById('admResourceType').value; const targetPathString = adminSelectedPath.join(' > '); 
    const btn = document.getElementById('uploadBtn'); btn.innerText = "Uploading... Please wait"; btn.disabled = true;

    try {
        if (type === 'mcq') {
            const question = document.getElementById('admQuestion').value.trim();
            const options = { A: document.getElementById('admOptA').value.trim(), B: document.getElementById('admOptB').value.trim(), C: document.getElementById('admOptC').value.trim(), D: document.getElementById('admOptD').value.trim() };
            const correctCbs = document.querySelectorAll('.admCorrectCb:checked'); let correctAnswers = Array.from(correctCbs).map(cb => cb.value);
            const explanation = document.getElementById('admExplanation').value.trim(); const imageFile = document.getElementById('admQImage').files[0];
            const level = document.getElementById('admDifficulty').value;
            if (!question || !options.A || !options.B || correctAnswers.length === 0) throw new Error("Question, Option A, Option B, and Correct Answer are required.");
            let imageUrl = null; if (imageFile) imageUrl = await uploadFileToCloudinary(imageFile); 
            await db.collection("content").add({ type: 'mcq', path: targetPathString, level: level, question: question, options: options, correctAnswers: correctAnswers, explanation: explanation, imageUrl: imageUrl, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
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
async function loadContentForManagement() {
    const listEl = document.getElementById('manage-content-list'); listEl.innerHTML = `<p style="color:var(--primary-yellow);">Fetching items from database...</p>`;
    try {
        let query = db.collection("content");
        if (adminManageSelectedPath.length > 0) { const prefixPath = adminManageSelectedPath.join(' > '); query = query.where("path", ">=", prefixPath).where("path", "<=", prefixPath + "\uf8ff"); } 
        else { query = query.orderBy("timestamp", "desc").limit(50); }
        const snapshot = await query.get();
        if(snapshot.empty) { listEl.innerHTML = `<p style="color:var(--text-muted);">No items found in this folder.</p>`; return; }
        loadedItemsCache = {}; let html = '';
        snapshot.forEach(doc => {
            const data = doc.data(); loadedItemsCache[doc.id] = data;
            if (data.type === 'mcq') {
                let answersStr = (data.correctAnswers || []).join(', ');
                let lvlBadge = data.level ? `<span style="margin-left:10px; background:#444; color:white; padding:2px 6px; border-radius:4px; font-size:11px;">${data.level}</span>` : '';
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#252525; border:1px solid #333; border-radius:8px; padding:15px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${data.path || 'Uncategorized'}</span>${lvlBadge}<div style="display:flex; gap:8px;"><button class="btn-exam" onclick="openEditModal('${doc.id}')" style="padding:4px 10px; font-size:12px; background:#2196F3; border:none;">✏️ Edit</button><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:4px 10px; font-size:12px; background:var(--wrong-red); border:none;">🗑️ Delete</button></div></div><div style="font-weight:bold; margin-bottom:8px;">${data.question}</div>${data.imageUrl ? `<img src="${data.imageUrl}" style="max-height:80px; border-radius:4px; margin-bottom:8px; display:block;">` : ''}<div style="font-size:13px; color:var(--text-muted); line-height:1.4;">A: ${data.options?.A || '-'} | B: ${data.options?.B || '-'} | C: ${data.options?.C || '-'} | D: ${data.options?.D || '-'}</div><div style="margin-top:6px; font-size:13px; color:var(--correct-green);">Correct: ${answersStr}</div></div>`;
            } else {
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#252525; border:1px solid #333; border-radius:8px; padding:15px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${data.path || 'Uncategorized'}</span><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:4px 10px; font-size:12px; background:var(--wrong-red); border:none;">🗑️ Delete</button></div><div style="font-weight:bold; margin-bottom:5px;">📄 ${data.title}</div><a href="${data.fileUrl}" target="_blank" style="color:var(--primary-yellow); font-size:13px;">View Document &rarr;</a></div>`;
            }
        });
        let titleMsg = adminManageSelectedPath.length > 0 ? `<p style="color:white; font-size:14px; margin-bottom:15px;">Showing results for: <b>${adminManageSelectedPath.join(' > ')}</b></p>` : `<p style="color:white; font-size:14px; margin-bottom:15px;">Showing 50 most recent uploads across all folders.</p>`;
        listEl.innerHTML = titleMsg + html;
    } catch(e) { listEl.innerHTML = `<p style="color:var(--wrong-red);">Error loading items: ${e.message}</p>`; }
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
        await db.collection("content").doc(docId).update({ question: question, options: options, correctAnswers: correctAnswers, explanation: explanation, level: level });
        closeEditModal(); showNotification("✅ Changes saved!"); loadContentForManagement();
    } catch(e) { showNotification("❌ Update failed: " + e.message); }
}

async function changeAdminPassword() {
    const p1 = document.getElementById('newAdminPass').value; const p2 = document.getElementById('confirmAdminPass').value;
    if(p1.length < 6) { showNotification("⚠️ Password must be at least 6 characters."); return; }
    if(p1 !== p2) { showNotification("❌ Passwords do not match!"); return; }
    try { await db.collection("settings").doc("admin_auth").set({ password: p1 }); document.getElementById('newAdminPass').value = ""; document.getElementById('confirmAdminPass').value = ""; showNotification("✅ Password changed successfully!"); } 
    catch(e) { showNotification("❌ Error updating password: " + e.message); }
}

// --- CUSTOM PRACTICE BUILDER ---
let customQuizConfig = { paths: [], count: 20, level: 'Mixed' };

function cwStep1() {
    if(!currentUser) { showAuthModal(); return; }
    cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' };
    document.getElementById('breadcrumb-text').innerText = "Home / Custom Practice Setup / Select Exam";
    let html = `
        <div class="card">
            <h2 style="color:var(--primary-yellow);">⚙️ Custom Practice Setup</h2>
            <p style="color:var(--text-muted); margin-bottom:25px;">Step 1: Which exam are you preparing for?</p>
            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <button class="btn-exam" onclick="cwStep2('NEET')" style="flex:1; padding:20px; font-size:18px;">🩺 NEET</button>
                <button class="btn-exam" onclick="cwStep2('General Knowledge')" style="flex:1; padding:20px; font-size:18px;">🌍 General Knowledge</button>
            </div>
            <button class="btn-exam" onclick="goHome()" style="margin-top:20px; background:#333;">&larr; Cancel</button>
        </div>
    `;
    document.getElementById('dynamic-content').innerHTML = html;
}

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

function cwStep2(exam) {
    cwState.exam = exam;
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / ${exam} / Select Subjects`;
    let subjects = getCustomSubjects(exam);
    let html = `
        <div class="card">
            <h2 style="color:var(--primary-yellow);">📚 Select Subjects</h2>
            <p style="color:var(--text-muted); margin-bottom:20px;">Step 2: Choose one or more subjects from ${exam}.</p>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px; margin-bottom:25px;">
                ${subjects.map(s => `<label style="background:#2a2a2a; border:1px solid #444; padding:15px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:10px; transition:0.2s;" onmouseover="this.style.borderColor='var(--primary-yellow)'" onmouseout="this.style.borderColor='#444'"><input type="checkbox" value="${s.path}" class="cw-subj-cb"> <span>${s.name}</span></label>`).join('')}
            </div>
            <div style="display:flex; justify-content:space-between;">
                <button class="btn-exam" onclick="cwStep1()" style="background:#333;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep2()" style="background:var(--primary-yellow); color:black;">Next: Select Chapters &rarr;</button>
            </div>
        </div>
    `;
    document.getElementById('dynamic-content').innerHTML = html;
}

function cwProcessStep2() {
    let cbs = Array.from(document.querySelectorAll('.cw-subj-cb:checked')).map(cb => cb.value);
    if(cbs.length === 0) return showNotification("⚠️ Select at least one subject.");
    cwState.subjects = cbs; cwStep3();
}

function getAllLeafNodes(subjectPaths) {
    let leafs = [];
    subjectPaths.forEach(subjPath => {
        let parts = subjPath.split(' > '); let curr = appData; let valid = true;
        for(let p of parts) { if(curr[p]) curr = curr[p]; else {valid = false; break;} }
        function traverse(node, pathStr) {
            let hasChildren = false;
            for(let k in node) { if(k === "Daily Quiz Challenge") continue; hasChildren = true; traverse(node[k], pathStr + " > " + k); }
            if(!hasChildren) leafs.push(pathStr);
        }
        if(valid) traverse(curr, subjPath);
        for(let customP in customTopicTypes) {
            if(customP.startsWith(subjPath) && customTopicTypes[customP] === 'mcq') { if(!leafs.includes(customP)) leafs.push(customP); }
        }
    });
    return [...new Set(leafs)].sort();
}

function cwStep3() {
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / ${cwState.exam} / Chapters`;
    let leafs = getAllLeafNodes(cwState.subjects);
    let html = `
        <div class="card">
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
                <button class="btn-exam" onclick="cwStep2(cwState.exam)" style="background:#333;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep3()" style="background:var(--primary-yellow); color:black;">Next: Set Difficulty &rarr;</button>
            </div>
        </div>
    `;
    document.getElementById('dynamic-content').innerHTML = html;
}

function cwFilterSubtopics() {
    let q = document.getElementById('cwSubtopicSearch').value.toLowerCase();
    document.querySelectorAll('.cw-sub-lbl').forEach(lbl => {
        if(lbl.innerText.toLowerCase().includes(q)) lbl.style.display = 'flex'; else lbl.style.display = 'none';
    });
}

function cwSelectAll(select) {
    document.querySelectorAll('.cw-sub-cb').forEach(cb => { if(cb.closest('.cw-sub-lbl').style.display !== 'none') cb.checked = select; });
}

function cwProcessStep3() {
    let cbs = Array.from(document.querySelectorAll('.cw-sub-cb:checked')).map(cb => cb.value);
    if(cbs.length === 0) return showNotification("⚠️ Select at least one chapter.");
    cwState.subtopics = cbs; cwStep4();
}

function cwStep4() {
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / Configure Quiz`;
    let html = `
        <div class="card">
            <h2 style="color:var(--primary-yellow);">🎯 Final Setup</h2>
            <p style="color:var(--text-muted);">Step 4: Choose difficulty and number of questions.</p>
            <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:30px; margin-top:20px;">
                <div style="flex:1; min-width:200px;">
                    <label style="color:var(--text-light); font-weight:bold; margin-bottom:10px; display:block;">Difficulty Level:</label>
                    <select id="cwLevel" class="input-field" style="padding:15px; font-size:16px;"><option value="Mixed">Mixed (All Levels)</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>
                </div>
                <div style="flex:1; min-width:200px;">
                    <label style="color:var(--text-light); font-weight:bold; margin-bottom:10px; display:block;">Total Questions:</label>
                    <input type="number" id="cwCount" class="input-field" value="20" min="5" max="100" style="padding:15px; font-size:16px;">
                </div>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <button class="btn-exam" onclick="cwStep3()" style="background:#333;">&larr; Back</button>
                <button class="btn-exam" onclick="cwLaunchQuiz()" style="background:var(--correct-green); color:white; font-size:18px; padding:15px 30px; border:none; box-shadow:0 4px 15px rgba(76,175,80,0.4);">🚀 Start Custom Quiz</button>
            </div>
        </div>
    `;
    document.getElementById('dynamic-content').innerHTML = html;
}

function cwLaunchQuiz() {
    cwState.level = document.getElementById('cwLevel').value; cwState.count = parseInt(document.getElementById('cwCount').value) || 20;
    customQuizConfig.paths = cwState.subtopics; customQuizConfig.count = cwState.count; customQuizConfig.level = cwState.level;
    _initiateQuizEngine(true);
}

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

function showNotification(message) { const notif = document.getElementById('notification'); notif.innerText = message; notif.style.display = 'block'; setTimeout(() => { notif.style.display = 'none'; }, 3000); }
fetchGlobalRating();
