const firebaseConfig = { apiKey: "AIzaSyDuletjxV1THjWvWLvO0XqB_z5xBBXLwL8", authDomain: "mcqsprep.firebaseapp.com", projectId: "mcqsprep", storageBucket: "mcqsprep.firebasestorage.app", messagingSenderId: "920181103186", appId: "1:920181103186:web:14c2ba261d4a6163db5d8b" };
firebase.initializeApp(firebaseConfig); 
const db = firebase.firestore(); 
const auth = firebase.auth(); 
const provider = new firebase.auth.GoogleAuthProvider();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; 
const CLOUDINARY_PRESET = "mcq_uploads"; 
const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

let appData = { "Daily Quiz Challenge": { "NEET": {}, "General Knowledge": {} }, "NEET": { "NCERT Book": {}, "PYQs": {}, "Practice Paper": {}, "MCQs Practice": { "Botany": {}, "Zoology": {}, "Physics": {}, "Organic Chemistry": {}, "Physical Chemistry": {}, "Inorganic Chemistry": {} }, "Mock Test": {} }, "General Knowledge": { "Current Affairs": {}, "History": {}, "Geography": {} } };
let customTopicTypes = {};

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
    } catch(e) { console.log(e); }
}

let currentUser = null; 
let currentPath = []; 
let dataLoaded = false; 

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
        db.collection("users").doc(user.uid).set({ displayName: user.displayName, email: user.email, photoURL: user.photoURL, lastLogin: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        checkUserNotifications();
    } else {
        badge.style.display = 'none'; 
        loginNavBtn.style.display = 'flex'; 
        document.getElementById('profileNotifDot').style.display = 'none';
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) {
            document.getElementById('authModal').style.display = 'flex';
        }
    }
    if (dataLoaded) handleRouting(); 
});

initApp(); 

function signInWithGoogle() { auth.signInWithPopup(provider).catch(err => showNotification("❌ Sign-in Error")); }
function signOut() { if(confirm("Are you sure you want to sign out?")) auth.signOut(); }
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
function navigateTo(key) { 
    let pathPart = [...currentPath, key].join('/');
    window.location.hash = '#/path/' + encodeURIComponent(pathPart).replace(/%2F/g, '/'); 
}
function jumpToSection(pathArray) { 
    window.location.hash = '#/path/' + encodeURIComponent(pathArray.join('/')).replace(/%2F/g, '/'); 
}
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }
function goBack() { window.history.back(); }

// --- RESTORED: STREAK LOGIC ---
let activeTime = 0; 
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
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Streak";
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card"><h2>🔥 Fetching Streak...</h2></div>`;
    try {
        let doc = await db.collection("users").doc(currentUser.uid).get();
        let dates = doc.exists ? (doc.data().activeDates || []) : [];
        let streak = calculateStreak(dates);
        let datesHtml = `<ul style="list-style:none; padding:0; display:flex; flex-wrap:wrap; gap:10px;">`;
        [...new Set(dates)].sort().reverse().slice(0, 14).forEach(d => { 
            datesHtml += `<li style="background:#2a2a2a; padding:8px 12px; border-radius:6px; border:1px solid var(--correct-green); color:var(--correct-green); font-weight:bold;">✅ ${d}</li>`; 
        });
        datesHtml += `</ul>`;
        mc.innerHTML = `<div class="card" style="text-align:center;"><h2 style="color:var(--primary-yellow);">🔥 Daily Streak</h2><div style="font-size: 80px; margin: 20px 0;">🔥</div><div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">${streak} Day${streak !== 1 ? 's' : ''}</div><p style="color:var(--text-muted); font-size:14px; margin-bottom:30px;"><i>Spend at least 5 minutes practicing daily to maintain your streak!</i></p>${dates.length > 0 ? datesHtml : ''}<button class="btn-exam" onclick="goBack()" style="margin-top:20px; background:#333; border:none;">Back</button></div>`;
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}

