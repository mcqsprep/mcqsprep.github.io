// ==========================================
// 4. MAIN VIEW RENDERER & AUTO-SORTER
// ==========================================

function forceStartQuiz() {
    window.location.hash = '#/quiz';
    setTimeout(() => { _initiateQuizEngine(); }, 100);
}

function forceCwStep1(e) {
    if (e) e.stopPropagation();
    window.location.hash = '#/custom-setup';
}

function getSmartIcon(text, customIcon = null) {
    // Prioritize custom icon from Firestore if provided
    if (customIcon) {
        return { i: customIcon, c: "#fdb813", bg: "rgba(253, 184, 19, 0.15)" };
    }

    let t = text.toLowerCase();

    // Exam Categories
    if(t.includes('neet')) return { i: "🩺", c: "#fdb813", bg: "rgba(253, 184, 19, 0.15)" };
    if(t.includes('jee')) return { i: "🚀", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('engineering')) return { i: "⚙️", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('medical')) return { i: "🩺", c: "#E91E63", bg: "rgba(233, 30, 99, 0.15)" };
    if(t.includes('law')) return { i: "⚖️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('defense')) return { i: "🛡️", c: "#FF5722", bg: "rgba(255, 87, 34, 0.15)" };
    if(t.includes('banking')) return { i: "🏦", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('railway')) return { i: "🚂", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('ssc') || t.includes('staff selection')) return { i: "📋", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };
    if(t.includes('upsc') || t.includes('civil')) return { i: "🏛️", c: "#795548", bg: "rgba(121, 85, 72, 0.15)" };
    if(t.includes('gate')) return { i: "🎓", c: "#673AB7", bg: "rgba(103, 58, 183, 0.15)" };
    if(t.includes('cat') || t.includes('mba')) return { i: "📊", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };

    // Subjects
    if(t.includes('physics')) return { i: "⚛️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('chemistry')) return { i: "🧪", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };
    if(t.includes('botany') || t.includes('plant')) return { i: "🌿", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('zoology') || t.includes('animal') || t.includes('lion')) return { i: "🦁", c: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" };
    if(t.includes('biology')) return { i: "🧬", c: "#E91E63", bg: "rgba(233, 30, 99, 0.15)" };
    if(t.includes('math') || t.includes('mathematics')) return { i: "📐", c: "#3F51B5", bg: "rgba(63, 81, 181, 0.15)" };
    if(t.includes('reasoning')) return { i: "🧠", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('aptitude')) return { i: "📈", c: "#009688", bg: "rgba(0, 150, 136, 0.15)" };
    if(t.includes('english')) return { i: "📖", c: "#795548", bg: "rgba(121, 85, 72, 0.15)" };
    if(t.includes('hindi')) return { i: "🔤", c: "#FF5722", bg: "rgba(255, 87, 34, 0.15)" };

    // General Knowledge & Current Affairs
    if(t.includes('history')) return { i: "🏛️", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('geography')) return { i: "🗺️", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('gk') || t.includes('general knowledge')) return { i: "🌍", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('affairs') || t.includes('current')) return { i: "📰", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('politics') || t.includes('polity')) return { i: "🏛️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('economy') || t.includes('economics')) return { i: "💰", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };

    // Materials & Practice
    if(t.includes('ncert')) return { i: "📚", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('pyq') || t.includes('previous')) return { i: "📄", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };
    if(t.includes('mock') || t.includes('test')) return { i: "⏱️", c: "#F44336", bg: "rgba(244, 67, 54, 0.15)" };
    if(t.includes('quiz') || t.includes('practice')) return { i: "📝", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };
    if(t.includes('notes')) return { i: "📝", c: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" };
    if(t.includes('syllabus')) return { i: "📋", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };

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

        let checkPath = currentPath.join(" > ");
        let hasDbChildren = Object.keys(customTopicTypes).some(k => k.startsWith(checkPath + " > "));
        
        let isEndpoint = false;
        if (typeof currentLevel === 'string' || Array.isArray(currentLevel) || (typeof currentLevel === 'object' && Object.keys(currentLevel).length === 0 && !hasDbChildren)) {
            isEndpoint = true;
        }

        // CRITICAL SAFEGUARD: Never treat the Home Screen as an endpoint
        if (currentPath.length === 0) {
            isEndpoint = false;
        }

        if (isEndpoint) {
            let topicNameRaw = currentPath[currentPath.length - 1]; 
            let niceTitle = topicNameRaw.replace(/^\d+\.\s*/, '');
            let topicNameLower = niceTitle.toLowerCase(); 
            
            let isPdfOnly = false;
            let isContainer = false;

            const topicType = customTopicTypes[checkPath];
            const typeValue = topicType ? (typeof topicType === 'object' ? topicType.type : topicType) : null;

            if (typeValue === 'pdf') {
                isPdfOnly = true;
            } else if (typeValue === 'both') {
                isContainer = true;
            } else if (!typeValue || typeValue === 'mcq') {
                let pdfTriggers = ["ncert", "book", "pyq", "previous", "paper", "pdf", "notes", "material", "syllabus"];
                let isPdf = pdfTriggers.some(t => topicNameLower.includes(t));
                let mcqTriggers = ["mcq", "mock", "quiz", "test", "practice", "challenge"];
                let isMcq = mcqTriggers.some(t => topicNameLower.includes(t));

                if (isPdf && !isMcq) isPdfOnly = true;
            }
            
            let studentName = currentUser ? currentUser.displayName.split(" ")[0] : "Student";
            
            if (isContainer) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📂 ${niceTitle}</h2>
                    <p style="color:var(--text-muted);">This category is currently empty. Subtopics will appear here once added by the Admin.</p>
                </div>`;
            } else if (isPdfOnly) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📄 ${niceTitle} Resources</h2>
                    <p style="color:var(--text-muted);">Materials will appear here once uploaded via the Admin Panel.</p>
                </div>`;
            } else {
                let signPrompt = !currentUser ? "Sign in to track your scores on the leaderboard!" : `Ready for practice, <span style="color:var(--primary-yellow);">${studentName}</span>?`;
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📝 ${niceTitle} Practice</h2>
                    <p style="color:var(--text-muted); margin-bottom:25px;">${signPrompt}</p>
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
        
        let keys = new Set(Object.keys(currentLevel));
        Object.keys(customTopicTypes).forEach(dbKey => {
            let parts = dbKey.split(' > ');
            if (currentPath.length === 0) {
                keys.add(parts[0]);
            } else if (dbKey.startsWith(checkPath + " > ")) {
                let nextLevel = dbKey.replace(checkPath + " > ", "").split(' > ')[0];
                keys.add(nextLevel);
            }
        });
        
        let keysArr = Array.from(keys);
        const difficultyOrder = ["Easy", "Medium", "Hard", "Mixed"];
        
        keysArr.sort((a, b) => {
            let idxA = difficultyOrder.indexOf(a); let idxB = difficultyOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1; if (idxB !== -1) return 1;
            
            let matchA = a.match(/^(\d+)\./); let matchB = b.match(/^(\d+)\./);
            if (matchA && matchB) return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            return a.localeCompare(b);
        });

        for (let key of keysArr) { 
            if (currentPath.length === 0 && key === "Daily Quiz Challenge") continue; 
            let fullCheckPath = currentPath.join(" > ") + (currentPath.length > 0 ? " > " : "") + key;
            
            let typeLabel = "";
            const topicType = customTopicTypes[fullCheckPath];
            const typeValue = topicType ? (typeof topicType === 'object' ? topicType.type : topicType) : null;
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;

            if (typeValue === 'mcq') typeLabel = "📝";
            else if (typeValue === 'pdf') typeLabel = "📄";
            else if (typeValue === 'both') typeLabel = "📂";

            let safeKey = key.replace(/'/g, "\\'");
            let displayKey = key.replace(/^\d+\.\s*/, '');
            let fallbackIcon = typeLabel === '📄' ? "📄" : (typeLabel === '📝' ? "📝" : "📁");

            let iconData = getSmartIcon(displayKey, customIcon) || { i: fallbackIcon, c: "#9e9ea7", bg: "rgba(255,255,255,0.08)" };

            h += `<button class="category-tile" onclick="navigateTo('${safeKey}')">
                    <div class="cat-icon" style="background: ${iconData.bg}; color: ${iconData.c};">${iconData.i}</div>
                    <div class="cat-text">${displayKey}</div>
                  </button>`; 
        }
        
        // NO GIANT GO BACK BUTTON HERE ANYMORE
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
            if (subDoc.exists && Array.isArray(subDoc.data().attemptedIds)) return subDoc.data().attemptedIds;
        } catch(e) {}
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
        } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        localProg[safePath] = [...(localProg[safePath] || []), ...newAttemptedIds];
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
}

async function resetProgress(safePath) {
    if(!confirm("Are you sure you want to reset your progress for this section?")) return;
    if (currentUser) {
        try { await db.collection("users").doc(currentUser.uid).collection("progress").doc(safePath).delete(); } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        delete localProg[safePath];
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
    showNotification("🔄 Progress reset for this section!");
    if(typeof _initiateQuizEngine === 'function') _initiateQuizEngine();
}

function _renderProgressSelection() {
    if (!currentUser) {
        document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
        return;
    }
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    
    rootKeys.forEach(k => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        let safeKey = k.replace(/'/g, "\\'");
        // Check for custom icon from customTopics
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let icon = getSmartIcon(cleanKey, customIcon) || { i: "📊" };
        optionsHtml += `<button class="btn-exam" onclick="window.location.hash='#/progress/${encodeURIComponent(safeKey)}'" style="width:100%; max-width:250px; padding:15px; font-size:14px;">${icon.i} ${cleanKey} Analytics</button>`;
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
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Data Available</h2><p style="color:var(--text-muted); font-size:14px;">You haven't completed any quizzes in the ${displayCategory} category yet.</p><button class="btn-exam" onclick="goBack()" style="background:#0d1527; margin-top:20px;">&larr; Back</button></div>`;
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
        
        let weakSpotsText = weakSubjects.length > 0 ? weakSubjects.join(' • ') : "<span style='color:var(--correct-green);'>✅ Excellent! All subjects are >50% accuracy. Keep it up!</span>";

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
    if(dataPoints.length === 0) return;
    
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
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    
    rootKeys.forEach(k => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        let safeKey = k.replace(/'/g, "\\'");
        // Check for custom icon from customTopics
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let smartData = getSmartIcon(cleanKey, customIcon) || { i: "🥇" };

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
// CUSTOM WORKOUT FEATURE (FIXED)
// -----------------------------------------
let cwPath = ""; let cwSubject = "Mixed"; let cwDiff = "Mixed"; let cwLimit = 25;

function cwStep1() {
    const mc = document.getElementById('dynamic-content');
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    
    let html = `
    <div class="card page-transition" style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 class="section-title" style="margin-bottom: 25px; color:var(--primary-yellow); justify-content:center;">⚙️ Custom Practice Setup</h2>
        <p style="color:var(--text-muted); margin-bottom: 25px; text-align:center;">Step 1: Which exam are you preparing for?</p>
        
        <div style="display:grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 25px;">`;
        
        rootKeys.forEach(k => {
            let cleanKey = k.replace(/^\d+\.\s*/, '');
            let safeKey = k.replace(/'/g, "\\'");
            // Check for custom icon from customTopics
            const topicType = customTopicTypes[k];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            let smartData = getSmartIcon(cleanKey, customIcon) || { i: "📁" };

            html += `<button class="btn-exam" onclick="cwSetPath('${safeKey}')" style="background:#0d1527; border-color:var(--border-color); padding:16px; font-size:15px; letter-spacing:0.5px;">${smartData.i} ${cleanKey}</button>`;
        });
        
    html += `
        </div>
        <button class="btn-exam" onclick="goBack()" style="width:100%; background:transparent; border-color:#333; color:var(--text-muted);">&larr; Cancel</button>
    </div>`;
    mc.innerHTML = html;
}

function cwSetPath(path) { cwPath = path; cwStep2(); }

function cwStep2() {
    const mc = document.getElementById('dynamic-content');

    // Safety check: ensure cwPath exists in appData
    if (!appData[cwPath]) {
        mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p style="color:var(--text-muted);">Selected topic not found. Please go back and try again.</p><button class="btn-exam" onclick="cwStep1()" style="margin-top:20px;">&larr; Back</button></div>`;
        return;
    }

    let subjectsHtml = `<option value="Mixed">All Chapters / Subjects (Full Mock)</option>`;

    let dbTopics = new Set();
    if (appData[cwPath]) {
        Object.keys(appData[cwPath]).forEach(c => {
            if(c !== "MCQs Practice" && c !== "Mock Test") dbTopics.add(c);
        });
        if (appData[cwPath]["MCQs Practice"]) {
            Object.keys(appData[cwPath]["MCQs Practice"]).forEach(c => dbTopics.add(c));
        }
    }

    let prefix = cwPath + " > ";
    Object.keys(customTopicTypes).forEach(key => {
        if(key.startsWith(prefix)) {
            let sub = key.replace(prefix, '').split(' > ')[0];
            if(sub && sub !== "MCQs Practice" && sub !== "Mock Test") dbTopics.add(sub);
        }
    });

    dbTopics.forEach(c => {
        let cleanC = c.replace(/^\d+\.\s*/, '');
        subjectsHtml += `<option value="${c.replace(/'/g, "\\'")}">${cleanC}</option>`;
    });

    dbTopics.forEach(c => {
        let cleanC = c.replace(/^\d+\.\s*/, '');
        subjectsHtml += `<option value="${c.replace(/'/g, "\\'")}">${cleanC}</option>`;
    });

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
            <input type="number" id="cwNum" class="input-field" style="font-size:14px; padding:14px;" value="25" min="1" max="500">
        </div>

        <div style="display:flex; gap:15px;">
            <button class="btn-exam" onclick="cwStep1()" style="flex:1; background:#0d1527;">&larr; Back</button>
            <button class="btn-exam" onclick="cwLaunch()" style="flex:2; background:var(--primary-yellow); color:black; border:none; box-shadow: 0 4px 15px rgba(253,184,19,0.3);">Launch Practice 🚀</button>
        </div>
    </div>`;
}

async function cwLaunch() {
    const cwSubjEl = document.getElementById('cwSubj');
    const cwDiffEl = document.getElementById('cwDiffSelect');
    const cwNumEl = document.getElementById('cwNum');

    if (!cwSubjEl || !cwDiffEl || !cwNumEl) {
        console.error("Custom practice form elements not found");
        return;
    }

    cwSubject = cwSubjEl.value;
    cwDiff = cwDiffEl.value;
    cwLimit = parseInt(cwNumEl.value);
    if(isNaN(cwLimit) || cwLimit < 1) cwLimit = 25;

    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title" style="justify-content:center;">🔍 Compiling Custom Practice...</h2><p style="color:var(--text-muted);">Fetching ${cwLimit} questions from database...</p></div>`;

    let targetPath = cwPath;
    if (cwSubject !== "Mixed") targetPath += " > " + cwSubject;

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
        
        // Save to global variables for quiz engine
        if (typeof currentQuestions !== 'undefined') {
            currentQuestions = allDocs; 
            currentQuizPath = targetPath;
            currentIndex = 0;
            userAnswers = {};
            timeSpent = {};
        }

        if(typeof renderQuizInterface === 'function') renderQuizInterface();
        if(typeof startQuestionTimer === 'function') startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p></div>`;
    }
}

// -----------------------------------------
// BOOKMARK MANAGER
// -----------------------------------------
async function loadUserBookmarks() {
    if(!currentUser) return;
    try {
        const doc = await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").get();
        if(doc.exists && Array.isArray(doc.data().list)) { userBookmarks = doc.data().list; }
    } catch(e){}
}

async function bookmarkQuestion(qId) {
    if(!currentUser) { showAuthModal(); return; }
    let savedBookmarks = userBookmarks || [];
    if(savedBookmarks.includes(qId)) { showNotification("⚠️ Already bookmarked!"); return; }
    
    savedBookmarks.push(qId);
    userBookmarks = savedBookmarks;
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({
            list: savedBookmarks, lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        showNotification("🔖 Question saved to Bookmarks!");
    } catch(e) { showNotification("❌ Failed to bookmark"); }
}

async function removeBookmark(qId) {
    if(!currentUser) return;
    let savedBookmarks = userBookmarks || [];
    savedBookmarks = savedBookmarks.filter(id => id !== qId);
    userBookmarks = savedBookmarks;
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({ list: savedBookmarks }, {merge:true});
        let card = document.getElementById('bmCard_'+qId);
        if(card) card.remove();
        showNotification("🗑 Bookmark removed");
    } catch(e){}
}

async function _initiateBookmarkQuiz() {
    const mc = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Bookmarks";
    
    if(!currentUser) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; return; }
    let savedBookmarks = userBookmarks || [];
    if(savedBookmarks.length === 0) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>🔖 No Bookmarks Yet</h2><p style="color:var(--text-muted);">Questions you bookmark during practice will appear here.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none; margin-top:20px;">Back to Home</button></div>`; return; }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding:50px;"><h2 class="section-title" style="justify-content:center;">🔖 Loading Bookmarks...</h2></div>`;

    try {
        let allDocs = [];
        for(let i=0; i<savedBookmarks.length; i+=10) {
            let chunk = savedBookmarks.slice(i, i+10);
            let snap = await db.collection("content").where(firebase.firestore.FieldPath.documentId(), "in", chunk).get();
            snap.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
        }

        if(allDocs.length === 0) { mc.innerHTML = `<div class="card"><p>Bookmarks not found in database.</p></div>`; return; }

        let html = `<div class="card page-transition"><h2 class="section-title">🔖 My Bookmarked Questions</h2><div style="background: rgba(33, 150, 243, 0.1); border-left: 3px solid #2196F3; padding: 10px; margin-bottom: 20px; font-size: 13px; border-radius: 4px;"><span style="color: #2196F3;"><b>Tip:</b></span> Use the 'Ask AI' button to instantly resolve any lingering doubts about these saved questions.</div>`;
        
        allDocs.forEach((q, index) => {
            html += `
            <div class="review-item" id="bmCard_${q.id}">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:var(--text-muted); font-size:12px; font-weight:bold;">${q.path.split(' > ').pop()}</span>
                    <button onclick="removeBookmark('${q.id}')" style="background:none; border:none; color:var(--wrong-red); cursor:pointer; font-size:18px;" title="Remove">✕</button>
                </div>
                <div style="font-weight:500; font-size:15px; margin-bottom:15px; color:#fff;" id="bmQ_${q.id}">${q.question}</div>
                ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-height:150px; border-radius:6px; margin-bottom:15px; display:block; border: 1px solid #333;">` : ''}
                
                <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
                    ${['A','B','C','D'].map(opt => {
                        let text = q.options[opt]; if(!text) return '';
                        let isTrueCorrect = q.correctAnswers.includes(opt);
                        let bg = isTrueCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)";
                        let border = isTrueCorrect ? "var(--correct-green)" : "#1a2744";
                        let color = isTrueCorrect ? "#fff" : "#aaa";
                        return `<div style="background:${bg}; border:1px solid ${border}; color:${color}; padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:center; gap:10px;" id="bmOpt_${q.id}_${opt}">
                            <span style="font-weight:bold; font-size:12px; opacity:0.8;">${opt}</span>${text}
                        </div>`;
                    }).join('')}
                </div>
                
                <button onclick="toggleViewAnswer('bmSol_${q.id}')" style="background:#090e1a; color:white; border:1px solid var(--border-color); padding:8px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">👁 View Explanation</button>
                
                <div id="bmSol_${q.id}" class="quiz-explanation">
                    <strong style="color:var(--primary-yellow); display:block; margin-bottom:8px;">Explanation:</strong>
                    <span id="bmExp_${q.id}">${q.explanation || "No detailed explanation provided by the author."}</span>
                </div>
            </div>`;
        });
        
        html += `</div>`;
        mc.innerHTML = html;

        allDocs.forEach(q => {
            let elQ = document.getElementById('bmQ_'+q.id); if(elQ && typeof renderMathInElement === 'function') renderMathInElement(elQ, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
            ['A','B','C','D'].forEach(opt => {
                let elO = document.getElementById(`bmOpt_${q.id}_${opt}`); if(elO && typeof renderMathInElement === 'function') renderMathInElement(elO, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
            });
            let elE = document.getElementById('bmExp_'+q.id); if(elE && typeof renderMathInElement === 'function') renderMathInElement(elE, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
        });

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

// ==========================================
// MODAL & UI HELPER FUNCTIONS
// ==========================================

// Feedback Modal
function openFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'flex';
}
function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}
let currentRating = 0;
function updateStarUI(rating) {
    currentRating = rating;
    for(let i=1; i<=5; i++) {
        const btn = document.getElementById('star-'+i);
        if(btn) {
            btn.style.color = i <= rating ? '#fdb813' : '#666';
            btn.style.fontSize = i <= rating ? '32px' : '28px';
        }
    }
}
async function submitPlatformFeedback() {
    const text = document.getElementById('platformFeedbackText').value;
    if(!text.trim()) { showNotification("⚠️ Please enter your feedback"); return; }
    if(currentRating === 0) { showNotification("⚠️ Please select a rating"); return; }

    try {
        await db.collection("feedback").add({
            rating: currentRating,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: currentUser ? currentUser.uid : 'anonymous'
        });
        showNotification("✅ Thank you for your feedback!");
        closeFeedbackModal();
        document.getElementById('platformFeedbackText').value = '';
        updateStarUI(0);
    } catch(e) {
        showNotification("❌ Failed to submit feedback");
    }
}

// Streak Modal
function openStreakModal() {
    const streakDisplay = document.getElementById('nav-streak-display');
    const modalCount = document.getElementById('modalStreakCount');
    if(streakDisplay && modalCount) modalCount.innerText = streakDisplay.innerText;
    document.getElementById('streakModal').style.display = 'flex';
}
function closeStreakModal() {
    document.getElementById('streakModal').style.display = 'none';
}

// Search Modal
function openSearch() {
    const wrapper = document.getElementById('searchWrapper');
    if(wrapper) {
        wrapper.classList.add('active');
        document.getElementById('searchInput').focus();
    }
}
function closeSearch() {
    const wrapper = document.getElementById('searchWrapper');
    if(wrapper) wrapper.classList.remove('active');
}
let searchTimeout;
function delayCloseSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const wrapper = document.getElementById('searchWrapper');
        if(wrapper && !wrapper.contains(document.activeElement)) {
            closeSearch();
        }
    }, 200);
}
async function handleLiveSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestions = document.getElementById('searchSuggestions');
    if(!suggestions) return;

    if(query.length < 2) {
        suggestions.style.display = 'none';
        return;
    }

    try {
        const snap = await db.collection("content")
            .where("question", ">=", query)
            .where("question", "<=", query + "\uf8ff")
            .limit(10)
            .get();

        if(snap.empty) {
            suggestions.style.display = 'none';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            const cleanPath = data.path ? data.path.split(' > ').pop() : 'General';
            html += `<div class="search-result-item" onclick="window.location.hash='#/path/${encodeURIComponent(data.path.replace(/ > /g, '/'))}'; closeSearch();">
                <div style="font-size:13px; color:#fff; margin-bottom:4px;">${data.question.substring(0, 60)}${data.question.length > 60 ? '...' : ''}</div>
                <div style="font-size:11px; color:var(--text-muted);">${cleanPath}</div>
            </div>`;
        });

        suggestions.innerHTML = html;
        suggestions.style.display = 'block';
    } catch(e) {
        console.error("Search error:", e);
    }
}