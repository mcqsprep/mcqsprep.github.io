// ==========================================
// 4. MAIN VIEW RENDERER & AUTO-SORTER
// ==========================================

window.forceStartQuiz = function() {
    window.location.hash = '#/quiz';
    setTimeout(() => { _initiateQuizEngine(); }, 100);
};

window.forceCwStep1 = function(e) {
    if (e) e.stopPropagation();
    if (typeof cwStep1 === 'function') cwStep1();
};

function getSmartIcon(text) {
    let t = text.toLowerCase();
    if(t.includes('neet')) return { i: "🩺", c: "#fdb813", bg: "rgba(253, 184, 19, 0.15)" };
    if(t.includes('jee')) return { i: "🚀", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('physics')) return { i: "⚛️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('chemistry')) return { i: "🧪", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };
    if(t.includes('botany') || t.includes('plant')) return { i: "🌿", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('zoology') || t.includes('animal') || t.includes('lion')) return { i: "🦁", c: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" };
    if(t.includes('biology')) return { i: "🧬", c: "#E91E63", bg: "rgba(233, 30, 99, 0.15)" };
    if(t.includes('math')) return { i: "📐", c: "#3F51B5", bg: "rgba(63, 81, 181, 0.15)" };
    if(t.includes('history')) return { i: "🏛️", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('geography')) return { i: "🗺️", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('gk') || t.includes('general knowledge')) return { i: "🌍", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('affairs')) return { i: "📰", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('ncert')) return { i: "📚", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('pyq') || t.includes('previous')) return { i: "📄", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };
    if(t.includes('mock') || t.includes('test')) return { i: "⏱️", c: "#F44336", bg: "rgba(244, 67, 54, 0.15)" };
    return null; 
}

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
            let topicNameRaw = currentPath[currentPath.length - 1]; 
            let topicName = topicNameRaw.replace(/^\d+\.\s*/, ''); 
            let checkPath = currentPath.join(" > ");
            
            let isPdfOnly = false;
            let isContainer = false;
            
            if (customTopicTypes[checkPath] === 'pdf') {
                isPdfOnly = true;
            } else if (customTopicTypes[checkPath] === 'both') {
                isContainer = true;
            } else if (customTopicTypes[checkPath] !== 'mcq') {
                let triggers = ["mcqs practice", "mock test", "general knowledge", "practice paper", "current affairs", "history", "geography", "daily quiz challenge"];
                let reqQuiz = triggers.some(t => checkPath.toLowerCase().includes(t));
                if (!reqQuiz) isPdfOnly = true;
            }
            
            let studentName = (currentUser && currentUser.displayName) ? currentUser.displayName.split(" ")[0] : "Student";
            
            // REMOVED: Large inline "Go Back" buttons since we now have the top-left arrow
            if (isContainer) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📂 ${topicName}</h2>
                    <p style="color:var(--text-muted);">This category is currently empty. Subtopics will appear here once added by the Admin.</p>
                </div>`;
            } else if (isPdfOnly) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">${topicName} Resources</h2>
                    <p style="color:var(--text-muted);">Materials will appear here once uploaded via the Admin Panel.</p>
                </div>`;
            } else {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">${topicName} Practice</h2>
                    <p style="color:var(--text-muted); margin-bottom:25px;">${!currentUser ? "Sign in to track your scores on the leaderboard!" : `Ready for practice, <span style="color:var(--primary-yellow);">${studentName}</span>?`}</p>
                    <button class="btn-exam" onclick="forceStartQuiz()" style="background:var(--primary-yellow) !important; color:black !important; width:100%; max-width:250px; font-size:16px; font-weight:bold; border:none !important; box-shadow:0 4px 15px rgba(253,184,19,0.3) !important;">Start Quiz &rarr;</button>
                </div>`;
            }
            return;
        }

        let titleRaw = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1];
        let title = titleRaw.replace(/^\d+\.\s*/, '');
        let h = ``;

        if (currentPath.length === 0) {
            h += `
            <div class="card setup-hero-card" onclick="forceCwStep1(event)">
                <div class="hero-badge">CUSTOM PRACTICE</div>
                <h2 class="hero-title">Practice smart with tailored mock tests.</h2>
                <p class="hero-desc">Mix subjects, filter by difficulty, and build your ultimate personalized mock test.</p>
                <button class="btn-exam hero-btn" onclick="forceCwStep1(event)">Launch Setup 🚀</button>
            </div>`;
        }

        h += `<div class="card category-section"><h3 class="section-title">${title}</h3><div class="category-grid">`;
        
        let keys = Object.keys(currentLevel);
        const difficultyOrder = ["Easy", "Medium", "Hard", "Mixed"];
        
        keys.sort((a, b) => {
            let idxA = difficultyOrder.indexOf(a);
            let idxB = difficultyOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            
            let matchA = a.match(/^(\d+)\./);
            let matchB = b.match(/^(\d+)\./);
            if (matchA && matchB) return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            
            return a.localeCompare(b);
        });

        for (let key of keys) { 
            if (currentPath.length === 0 && key === "Daily Quiz Challenge") continue; 
            let checkPath = currentPath.join(" > ") + (currentPath.length > 0 ? " > " : "") + key;
            
            let typeLabel = ""; 
            if (customTopicTypes[checkPath] === 'mcq') typeLabel = "📝"; 
            else if (customTopicTypes[checkPath] === 'pdf') typeLabel = "📄";
            else if (customTopicTypes[checkPath] === 'both') typeLabel = "📂";
            
            let safeKey = key.replace(/'/g, "\\'");
            let displayKey = key.replace(/^\d+\.\s*/, '');
            let fallbackIcon = typeLabel === '📄' ? "📄" : (typeLabel === '📝' ? "📝" : "📁");
            
            let iconData = getSmartIcon(displayKey) || { i: fallbackIcon, c: "#9e9ea7", bg: "rgba(255,255,255,0.08)" };

            h += `<button class="category-tile" onclick="navigateTo('${safeKey}')">
                    <div class="cat-icon" style="background: ${iconData.bg}; color: ${iconData.c};">${iconData.i}</div>
                    <div class="cat-text">${displayKey}</div>
                  </button>`; 
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
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    
    // Dynamic Root Fetching for Analytics Options
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    
    rootKeys.forEach(k => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        let safeKey = k.replace(/'/g, "\\'");
        optionsHtml += `<button class="btn-exam" onclick="window.location.hash='#/progress/${encodeURIComponent(safeKey)}'" style="width:100%; max-width:250px; padding:15px; font-size:14px;">📊 ${cleanKey} Analytics</button>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition" style="text-align:center; padding: 40px 20px;">
            <h2 class="section-title" style="justify-content:center;">📊 Select Analytics Dashboard</h2>
            <p style="color:var(--text-muted); margin-bottom:30px; font-size:14px;">Choose an exam category to view your detailed performance metrics and weak spots.</p>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                ${optionsHtml}
            </div>
        </div>
    `;
}

async function _renderProgressDashboard(category) {
    if (!currentUser) return;
    
    let displayCategory = category.replace(/^\d+\.\s*/, '');
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
            if (d.examCategory === category || (d.quizPath && d.quizPath.startsWith(category))) {
                validDocs.push(d);
            }
        });

        if (validDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Data Available</h2><p style="color:var(--text-muted); font-size:14px;">You haven't completed any quizzes in the ${displayCategory} category yet.</p></div>`;
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
                    let cleanS = s.replace(/^\d+\.\s*/, '');
                    if(!aggregatedSubs[cleanS]) aggregatedSubs[cleanS] = { attempts: 0, correct: 0 };
                    aggregatedSubs[cleanS].attempts += d.subjectBreakdown[s].attempts;
                    aggregatedSubs[cleanS].correct += d.subjectBreakdown[s].correct;
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
            <h2 class="section-title" style="margin-top:0; margin-bottom:15px; font-size:22px;">${displayCategory} Performance</h2>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 15px;">
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 24px; color: white; font-weight: bold;">${totalQuestions}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Attempted</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--correct-green);">
                    <div style="font-size: 24px; color: var(--correct-green); font-weight: bold;">${correctCount}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Right</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--wrong-red);">
                    <div style="font-size: 24px; color: var(--wrong-red); font-weight: bold;">${wrongCount}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Wrong</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--primary-yellow);">
                    <div style="font-size: 24px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Overall Mark</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 24px; color: white; font-weight: bold;">${overallAccuracy}%</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Accuracy</div>
                </div>
            </div>

            <div style="background:rgba(239, 68, 68, 0.05); border-left:3px solid var(--wrong-red); padding:12px; border-radius:4px; margin-bottom:20px;">
                <div style="color:var(--wrong-red); font-size:11px; font-weight:bold; margin-bottom:5px; text-transform:uppercase;">Needs Improvement</div>
                <div style="font-size:13px; color:#d1d5db; line-height:1.4;">${weakSpotsText}</div>
            </div>
            
            <div style="background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px; margin-bottom: 20px;">
                <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">⏱️ Time to Accuracy Insights</h3>
                <div style="display:flex; gap:15px; flex-wrap:wrap;">
                    <div style="flex:1; background:rgba(16, 185, 129, 0.1); border:1px solid var(--correct-green); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--correct-green); font-weight:bold;">${finalAvgTimeC}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Correct Answers</div>
                    </div>
                    <div style="flex:1; background:rgba(239, 68, 68, 0.1); border:1px solid var(--wrong-red); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--wrong-red); font-weight:bold;">${finalAvgTimeW}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Wrong Answers</div>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <div style="flex:1; min-width:280px; background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Subject-Wise Mastery</h3>
                    ${subjectHtml}
                </div>

                <div style="flex:1; min-width:280px; background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Accuracy Trajectory</h3>
                    <canvas id="accuracyChart" style="width:100%; height:160px;"></canvas>
                </div>
            </div>
        </div>`;

        setTimeout(() => drawAccuracyChart(recentTrend), 50);

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
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
    
    ctx.strokeStyle = '#1a2744'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(val => {
        let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w-padding, y); ctx.stroke();
        ctx.fillStyle = '#8492a6'; ctx.font = '10px sans-serif'; ctx.fillText(val+'%', 0, y+3);
    });
    
    if(dataPoints.length > 1) {
        ctx.strokeStyle = '#fdb813'; ctx.lineWidth = 2; ctx.beginPath();
        dataPoints.forEach((val, i) => {
            let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
            if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    
    ctx.fillStyle = '#10b981';
    dataPoints.forEach((val, i) => {
        let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    });
}

function _renderLeaderboardOptions() { 
    document.getElementById('breadcrumb-text').innerText = "Home / Leaderboard"; 
    
    // Dynamic Root Fetching for Leaderboard Options
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    
    rootKeys.forEach(k => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        let safeKey = k.replace(/'/g, "\\'");
        
        // Use smart icon for the leaderboard buttons too
        let smartData = getSmartIcon(cleanKey) || { i: "🥇" };
        
        optionsHtml += `<button class="btn-exam category-tile" onclick="window.location.hash='#/board/${encodeURIComponent(safeKey)}'" style="flex-direction:row; padding:15px; flex:1; min-width:200px;">
            <div class="cat-icon" style="background: rgba(255,255,255,0.05); color: #fff; width:30px; height:30px; font-size:14px;">${smartData.i}</div>
            <div class="cat-text" style="font-size:13px; letter-spacing:0.5px; text-transform:uppercase;">${cleanKey} Leaderboard</div>
        </button>`;
    });
    
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">🏆 Global Leaderboards</h2>
            <p style="color:var(--text-muted); margin-bottom: 20px;">Select a category to view the top 10 scores.</p>
            <div style="background: rgba(239, 68, 68, 0.05); border-left: 4px solid var(--wrong-red); padding: 12px; margin-bottom: 25px; border-radius: 4px;">
                <span style="color: var(--wrong-red); font-weight: bold;">⚠️ CAUTION:</span> <span style="color: #d1d5db; font-size: 14px;">Only signed-in users will have their scores recorded and displayed on the leaderboard.</span>
            </div>
            <div class="category-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                ${optionsHtml}
            </div>
        </div>`; 
}

