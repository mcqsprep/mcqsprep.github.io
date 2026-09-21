const firebaseConfig = { apiKey: "AIzaSyDuletjxV1THjWvWLvO0XqB_z5xBBXLwL8", authDomain: "mcqsprep.firebaseapp.com", projectId: "mcqsprep", storageBucket: "mcqsprep.firebasestorage.app", messagingSenderId: "920181103186", appId: "1:920181103186:web:14c2ba261d4a6163db5d8b" };
firebase.initializeApp(firebaseConfig); const db = firebase.firestore(); const auth = firebase.auth(); const provider = new firebase.auth.GoogleAuthProvider();
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; const CLOUDINARY_PRESET = "mcq_uploads"; const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

let appData = { "Daily Quiz Challenge": { "NEET": {}, "General Knowledge": {} }, "NEET": { "NCERT Book": {}, "PYQs": {}, "Practice Paper": {}, "MCQs Practice": { "Botany": {}, "Zoology": {}, "Physics": {}, "Organic Chemistry": {}, "Physical Chemistry": {}, "Inorganic Chemistry": {} }, "Mock Test": {} }, "General Knowledge": { "Current Affairs": {}, "History": {}, "Geography": {} } };
let customTopicTypes = {}; let currentUser = null; let currentPath = []; let dataLoaded = false; 

async function loadCustomTopics() {
    try { const s = await db.collection("custom_topics").get(); s.forEach(d => { let obj = d.data(); let pts = (obj.parentPath||"").split(' > '); let c = appData; for(let p of pts) { if(p) { if(!c[p]) c[p]={}; c=c[p]; } } if(typeof c==='object' && !Array.isArray(c) && obj.name) { if(!c[obj.name]) c[obj.name]={}; customTopicTypes[obj.parentPath+" > "+obj.name] = obj.type; } }); } catch(e){}
}

function showAuthModal() { document.getElementById('authModal').style.display='flex'; }
function skipSignIn() { sessionStorage.setItem('auth_skipped', 'true'); document.getElementById('authModal').style.display='none'; }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('active'); }
window.addEventListener('click', e => { if(!document.getElementById('userBadge').contains(e.target) && !document.getElementById('profileMenu').contains(e.target)) document.getElementById('profileMenu').classList.remove('active'); });

async function initApp() { await loadCustomTopics(); dataLoaded = true; if (!window.location.hash) window.location.hash = '#/home'; handleRouting(); }

auth.onAuthStateChanged(u => {
    currentUser = u; const bdg = document.getElementById('userBadge'); const logBtn = document.getElementById('loginNavBtn');
    if (u) {
        document.getElementById('userNameDisplay').innerText = u.displayName ? u.displayName.split(" ")[0] : "User";
        if(u.photoURL) { document.getElementById('userPhotoDisplay').src = u.photoURL; document.getElementById('userPhotoDisplay').style.display = 'block'; }
        bdg.style.display = 'flex'; logBtn.style.display = 'none'; document.getElementById('authModal').style.display = 'none';
        db.collection("users").doc(u.uid).set({ displayName: u.displayName, email: u.email, photoURL: u.photoURL, lastLogin: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); checkUserNotifications();
    } else {
        bdg.style.display = 'none'; logBtn.style.display = 'flex'; document.getElementById('profileNotifDot').style.display = 'none';
        if (window.location.hash !== '#/admin' && window.location.hash !== '#/admin-panel' && !sessionStorage.getItem('auth_skipped')) document.getElementById('authModal').style.display = 'flex';
    } if (dataLoaded) handleRouting(); 
});
initApp(); 

function signInWithGoogle() { auth.signInWithPopup(provider).catch(e => showNotification("❌ Error")); }
function signOut() { if(confirm("Sign out?")) auth.signOut(); }
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    if(!dataLoaded) return; 
    let h = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')); let isH = (!h || h === 'home');
    document.getElementById('main-sidebar').style.display = isH ? 'block' : 'none';
    if (isH) { currentPath = []; _renderView(); } 
    else if (h.startsWith('path/')) { currentPath = h.replace('path/', '').split('/'); _renderView(); } 
    else if (h === 'leaderboard') _renderLeaderboardOptions(); 
    else if (h.startsWith('board/')) fetchLiveLeaderboard(h.replace('board/', '')); 
    else if (h === 'quiz') _initiateQuizEngine(); 
    else if (h === 'progress') _renderProgress(); 
    else if (h === 'streak') _renderStreak(); 
    else if (h === 'diary') _renderDoubtDiary(); 
    else if (h === 'admin') _renderAdminLogin(); 
    else if (h === 'admin-panel') _renderAdminPanel();
}

function goHome() { window.location.hash = '#/home'; }
function navigateTo(k) { window.location.hash = '#/path/' + encodeURIComponent([...currentPath, k].join('/')).replace(/%2F/g, '/'); }
function jumpToSection(a) { window.location.hash = '#/path/' + encodeURIComponent(a.join('/')).replace(/%2F/g, '/'); }
function showLeaderboardOptions() { window.location.hash = '#/leaderboard'; }
function goBack() { window.history.back(); }

let activeTime = 0; setInterval(() => { let t = new Date(new Date().getTime()-(new Date().getTimezoneOffset()*60000)).toISOString().split('T')[0]; if (currentUser && !localStorage.getItem('streak_'+t)) { activeTime++; if (activeTime >= 300) { localStorage.setItem('streak_'+t, 'true'); logStreakActivity(t); } } }, 1000);
async function logStreakActivity(t) { try { await db.collection("users").doc(currentUser.uid).set({ activeDates: firebase.firestore.FieldValue.arrayUnion(t) }, { merge: true }); showNotification("🔥 Streak Updated!"); } catch(e){} }
function calculateStreak(arr) { if (!arr || arr.length===0) return 0; let s=[...new Set(arr)].sort().reverse(); let t=new Date(new Date().getTime()-(new Date().getTimezoneOffset()*60000)).toISOString().split('T')[0]; let yD=new Date(); yD.setDate(yD.getDate()-1); let yS=new Date(yD.getTime()-(yD.getTimezoneOffset()*60000)).toISOString().split('T')[0]; if(!s.includes(t)&&!s.includes(yS)) return 0; let str=0; let cD=new Date(); if(!s.includes(t)) cD.setDate(cD.getDate()-1); for(let i=0;i<365;i++){ let dS=new Date(cD.getTime()-(cD.getTimezoneOffset()*60000)).toISOString().split('T')[0]; if(s.includes(dS)){ str++; cD.setDate(cD.getDate()-1); }else break; } return str; }