// --- RESTORED: TRACK PROGRESS ---
async function _renderProgress() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card"><h2>📊 Fetching Progress...</h2></div>`;
    try {
        const snap = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get();
        let totalScore = 0; let totalQuestions = 0; let testCount = 0; let accuracySum = 0;
        snap.forEach(doc => {
            let data = doc.data(); 
            totalScore += (data.score || 0); 
            totalQuestions += (data.attemptedQuestions || 0);
            accuracySum += (data.accuracy || 0); 
            testCount++;
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
            <button class="btn-exam" onclick="goBack()" style="margin-top:30px; background:#333; border:none;">Back</button>
        </div>`;
    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

// --- RESTORED: NOTIFICATIONS & REPORTS ---
async function checkUserNotifications() {
    if(!currentUser) return;
    try {
        let hasUnseen = false;
        let reportsSnap = await db.collection("reported_mistakes").where("studentId", "==", currentUser.uid).get();
        reportsSnap.forEach(doc => { let d = doc.data(); if(d.status === 'resolved' && d.seenByStudent === false) hasUnseen = true; });
        
        let flagsSnap = await db.collection("flagged_doubts").where("studentId", "==", currentUser.uid).get();
        flagsSnap.forEach(doc => { let d = doc.data(); if(d.status === 'resolved' && d.seenByStudent === false) hasUnseen = true; });
        
        if(hasUnseen) { 
            document.getElementById('profileNotifDot').style.display = 'block'; 
            document.getElementById('reportMenuDot').style.display = 'inline'; 
        }
    } catch(e){}
}

let tempReportTarget = null;
function openReportModal(questionId, qText, qPath) { 
    if(!currentUser) { showAuthModal(); return; }
    tempReportTarget = { id: questionId, text: qText, path: qPath }; 
    document.getElementById('reportModal').style.display = 'flex'; 
}
function closeReportModal() { 
    document.getElementById('reportModal').style.display = 'none'; 
    tempReportTarget = null; 
}

async function submitReport() {
    if(!currentUser || !tempReportTarget) return;
    const reason = document.getElementById('reportReason').value; 
    const desc = document.getElementById('reportDescription').value;
    const btn = document.querySelector('#reportModal .btn-exam'); 
    btn.innerText = "Submitting..."; 
    btn.disabled = true;
    try {
        await db.collection("reported_mistakes").add({
            studentId: currentUser.uid, studentName: currentUser.displayName,
            questionId: tempReportTarget.id, questionText: tempReportTarget.text, path: tempReportTarget.path,
            reason: reason, description: desc, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("✅ Report submitted to admins!"); 
        closeReportModal();
        document.getElementById('reportDescription').value = "";
    } catch(e) { 
        showNotification("❌ Error: " + e.message); 
    }
    btn.innerText = "Submit"; 
    btn.disabled = false;
}

async function openUserReportsModal() {
    if(!currentUser) return;
    document.getElementById('userReportsModal').style.display = 'flex';
    document.getElementById('profileNotifDot').style.display = 'none'; 
    document.getElementById('reportMenuDot').style.display = 'none';
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
            html += `<div style="background:#1a1a1a; padding:12px; border:1px solid #333; border-radius:6px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;">${title}${badge}</div><p style="font-size:13px; color:var(--text-muted); margin:0;">${d.questionText}</p></div>`;
            
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

// --- RESTORED: RATE US / FEEDBACK LOGIC ---
let selectedStars = 0; let userFeedbackDocId = null; 
function updateStarUI(stars) { 
    selectedStars = stars; 
    for(let i=1; i<=5; i++) { 
        document.getElementById('star-'+i).classList.remove('active'); 
        if(i <= stars) document.getElementById('star-'+i).classList.add('active'); 
    } 
}
        
async function openFeedbackModal() { 
    if (!currentUser) { showNotification("⚠️ Please sign in to rate."); showAuthModal(); return; }
    document.getElementById('feedbackModal').style.display = 'flex'; 
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get();
        if (!snap.empty) { 
            userFeedbackDocId = snap.docs[0].id; 
            updateStarUI(snap.docs[0].data().rating || 0); 
            document.getElementById('platformFeedbackText').value = snap.docs[0].data().feedback || ""; 
            document.getElementById('submitFeedbackBtn').innerText = "Update Feedback"; 
        } else { 
            userFeedbackDocId = null; 
            updateStarUI(0); 
            document.getElementById('platformFeedbackText').value = ""; 
            document.getElementById('submitFeedbackBtn').innerText = "Submit"; 
        }
    } catch(e) {}
}
function closeFeedbackModal() { document.getElementById('feedbackModal').style.display = 'none'; }
        
async function submitPlatformFeedback() {
    if (!currentUser) return; 
    if (selectedStars === 0) { showNotification("⚠️ Please select a star rating!"); return; }
    const feedbackText = document.getElementById('platformFeedbackText').value.trim(); 
    const btn = document.getElementById('submitFeedbackBtn'); btn.innerText = "Submitting..."; btn.disabled = true;
    try {
        const snap = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get();
        if (!snap.empty) {
            await db.collection("platform_feedback").doc(snap.docs[0].id).update({ rating: selectedStars, feedback: feedbackText, studentName: currentUser.displayName, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            if (snap.docs.length > 1) { for(let i = 1; i < snap.docs.length; i++) await db.collection("platform_feedback").doc(snap.docs[i].id).delete(); }
            showNotification("✅ Feedback updated!");
        } else { 
            await db.collection("platform_feedback").add({ rating: selectedStars, feedback: feedbackText, studentName: currentUser.displayName, studentId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
            showNotification("✅ Thank you!"); 
        }
        closeFeedbackModal(); fetchGlobalRating(); 
    } catch(e) { showNotification("❌ Error: " + e.message); }
    btn.innerText = "Submit"; btn.disabled = false;
}

async function fetchGlobalRating() {
    const display = document.getElementById('global-rating-display'); if(!display) return;
    try {
        const snapshot = await db.collection("platform_feedback").get(); 
        if (snapshot.empty) { display.innerText = "5.0"; return; }
        let total = 0; let count = 0; 
        snapshot.forEach(doc => { total += doc.data().rating; count++; }); 
        display.innerText = (total / count).toFixed(1);
    } catch(e) { display.innerText = "5.0"; }
}
fetchGlobalRating();

// --- RESTORED: DOUBT DIARY ---
async function saveToDoubtDiary() {
    if (!currentUser) { showAuthModal(); return; } 
    if (!lastExtractedQuestion) return;
    try { 
        await db.collection("ai_doubt_diary").add({ userId: currentUser.uid, questionText: lastExtractedQuestion.extractedQuestion, subject: lastExtractedQuestion.subject, solution: lastExtractedQuestion.solution, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
        showNotification("📔 Saved to your Doubt Diary!"); 
    } catch(e) { showNotification("❌ Failed to save: " + e.message); }
}

async function _renderDoubtDiary() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Doubt Diary";
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card"><h2>📔 Loading Doubt Diary...</h2></div>`;
    try {
        const snap = await db.collection("ai_doubt_diary").where("userId", "==", currentUser.uid).get();
        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        if(items.length === 0) { 
            mc.innerHTML = `<div class="card" style="text-align:center;"><h2>📔 Doubt Diary Empty</h2><p style="color:var(--text-muted);">Use the ✨ Ask AI feature to scan questions and save explanations here for rapid revision.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
            return; 
        }
        
        let html = `<div class="card"><h2 style="color:var(--primary-yellow);">📔 Your Saved Explanations</h2><p style="color:var(--text-muted); margin-bottom:20px;">Review your previously solved doubts here.</p>`;
        items.forEach(d => {
            let dateStr = d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleDateString() : '';
            let md = `**Core Concept:** ${d.solution.keyConcept}\n\n**Step-by-Step:**\n${d.solution.stepByStep}\n\n**Final Answer:** ${d.solution.finalAnswer}`;
            html += `<div style="background:#1a1a1a; border-left: 4px solid var(--primary-yellow); padding: 15px; border-radius: 6px; margin-bottom: 20px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${d.subject}</span><span style="font-size:12px; color:var(--text-muted);">${dateStr}</span></div><p style="font-weight:bold; font-size:16px;">Q: ${d.questionText}</p><button onclick="toggleViewAnswer('diary_sol_${d.id}')" style="background:#333; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">👁️ Show Solution</button><div id="diary_sol_${d.id}" class="katex-render-target" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #333; line-height:1.6; font-size:15px;">${marked.parse(md)}</div></div>`;
        });
        html += `<button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
        mc.innerHTML = html;
        document.querySelectorAll('.katex-render-target').forEach(el => { renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] }); });
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}


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

function openAIModal() {
    document.getElementById('aiModal').style.display = 'flex'; 
    document.getElementById('ai-input-view').style.display = 'block';
    document.getElementById('ai-cropper-view').style.display = 'none'; 
    document.getElementById('ai-loading-view').style.display = 'none';
    document.getElementById('ai-chat-view').style.display = 'none'; 
    document.getElementById('ai-idle-view').style.display = 'flex';
    document.getElementById('aiTextInput').value = '';
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    document.getElementById('ai-chat-history').innerHTML = '';
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
        box.innerHTML = `<div class="ai-fuzzy-item" style="color:var(--text-muted);">No direct syllabus match found — AI will solve autonomously using NCERT references 🌐</div>`; 
    } else { 
        box.innerHTML = matches.slice(0, 5).map(m => `<div class="ai-fuzzy-item" onclick="insertAISuggestion('${m.text.replace(/'/g, "\\'")}')"><span>📚 <b>${m.type}:</b>${m.title}</span><span style="font-size:12px; color:var(--primary-yellow);">Use Topic &rarr;</span></div>`).join(''); 
    }
    box.style.display = 'block';
}

