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
        let totalAvgTimeC = 0; let countC = 0;
        let totalAvgTimeW = 0; let countW = 0;

        validDocs.forEach(d => {
            totalScore += (d.score || 0); 
            totalQuestions += (d.attemptedQuestions || 0);
            
            let c = d.correctCount !== undefined ? d.correctCount : Math.round(((d.accuracy||0)/100) * (d.attemptedQuestions||0));
            let w = d.wrongCount !== undefined ? d.wrongCount : ((d.attemptedQuestions||0) - c);
            
            correctCount += c;
            wrongCount += w;
            accuracyTrend.push(d.accuracy || 0);
            
            if (d.avgTimeCorrect) { totalAvgTimeC += d.avgTimeCorrect; countC++; }
            if (d.avgTimeWrong) { totalAvgTimeW += d.avgTimeWrong; countW++; }
            
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
        let finalAvgTimeC = countC > 0 ? Math.round(totalAvgTimeC / countC) : 0;
        let finalAvgTimeW = countW > 0 ? Math.round(totalAvgTimeW / countW) : 0;

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
            
            <div style="background:#1a1a1a; border:1px solid var(--border-color); padding:15px; border-radius:6px; margin-bottom: 20px;">
                <h3 style="margin-top:0; color:white; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:15px; font-size:15px;">⏱️ Time to Accuracy Insights</h3>
                <div style="display:flex; gap:15px; flex-wrap:wrap;">
                    <div style="flex:1; background:rgba(76, 175, 80, 0.1); border:1px solid var(--correct-green); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--correct-green); font-weight:bold;">${finalAvgTimeC}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Correct Answers</div>
                    </div>
                    <div style="flex:1; background:rgba(244, 67, 54, 0.1); border:1px solid var(--wrong-red); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--wrong-red); font-weight:bold;">${finalAvgTimeW}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Wrong Answers</div>
                    </div>
                </div>
                <p style="font-size:12px; color:var(--text-light); margin-top:15px; line-height:1.5;">💡 If your time on wrong answers is significantly higher, it means you are getting stuck and wasting time on questions you ultimately don't know. Practice skipping difficult questions faster!</p>
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