async function _renderStreak() {
    const mc = document.getElementById('dynamic-content'); document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Streak";
    if (!currentUser) return mc.innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`;
    mc.innerHTML = `<div class="card"><h2>🔥 Fetching...</h2></div>`;
    try { let d = await db.collection("users").doc(currentUser.uid).get(); let arr = d.exists ? (d.data().activeDates||[]) : []; let st = calculateStreak(arr); let h = `<ul style="list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;">${[...new Set(arr)].sort().reverse().slice(0,14).map(x=>`<li style="background:#2a2a2a;padding:8px 12px;border-radius:6px;border:1px solid var(--correct-green);color:var(--correct-green);font-weight:bold;">✅ ${x}</li>`).join('')}</ul>`; mc.innerHTML = `<div class="card" style="text-align:center;"><h2 style="color:var(--primary-yellow);">🔥 Daily Streak</h2><div style="font-size:80px;margin:20px 0;">🔥</div><div style="font-size:32px;font-weight:bold;margin-bottom:10px;">${st} Day${st!==1?'s':''}</div><p style="color:var(--text-muted);margin-bottom:30px;"><i>Practice 5 mins daily!</i></p>${h}<button class="btn-exam" onclick="goBack()" style="margin-top:20px;">Back</button></div>`; } catch(e){}
}

async function _renderProgress() {
    const mc = document.getElementById('dynamic-content'); document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    if (!currentUser) return mc.innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`;
    mc.innerHTML = `<div class="card"><h2>📊 Fetching...</h2></div>`;
    try { const s = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get(); let tQ=0; let tC=0; let aS=0; s.forEach(doc=>{ let d=doc.data(); tQ+=(d.attemptedQuestions||0); aS+=(d.accuracy||0); tC++; }); let avg = tC>0?Math.round(aS/tC):0; mc.innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">📊 Overall Progress</h2><div style="display:flex;gap:15px;flex-wrap:wrap;margin-top:20px;"><div style="background:#2a2a2a;padding:20px;border-radius:8px;flex:1;text-align:center;border:1px solid #333;"><div style="font-size:32px;font-weight:bold;">${tC}</div><div style="color:var(--text-muted);font-size:14px;">Quizzes</div></div><div style="background:#2a2a2a;padding:20px;border-radius:8px;flex:1;text-align:center;border:1px solid #333;"><div style="font-size:32px;color:var(--correct-green);font-weight:bold;">${avg}%</div><div style="color:var(--text-muted);font-size:14px;">Accuracy</div></div><div style="background:#2a2a2a;padding:20px;border-radius:8px;flex:1;text-align:center;border:1px solid var(--primary-yellow);"><div style="font-size:32px;color:var(--primary-yellow);font-weight:bold;">${tQ}</div><div style="color:var(--text-muted);font-size:14px;">Questions Solved</div></div></div><button class="btn-exam" onclick="goBack()" style="margin-top:30px;">Back</button></div>`; } catch(e){}
}

async function checkUserNotifications() {
    if(!currentUser) return;
    try { let h=false; let r = await db.collection("reported_mistakes").where("studentId","==",currentUser.uid).get(); r.forEach(doc=>{if(doc.data().status==='resolved'&&!doc.data().seenByStudent) h=true;}); let f = await db.collection("flagged_doubts").where("studentId","==",currentUser.uid).get(); f.forEach(doc=>{if(doc.data().status==='resolved'&&!doc.data().seenByStudent) h=true;}); if(h){ document.getElementById('profileNotifDot').style.display='block'; document.getElementById('reportMenuDot').style.display='inline'; } } catch(e){}
}

let tempReportTarget = null;
function openReportModal(qId, qText, qPath) { if(!currentUser) return showAuthModal(); tempReportTarget = { id: qId, text: qText, path: qPath }; document.getElementById('reportModal').style.display = 'flex'; }
function closeReportModal() { document.getElementById('reportModal').style.display = 'none'; tempReportTarget = null; }
async function submitReport() { if(!currentUser || !tempReportTarget) return; const b = document.querySelector('#reportModal .btn-exam'); b.innerText = "Submitting..."; b.disabled = true; try { await db.collection("reported_mistakes").add({ studentId: currentUser.uid, studentName: currentUser.displayName, questionId: tempReportTarget.id, questionText: tempReportTarget.text, path: tempReportTarget.path, reason: document.getElementById('reportReason').value, description: document.getElementById('reportDescription').value, status: 'pending', seenByStudent: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("✅ Submitted!"); closeReportModal(); document.getElementById('reportDescription').value = ""; } catch(e){} b.innerText = "Submit"; b.disabled = false; }

async function openUserReportsModal() {
    if(!currentUser) return; document.getElementById('userReportsModal').style.display='flex'; document.getElementById('profileNotifDot').style.display='none'; document.getElementById('reportMenuDot').style.display='none'; const lst = document.getElementById('user-reports-list'); lst.innerHTML = `<p style="color:var(--primary-yellow);">Loading...</p>`;
    try { let h=''; let c=0; let arr=[]; let rS=await db.collection("reported_mistakes").where("studentId","==",currentUser.uid).get(); rS.forEach(doc=>arr.push({_id:doc.id,_type:'report',...doc.data()})); let fS=await db.collection("flagged_doubts").where("studentId","==",currentUser.uid).get(); fS.forEach(doc=>arr.push({_id:doc.id,_type:'flag',...doc.data()})); arr.sort((a,b)=>(b.timestamp?.toMillis()||0)-(a.timestamp?.toMillis()||0)); arr.forEach(d=>{ c++; let bdg = d.status==='resolved'?`<span style="background:var(--correct-green);padding:2px 6px;border-radius:4px;font-size:11px;">✅ ${d._type==='flag'?'Reviewed':'Fixed'}</span>`:`<span style="background:#555;padding:2px 6px;border-radius:4px;font-size:11px;">⏳ Pending</span>`; let t = d._type==='flag'?'⭐ Doubt':`<b>${d.reason}</b>`; h+=`<div style="background:#1a1a1a;padding:12px;border:1px solid #333;border-radius:6px;margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;">${t}${bdg}</div><p style="font-size:13px;color:#aaa;margin:0;">${d.questionText}</p></div>`; if(d.status==='resolved'&&!d.seenByStudent) db.collection(d._type==='flag'?"flagged_doubts":"reported_mistakes").doc(d._id).update({seenByStudent:true}); }); lst.innerHTML = c===0?`<p>No reports.</p>`:h; } catch(e){}
}
function closeUserReportsModal() { document.getElementById('userReportsModal').style.display = 'none'; }

// --- AI LOGIC ---
const aiBtn = document.getElementById('ai-floating-btn'); let pressTimer; let isDragging = false; let sX, sY, iX, iY;
aiBtn.addEventListener('mousedown', sP); aiBtn.addEventListener('touchstart', sP, {passive: true}); document.addEventListener('mouseup', eP); document.addEventListener('touchend', eP); document.addEventListener('mousemove', dR); document.addEventListener('touchmove', dR, {passive: false});
function sP(e) { if(e.type === 'touchstart') { iX = e.touches[0].clientX - aiBtn.getBoundingClientRect().left; iY = e.touches[0].clientY - aiBtn.getBoundingClientRect().top; } else { iX = e.clientX - aiBtn.getBoundingClientRect().left; iY = e.clientY - aiBtn.getBoundingClientRect().top; } isDragging = false; pressTimer = setTimeout(() => { isDragging = true; aiBtn.classList.add('draggable'); }, 500); }
function dR(e) { if (!isDragging) return; e.preventDefault(); let cX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX; let cY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY; let nL = cX - iX; let nT = cY - iY; if (nL < 0) nL = 0; if (nT < 0) nT = 0; if (nL > window.innerWidth - aiBtn.offsetWidth) nL = window.innerWidth - aiBtn.offsetWidth; if (nT > window.innerHeight - aiBtn.offsetHeight) nT = window.innerHeight - aiBtn.offsetHeight; aiBtn.style.left = nL + 'px'; aiBtn.style.top = nT + 'px'; aiBtn.style.right = 'auto'; aiBtn.style.bottom = 'auto'; }
function eP(e) { clearTimeout(pressTimer); if (isDragging) { isDragging = false; aiBtn.classList.remove('draggable'); } else if (e.target === aiBtn || aiBtn.contains(e.target)) openAIModal(); }

let cropper = null; let aiChatHistory = []; let lastExtractedQuestion = null;
function openAIModal() { document.getElementById('aiModal').style.display='flex'; document.getElementById('ai-input-view').style.display='block'; document.getElementById('ai-cropper-view').style.display='none'; document.getElementById('ai-loading-view').style.display='none'; document.getElementById('ai-chat-view').style.display='none'; document.getElementById('ai-idle-view').style.display='flex'; document.getElementById('aiTextInput').value=''; document.getElementById('ai-fuzzy-box').style.display='none'; document.getElementById('ai-chat-history').innerHTML=''; aiChatHistory=[]; lastExtractedQuestion=null; }
function closeAIModal() { document.getElementById('aiModal').style.display='none'; if(cropper) { cropper.destroy(); cropper=null; } }
function handleAIFuzzySuggestions() { document.getElementById('ai-fuzzy-box').style.display='none'; }
function handleAIImageUpload(e) { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => { document.getElementById('ai-input-view').style.display='none'; document.getElementById('ai-cropper-view').style.display='flex'; const img = document.getElementById('aiCropperImage'); img.src = ev.target.result; if(cropper) cropper.destroy(); cropper = new Cropper(img, { viewMode: 1, autoCropArea: 0.85, background: false }); }; r.readAsDataURL(f); }
function cancelCropper() { if(cropper) { cropper.destroy(); cropper=null; } document.getElementById('ai-cropper-view').style.display='none'; document.getElementById('ai-input-view').style.display='block'; document.getElementById('aiImageInput').value=""; document.getElementById('aiCameraInput').value=""; }
async function confirmCropAndSolve() { if(!cropper) return; const c = cropper.getCroppedCanvas(); const b64 = c.toDataURL('image/jpeg').split(',')[1]; document.getElementById('ai-cropper-view').style.display='none'; document.getElementById('ai-input-view').style.display='block'; await callAIWorker({ image: b64, mimeType: 'image/jpeg', mode: 'solve' }); }
async function processAIText() { const t = document.getElementById('aiTextInput').value.trim(); if(!t) return; document.getElementById('ai-idle-view').style.display='none'; document.getElementById('ai-loading-view').style.display='flex'; await callAIWorker({ text: t, mode: 'solve' }); }
async function callAIWorker(p) {
    document.getElementById('ai-idle-view').style.display='none'; document.getElementById('ai-loading-view').style.display='flex';
    try {
        const r = await fetch(AI_WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); const d = await r.json(); if(d.error) throw new Error(d.error);
        if (p.mode === 'solve') { 
            document.getElementById('ai-loading-view').style.display='none'; document.getElementById('ai-chat-view').style.display='flex'; lastExtractedQuestion = d; aiChatHistory = [{ role: 'user', text: "Solve this: " + d.extractedQuestion }];
            let h = `<div class="ai-chat-bubble user-bubble"><b>Extracted Question:</b><br>${d.extractedQuestion}</div><div style="background:rgba(253,184,19,.1); border:1px solid rgba(253,184,19,.4); padding:12px; border-radius:8px; margin-bottom:16px; font-size:14px;">🌐 <b>Knowledge Base Solution</b></div>`;
            let md = `**Subject:** ${d.subject}\n\n**Core Concept:** ${d.solution.keyConcept}\n\n**Step-by-Step:**\n${d.solution.stepByStep}\n\n**Final Answer:** ${d.solution.finalAnswer}`;
            aiChatHistory.push({ role: 'model', text: md }); h += `<div class="ai-chat-bubble" id="ai-sol-bubble">${marked.parse(md)}</div><button class="btn-exam" onclick="saveToDoubtDiary()" style="background:rgba(255,255,255,.08); color:var(--primary-yellow); width:100%; border:1px solid var(--primary-yellow); margin-bottom:15px;">📔 Save to Doubt Diary</button>`;
            document.getElementById('ai-chat-history').innerHTML = h; renderMathInElement(document.getElementById('ai-sol-bubble'), { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false} ] });
        } else {
            document.getElementById('ai-loading-view').style.display='none'; document.getElementById('ai-chat-view').style.display='flex'; aiChatHistory.push({ role: 'model', text: d.reply });
            const cDiv = document.createElement('div'); cDiv.className = 'ai-chat-bubble'; cDiv.innerHTML = marked.parse(d.reply); document.getElementById('ai-chat-history').appendChild(cDiv); renderMathInElement(cDiv, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false} ] }); document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight;
        }
    } catch(e) { document.getElementById('ai-loading-view').style.display='none'; document.getElementById('ai-idle-view').style.display='flex'; showNotification("❌ AI Error"); }
}
async function sendAIFollowUp() { const iE = document.getElementById('aiFollowUpInput'); const t = iE.value.trim(); if(!t) return; aiChatHistory.push({ role: 'user', text: t }); const cDiv = document.createElement('div'); cDiv.className = 'ai-chat-bubble user-bubble'; cDiv.innerText = t; document.getElementById('ai-chat-history').appendChild(cDiv); document.getElementById('ai-chat-history').scrollTop = document.getElementById('ai-chat-history').scrollHeight; iE.value = ''; await callAIWorker({ mode: 'chat', text: t, conversationHistory: aiChatHistory.slice(0, -1) }); }
async function saveToDoubtDiary() { if (!currentUser) return showAuthModal(); try { await db.collection("ai_doubt_diary").add({ userId: currentUser.uid, questionText: lastExtractedQuestion.extractedQuestion, subject: lastExtractedQuestion.subject, solution: lastExtractedQuestion.solution, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("📔 Saved!"); } catch(e){} }
async function _renderDoubtDiary() { const mc = document.getElementById('dynamic-content'); document.getElementById('breadcrumb-text').innerText = "Home / Doubt Diary"; if (!currentUser) return mc.innerHTML = `<div class="card" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`; mc.innerHTML = `<div class="card"><h2>📔 Loading...</h2></div>`; try { const s = await db.collection("ai_doubt_diary").where("userId", "==", currentUser.uid).get(); let arr = []; s.forEach(doc => arr.push({ id: doc.id, ...doc.data() })); arr.sort((a,b) => (b.timestamp?.toMillis()||0) - (a.timestamp?.toMillis()||0)); if(arr.length === 0) return mc.innerHTML = `<div class="card" style="text-align:center;"><h2>📔 Empty</h2><button class="btn-exam" onclick="goBack()">Back</button></div>`; let h = `<div class="card"><h2 style="color:var(--primary-yellow);">📔 Saved Explanations</h2>`; arr.forEach(d => { let md = `**Concept:** ${d.solution.keyConcept}\n\n**Steps:**\n${d.solution.stepByStep}\n\n**Answer:** ${d.solution.finalAnswer}`; h += `<div style="background:#1a1a1a; border-left:4px solid var(--primary-yellow); padding:15px; margin-bottom:20px;"><b>Q: ${d.questionText}</b><br><button onclick="toggleViewAnswer('ds_${d.id}')" style="background:#333; color:white; border:none; padding:6px 12px; margin-top:10px; border-radius:4px; cursor:pointer;">👁️ Solution</button><div id="ds_${d.id}" class="katex-render-target" style="display:none; margin-top:15px; padding-top:15px; border-top:1px solid #333;">${marked.parse(md)}</div></div>`; }); h += `<button class="btn-exam" onclick="goBack()">Back</button></div>`; mc.innerHTML = h; document.querySelectorAll('.katex-render-target').forEach(el => renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false} ] })); } catch(e){} }