function insertAISuggestion(text) { 
    document.getElementById('aiTextInput').value = text + ": "; 
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    document.getElementById('aiTextInput').focus(); 
}

function handleAIImageUpload(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('ai-input-view').style.display = 'none'; 
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
    document.getElementById('ai-input-view').style.display = 'block'; 
    document.getElementById('aiImageInput').value = ""; 
    document.getElementById('aiCameraInput').value = ""; 
}

async function confirmCropAndSolve() {
    if(!cropper) return; 
    const canvas = cropper.getCroppedCanvas(); 
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1]; 
    document.getElementById('ai-cropper-view').style.display = 'none'; 
    document.getElementById('ai-input-view').style.display = 'block';
    await callAIWorker({ image: base64Image, mimeType: 'image/jpeg', mode: 'solve' });
}

async function processAIText() {
    const text = document.getElementById('aiTextInput').value.trim(); 
    if(!text) return showNotification("⚠️ Please type a question.");
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

        if (payload.mode === 'solve') { 
            renderAISolution(data, false); 
        } else {
            document.getElementById('ai-loading-view').style.display = 'none'; 
            document.getElementById('ai-chat-view').style.display = 'flex';
            aiChatHistory.push({ role: 'model', text: data.reply }); 
            let parsedHTML = marked.parse(data.reply);
            const chatDiv = document.createElement('div'); 
            chatDiv.className = 'ai-chat-bubble'; 
            chatDiv.innerHTML = parsedHTML;
            document.getElementById('ai-chat-history').appendChild(chatDiv);
            renderMathInElement(chatDiv, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
            document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight;
        }
    } catch(e) { 
        document.getElementById('ai-loading-view').style.display = 'none'; 
        document.getElementById('ai-idle-view').style.display = 'flex'; 
        showNotification("❌ AI Error: " + e.message); 
    }
}