// -----------------------------------------
// CUSTOM WORKOUT FEATURE (DYNAMIC ROOT LOADER)
// -----------------------------------------
let cwPath = ""; let cwSubject = "Mixed"; let cwDiff = "Mixed"; let cwLimit = 20;

function cwStep1() {
    const mc = document.getElementById('dynamic-content');
    
    // Dynamically fetch Root Level folders from appData
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    
    let html = `
    <div class="card page-transition" style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 class="section-title" style="margin-bottom: 25px; color:var(--primary-yellow); justify-content:center;">⚙️ Custom Practice Setup</h2>
        <p style="color:var(--text-muted); margin-bottom: 25px; text-align:center;">Step 1: Which exam are you preparing for?</p>
        
        <div style="display:grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 25px;">`;
        
        rootKeys.forEach(k => {
            let cleanKey = k.replace(/^\d+\.\s*/, '');
            let safeKey = k.replace(/'/g, "\\'");
            let smartData = getSmartIcon(cleanKey) || { i: "📁" };
            
            html += `<button class="btn-exam" onclick="cwSetPath('${safeKey}')" style="background:#0d1527; border-color:var(--border-color); padding:16px; font-size:15px; letter-spacing:0.5px;">${smartData.i} ${cleanKey}</button>`;
        });
        
    html += `
        </div>
    </div>`;
    mc.innerHTML = html;
}

function cwSetPath(path) { cwPath = path; cwStep2(); }

function cwStep2() {
    const mc = document.getElementById('dynamic-content');
    
    let subjectsHtml = `<option value="Mixed">All Subjects (Full Mock)</option>`;
    if (appData[cwPath] && appData[cwPath]["MCQs Practice"]) {
        let subjects = Object.keys(appData[cwPath]["MCQs Practice"]);
        subjects.forEach(s => { 
            let cleanS = s.replace(/^\d+\.\s*/, '');
            subjectsHtml += `<option value="${s.replace(/'/g, "\\'")}">${cleanS}</option>`; 
        });
    }

    mc.innerHTML = `
    <div class="card page-transition" style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 class="section-title" style="margin-bottom: 25px; color:var(--primary-yellow); justify-content:center;">🎯 Customize Your Test</h2>
        
        <div style="margin-bottom: 20px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:12px; font-weight:bold; text-transform:uppercase;">Select Subject/Topic</label>
            <select id="cwSubj" class="input-field" style="font-size:14px; padding:14px;">${subjectsHtml}</select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:12px; font-weight:bold; text-transform:uppercase;">Difficulty Level</label>
            <select id="cwDiffSelect" class="input-field" style="font-size:14px; padding:14px;">
                <option value="Mixed">Mixed (Real Exam Balance)</option>
                <option value="Easy">Easy (Warmup)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Challenge)</option>
            </select>
        </div>
        
        <div style="margin-bottom: 30px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:12px; font-weight:bold; text-transform:uppercase;">Number of Questions</label>
            <select id="cwNum" class="input-field" style="font-size:14px; padding:14px;">
                <option value="10">10 Questions (Quick)</option>
                <option value="25" selected>25 Questions (Standard)</option>
                <option value="50">50 Questions (Half Mock)</option>
                <option value="100">100 Questions (Full Length)</option>
                <option value="200">200 Questions (Marathon)</option>
                <option value="250">250 Questions (Extreme Limit)</option>
            </select>
        </div>

        <div style="display:flex; gap:15px;">
            <button class="btn-exam" onclick="cwStep1()" style="flex:1; background:#0d1527;">&larr; Back</button>
            <button class="btn-exam" onclick="cwLaunch()" style="flex:2; background:var(--primary-yellow); color:black; border:none; box-shadow: 0 4px 15px rgba(253,184,19,0.3);">Launch Practice 🚀</button>
        </div>
    </div>`;
}

async function cwLaunch() {
    cwSubject = document.getElementById('cwSubj').value;
    cwDiff = document.getElementById('cwDiffSelect').value;
    cwLimit = parseInt(document.getElementById('cwNum').value);
    
    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title" style="justify-content:center;">🔍 Compiling Custom Practice...</h2><p style="color:var(--text-muted);">Fetching ${cwLimit} questions from database...</p></div>`;

    let targetPath = cwPath;
    if (cwSubject !== "Mixed") targetPath += " > MCQs Practice > " + cwSubject;

    try {
        let query = db.collection("content")
            .where("path", ">=", targetPath)
            .where("path", "<=", targetPath + "\uf8ff")
            .where("type", "==", "mcq");

        if (cwDiff !== "Mixed") query = query.where("level", "==", cwDiff);

        let randomStart = Math.random();
        let snapshot = await query.where("randomKey", ">=", randomStart).orderBy("randomKey").limit(cwLimit).get();
        let allDocs = [];
        snapshot.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));

        if (allDocs.length < cwLimit) {
            let remainder = cwLimit - allDocs.length;
            let snapshot2 = await query.where("randomKey", "<", randomStart).orderBy("randomKey").limit(remainder).get();
            snapshot2.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
        }

        if (allDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="justify-content:center;">No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find enough questions matching these exact filters.</p><button class="btn-exam" onclick="cwStep2()" style="margin-top:20px; background:#0d1527; border-color:var(--border-color);">&larr; Adjust Filters</button></div>`;
            return;
        }

        allDocs.sort(() => Math.random() - 0.5);
        currentQuestions = allDocs; 
        currentQuizPath = targetPath;
        currentIndex = 0;
        userAnswers = {};
        timeSpent = {};

        renderQuizInterface();
        startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p></div>`;
    }
}