// --- FEEDBACK LOGIC ---
let selectedStars = 0; function updateStarUI(s) { selectedStars = s; for(let i=1; i<=5; i++) { document.getElementById('star-'+i).classList.remove('active'); if(i<=s) document.getElementById('star-'+i).classList.add('active'); } }
async function openFeedbackModal() { if (!currentUser) return showAuthModal(); document.getElementById('feedbackModal').style.display = 'flex'; try { const s = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get(); if (!s.empty) { updateStarUI(s.docs[0].data().rating||0); document.getElementById('platformFeedbackText').value = s.docs[0].data().feedback||""; document.getElementById('submitFeedbackBtn').innerText = "Update"; } else { updateStarUI(0); document.getElementById('platformFeedbackText').value = ""; document.getElementById('submitFeedbackBtn').innerText = "Submit"; } } catch(e){} }
function closeFeedbackModal() { document.getElementById('feedbackModal').style.display = 'none'; }
async function submitPlatformFeedback() { if (!currentUser || selectedStars===0) return; const b = document.getElementById('submitFeedbackBtn'); b.innerText = "Submitting..."; b.disabled = true; try { const s = await db.collection("platform_feedback").where("studentId", "==", currentUser.uid).get(); if (!s.empty) { await db.collection("platform_feedback").doc(s.docs[0].id).update({ rating: selectedStars, feedback: document.getElementById('platformFeedbackText').value, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("✅ Updated!"); } else { await db.collection("platform_feedback").add({ rating: selectedStars, feedback: document.getElementById('platformFeedbackText').value, studentName: currentUser.displayName, studentId: currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("✅ Thanks!"); } closeFeedbackModal(); fetchGlobalRating(); } catch(e){} b.innerText = "Submit"; b.disabled = false; }
async function fetchGlobalRating() { const d = document.getElementById('global-rating-display'); if(!d) return; try { const s = await db.collection("platform_feedback").get(); if (s.empty) return; let t = 0; let c = 0; s.forEach(doc => { t += doc.data().rating; c++; }); d.innerText = (t / c).toFixed(1); } catch(e){} }
fetchGlobalRating();

// --- VIEW ROUTER ---
function _renderView() {
    const mc = document.getElementById('dynamic-content'); if(!mc) return;
    const bc = document.getElementById('breadcrumb-text'); if(bc) bc.innerText = currentPath.length === 0 ? "Home" : "Home / " + currentPath.join(" / "); 
    let cL = appData; for (let n of currentPath) { if(cL[n] !== undefined) cL = cL[n]; else cL = {}; }
    let isE = false; if (typeof cL === 'string' || Array.isArray(cL) || (typeof cL === 'object' && Object.keys(cL).length === 0)) isE = true;

    if (isE) {
        let tN = currentPath[currentPath.length - 1]; let cP = currentPath.join(" > "); let isPdf = false;
        if (customTopicTypes[cP] === 'pdf') isPdf = true; else if (customTopicTypes[cP] !== 'mcq') { let req = ["mcqs practice", "mock test", "general knowledge", "practice paper", "current affairs", "history", "geography", "daily quiz challenge"].some(t => cP.toLowerCase().includes(t)); if (!req) isPdf = true; }
        if (!isPdf) mc.innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">${tN} Practice</h2><p style="color:var(--text-muted); margin-bottom:25px;">${!currentUser ? "Sign in to track scores!" : `Ready, <span style="color:var(--primary-yellow);">${currentUser.displayName.split(" ")[0]}</span>?`}</p><button class="btn-exam" onclick="window.location.hash='#/quiz'" style="background:var(--primary-yellow); color:black; width:200px; margin-right:15px;">Start Quiz &rarr;</button><button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; border:none;">&larr; Go Back</button></div>`;
        else mc.innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">${tN} Resources</h2><p style="color:var(--text-muted);">Materials will appear here once uploaded.</p><button class="btn-exam" onclick="goBack()" style="background:#333; width:150px; border:none; margin-top:20px;">&larr; Go Back</button></div>`;
        return;
    }
    let t = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1]; let h = ``;
    if (currentPath.length === 0) h += `<div class="card" style="border:1px solid var(--primary-yellow); background:rgba(253,184,19,.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:25px;"><div><h2 style="color:var(--primary-yellow); margin:0 0 5px 0;">⚙️ Custom Engine</h2><p style="color:var(--text-muted); margin:0; font-size:14px;">Build your mock test.</p></div><button class="btn-exam" onclick="cwStep1()" style="background:var(--primary-yellow); color:black;">Launch Setup 🚀</button></div>`;
    h += `<div class="card"><h2 style="color:var(--primary-yellow);">${t}</h2><div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">`;
    for (let k in cL) { if (currentPath.length === 0 && k === "Daily Quiz Challenge") continue; let cP = currentPath.join(" > ") + (currentPath.length > 0 ? " > " : "") + k; let tL = ""; if (customTopicTypes[cP] === 'mcq') tL = " 📝"; else if (customTopicTypes[cP] === 'pdf') tL = " 📄"; h += `<button class="btn-exam" onclick="navigateTo('${k.replace(/'/g, "\\'")}')">${k} ${tL}</button>`; }
    if (currentPath.length > 0) h += `<button class="btn-exam" onclick="goBack()" style="grid-column: 1 / -1; background: #222; border:none; margin-top: 10px;">&larr; Go Back</button>`;
    h += `</div></div>`; mc.innerHTML = h;
}

// --- CUSTOM WIZARD ---
let cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' }; let customQuizConfig = { paths: [], count: 20, level: 'Mixed' };
function cwStep1() { if(!currentUser) return showAuthModal(); cwState = { exam: '', subjects: [], subtopics: [], count: 20, level: 'Mixed' }; document.getElementById('breadcrumb-text').innerText = "Home / Custom Setup"; document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">⚙️ Setup: Exam</h2><div style="display:flex; gap:15px; flex-wrap:wrap; margin-top:20px;"><button class="btn-exam" onclick="cwStep2('NEET')" style="flex:1; padding:20px; font-size:18px;">🩺 NEET</button><button class="btn-exam" onclick="cwStep2('General Knowledge')" style="flex:1; padding:20px; font-size:18px;">🌍 GK</button></div><button class="btn-exam" onclick="goHome()" style="margin-top:20px; background:#333; border:none;">Cancel</button></div>`; }
function cwStep2(e) { cwState.exam = e; document.getElementById('breadcrumb-text').innerText = `Home / Setup / ${e}`; let s = []; let r = e === 'NEET' ? appData["NEET"]["MCQs Practice"] : appData["General Knowledge"]; let rP = e === 'NEET' ? "NEET > MCQs Practice" : "General Knowledge"; for(let k in r) s.push({ name: k, path: `${rP} > ${k}` }); for(let p in customTopicTypes) { if(p.startsWith(rP) && p.split(' > ').length === rP.split(' > ').length + 1) { let n = p.split(' > ').pop(); if(!s.find(x=>x.name===n)) s.push({name:n, path:p}); } } document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">📚 Subjects</h2><div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px; margin:20px 0;">${s.map(x => `<label style="background:#2a2a2a; border:1px solid #444; padding:15px; border-radius:8px; display:flex; align-items:center; gap:10px;"><input type="checkbox" value="${x.path}" class="cw-subj-cb"> <span>${x.name}</span></label>`).join('')}</div><div style="display:flex; justify-content:space-between;"><button class="btn-exam" onclick="cwStep1()" style="background:#333; border:none;">Back</button><button class="btn-exam" onclick="cwProcessStep2()" style="background:var(--primary-yellow); color:black;">Next</button></div></div>`; }
function cwProcessStep2() { let c = Array.from(document.querySelectorAll('.cw-subj-cb:checked')).map(x => x.value); if(c.length === 0) return showNotification("⚠️ Select subject"); cwState.subjects = c; cwStep3(); }
function cwStep3() { document.getElementById('breadcrumb-text').innerText = `Home / Setup / Chapters`; let l = []; cwState.subjects.forEach(sp => { let pts = sp.split(' > '); let c = appData; let v = true; for(let p of pts) { if(c[p]) c=c[p]; else {v=false; break;} } function tr(nd, ps) { let hc = false; for(let k in nd) { if(k==="Daily Quiz Challenge") continue; hc=true; tr(nd[k], ps+" > "+k); } if(!hc) l.push(ps); } if(v) tr(c, sp); for(let cp in customTopicTypes) { if(cp.startsWith(sp) && customTopicTypes[cp]==='mcq' && !l.includes(cp)) l.push(cp); } }); l = [...new Set(l)].sort(); document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">📑 Chapters</h2><input type="text" id="cwSubtopicSearch" class="input-field" placeholder="🔍 Search..." oninput="document.querySelectorAll('.cw-sub-lbl').forEach(lbl=>{lbl.style.display=lbl.innerText.toLowerCase().includes(this.value.toLowerCase())?'flex':'none'})"><div style="margin-bottom:15px;"><button onclick="document.querySelectorAll('.cw-sub-cb').forEach(c=>{if(c.closest('label').style.display!=='none')c.checked=true})" style="background:none; border:none; color:var(--primary-yellow);">Select All</button> | <button onclick="document.querySelectorAll('.cw-sub-cb').forEach(c=>{if(c.closest('label').style.display!=='none')c.checked=false})" style="background:none; border:none; color:var(--primary-yellow);">Deselect All</button></div><div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:10px; max-height:40vh; overflow-y:auto; padding:10px; background:#111; border-radius:8px; border:1px solid #333; margin-bottom:25px;">${l.map(x => `<label class="cw-sub-lbl" style="background:#2a2a2a; border:1px solid #444; padding:12px; border-radius:6px; display:flex; align-items:flex-start; gap:10px;"><input type="checkbox" value="${x}" class="cw-sub-cb" checked> <span style="font-size:14px;">${x.split(' > ').pop()}</span></label>`).join('')}</div><div style="display:flex; justify-content:space-between;"><button class="btn-exam" onclick="cwStep2(cwState.exam)" style="background:#333; border:none;">Back</button><button class="btn-exam" onclick="cwProcessStep3()" style="background:var(--primary-yellow); color:black;">Next</button></div></div>`; }
function cwProcessStep3() { let c = Array.from(document.querySelectorAll('.cw-sub-cb:checked')).map(x => x.value); if(c.length === 0) return showNotification("⚠️ Select chapter"); cwState.subtopics = c; cwStep4(); }
function cwStep4() { document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">🎯 Final Setup</h2><div style="display:flex; gap:20px; flex-wrap:wrap; margin:20px 0 30px 0;"><div style="flex:1;"><label style="font-weight:bold;">Difficulty:</label><select id="cwLevel" class="input-field"><option value="Mixed">Mixed</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div><div style="flex:1;"><label style="font-weight:bold;">Questions:</label><input type="number" id="cwCount" class="input-field" value="20" min="5" max="100"></div></div><div style="display:flex; justify-content:space-between;"><button class="btn-exam" onclick="cwStep3()" style="background:#333; border:none;">Back</button><button class="btn-exam" onclick="cwLaunchQuiz()" style="background:var(--correct-green);">🚀 Start</button></div></div>`; }
function cwLaunchQuiz() { cwState.level = document.getElementById('cwLevel').value; cwState.count = parseInt(document.getElementById('cwCount').value) || 20; customQuizConfig.paths = cwState.subtopics; customQuizConfig.count = cwState.count; customQuizConfig.level = cwState.level; _initiateQuizEngine(true); }

// --- LEADERBOARD ---
function _renderLeaderboardOptions() { document.getElementById('breadcrumb-text').innerText = "Home / Leaderboard"; document.getElementById('dynamic-content').innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow);">🏆 Leaderboards</h2><div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:15px; margin-top:20px;"><button class="btn-exam" onclick="window.location.hash='#/board/NEET > MCQs Practice'">1. NEET PRACTICE</button><button class="btn-exam" onclick="window.location.hash='#/board/NEET > Mock Test'">2. MOCK TEST</button><button class="btn-exam" onclick="window.location.hash='#/board/General Knowledge'">3. GK</button></div></div>`; }
async function fetchLiveLeaderboard(pfx) {
    const mc = document.getElementById('dynamic-content'); if (!currentUser) return mc.innerHTML = `<div class="card"><h2>🏆 Leaderboard</h2><p>⚠️ Sign in required.</p><button class="btn-exam" onclick="window.location.hash='#/leaderboard'">Back</button></div>`;
    mc.innerHTML = `<div class="card"><h2>🏆 Fetching...</h2></div>`;
    try {
        const uS = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get(); let tQ=0; let tT=0; let mBS=-99999; let mBD=null;
        uS.forEach(doc => { let d = doc.data(); if (d.quizPath && d.quizPath.startsWith(pfx)) { tT++; tQ+=(d.attemptedQuestions||0); if (d.score>mBS) { mBS=d.score; mBD=d; } } });
        let iM = pfx.includes('Mock Test'); let tM = iM ? (tT>=5) : (tQ>=100); let rT = iM ? "5 Mock Tests" : "100 Questions";
        if (!tM) return mc.innerHTML = `<div class="card" style="text-align:center;"><h2 style="color:var(--primary-yellow);">🔒 Locked</h2><p>Attempt ${rT} to unlock.</p><button class="btn-exam" onclick="window.location.hash='#/leaderboard'">Back</button></div>`;
        const bS = await db.collection("leaderboards").where("quizPath", ">=", pfx).where("quizPath", "<=", pfx + "\uf8ff").orderBy("score", "desc").limit(10).get();
        let h = `<div class="card"><h2 style="color:var(--primary-yellow);">🏆 Top 10: ${pfx.split(' > ').pop()}</h2><div style="overflow-x:auto;"><table><tr><th>Rank</th><th>Student</th><th>Score</th><th>Acc</th></tr>`;
        let mR = ">10"; let docs = []; bS.forEach(doc => docs.push(doc.data()));
        for(let i=0; i<docs.length; i++) { if (docs[i].userId===currentUser.uid && docs[i].score===mBS) { mR=i+1; break; } }
        for(let i=0; i<Math.min(10, docs.length); i++) { let d=docs[i]; let rS=d.userId===currentUser.uid?`style="background:rgba(253,184,19,.15);"`:""; h += `<tr ${rS}><td>${i+1}</td><td><b>${d.userName}</b></td><td style="color:var(--correct-green);">${d.score}</td><td>${d.accuracy}%</td></tr>`; }
        h += `</table></div><button class="btn-exam" onclick="window.location.hash='#/leaderboard'" style="margin-top:25px; background:#333; border:none;">Back</button></div>`; mc.innerHTML = h;
    } catch(e) {}
}

// --- QUIZ ENGINE ---
let quizState = { questions: [], currentIndex: 0, userAnswers: {}, showAnswerTriggered: {}, flaggedDoubts: {}, viewedQuestions: [], timer: null, secondsPassed: 0, isTimerPaused: false, isCustom: false };
async function _initiateQuizEngine(iC = false) {
    const mc = document.getElementById('dynamic-content'); mc.innerHTML = `<div class="card"><h2 style="color:var(--primary-yellow); text-align:center;">Building Quiz...</h2></div>`;
    try {
        let iD = currentPath[0] === 'Daily Quiz Challenge'; let gIds = [];
        if (currentUser) { let d = (await db.collection("users").doc(currentUser.uid).get()).data() || {}; for (let k in d) { if(k.startsWith("prog_")) gIds.push(...d[k]); } }
        else { let l = JSON.parse(localStorage.getItem('mcq_progress')||'{}'); for(let k in l) gIds.push(...l[k]); }
        let aQ = [];
        if (iC) {
            quizState.isCustom = true; let uA = [];
            for (const p of customQuizConfig.paths) { const s = await db.collection("content").where("path", "==", p).get(); s.forEach(doc => { let d=doc.data(); if(d.type==='mcq' && !gIds.includes(doc.id)) { if(customQuizConfig.level==='Mixed' || d.level===customQuizConfig.level || (!d.level&&customQuizConfig.level==='Mixed')) uA.push({id:doc.id, ...d}); } }); }
            aQ = uA.sort(()=>0.5-Math.random()).slice(0, customQuizConfig.count);
        } else if (iD) {
            quizState.isCustom = false; let tP = currentPath[1] === "NEET" ? "NEET" : "General Knowledge";
            const s = await db.collection("content").where("path", ">=", tP).where("path", "<=", tP + "\uf8ff").get(); let uA = [];
            s.forEach(doc => { let d=doc.data(); if(d.type==='mcq' && !gIds.includes(doc.id)) uA.push({id:doc.id, ...d}); });
            if (currentPath[1] === "NEET") { let b=uA.filter(q=>q.path.includes("Botany")), z=uA.filter(q=>q.path.includes("Zoology")), p=uA.filter(q=>q.path.includes("Physics")), c=uA.filter(q=>q.path.includes("Chemistry")); aQ.push(...b.slice(0,5), ...z.slice(0,5), ...p.slice(0,5), ...c.slice(0,5)); }
            else aQ = uA.sort(()=>0.5-Math.random()).slice(0, 20);
        } else {
            quizState.isCustom = false; let pS = currentPath.join(' > '); let sP = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
            let pA = []; if(currentUser){ let d=(await db.collection("users").doc(currentUser.uid).get()).data(); if(d) pA=d[sP]||[]; }
            const s = await db.collection("content").where("path", ">=", pS).where("path", "<=", pS + "\uf8ff").get();
            s.forEach(doc => { let d=doc.data(); if(d.type==='mcq' && !pA.includes(doc.id)) aQ.push({id:doc.id, ...d}); });
        }
        quizState.questions = aQ.sort(()=>Math.random()-0.5);
        if (quizState.questions.length === 0) { let sP="prog_"+currentPath.join('_').replace(/[^a-zA-Z0-9]/g,'_'); return mc.innerHTML = `<div class="card" style="text-align:center;"><h2>🎉 Completed!</h2><button class="btn-exam" onclick="resetProgress('${sP}')" style="background:#333;border:none;">🔄 Reset Progress</button> <button class="btn-exam" onclick="goBack()">Go Back</button></div>`; }
        quizState.currentIndex=0; quizState.userAnswers={}; quizState.showAnswerTriggered={}; quizState.flaggedDoubts={}; quizState.viewedQuestions=[]; quizState.secondsPassed=0; quizState.isTimerPaused=false;
        clearInterval(quizState.timer); quizState.timer = setInterval(() => { if (!quizState.isTimerPaused) { quizState.secondsPassed++; let d = document.getElementById('quizTimeDisplay'); if(d) d.innerText = formatTime(quizState.secondsPassed); } }, 1000);
        _renderQuizQuestion();
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}

function toggleFlag() { quizState.flaggedDoubts[quizState.currentIndex]=!quizState.flaggedDoubts[quizState.currentIndex]; let b=document.getElementById('flagDoubtBtn'); if(quizState.flaggedDoubts[quizState.currentIndex]){b.classList.add('flagged');b.innerText='⭐ Flagged';}else{b.classList.remove('flagged');b.innerText='⭐ Flag';} }
function _renderQuizQuestion() {
    const mc = document.getElementById('dynamic-content'); if(!quizState.viewedQuestions.includes(quizState.currentIndex)) quizState.viewedQuestions.push(quizState.currentIndex);
    const q = quizState.questions[quizState.currentIndex]; let mt = q.correctAnswers.length > 1 ? `<span style="color:var(--primary-yellow);font-size:12px;">(Multi)</span>` : "";
    let sN = quizState.userAnswers[quizState.currentIndex]||[]; let hP = quizState.showAnswerTriggered[quizState.currentIndex]; let iF = quizState.flaggedDoubts[quizState.currentIndex]; quizState.isTimerPaused = !!hP;
    let pal = '<div class="question-palette">'; for(let i=0;i<quizState.questions.length;i++){ let iA=quizState.userAnswers[i]&&quizState.userAnswers[i].length>0; let bg=quizState.currentIndex===i?'var(--primary-yellow)':(iA?'#4CAF50':'#2a2a2a'); let cl=quizState.currentIndex===i?'#000':'#fff'; pal+=`<button onclick="jumpToQuestion(${i})" style="width:35px;height:35px;border-radius:5px;border:1px solid var(--border-color);background:${bg};color:${cl};font-weight:bold;cursor:pointer;">${i+1}</button>`; } pal+='</div>';
    let optH = Object.keys(q.options).sort().map(k=>{ if(!q.options[k])return''; let iS=sN.includes(k); let eC=''; if(hP){ if(q.correctAnswers.includes(k)) eC='correct'; else if(iS) eC='wrong'; } else if(iS) eC='selected'; return `<div class="quiz-option ${eC}" onclick="toggleOptionSelection('${k}', ${q.correctAnswers.length>1})"><b style="margin-right:15px;color:var(--text-muted);">${k}.</b> <span class="katex-render-target">${q.options[k]}</span></div>`; }).join('');
    mc.innerHTML = `<div class="card"><div class="quiz-header"><span style="color:var(--text-muted);">Q ${quizState.currentIndex+1} ${mt}</span><div style="display:flex;gap:15px;"><button class="report-btn" onclick="openReportModal('${q.id}', '${q.question.replace(/'/g, "\\'")}', '${q.path}')">🚨</button><button id="flagDoubtBtn" class="flag-btn ${iF?'flagged':''}" onclick="toggleFlag()">${iF?'⭐ Flagged':'⭐ Flag'}</button><span class="quiz-timer">⏱ <span id="quizTimeDisplay">${formatTime(quizState.secondsPassed)}</span></span></div></div>${pal}${q.imageUrl?`<img src="${q.imageUrl}" class="quiz-image">`:''}<div class="quiz-question-text katex-render-target">${q.question}</div><div id="optionsContainer">${optH}</div><div class="quiz-explanation katex-render-target" style="display:${hP?'block':'none'}"><b>Explanation:</b><br>${q.explanation||"None"}</div><div class="nav-buttons-row"><div style="display:flex;gap:10px;"><button class="btn-exam" onclick="_prevQuestion()" ${quizState.currentIndex===0?'disabled':''}>&larr; Prev</button><button class="btn-exam" onclick="_nextQuestion()" ${quizState.currentIndex===quizState.questions.length-1?'disabled':''}>Next &rarr;</button></div><div style="display:flex;gap:10px;"><button class="btn-exam" onclick="checkAnswer()" style="background:#333;${hP?'display:none;':''}">Check</button><button class="btn-exam" onclick="finishQuiz()" style="background:var(--wrong-red);border:none;">Finish</button></div></div></div>`;
    document.querySelectorAll('.katex-render-target').forEach(el=>renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]}));
}