async function renderAISolution(data, isCached = false) {
    document.getElementById('ai-loading-view').style.display = 'none'; 
    document.getElementById('ai-chat-view').style.display = 'flex';
    
    lastExtractedQuestion = data; 
    aiChatHistory = [{ role: 'user', text: "Solve this: " + data.extractedQuestion }];
    
    let html = `<div class="ai-chat-bubble user-bubble"><b>Extracted Question:</b><br>${data.extractedQuestion}</div>`;
    
    if (isCached) {
        html += `<div class="ai-match-card" style="border-color: var(--primary-yellow); background: rgba(253, 184, 19, 0.15);"><div><b style="color:var(--primary-yellow);">⚡ Instant Cache Match!</b><br><span style="font-size:13px; color:var(--text-light);">Served from Firebase (Zero API Cost)</span></div></div>`;
    } else {
        const isFound = await checkDatabaseForQuestion(data.searchKeywords);
        if (isFound) { 
            html += `<div class="ai-match-card"><div><b style="color:var(--correct-green);">✅ Verified Match in MCQsPrep!</b><br><span style="font-size:13px; color:var(--text-light);">${isFound.path}</span></div><button class="btn-exam" onclick="closeAIModal(); jumpToSection(${JSON.stringify(isFound.path.split(' > ')).replace(/"/g, "'")}); window.location.hash='#/quiz';" style="background:var(--correct-green); border:none; padding:8px 14px; color:white; border-radius:6px;">Go Practice 🚀</button></div>`; 
        } else { 
            html += `<div style="background: rgba(253, 184, 19, 0.1); border: 1px solid rgba(253, 184, 19, 0.4); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; color: #eee;">🌐 <b>Curriculum Knowledge Base Solution:</b> Solved autonomously using verified NCERT syllabus standards.</div>`; 
        }
    }
    
    let solutionMarkdown = `**Subject:** ${data.subject}\n\n**Core Concept:** ${data.solution.keyConcept}\n\n**Step-by-Step Explanation:**\n${data.solution.stepByStep}\n\n**Final Conclusion & Answer:** ${data.solution.finalAnswer}`;
    aiChatHistory.push({ role: 'model', text: solutionMarkdown }); 
    let parsedHTML = marked.parse(solutionMarkdown);
    html += `<div class="ai-chat-bubble" id="ai-sol-bubble">${parsedHTML}</div>`;
    html += `<button class="btn-exam" onclick="saveToDoubtDiary()" style="background:rgba(255,255,255,0.08); color:var(--primary-yellow); width:100%; margin-bottom:15px; border: 1px solid var(--primary-yellow); border-radius:8px;">📔 Save Explanation to Doubt Diary</button>`;

    const historyContainer = document.getElementById('ai-chat-history'); 
    historyContainer.innerHTML = html;
    renderMathInElement(document.getElementById('ai-sol-bubble'), { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
}

async function sendAIFollowUp() {
    const inputEl = document.getElementById('aiFollowUpInput'); 
    const text = inputEl.value.trim(); 
    if(!text) return;
    
    aiChatHistory.push({ role: 'user', text: text });
    const chatDiv = document.createElement('div'); 
    chatDiv.className = 'ai-chat-bubble user-bubble'; 
    chatDiv.innerText = text;
    document.getElementById('ai-chat-history').appendChild(chatDiv); 
    document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight; 
    inputEl.value = '';

    const typingDiv = document.createElement('div'); 
    typingDiv.className = 'ai-chat-bubble'; 
    typingDiv.id = 'ai-typing-indicator'; 
    typingDiv.innerText = "Analyzing follow-up..."; 
    document.getElementById('ai-chat-history').appendChild(typingDiv);
    await callAIWorker({ mode: 'chat', text: text, conversationHistory: aiChatHistory.slice(0, -1) });
    document.getElementById('ai-typing-indicator')?.remove();
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

// --- MAIN VIEW RENDERER ---
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
                <div class="card">
                    <h2 style="color:var(--primary-yellow);">${topicName} Practice</h2>
                    <p style="color:var(--text-muted); margin-bottom:25px;">${!currentUser ? "Sign in to track your scores on the leaderboard!" : `Ready for practice, <span style="color:var(--primary-yellow);">${studentName}</span>?`}</p>
                    <button class="btn-exam" onclick="window.location.hash='#/quiz'" style="background:var(--primary-yellow); color:black; width:200px; margin-right:15px; font-size:16px;">Start Quiz &rarr;</button>
                    <button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; font-size:16px; border:none;">&larr; Go Back</button>
                </div>`;
            } else {
                mc.innerHTML = `
                <div class="card">
                    <h2 style="color:var(--primary-yellow);">${topicName} Resources</h2>
                    <p style="color:var(--text-muted);">Materials will appear here once uploaded via the Admin Panel.</p>
                    <button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; margin-top:20px; font-size:16px; border:none;">&larr; Go Back</button>
                </div>`;
            }
            return;
        }

        let title = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1];
        let h = ``;

        // HOMEPAGE CUSTOM PRACTICE BUTTON
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
        
        for (let key in currentLevel) { 
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
        mc.innerHTML = h;
    } catch(err) {
        console.error("Render View Error:", err);
        document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2>Error Rendering</h2><p>${err.message}</p></div>`;
    }
}

// --- CUSTOM PRACTICE BUILDER ---
let customQuizConfig = { paths: [], count: 20, level: 'Mixed' };

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

function cwStep1() {
    if(!currentUser) { showAuthModal(); return; }
    cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' };
    document.getElementById('breadcrumb-text').innerText = "Home / Custom Practice Setup";
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card">
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
    cwState.exam = exam; 
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / ${exam}`;
    let subjects = getCustomSubjects(exam);
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card">
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
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / Chapters`;
    let leafs = getAllLeafNodes(cwState.subjects);
    document.getElementById('dynamic-content').innerHTML = `
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
    document.getElementById('breadcrumb-text').innerText = `Home / Custom Practice Setup / Configure Quiz`;
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card">
            <h2 style="color:var(--primary-yellow);">🎯 Final Setup</h2>
            <p style="color:var(--text-muted);">Step 4: Choose difficulty and number of questions.</p>
            <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:30px; margin-top:20px;">
                <div style="flex:1; min-width:200px;">
                    <label style="color:var(--text-light); font-weight:bold; margin-bottom:10px; display:block;">Difficulty Level:</label>
                    <select id="cwLevel" class="input-field" style="padding:15px; font-size:16px;">
                        <option value="Mixed">Mixed (All Levels)</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
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
    
    customQuizConfig.paths = cwState.subtopics; 
    customQuizConfig.count = cwState.count; 
    customQuizConfig.level = cwState.level;
    _initiateQuizEngine(true);
}

function requiresQuizLogin(pathArray) {
    const pathString = pathArray.join(" > ").toLowerCase();
    const triggers = ["mcqs practice", "mock test", "general knowledge", "practice paper", "current affairs", "history", "geography", "daily quiz challenge"];
    return triggers.some(trigger => pathString.includes(trigger));
}

// ==========================================
// 6. LEADERBOARDS & STATS
// ==========================================
function _renderLeaderboardOptions() { 
    document.getElementById('breadcrumb-text').innerText = "Home / Leaderboard"; 
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card">
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
        mainContent.innerHTML = `<div class="card"><h2>🏆 Fetching Leaderboard...</h2><div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--wrong-red); padding: 15px; margin: 20px 0; border-radius: 4px;"><span style="color: var(--wrong-red); font-weight: bold;">⚠️ ACCESS DENIED:</span> <span style="color: var(--text-light); font-size: 14px;">You must be signed in with Google to view the global leaderboards.</span></div><button class="btn-exam" onclick="window.location.hash='#/leaderboard'" style="background:#333; border:none;">&larr; Back</button></div>`; 
        return; 
    }

    mainContent.innerHTML = `<div class="card"><h2>🏆 Fetching Leaderboard...</h2></div>`;
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
            mainContent.innerHTML = `<div class="card" style="text-align:center; padding: 40px 20px;"><h2 style="color: var(--primary-yellow); font-size: 28px; margin-bottom: 10px;">🔒 Leaderboard Locked</h2><p style="color: var(--text-muted); font-size: 15px; max-width: 500px; margin: 0 auto 20px auto; line-height: 1.5;">To ensure competitive integrity, you must attempt a minimum of <b style="color: white;">${requiredText}</b> in this specific category before unlocking the global rankings.</p><div style="background: #2a2a2a; border: 1px solid var(--border-color); padding: 15px 25px; border-radius: 8px; display: inline-block; margin-bottom: 30px;"><span style="color: var(--primary-yellow); font-weight: bold; margin-right: 10px;">Your Progress:</span> <span style="color: white; font-weight: bold;">${progressText}</span></div><br><button class="btn-exam" onclick="window.location.hash='#/leaderboard'" style="background:#333; border:none;">&larr; Back to Categories</button></div>`; return;
        }

        const boardSnapshot = await db.collection("leaderboards").where("quizPath", ">=", pathPrefix).where("quizPath", "<=", pathPrefix + "\uf8ff").orderBy("score", "desc").limit(10).get();
        let html = `<div class="card"><h2 style="color:var(--primary-yellow);">🏆 Top 10: ${pathPrefix.split(' > ').pop()}</h2><div style="overflow-x:auto;"><table><tr><th>Rank</th><th>Student</th><th>Score</th><th>Accuracy</th><th>Time</th></tr>`;
        let myRank = ">100"; let inTop10 = false; let docs = [];
        boardSnapshot.forEach(doc => docs.push(doc.data()));

        for(let i = 0; i < docs.length; i++) { if (docs[i].userId === currentUser.uid && docs[i].score === myBestScore) { myRank = i + 1; if (myRank <= 10) inTop10 = true; break; } }
        let displayCount = Math.min(10, docs.length);
        for(let i = 0; i < displayCount; i++) {
            let data = docs[i]; let medal = (i === 0) ? "🥇 " : ((i === 1) ? "🥈 " : ((i === 2) ? "🥉 " : (i + 1) + ". "));
            let isMe = (data.userId === currentUser.uid); let rowStyle = isMe ? `style="background: rgba(253, 184, 19, 0.15);"` : "";
            html += `<tr ${rowStyle}><td>${medal}</td><td><b>${data.userName}</b> ${isMe ? '<span style="color:var(--primary-yellow); font-size:12px; margin-left:5px;">(You)</span>' : ''}</td><td style="color:var(--correct-green); font-weight:bold;">${data.score}</td><td>${data.accuracy}%</td><td>${data.timeStr}</td></tr>`;
        }
        html += `</table></div>`;

        if (!inTop10 && myBestData) { html += `<div style="margin-top: 30px; background: #2a2a2a; border: 1px solid var(--border-color); border-left: 4px solid var(--primary-yellow); padding: 20px; border-radius: 4px;"><h4 style="margin: 0 0 15px 0; color: var(--primary-yellow); font-size: 18px;">Your Personal Best</h4><div style="display: flex; gap: 30px; flex-wrap: wrap;"><div><span style="color:var(--text-muted); font-size:13px;">Global Rank</span><br><b style="font-size:20px; color: white;">${myRank}</b></div><div><span style="color:var(--text-muted); font-size:13px;">Best Score</span><br><b style="font-size:20px; color:var(--correct-green);">${myBestData.score}</b></div><div><span style="color:var(--text-muted); font-size:13px;">Accuracy</span><br><b style="font-size:20px; color: white;">${myBestData.accuracy}%</b></div><div><span style="color:var(--text-muted); font-size:13px;">Total Tests Attempted</span><br><b style="font-size:20px; color: white;">${totalTests}</b></div></div></div>`; }
        html += `<button class="btn-exam" onclick="window.location.hash='#/leaderboard'" style="margin-top:25px; background:#333; border:none;">&larr; Back to Categories</button></div>`;
        mainContent.innerHTML = html;

    } catch(e) { mainContent.innerHTML = `<div class="card"><h2 style="color:var(--wrong-red);">Error</h2><p>${e.message}</p></div>`; }
}