function toggleOptionSelection(k, iM) { if(quizState.showAnswerTriggered[quizState.currentIndex]) return; let c = quizState.userAnswers[quizState.currentIndex]||[]; if(!iM) c=[k]; else { if(c.includes(k)) c=c.filter(x=>x!==k); else c.push(k); } quizState.userAnswers[quizState.currentIndex]=c; _renderQuizQuestion(); }
function checkAnswer() { let c=quizState.userAnswers[quizState.currentIndex]||[]; if(c.length===0) return showNotification("⚠️ Select an option!"); quizState.showAnswerTriggered[quizState.currentIndex]=true; _renderQuizQuestion(); }
function jumpToQuestion(i) { quizState.currentIndex=i; _renderQuizQuestion(); }
function _nextQuestion() { if(quizState.currentIndex<quizState.questions.length-1){ quizState.currentIndex++; _renderQuizQuestion(); } }
function _prevQuestion() { if(quizState.currentIndex>0){ quizState.currentIndex--; _renderQuizQuestion(); } }
function formatTime(s) { const m=Math.floor(s/60); const sc=s%60; return `${m}:${sc<10?'0':''}${sc}`; }

async function resetProgress(safePath) {
    if(!confirm("Reset your progress? This lets you re-attempt all questions in this section.")) return;
    if(currentUser) { let d={}; d[safePath]=firebase.firestore.FieldValue.delete(); await db.collection("users").doc(currentUser.uid).update(d).catch(e=>{}); } 
    else { let p=JSON.parse(localStorage.getItem('mcq_progress')||'{}'); delete p[safePath]; localStorage.setItem('mcq_progress', JSON.stringify(p)); }
    _initiateQuizEngine(); 
}

window.showReviewTab = function(t) { ['correct', 'wrong', 'skipped'].forEach(x=>document.getElementById('review-'+x).style.display='none'); document.getElementById('review-'+t).style.display='block'; };
window.toggleViewAnswer = function(id) { let e=document.getElementById(id); e.style.display=e.style.display==='none'?'block':'none'; };

function buildRevHtml(q, i, t, u) {
    let oH=''; Object.keys(q.options).sort().forEach(k=>{ let iU=u.includes(k); let iC=q.correctAnswers.includes(k); let bg=''; let ic=''; if(t!=='skipped'){ if(iC){bg='background:rgba(76,175,80,0.1); border-color:var(--correct-green);';ic='✅ ';}else if(iU&&!iC){bg='background:rgba(244,67,54,0.1); border-color:var(--wrong-red);';ic='❌ ';} } oH+=`<div style="padding:10px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:8px; ${bg}"><b>${ic}${k}.</b> <span class="katex-render-target">${q.options[k]}</span></div>`; });
    let bc = t==='correct'?'var(--correct-green)':(t==='wrong'?'var(--wrong-red)':'var(--primary-yellow)');
    return `<div class="review-item" style="border-left: 4px solid ${bc};"><p style="margin-top:0;"><b>Q${i+1}:</b> <span class="katex-render-target">${q.question}</span></p>${oH}<p style="color:var(--correct-green);"><b>Correct:</b> ${q.correctAnswers.join(', ')}</p><div class="katex-render-target" style="font-size:14px; color:var(--text-muted);"><b>Explanation:</b> ${q.explanation||''}</div></div>`;
}