// ==========================================
// 7. QUIZ ENGINE
// ==========================================
let quizState = { questions: [], currentIndex: 0, userAnswers: {}, showAnswerTriggered: {}, flaggedDoubts: {}, viewedQuestions: [], timer: null, secondsPassed: 0, isTimerPaused: false, isCustom: false };

async function _initiateQuizEngine(isCustomLaunch = false) {
    const pathString = currentPath.join(' > ');
    document.getElementById('breadcrumb-text').innerText = "Home / " + (isCustomLaunch ? "Custom Quiz" : pathString + " / Active Quiz"); 
    const mainContent = document.getElementById('dynamic-content');
    mainContent.innerHTML = `<div class="card"><div style="font-size:40px; text-align:center; margin-bottom:15px;">⚙️</div><h2 style="color:var(--primary-yellow); text-align:center;">Building Your Quiz...</h2><p style="text-align:center; color:var(--text-muted);">Fetching and filtering unattempted questions from the database...</p></div>`;

    try {
        let isDailyQuiz = currentPath[0] === 'Daily Quiz Challenge';
        
        let globalAttemptedIds = [];
        if (currentUser) {
            let userDoc = await db.collection("users").doc(currentUser.uid).get();
            if (userDoc.exists) { let d = userDoc.data(); for (let k in d) { if (k.startsWith("prog_")) globalAttemptedIds.push(...d[k]); } }
        } else {
            let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
            for (let k in localProg) { globalAttemptedIds.push(...localProg[k]); }
        }

        let availableQuestions = []; let totalQuestionsInDB = 0;

        if (isCustomLaunch) {
            let unattempted = [];
            for (const p of customQuizConfig.paths) {
                const snap = await db.collection("content").where("path", "==", p).get();
                snap.forEach(doc => {
                    let d = doc.data();
                    if (d.type === 'mcq' && !globalAttemptedIds.includes(doc.id)) {
                        if (customQuizConfig.level === 'Mixed' || d.level === customQuizConfig.level || (!d.level && customQuizConfig.level === 'Mixed')) {
                            unattempted.push({id: doc.id, ...d});
                        }
                    }
                });
            }
            totalQuestionsInDB = unattempted.length;
            availableQuestions = unattempted.sort(()=>0.5-Math.random()).slice(0, customQuizConfig.count);
            quizState.questions = availableQuestions;
            quizState.isCustom = true;

        } else if (isDailyQuiz) {
            let targetPrefix = currentPath[1] === "NEET" ? "NEET" : "General Knowledge";
            let snap = await db.collection("content").where("path", ">=", targetPrefix).where("path", "<=", targetPrefix + "\uf8ff").get();
            let unattempted = [];
            snap.forEach(doc => { let data = doc.data(); if (data.type === 'mcq' && !globalAttemptedIds.includes(doc.id)) { unattempted.push({id: doc.id, ...data}); } });

            if (currentPath[1] === "NEET") {
                let bot = unattempted.filter(q => q.path.includes("Botany")).sort(()=>0.5-Math.random()); let zoo = unattempted.filter(q => q.path.includes("Zoology")).sort(()=>0.5-Math.random());
                let phy = unattempted.filter(q => q.path.includes("Physics")).sort(()=>0.5-Math.random()); let pChem = unattempted.filter(q => q.path.includes("Physical Chemistry")).sort(()=>0.5-Math.random());
                let oChem = unattempted.filter(q => q.path.includes("Organic Chemistry")).sort(()=>0.5-Math.random()); let iChem = unattempted.filter(q => q.path.includes("Inorganic Chemistry")).sort(()=>0.5-Math.random());
                
                availableQuestions.push(...bot.slice(0, 5), ...zoo.slice(0, 5), ...phy.slice(0, 4), ...pChem.slice(0, 2), ...oChem.slice(0, 2), ...iChem.slice(0, 2));
                totalQuestionsInDB = 20; 
            } else { 
                availableQuestions = unattempted.sort(()=>0.5-Math.random()).slice(0, 20); totalQuestionsInDB = 20;
            }
            quizState.questions = availableQuestions.sort(() => Math.random() - 0.5);
            quizState.isCustom = false;

        } else {
            let snapshot = await db.collection("content").where("path", ">=", pathString).where("path", "<=", pathString + "\uf8ff").get();
            let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_'); let previouslyAttemptedIds = [];
            if (currentUser) { let userDoc = await db.collection("users").doc(currentUser.uid).get(); if (userDoc.exists) previouslyAttemptedIds = userDoc.data()[safePath] || []; } 
            else { let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}'); previouslyAttemptedIds = localProg[safePath] || []; }

            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.type === 'mcq') { totalQuestionsInDB++; if (!previouslyAttemptedIds.includes(doc.id)) { availableQuestions.push({ id: doc.id, ...data }); } }
            });
            quizState.questions = availableQuestions.sort(() => Math.random() - 0.5);
            quizState.isCustom = false;
        }

        if (availableQuestions.length === 0) { 
            if(isCustomLaunch) mainContent.innerHTML = `<div class="card" style="text-align:center;"><h2>No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find any unattempted questions matching your selected chapters and difficulty level.</p><button class="btn-exam" onclick="goHome()" style="background:#333; border:none;">&larr; Go Back</button></div>`;
            else if(totalQuestionsInDB === 0) mainContent.innerHTML = `<div class="card"><h2>No Questions Available</h2><p style="color:var(--text-muted);">Not enough questions available in the database for this section.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Go Back</button></div>`; 
            else {
                let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
                mainContent.innerHTML = `<div class="card" style="text-align:center; padding: 40px 20px;"><h2 style="color: var(--primary-yellow); font-size: 28px; margin-bottom: 15px;">🎉 Section Completed!</h2><p style="color: var(--text-muted); font-size: 16px; margin-bottom: 25px;">You have successfully attempted all available questions in this section.</p><div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap;"><button class="btn-exam" onclick="resetProgress('${safePath}')" style="background: #333; color: white; border:none;">🔄 Reset My Progress</button><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">&larr; Explore Other Topics</button></div></div>`;
            }
            return; 
        }
        
        quizState.currentIndex = 0; quizState.userAnswers = {}; quizState.showAnswerTriggered = {}; quizState.flaggedDoubts = {}; quizState.viewedQuestions = []; quizState.secondsPassed = 0; quizState.isTimerPaused = false;
        
        clearInterval(quizState.timer);
        quizState.timer = setInterval(() => {
            if (!quizState.isTimerPaused) { quizState.secondsPassed++; let disp = document.getElementById('quizTimeDisplay'); if(disp) disp.innerText = formatTime(quizState.secondsPassed); }
        }, 1000);
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
    if(currentSelections.length === 0) { showNotification("⚠️ Select an option first!"); return; }
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
    let attempted = 0; let totalScore = 0; let correctCount = 0; let wrongCount = 0;
    let sessionAttemptedIds = []; let skippedCount = 0; let isDailyQuiz = currentPath[0] === 'Daily Quiz Challenge';
    let correctHtml = ''; let wrongHtml = ''; let skippedHtml = ''; let flaggedListHtml = '';
    
    let isNeetSection = isDailyQuiz ? (currentPath[1] === "NEET") : (currentPath[0] === "NEET");
    if(quizState.isCustom) {
        isNeetSection = customQuizConfig.paths.some(p => p.includes("NEET"));
    }

    quizState.questions.forEach((q, index) => {
        let userAnsArray = quizState.userAnswers[index] || []; let isAttempted = userAnsArray.length > 0; let isCorrect = false; let isViewed = quizState.viewedQuestions.includes(index);
        if (isAttempted) { attempted++; sessionAttemptedIds.push(q.id); let userAnsStr = userAnsArray.sort().join(','); let correctAnsStr = q.correctAnswers.sort().join(','); if (userAnsStr === correctAnsStr) { isCorrect = true; correctCount++; } }
        if (isAttempted && !isCorrect) wrongCount++;
        if (isAttempted) { if (isCorrect) correctHtml += buildReviewItemHtml(q, index, 'correct', userAnsArray); else wrongHtml += buildReviewItemHtml(q, index, 'wrong', userAnsArray); } 
        else if (isViewed) { skippedCount++; skippedHtml += buildReviewItemHtml(q, index, 'skipped', []); }

        if (isNeetSection) { if (isCorrect) totalScore += 4; else if (isAttempted && !isCorrect) totalScore -= 1; } else { if (isCorrect) totalScore += 1; }

        if(quizState.flaggedDoubts[index]) {
            flaggedListHtml += `<div style="background:#2a2a2a; border-left:4px solid var(--primary-yellow); padding:15px; margin-bottom:15px; text-align:left;"><p style="margin-top:0;"><b>Q:</b> ${q.question}</p><p style="color:var(--text-muted); font-size:14px;"><b>Explanation:</b> ${q.explanation || 'None'}</p></div>`;
            if (currentUser) { db.collection("flagged_doubts").add({ studentId: currentUser.uid, studentName: currentUser.displayName, questionId: q.id, questionText: q.question, path: q.path, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }
        }
    });

    if (sessionAttemptedIds.length > 0 && !isDailyQuiz && !quizState.isCustom) { 
        let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
        if (currentUser) { let dataToSave = {}; dataToSave[safePath] = firebase.firestore.FieldValue.arrayUnion(...sessionAttemptedIds); db.collection("users").doc(currentUser.uid).set(dataToSave, {merge: true}); } 
        else { let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}'); localProg[safePath] = [...(localProg[safePath] || []), ...sessionAttemptedIds]; localStorage.setItem('mcq_progress', JSON.stringify(localProg)); }
    } else if (sessionAttemptedIds.length > 0 && quizState.isCustom) {
        if (currentUser) { 
            let dataToSave = {}; 
            quizState.questions.forEach((q) => {
                if(sessionAttemptedIds.includes(q.id)) {
                    let safePath = "prog_" + q.path.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g, '_');
                    if(!dataToSave[safePath]) dataToSave[safePath] = [];
                    dataToSave[safePath].push(q.id);
                }
            });
            for(let k in dataToSave) { dataToSave[k] = firebase.firestore.FieldValue.arrayUnion(...dataToSave[k]); }
            db.collection("users").doc(currentUser.uid).set(dataToSave, {merge: true}); 
        } 
        else { 
            let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}'); 
            quizState.questions.forEach((q) => {
                if(sessionAttemptedIds.includes(q.id)) {
                    let safePath = "prog_" + q.path.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g, '_');
                    localProg[safePath] = [...(localProg[safePath] || []), q.id];
                }
            });
            localStorage.setItem('mcq_progress', JSON.stringify(localProg)); 
        }
    } else if (sessionAttemptedIds.length > 0 && isDailyQuiz) {
        if (currentUser) { db.collection("users").doc(currentUser.uid).set({ prog_daily_challenge: firebase.firestore.FieldValue.arrayUnion(...sessionAttemptedIds)}, {merge: true}); } 
        else { let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}'); localProg["prog_daily_challenge"] = [...(localProg["prog_daily_challenge"] || []), ...sessionAttemptedIds]; localStorage.setItem('mcq_progress', JSON.stringify(localProg)); }
    }

    let accuracy = attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100); 
    let timeStr = formatTime(quizState.secondsPassed); let pathString = quizState.isCustom ? "Custom Practice" : currentPath.join(' > '); let studentName = currentUser ? currentUser.displayName.split(" ")[0] : "Student";

    if (currentUser && attempted > 0 && !isDailyQuiz) { db.collection("leaderboards").add({ userId: currentUser.uid, userName: currentUser.displayName, quizPath: pathString, score: totalScore, accuracy: accuracy, timeStr: timeStr, attemptedQuestions: attempted, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }

    let scoreCardsHtml = '';
    if (isNeetSection) {
        scoreCardsHtml = `<div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${attempted * 4}</div><div style="color: var(--text-muted); font-size: 14px;">Total Marks</div><div style="color: var(--text-muted); font-size: 11px; margin-top:5px;">(${attempted}x4)</div></div><div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1; border: 1px solid var(--primary-yellow);"><div style="font-size: 32px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div><div style="color: var(--text-muted); font-size: 14px;">Obtained Mark</div><div style="color: var(--text-muted); font-size: 11px; margin-top:5px;">(${correctCount}x4) - ${wrongCount}</div></div>`;
    } else {
        scoreCardsHtml = `<div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 120px; flex: 1; border: 1px solid var(--primary-yellow);"><div style="font-size: 32px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div><div style="color: var(--text-muted); font-size: 14px;">Total Score</div></div>`;
    }

    const mainContent = document.getElementById('dynamic-content');
    mainContent.innerHTML = `
        <div class="card" style="text-align: center;">
            <h2 style="font-size: 32px; color: var(--primary-yellow); margin-bottom: 5px;">Test Complete!</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Great effort, ${studentName}! Here is your final breakdown.</p>
            ${isDailyQuiz ? `<div style="background:rgba(253, 184, 19, 0.1); border-left:4px solid var(--primary-yellow); padding:10px; margin-bottom:20px; border-radius:4px; font-size:14px; text-align:left;"><b style="color:var(--primary-yellow);">Daily Challenge Note:</b> This score is temporary and is not added to the global leaderboard. Come back tomorrow for 20 new questions!</div>` : ''}
            <div style="display:flex; justify-content:center; gap:15px; flex-wrap:wrap; margin-bottom: 40px;">
                ${scoreCardsHtml}
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${attempted}</div><div style="color: var(--text-muted); font-size: 14px;">Attempted</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: var(--correct-green); font-weight: bold;">${acc}%</div><div style="color: var(--text-muted); font-size: 14px;">Accuracy</div></div>
                <div style="background:#2a2a2a; padding: 20px; border-radius: 8px; min-width: 100px; flex: 1;"><div style="font-size: 32px; color: white; font-weight: bold;">${timeStr}</div><div style="color: var(--text-muted); font-size: 14px;">Time Taken</div></div>
            </div>
            <h3 style="margin-top:20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); text-align: left;">📊 Detailed Analysis</h3>
            <div class="review-tabs"><button class="review-tab-btn" onclick="showReviewTab('correct')" style="color:var(--correct-green);">✅ Correct (${correctCount})</button><button class="review-tab-btn" onclick="showReviewTab('wrong')" style="color:var(--wrong-red);">❌ Wrong (${wrongCount})</button><button class="review-tab-btn" onclick="showReviewTab('skipped')" style="color:var(--primary-yellow);">⏭️ Skipped (${skippedCount})</button></div>
            <div id="review-correct" style="display:block;">${correctHtml || '<p>No correct answers.</p>'}</div>
            <div id="review-wrong" style="display:none;">${wrongHtml || '<p>No wrong answers!</p>'}</div>
            <div id="review-skipped" style="display:none;">${skippedHtml || '<p>No skipped questions.</p>'}</div>
            ${flaggedListHtml !== '' ? `<h3 style="text-align:left; color:var(--primary-yellow); margin-top: 40px;">⭐ Sent to Admin</h3>${flaggedListHtml}` : ''}
            <button class="btn-exam" onclick="goHome()" style="width: 250px; margin-top:30px; background:#333; border:none;">&larr; Exit to Dashboard</button>
        </div>
    `;
    
    document.querySelectorAll('.katex-render-target, .review-item').forEach(el => {
        renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
    });
}