async function finishQuiz() {
    clearInterval(quizState.timer); let att=0; let ts=0; let cC=0; let wC=0; let sIds=[]; let sC=0; let cH=''; let wH=''; let sH='';
    let isD = currentPath[0]==='Daily Quiz Challenge'; let isN = isD?(currentPath[1]==="NEET"):(quizState.isCustom?cwState.exam==='NEET':currentPath[0]==="NEET");
    quizState.questions.forEach((q, i) => {
        let uA=quizState.userAnswers[i]||[]; let isA=uA.length>0; let isC=false; let isV=quizState.viewedQuestions.includes(i);
        if(isA){ att++; sIds.push(q.id); if(uA.sort().join(',')===q.correctAnswers.sort().join(',')){isC=true;cC++;} }
        if(isA&&!isC) wC++;
        if(isA){ if(isC) cH+=buildRevHtml(q,i,'correct',uA); else wH+=buildRevHtml(q,i,'wrong',uA); } else if(isV){ sC++; sH+=buildRevHtml(q,i,'skipped',[]); }
        if(isN){ if(isC) ts+=4; else if(isA&&!isC) ts-=1; } else { if(isC) ts+=1; }
    });

    if(sIds.length>0 && !isD) { 
        if(currentUser){ let dTS={}; if(quizState.isCustom){ quizState.questions.forEach(q=>{ if(sIds.includes(q.id)){ let sP="prog_"+q.path.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g,'_'); if(!dTS[sP])dTS[sP]=[]; dTS[sP].push(q.id); } }); for(let k in dTS) dTS[k]=firebase.firestore.FieldValue.arrayUnion(...dTS[k]); } else { let sP="prog_"+currentPath.join('_').replace(/[^a-zA-Z0-9]/g,'_'); dTS[sP]=firebase.firestore.FieldValue.arrayUnion(...sIds); } db.collection("users").doc(currentUser.uid).set(dTS,{merge:true}); } 
        else { let lP=JSON.parse(localStorage.getItem('mcq_progress')||'{}'); if(quizState.isCustom){ quizState.questions.forEach(q=>{ if(sIds.includes(q.id)){ let sP="prog_"+q.path.split(' > ').join('_').replace(/[^a-zA-Z0-9]/g,'_'); lP[sP]=[...(lP[sP]||[]), q.id]; } }); } else { let sP="prog_"+currentPath.join('_').replace(/[^a-zA-Z0-9]/g,'_'); lP[sP]=[...(lP[sP]||[]), ...sIds]; } localStorage.setItem('mcq_progress', JSON.stringify(lP)); }
    } else if(sIds.length>0 && isD) {
        if(currentUser) db.collection("users").doc(currentUser.uid).set({prog_daily_challenge:firebase.firestore.FieldValue.arrayUnion(...sIds)},{merge:true});
        else { let lP=JSON.parse(localStorage.getItem('mcq_progress')||'{}'); lP["prog_daily_challenge"]=[...(lP["prog_daily_challenge"]||[]), ...sIds]; localStorage.setItem('mcq_progress',JSON.stringify(lP)); }
    }

    let acc = att===0 ? 0 : Math.round((cC/att)*100); let tStr = formatTime(quizState.secondsPassed); let pS = quizState.isCustom ? "Custom Practice" : currentPath.join(' > ');
    if(currentUser && att>0 && !isD) db.collection("leaderboards").add({ userId: currentUser.uid, userName: currentUser.displayName, quizPath: pS, score: ts, accuracy: acc, timeStr: tStr, attemptedQuestions: att, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="card" style="text-align:center;"><h2 style="color:var(--primary-yellow);">Test Complete!</h2>
        <div style="display:flex;gap:15px;flex-wrap:wrap;margin:30px 0;">
            <div style="background:#2a2a2a;padding:20px;border-radius:8px;flex:1;"><div style="font-size:32px;font-weight:bold;">${ts}</div><div style="color:var(--text-muted);font-size:14px;">Score</div></div>
            <div style="background:#2a2a2a;padding:20px;border-radius:8px;flex:1;"><div style="font-size:32px;color:var(--correct-green);font-weight:bold;">${acc}%</div><div style="color:var(--text-muted);font-size:14px;">Accuracy</div></div>
        </div>
        <div class="review-tabs"><button class="review-tab-btn" onclick="showReviewTab('correct')" style="color:var(--correct-green);">✅ Correct (${cC})</button><button class="review-tab-btn" onclick="showReviewTab('wrong')" style="color:var(--wrong-red);">❌ Wrong (${wC})</button><button class="review-tab-btn" onclick="showReviewTab('skipped')" style="color:var(--primary-yellow);">⏭️ Skipped (${sC})</button></div>
        <div id="review-correct" style="display:block;">${cH||'<p>No correct answers.</p>'}</div><div id="review-wrong" style="display:none;">${wH||'<p>No wrong answers!</p>'}</div><div id="review-skipped" style="display:none;">${sH||'<p>No skipped questions.</p>'}</div>
        <button class="btn-exam" onclick="goHome()" style="margin-top:30px;background:#333;border:none;">&larr; Exit</button></div>`;
    document.querySelectorAll('.katex-render-target').forEach(el=>renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]}));
}

// --- ADMIN PANEL RESTORED IN FULL ---
let adminCurrentTab = 'topics'; let adminNewTopicPath = []; let adminSelectedPath = []; let adminManageSelectedPath = []; 
function _renderAdminLogin() { document.getElementById('dynamic-content').innerHTML = `<div class="card" style="max-width:400px;margin:0 auto;text-align:center;"><h2>🔒 Restricted Access</h2><input type="password" id="adminPassInput" class="input-field" placeholder="Password"><button id="loginBtn" class="btn-exam" onclick="verifyAdmin()" style="width:100%;background:var(--primary-yellow);color:black;">Login</button></div>`; }
async function verifyAdmin() { const p = document.getElementById('adminPassInput').value; try { let c = "mcqs2026"; const d = await db.collection("settings").doc("admin_auth").get(); if (d.exists && d.data().password) c = d.data().password; if (p === c) { sessionStorage.setItem('admin_verified', 'true'); window.location.hash = '#/admin-panel'; } else showNotification("❌ Incorrect Password"); } catch(e){} }

function _renderAdminPanel() {
    if (!sessionStorage.getItem('admin_verified')) { window.location.hash = '#/admin'; return; }
    document.getElementById('breadcrumb-text').innerText = "Admin Dashboard";
    document.getElementById('dynamic-content').innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;"><h2 style="color:var(--primary-yellow);margin:0;">🛠️ Admin Control Center</h2><div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="admin-tab-btn ${adminCurrentTab==='topics'?'active':''}" onclick="switchAdminTab('topics')">📁 Folders</button><button class="admin-tab-btn ${adminCurrentTab==='upload'?'active':''}" onclick="switchAdminTab('upload')">➕ Upload</button><button class="admin-tab-btn ${adminCurrentTab==='manage'?'active':''}" onclick="switchAdminTab('manage')">📋 Manage</button><button class="admin-tab-btn ${adminCurrentTab==='reports'?'active':''}" onclick="switchAdminTab('reports')">🚨 Reports</button><button class="admin-tab-btn ${adminCurrentTab==='users'?'active':''}" onclick="switchAdminTab('users')">👥 Users</button><button class="admin-tab-btn ${adminCurrentTab==='doubts'?'active':''}" onclick="switchAdminTab('doubts')">🚩 Doubts</button><button class="admin-tab-btn ${adminCurrentTab==='settings'?'active':''}" onclick="switchAdminTab('settings')">⚙️ Settings</button></div></div><div id="admin-upload-view" style="display:${adminCurrentTab==='upload'?'block':'none'};"><div style="background:#2a2a2a;padding:15px;border-radius:6px;margin-bottom:20px;"><h4 style="margin-top:0;margin-bottom:10px;">Upload Content: Target Folder</h4><div id="dynamic-path-selectors" style="display:flex;gap:10px;flex-wrap:wrap;"></div></div><div id="upload-form-area" style="display:none;"><div class="admin-row" style="margin-bottom:25px;"><b>Type:</b><select id="admResourceType" class="input-field" onchange="toggleAdminFormType()" style="max-width:300px;"><option value="mcq">MCQ</option><option value="pdf">PDF / Image</option></select></div><div id="admin-mcq-form"><textarea id="admQuestion" class="input-field" placeholder="Question"></textarea><div class="admin-row"><div><label style="color:var(--text-muted);font-size:14px;">Image (Opt):</label><input type="file" id="admQImage" class="input-field" accept="image/*"></div><div><label style="color:var(--text-muted);font-size:14px;">Level:</label><select id="admDifficulty" class="input-field"><option value="Mixed">Mixed</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></div></div><div class="admin-row"><input type="text" id="admOptA" class="input-field" placeholder="Opt A"><input type="text" id="admOptB" class="input-field" placeholder="Opt B"></div><div class="admin-row"><input type="text" id="admOptC" class="input-field" placeholder="Opt C"><input type="text" id="admOptD" class="input-field" placeholder="Opt D"></div><div class="admin-checkbox-group"><b>Correct:</b> <label><input type="checkbox" value="A" class="admCorrectCb">A</label> <label><input type="checkbox" value="B" class="admCorrectCb">B</label> <label><input type="checkbox" value="C" class="admCorrectCb">C</label> <label><input type="checkbox" value="D" class="admCorrectCb">D</label></div><textarea id="admExplanation" class="input-field" placeholder="Explanation..."></textarea></div><div id="admin-pdf-form" style="display:none;background:#2a2a2a;padding:20px;border-radius:8px;"><input type="text" id="admPdfTitle" class="input-field" placeholder="Title"><input type="file" id="admPdfFile" class="input-field" accept=".pdf, image/*"></div><div style="display:flex;gap:15px;margin-top:20px;"><button id="uploadBtn" class="btn-exam" onclick="processAdminUpload()" style="background:#4CAF50;color:white;flex:2;">☁️ Upload</button><button class="btn-exam" onclick="clearAdminUploadForm()" style="background:var(--wrong-red);color:white;flex:1;">🧹 Clear</button></div></div></div><div id="admin-topics-view" style="display:${adminCurrentTab==='topics'?'block':'none'};"><div style="background:rgba(253,184,19,.05);padding:20px;border-radius:8px;border:1px solid var(--primary-yellow);margin-bottom:25px;"><h4 style="margin-top:0;color:var(--primary-yellow);">📁 New Folder</h4><label style="color:white;font-size:13px;">1. Parent:</label><div id="dynamic-new-path-selectors" style="display:flex;gap:10px;flex-wrap:wrap;"></div><div class="admin-row" style="margin-top:15px;"><div><label style="color:white;font-size:13px;">2. Name:</label><input type="text" id="newFolderName" class="input-field" placeholder="e.g. Genetics"></div><div><label style="color:white;font-size:13px;">3. Type:</label><select id="newFolderType" class="input-field"><option value="mcq">MCQs</option><option value="pdf">PDF / Image</option></select></div></div><button class="btn-exam" onclick="createCustomTopic()" style="background:var(--primary-yellow);color:black;">+ Add Subtopic</button></div><h4 style="color:var(--primary-yellow);margin-top:30px;">Active Folders</h4><input type="text" id="adminTopicSearch" class="input-field" placeholder="🔍 Search..." oninput="filterAdminTopics()"><div id="admin-topic-list-container"></div></div><div id="admin-manage-view" style="display:${adminCurrentTab==='manage'?'block':'none'};"><div style="background:#2a2a2a;padding:15px;border-radius:6px;margin-bottom:20px;"><h4 style="margin-top:0;color:var(--text-muted);">Filter Content</h4><div id="manage-path-selectors" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;"></div><button class="btn-exam" onclick="loadContentForManagement()" style="background:var(--primary-yellow);color:black;">🔍 Fetch Content</button></div><div id="manage-content-list"><p>Select folder & fetch.</p></div></div><div id="admin-reports-view" style="display:${adminCurrentTab==='reports'?'block':'none'};"><button class="btn-exam" onclick="loadAdminReports()" style="margin-bottom:15px;background:var(--primary-yellow);color:black;">🔄 Refresh Reports</button><div id="reports-list-container"></div></div><div id="admin-users-view" style="display:${adminCurrentTab==='users'?'block':'none'};"><button class="btn-exam" onclick="loadAdminUsers()" style="margin-bottom:15px;background:var(--primary-yellow);color:black;">🔄 Refresh Students</button><div id="users-table-container" style="overflow-x:auto;"></div></div><div id="admin-doubts-view" style="display:${adminCurrentTab==='doubts'?'block':'none'};"><button class="btn-exam" onclick="loadAdminDoubts()" style="margin-bottom:15px;background:var(--primary-yellow);color:black;">🔄 Refresh Doubts</button><div id="doubts-list-container"></div></div><div id="admin-settings-view" style="display:${adminCurrentTab==='settings'?'block':'none'};"><div style="background:#2a2a2a;padding:25px;border-radius:6px;max-width:400px;"><h3 style="margin-top:0;margin-bottom:20px;">Change Password</h3><input type="password" id="newAdminPass" class="input-field" placeholder="New Password"><input type="password" id="confirmAdminPass" class="input-field" placeholder="Confirm Password"><button class="btn-exam" onclick="changeAdminPassword()" style="background:var(--primary-yellow);color:black;width:100%;">Update</button></div></div></div>`;
    if (adminCurrentTab === 'upload') _buildAdminSelectors();
    else if (adminCurrentTab === 'topics') { _buildAdminNewTopicSelectors(); loadAdminTopicsList(); }
    else if (adminCurrentTab === 'manage') { _buildManageSelectors(); loadContentForManagement(); }
    else if (adminCurrentTab === 'reports') loadAdminReports();
    else if (adminCurrentTab === 'users') loadAdminUsers();
    else if (adminCurrentTab === 'doubts') loadAdminDoubts();
}

function switchAdminTab(t) { adminCurrentTab = t; _renderAdminPanel(); }
function toggleAdminFormType() { let v = document.getElementById('admResourceType').value; document.getElementById('admin-mcq-form').style.display = v === 'mcq' ? 'block' : 'none'; document.getElementById('admin-pdf-form').style.display = v === 'pdf' ? 'block' : 'none'; }
function clearAdminUploadForm() { if(!confirm("Clear form?")) return; document.getElementById('admQuestion').value = ""; document.getElementById('admQImage').value = ""; document.getElementById('admExplanation').value = ""; document.getElementById('admOptA').value = ""; document.getElementById('admOptB').value = ""; document.getElementById('admOptC').value = ""; document.getElementById('admOptD').value = ""; document.querySelectorAll('.admCorrectCb').forEach(cb => cb.checked = false); document.getElementById('admPdfTitle').value = ""; document.getElementById('admPdfFile').value = ""; }

let globalTopicsData = [];
async function loadAdminTopicsList() {
    const c = document.getElementById('admin-topic-list-container'); c.innerHTML = `<p>Loading folders...</p>`;
    try { const s = await db.collection("custom_topics").get(); globalTopicsData = []; s.forEach(d => globalTopicsData.push({ id: d.id, ...d.data() })); globalTopicsData.sort((a,b) => (a.parentPath||"").localeCompare(b.parentPath||"")); renderAdminTopicsList(globalTopicsData); } catch(e){}
}
function renderAdminTopicsList(arr) {
    const c = document.getElementById('admin-topic-list-container'); if(arr.length === 0) return c.innerHTML = `<p>No custom folders found.</p>`;
    c.innerHTML = arr.map(d => `<div style="background:#2a2a2a; border:1px solid #444; border-radius:6px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;"><div><span style="color:#aaa; font-size:12px;">Path: ${d.parentPath}</span><br><b>📁 ${d.name}</b> <span style="background:#444; padding:2px 6px; border-radius:4px; font-size:11px;">${d.type}</span></div><div style="display:flex; gap:8px;"><button onclick="openEditTopicModal('${d.id}', '${d.name.replace(/'/g, "\\'")}', '${d.type}')" style="background:#2196F3; border:none; color:white; padding:6px 12px; border-radius:4px;">Edit</button><button onclick="deleteCustomTopic('${d.id}')" style="background:var(--wrong-red); border:none; color:white; padding:6px 12px; border-radius:4px;">Delete</button></div></div>`).join('');
}
function filterAdminTopics() { let q = document.getElementById('adminTopicSearch').value.toLowerCase(); renderAdminTopicsList(globalTopicsData.filter(t => t.name.toLowerCase().includes(q) || t.parentPath.toLowerCase().includes(q))); }
function openEditTopicModal(id, name, type) { document.getElementById('editTopicId').value=id; document.getElementById('editTopicName').value=name; document.getElementById('editTopicType').value=type; document.getElementById('editTopicModal').style.display='flex'; }
function closeEditTopicModal() { document.getElementById('editTopicModal').style.display='none'; }
async function saveEditedTopic() { let i=document.getElementById('editTopicId').value, n=document.getElementById('editTopicName').value.trim(), t=document.getElementById('editTopicType').value; if(!n) return; try{ await db.collection("custom_topics").doc(i).update({name:n, type:t}); closeEditTopicModal(); showNotification("✅ Updated!"); loadAdminTopicsList(); await loadCustomTopics(); } catch(e){} }
async function deleteCustomTopic(id) { if(!confirm("Delete this folder?")) return; try{ await db.collection("custom_topics").doc(id).delete(); loadAdminTopicsList(); await loadCustomTopics(); } catch(e){} }

function _buildAdminNewTopicSelectors() {
    const c = document.getElementById('dynamic-new-path-selectors'); let h = ''; let cO = appData;
    for (let i = 0; i <= adminNewTopicPath.length; i++) {
        if (typeof cO === 'string' || Array.isArray(cO) || (typeof cO === 'object' && Object.keys(cO).length === 0 && i === adminNewTopicPath.length)) break;
        h += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminNewTopicPathChange(event, ${i})"><option value="">-- Stop Here --</option>`;
        for (let k in cO) { if (k === "Daily Quiz Challenge") continue; h += `<option value="${k}" ${adminNewTopicPath[i] === k ? 'selected' : ''}>${k}</option>`; } h += `</select>`;
        if (adminNewTopicPath[i] && cO[adminNewTopicPath[i]]) cO = cO[adminNewTopicPath[i]]; else break;
    }
    c.innerHTML = h; let pD = document.getElementById('new-topic-path-display'); if(!pD) c.insertAdjacentHTML('afterend', `<div id="new-topic-path-display" style="margin-top:10px; font-size:14px; color:var(--primary-yellow);"><b>Selected Parent Path:</b> <span id="new-topic-path-text" style="color:white;">None</span></div>`);
    document.getElementById('new-topic-path-text').innerText = adminNewTopicPath.length > 0 ? adminNewTopicPath.join(' > ') : 'Root';
}
function handleAdminNewTopicPathChange(e, d) { if(e.target.value === "") adminNewTopicPath = adminNewTopicPath.slice(0, d); else { adminNewTopicPath = adminNewTopicPath.slice(0, d); adminNewTopicPath.push(e.target.value); } _buildAdminNewTopicSelectors(); }
async function createCustomTopic() { if (adminNewTopicPath.length === 0) return showNotification("⚠️ Select a parent path."); const f = document.getElementById('newFolderName').value.trim(); if (!f) return; try { await db.collection("custom_topics").add({ parentPath: adminNewTopicPath.join(' > '), name: f, type: document.getElementById('newFolderType').value, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); showNotification("✅ Subtopic Created!"); document.getElementById('newFolderName').value = ""; await loadCustomTopics(); _buildAdminNewTopicSelectors(); loadAdminTopicsList(); } catch(e) {} }

function _buildAdminSelectors() {
    const c = document.getElementById('dynamic-path-selectors'); let h = ''; let cO = appData;
    for (let i = 0; i <= adminSelectedPath.length; i++) {
        if (typeof cO === 'string' || Array.isArray(cO) || (typeof cO === 'object' && Object.keys(cO).length === 0 && i === adminSelectedPath.length)) break;
        h += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleAdminPathChange(event, ${i})"><option value="">-- Upload Here --</option>`;
        for (let k in cO) { if (k === "Daily Quiz Challenge") continue; h += `<option value="${k}" ${adminSelectedPath[i] === k ? 'selected' : ''}>${k}</option>`; } h += `</select>`;
        if (adminSelectedPath[i] && cO[adminSelectedPath[i]]) cO = cO[adminSelectedPath[i]]; else break;
    }
    c.innerHTML = h; const fA = document.getElementById('upload-form-area'); if(fA) fA.style.display = (adminSelectedPath.length > 0) ? 'block' : 'none';
    let pD = document.getElementById('upload-path-display'); if(!pD) c.insertAdjacentHTML('afterend', `<div id="upload-path-display" style="margin-top:10px; font-size:14px; color:var(--correct-green);"><b>Uploading To:</b> <span id="upload-path-text" style="color:white;">None</span></div>`);
    document.getElementById('upload-path-text').innerText = adminSelectedPath.length > 0 ? adminSelectedPath.join(' > ') : 'Please select at least one path';
}
function handleAdminPathChange(e, d) { if(e.target.value === "") adminSelectedPath = adminSelectedPath.slice(0, d); else { adminSelectedPath = adminSelectedPath.slice(0, d); adminSelectedPath.push(e.target.value); } _buildAdminSelectors(); }

function _buildManageSelectors() {
    const c = document.getElementById('manage-path-selectors'); let h = ''; let cO = appData;
    for (let i = 0; i <= adminManageSelectedPath.length; i++) {
        if (typeof cO === 'string' || Array.isArray(cO)) break;
        h += `<select class="input-field" style="flex:1; min-width:150px; margin-bottom:0;" onchange="handleManagePathChange(event, ${i})"><option value="">-- All --</option>`;
        for (let k in cO) { if (k === "Daily Quiz Challenge") continue; h += `<option value="${k}" ${adminManageSelectedPath[i] === k ? 'selected' : ''}>${k}</option>`; } h += `</select>`;
        if (adminManageSelectedPath[i] && cO[adminManageSelectedPath[i]]) cO = cO[adminManageSelectedPath[i]]; else break;
    } c.innerHTML = h;
}
function handleManagePathChange(e, d) { if(e.target.value === "") adminManageSelectedPath = adminManageSelectedPath.slice(0, d); else { adminManageSelectedPath = adminManageSelectedPath.slice(0, d); adminManageSelectedPath.push(e.target.value); } _buildManageSelectors(); }

async function uploadFileToCloudinary(f) { const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', CLOUDINARY_PRESET); const r = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd }); const d = await r.json(); if (!r.ok) throw new Error(); return d.secure_url; }
async function processAdminUpload() {
    const ty = document.getElementById('admResourceType').value; const tP = adminSelectedPath.join(' > '); const b = document.getElementById('uploadBtn'); b.innerText = "Uploading..."; b.disabled = true;
    try {
        if (ty === 'mcq') {
            const q = document.getElementById('admQuestion').value.trim(); const o = { A: document.getElementById('admOptA').value.trim(), B: document.getElementById('admOptB').value.trim(), C: document.getElementById('admOptC').value.trim(), D: document.getElementById('admOptD').value.trim() };
            const cCb = document.querySelectorAll('.admCorrectCb:checked'); let cA = Array.from(cCb).map(cb => cb.value); const exp = document.getElementById('admExplanation').value.trim(); const iF = document.getElementById('admQImage').files[0]; const lvl = document.getElementById('admDifficulty').value;
            if (!q || !o.A || !o.B || cA.length === 0) throw new Error("Missing fields."); let iU = null; if (iF) iU = await uploadFileToCloudinary(iF); 
            await db.collection("content").add({ type: 'mcq', path: tP, level: lvl, question: q, options: o, correctAnswers: cA, explanation: exp, imageUrl: iU, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); clearAdminUploadForm();
        } else if (ty === 'pdf') {
            const t = document.getElementById('admPdfTitle').value.trim(); const f = document.getElementById('admPdfFile').files[0]; if (!t || !f) throw new Error(); const fU = await uploadFileToCloudinary(f);
            await db.collection("content").add({ type: 'material', path: tP, title: t, fileUrl: fU, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); document.getElementById('admPdfTitle').value = ""; document.getElementById('admPdfFile').value = "";
        } showNotification("✅ Upload Successful!");
    } catch(e) { showNotification("⚠️ ERROR!"); } b.innerText = "☁️ Upload"; b.disabled = false;
}

let loadedItemsCache = {};
async function loadContentForManagement() {
    const c = document.getElementById('manage-content-list'); c.innerHTML = `<p>Fetching items...</p>`;
    try {
        let q = db.collection("content"); if (adminManageSelectedPath.length > 0) { const p = adminManageSelectedPath.join(' > '); q = q.where("path", ">=", p).where("path", "<=", p + "\uf8ff"); } else { q = q.orderBy("timestamp", "desc").limit(50); }
        const s = await q.get(); if(s.empty) return c.innerHTML = `<p>No items found.</p>`; loadedItemsCache = {}; let h = '';
        s.forEach(doc => { let d = doc.data(); loadedItemsCache[doc.id] = d; if (d.type === 'mcq') { let aStr = (d.correctAnswers || []).join(', '); h += `<div class="card" id="item_${doc.id}" style="padding:15px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span class="badge-path">${d.path}</span><div><button onclick="openEditModal('${doc.id}')" style="background:#2196F3; color:white; border:none; padding:4px 10px; border-radius:4px; margin-right:5px;">Edit</button><button onclick="deleteContentItem('${doc.id}')" style="background:var(--wrong-red); color:white; border:none; padding:4px 10px; border-radius:4px;">Delete</button></div></div><b>${d.question}</b><br><span style="font-size:12px; color:var(--text-muted);">Level: ${d.level||'Mixed'} | Correct: ${aStr}</span></div>`; } else { h += `<div class="card" id="item_${doc.id}" style="padding:15px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between;"><span class="badge-path">${d.path}</span><button onclick="deleteContentItem('${doc.id}')" style="background:var(--wrong-red); color:white; border:none; padding:4px 10px; border-radius:4px;">Delete</button></div><b>📄 ${d.title}</b></div>`; } }); c.innerHTML = h;
    } catch(e) {}
}
async function deleteContentItem(id) { if(!confirm("Delete permanently?")) return; try { await db.collection("content").doc(id).delete(); document.getElementById("item_"+id).remove(); } catch(e){} }
function openEditModal(id) { const d = loadedItemsCache[id]; if(!d) return; document.getElementById('editDocId').value = id; document.getElementById('editQuestion').value = d.question||''; document.getElementById('editOptA').value = d.options?.A||''; document.getElementById('editOptB').value = d.options?.B||''; document.getElementById('editOptC').value = d.options?.C||''; document.getElementById('editOptD').value = d.options?.D||''; document.getElementById('editExplanation').value = d.explanation||''; document.getElementById('editDifficulty').value = d.level||'Mixed'; document.querySelectorAll('.editCorrectCb').forEach(cb => cb.checked = (d.correctAnswers||[]).includes(cb.value)); document.getElementById('editModal').style.display = 'flex'; }
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }
async function saveEditedMCQ() { const id = document.getElementById('editDocId').value; const cA = Array.from(document.querySelectorAll('.editCorrectCb:checked')).map(cb => cb.value); if(cA.length===0) return; try { await db.collection("content").doc(id).update({ question: document.getElementById('editQuestion').value, options: {A:document.getElementById('editOptA').value, B:document.getElementById('editOptB').value, C:document.getElementById('editOptC').value, D:document.getElementById('editOptD').value}, correctAnswers: cA, explanation: document.getElementById('editExplanation').value, level: document.getElementById('editDifficulty').value }); closeEditModal(); showNotification("✅ Saved!"); loadContentForManagement(); } catch(e){} }
async function changeAdminPassword() { const p1 = document.getElementById('newAdminPass').value; const p2 = document.getElementById('confirmAdminPass').value; if(p1.length < 6) return showNotification("⚠️ Password must be 6+ chars."); if(p1 !== p2) return showNotification("❌ Passwords do not match!"); try { await db.collection("settings").doc("admin_auth").set({ password: p1 }); document.getElementById('newAdminPass').value = ""; document.getElementById('confirmAdminPass').value = ""; showNotification("✅ Changed!"); } catch(e){} }

async function loadAdminReports() {
    const c = document.getElementById('reports-list-container'); c.innerHTML = `<p>Loading...</p>`;
    try {
        const s = await db.collection("reported_mistakes").get(); let i = []; s.forEach(doc => i.push({ id: doc.id, ...doc.data() })); i.sort((a,b) => (b.timestamp?.toMillis()||0) - (a.timestamp?.toMillis()||0));
        if(i.length === 0) return c.innerHTML = "<p>No reports.</p>"; let h = '';
        i.forEach(d => { let st = d.status === 'resolved' ? `<span style="color:var(--correct-green);">✅ Resolved</span>` : `<span style="color:var(--text-muted);">⏳ Pending</span>`; h += `<div class="card" style="padding:15px; margin-bottom:10px;"><p><b>${d.reason}</b> (${st})<br><span style="font-size:12px; color:var(--text-muted);">Path: ${d.path} | User: ${d.studentName}</span></p><p style="font-size:14px;">${d.questionText}</p><div style="display:flex; gap:10px;"><button onclick="openEditModalFromReport('${d.questionId}')" style="background:#2196F3; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Edit MCQ</button><button onclick="resolveReport('${d.id}')" style="background:var(--correct-green); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" ${d.status==='resolved'?'disabled':''}>Mark Resolved</button></div></div>`; }); c.innerHTML = h;
    } catch(e) {}
}
async function resolveReport(id) { if(confirm("Resolve this report?")) { await db.collection("reported_mistakes").doc(id).update({status: 'resolved', seenByStudent: false}); loadAdminReports(); } }
async function openEditModalFromReport(qId) { try { let d = await db.collection("content").doc(qId).get(); if (d.exists) { loadedItemsCache[qId] = d.data(); openEditModal(qId); } } catch(e){} }

async function loadAdminDoubts() {
    const c = document.getElementById('doubts-list-container'); c.innerHTML = `<p>Loading...</p>`;
    try {
        const s = await db.collection("flagged_doubts").get(); let i = []; s.forEach(doc => i.push({ id: doc.id, ...doc.data() })); i.sort((a,b) => (b.timestamp?.toMillis()||0) - (a.timestamp?.toMillis()||0));
        if(i.length === 0) return c.innerHTML = "<p>No flags.</p>"; let h = '';
        i.forEach(d => { let st = d.status === 'resolved' ? `<span style="color:var(--correct-green);">✅ Reviewed</span>` : `<span style="color:var(--text-muted);">⏳ Pending</span>`; h += `<div class="card" style="padding:15px; margin-bottom:10px;"><p><b>⭐ Flagged</b> (${st})<br><span style="font-size:12px; color:var(--text-muted);">User: ${d.studentName}</span></p><p style="font-size:14px;">${d.questionText}</p><button onclick="resolveDoubt('${d.id}')" style="background:var(--correct-green); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" ${d.status==='resolved'?'disabled':''}>Mark Reviewed</button></div>`; }); c.innerHTML = h;
    } catch(e) {}
}
async function resolveDoubt(id) { if(confirm("Resolve this doubt?")) { await db.collection("flagged_doubts").doc(id).update({status: 'resolved', seenByStudent: false}); loadAdminDoubts(); } }
async function loadAdminUsers() { const c = document.getElementById('users-table-container'); try { const s = await db.collection("users").orderBy("lastLogin", "desc").get(); let h = `<table><tr><th>Name</th><th>Email</th></tr>`; s.forEach(d => { h += `<tr><td>${d.data().displayName}</td><td>${d.data().email}</td></tr>`; }); c.innerHTML = h + `</table>`; } catch(e){} }
