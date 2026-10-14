// ==========================================
// 4. MAIN VIEW RENDERER & AUTO-SORTER
// ==========================================

function forceStartQuiz() {
    window.location.hash = '#/quiz';
    setTimeout(() => { if (typeof _initiateQuizEngine === 'function') _initiateQuizEngine(); }, 50);
}

function forceCwStep1(e) {
    if (e) e.stopPropagation();
    window.location.hash = '#/custom-setup';
}

function getSmartIcon(text, customIcon = null) {
    if (customIcon && String(customIcon).trim() !== "") {
        return { i: String(customIcon).trim(), c: "#fdb813", bg: "rgba(253, 184, 19, 0.15)" };
    }

    let t = (text || "").toLowerCase();

    // Exam Categories
    if(t.includes('neet')) return { i: "🩺", c: "#fdb813", bg: "rgba(253, 184, 19, 0.15)" };
    if(t.includes('jee')) return { i: "🚀", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('engineering')) return { i: "⚙️", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('medical') || t.includes('aiims') || t.includes('paramedical')) return { i: "🩺", c: "#E91E63", bg: "rgba(233, 30, 99, 0.15)" };
    if(t.includes('law') || t.includes('clat')) return { i: "⚖️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('defense') || t.includes('nda') || t.includes('cds')) return { i: "🛡️", c: "#FF5722", bg: "rgba(255, 87, 34, 0.15)" };
    if(t.includes('banking') || t.includes('ibps') || t.includes('sbi')) return { i: "🏦", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('railway') || t.includes('rrb')) return { i: "🚂", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('ssc') || t.includes('staff selection')) return { i: "📋", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };
    if(t.includes('upsc') || t.includes('civil')) return { i: "🏛️", c: "#795548", bg: "rgba(121, 85, 72, 0.15)" };
    if(t.includes('gate')) return { i: "🎓", c: "#673AB7", bg: "rgba(103, 58, 183, 0.15)" };
    if(t.includes('cat') || t.includes('mba') || t.includes('cuet')) return { i: "📊", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };

    // Specific Science & Exam Subtopics
    if(t.includes('organic')) return { i: "⌬", c: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    if(t.includes('inorganic')) return { i: "💎", c: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)" };
    if(t.includes('physical')) return { i: "⚡", c: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
    if(t.includes('physics') || t.includes('mechanics') || t.includes('optics') || t.includes('electro')) return { i: "⚛️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('chemistry') || t.includes('chemical') || t.includes('thermodynamics')) return { i: "🧪", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };
    if(t.includes('botany') || t.includes('plant') || t.includes('ecology') || t.includes('photosynthesis')) return { i: "🌿", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('zoology') || t.includes('animal') || t.includes('human') || t.includes('physiology')) return { i: "🦁", c: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" };
    if(t.includes('biology') || t.includes('genetics') || t.includes('cell') || t.includes('biomolecule') || t.includes('biotech')) return { i: "🧬", c: "#E91E63", bg: "rgba(233, 30, 99, 0.15)" };
    if(t.includes('math') || t.includes('calculus') || t.includes('algebra') || t.includes('geometry')) return { i: "📐", c: "#3F51B5", bg: "rgba(63, 81, 181, 0.15)" };
    if(t.includes('reasoning') || t.includes('logic')) return { i: "🧠", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('aptitude') || t.includes('quant')) return { i: "📈", c: "#009688", bg: "rgba(0, 150, 136, 0.15)" };
    if(t.includes('english') || t.includes('grammar') || t.includes('vocab')) return { i: "📖", c: "#795548", bg: "rgba(121, 85, 72, 0.15)" };
    if(t.includes('hindi')) return { i: "🔤", c: "#FF5722", bg: "rgba(255, 87, 34, 0.15)" };

    // General Knowledge & Current Affairs
    if(t.includes('history') || t.includes('ancient') || t.includes('modern')) return { i: "🏛️", c: "#FF9800", bg: "rgba(255, 152, 0, 0.15)" };
    if(t.includes('geography') || t.includes('earth')) return { i: "🗺️", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('gk') || t.includes('general knowledge')) return { i: "🌍", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };
    if(t.includes('affairs') || t.includes('current') || t.includes('news')) return { i: "📰", c: "#2196F3", bg: "rgba(33, 150, 243, 0.15)" };
    if(t.includes('politics') || t.includes('polity') || t.includes('constitution')) return { i: "🏛️", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('economy') || t.includes('economics')) return { i: "💰", c: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)" };

    // Materials & Practice
    if(t.includes('ncert') || t.includes('book')) return { i: "📚", c: "#9C27B0", bg: "rgba(156, 39, 176, 0.15)" };
    if(t.includes('pyq') || t.includes('previous') || t.includes('paper')) return { i: "📄", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };
    if(t.includes('mock') || t.includes('test')) return { i: "⏱️", c: "#F44336", bg: "rgba(244, 67, 54, 0.15)" };
    if(t.includes('quiz') || t.includes('practice') || t.includes('mcq')) return { i: "📝", c: "#00BCD4", bg: "rgba(0, 188, 212, 0.15)" };
    if(t.includes('note') || t.includes('formula') || t.includes('short')) return { i: "📒", c: "#FFC107", bg: "rgba(255, 193, 7, 0.15)" };
    if(t.includes('syllabus')) return { i: "📋", c: "#607D8B", bg: "rgba(96, 125, 139, 0.15)" };

    return null;
}

async function _renderPdfResources(checkPath, niceTitle) {
    const mc = document.getElementById('dynamic-content');
    if (!mc) return;
    mc.innerHTML = `
    <div class="card page-transition">
        <h2 class="section-title">📄 ${niceTitle} Resources</h2>
        <p style="color:var(--text-muted);">Loading study materials...</p>
    </div>`;

    try {
        const snap = await db.collection("content")
            .where("path", "==", checkPath)
            .where("type", "==", "material")
            .get();

        if (snap.empty) {
            mc.innerHTML = `
            <div class="card page-transition">
                <h2 class="section-title">📄 ${niceTitle} Resources</h2>
                <p style="color:var(--text-muted);">No study materials uploaded to this folder yet. Materials will appear here once uploaded via the Admin Panel.</p>
                <button class="btn-exam" onclick="goBack()" style="margin-top:15px; background:#0d1527;">&larr; Go Back</button>
            </div>`;
            return;
        }

        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        items.sort((a, b) => ((b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));

        let listHtml = items.map(item => `
            <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:10px; padding:16px 20px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="cat-icon" style="background:rgba(156, 39, 176, 0.15); color:#9C27B0;">📄</div>
                    <div>
                        <div style="font-weight:700; font-size:15px; color:#fff;">${item.title || 'Study Material'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${niceTitle}</div>
                    </div>
                </div>
                <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-exam" style="background:var(--primary-yellow); color:#000; border:none; text-decoration:none;">Open / Download ↗</a>
            </div>
        `).join('');

        mc.innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">📄 ${niceTitle} Resources</h2>
            <div style="margin-top:15px;">${listHtml}</div>
        </div>`;
    } catch (e) {
        mc.innerHTML = `<div class="card"><h2 class="section-title">📄 ${niceTitle}</h2><p style="color:var(--wrong-red);">Error loading materials: ${e.message}</p></div>`;
    }
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
            
            let studentName = (currentUser && currentUser.displayName) ? currentUser.displayName.split(" ")[0] : "Student";
            
            if (isContainer) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📂 ${niceTitle}</h2>
                    <p style="color:var(--text-muted);">This category is currently empty. Subtopics will appear here once added by the Admin.</p>
                </div>`;
            } else if (isPdfOnly) {
                _renderPdfResources(checkPath, niceTitle);
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
        
        h += `</div></div>`; 
        mc.innerHTML = `<div class="page-transition">${h}</div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(err) { console.error("Render View Error:", err); }
}

// ==========================================
// 6. SCALED TRACK PROGRESS, LEADERBOARDS, REPORTS & FEEDBACK
// ==========================================
async function getAttemptedIdsForPath(safePath) {
    let docKey = encodeURIComponent(safePath);
    let ids = [];
    if (currentUser) {
        try {
            const subDoc = await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).get();
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
    let docKey = encodeURIComponent(safePath);
    if (currentUser) {
        try {
            await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).set({
                path: safePath,
                attemptedIds: firebase.firestore.FieldValue.arrayUnion(...newAttemptedIds),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        localProg[safePath] = Array.from(new Set([...(localProg[safePath] || []), ...newAttemptedIds]));
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
}

async function resetProgress(safePath) {
    if(!confirm("Are you sure you want to reset your progress for this section?")) return;
    let docKey = encodeURIComponent(safePath);
    if (currentUser) {
        try { await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).delete(); } catch(e) {}
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
        document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><p style="color:var(--text-muted); margin-bottom:20px;">Please sign in to view your personalized exam analytics.</p><button class="btn-exam" onclick="showAuthModal()" style="background:var(--primary-yellow); color:#000; border:none; margin-right:10px;">Sign In</button><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
        return;
    }
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    
    rootKeys.forEach(k => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let icon = getSmartIcon(cleanKey, customIcon) || { i: "📊" };
        optionsHtml += `<button class="btn-exam" onclick="window.location.hash='#/progress/${encodeURIComponent(k)}'" style="width:100%; max-width:250px; padding:15px; font-size:14px;">${icon.i} ${cleanKey} Analytics</button>`;
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
    if (!currentUser) { _renderProgressSelection(); return; }
    
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
            if (d.examCategory === category || (d.quizPath && (d.quizPath.startsWith(category) || d.quizPath.startsWith("Daily Quiz Challenge > " + category)))) {
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

        let overallAccuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
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
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let smartData = getSmartIcon(cleanKey, customIcon) || { i: "🥇" };

        optionsHtml += `<button class="btn-exam category-tile" onclick="window.location.hash='#/board/${encodeURIComponent(k)}'" style="flex-direction:row; padding:15px; flex:1; min-width:200px;">
            <div class="cat-icon" style="background: rgba(255,255,255,0.05); color: #fff; width:30px; height:30px; font-size:14px;">${smartData.i}</div>
            <div class="cat-text" style="font-size:13px; letter-spacing:0.5px; text-transform:uppercase;">${cleanKey} Leaderboard</div>
        </button>`;
    });
    
    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">🏆 Global Leaderboards</h2>
            <p style="color:var(--text-muted); margin-bottom: 20px;">Select a category to view the top performers.</p>
            <div style="background: rgba(239, 68, 68, 0.05); border-left: 4px solid var(--wrong-red); padding: 12px; margin-bottom: 25px; border-radius: 4px;">
                <span style="color: var(--wrong-red); font-weight: bold;">⚠️ NOTE:</span> <span style="color: #d1d5db; font-size: 14px;">Only signed-in users will have their scores recorded and displayed on the leaderboard.</span>
            </div>
            <div class="category-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                ${optionsHtml}
            </div>
        </div>`; 
}

// RESTORED: Live Leaderboard Renderer for #/board/:category
async function fetchLiveLeaderboard(category) {
    const mc = document.getElementById('dynamic-content');
    let cleanCategory = category.replace(/^\d+\.\s*/, '');
    document.getElementById('breadcrumb-text').innerText = `Home / Leaderboard / ${cleanCategory}`;
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding:40px;"><h2 class="section-title" style="justify-content:center;">🏆 Loading ${cleanCategory} Leaderboard...</h2></div>`;

    try {
        const snap = await db.collection("leaderboards").limit(300).get();
        let bestByUser = {};

        snap.forEach(doc => {
            let d = doc.data();
            let matchesCategory = (d.examCategory === category) ||
                (d.quizPath && (d.quizPath.startsWith(category) || d.quizPath.startsWith("Daily Quiz Challenge > " + category)));
            if (!matchesCategory) return;

            let uid = d.userId || d.userName || doc.id;
            if (!bestByUser[uid]) {
                bestByUser[uid] = {
                    userId: d.userId,
                    userName: d.userName || "Student",
                    totalScore: 0,
                    bestScore: d.score || 0,
                    accuracy: d.accuracy || 0,
                    quizzesPlayed: 0
                };
            }
            bestByUser[uid].totalScore += (d.score || 0);
            bestByUser[uid].quizzesPlayed += 1;
            if ((d.score || 0) >= bestByUser[uid].bestScore) {
                bestByUser[uid].bestScore = d.score || 0;
                bestByUser[uid].accuracy = d.accuracy || 0;
            }
        });

        let rankings = Object.values(bestByUser).sort((a, b) => b.totalScore - a.totalScore || b.accuracy - a.accuracy).slice(0, 20);

        if (rankings.length === 0) {
            mc.innerHTML = `
            <div class="card page-transition" style="text-align:center; padding:40px 20px;">
                <h2 class="section-title" style="justify-content:center;">🏆 ${cleanCategory} Leaderboard</h2>
                <p style="color:var(--text-muted); margin-bottom:25px;">No scores recorded for ${cleanCategory} yet. Be the first to claim #1!</p>
                <button class="btn-exam" onclick="goBack()" style="background:#0d1527;">&larr; Back</button>
            </div>`;
            return;
        }

        let rowsHtml = rankings.map((r, idx) => {
            let rankBadge = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : `#${idx + 1}`));
            let isMe = currentUser && r.userId === currentUser.uid;
            let rowBg = isMe ? "rgba(253, 184, 19, 0.12)" : "#090e1a";
            let rowBorder = isMe ? "var(--primary-yellow)" : "var(--border-color)";

            return `
            <div style="display:flex; align-items:center; justify-content:space-between; background:${rowBg}; border:1px solid ${rowBorder}; padding:14px 18px; border-radius:10px; margin-bottom:10px; gap:10px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <span style="font-size:18px; font-weight:800; min-width:32px; text-align:center; color:var(--primary-yellow);">${rankBadge}</span>
                    <div>
                        <div style="font-weight:700; color:#fff; font-size:15px;">${r.userName} ${isMe ? '<span style="font-size:11px; color:var(--primary-yellow);">(You)</span>' : ''}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${r.quizzesPlayed} Quiz${r.quizzesPlayed > 1 ? 'zes' : ''} • Best Accuracy: ${r.accuracy}%</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:18px; font-weight:800; color:var(--correct-green);">${r.totalScore} pts</div>
                    <div style="font-size:11px; color:var(--text-muted);">Best: ${r.bestScore}</div>
                </div>
            </div>`;
        }).join('');

        mc.innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">🏆 ${cleanCategory} Top Performers</h2>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Ranked by cumulative score across ${cleanCategory} practice sessions.</p>
            <div>${rowsHtml}</div>
        </div>`;
    } catch (e) {
        mc.innerHTML = `<div class="card"><h2 class="section-title">Error</h2><p style="color:var(--wrong-red);">${e.message}</p></div>`;
    }
}

// -----------------------------------------
// CUSTOM PRACTICE FEATURE (FIXED PATH RESOLUTION & QUERY)
// -----------------------------------------
let cwPath = ""; let cwSubject = "Mixed"; let cwDiff = "Mixed"; let cwLimit = 25;

function cwStep1() {
    const mc = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Custom Practice";
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    
    let html = `
    <div class="card page-transition" style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 class="section-title" style="margin-bottom: 25px; color:var(--primary-yellow); justify-content:center;">⚙️ Custom Practice Setup</h2>
        <p style="color:var(--text-muted); margin-bottom: 25px; text-align:center;">Step 1: Which exam are you preparing for?</p>
        
        <div style="display:grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 25px;">`;
        
        rootKeys.forEach(k => {
            let cleanKey = k.replace(/^\d+\.\s*/, '');
            let safeKey = k.replace(/'/g, "\\'");
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

    if (!appData[cwPath]) {
        mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p style="color:var(--text-muted);">Selected topic not found. Please go back and try again.</p><button class="btn-exam" onclick="cwStep1()" style="margin-top:20px;">&larr; Back</button></div>`;
        return;
    }

    let subjectsHtml = `<option value="Mixed">All Chapters / Subjects (Full Mock)</option>`;
    let topicMap = new Map(); // relativePath -> displayLabel

    let pdfKeywords = ["ncert", "book", "pyq", "previous", "paper", "pdf", "notes", "material", "syllabus"];
    function isPdfFolder(fullKey, name) {
        let tObj = customTopicTypes[fullKey];
        let tVal = tObj ? (typeof tObj === 'object' ? tObj.type : tObj) : null;
        if (tVal === 'pdf') return true;
        if (tVal === 'mcq' || tVal === 'both') return false;
        let lower = name.toLowerCase();
        return pdfKeywords.some(k => lower.includes(k)) && !lower.includes('mcq') && !lower.includes('practice') && !lower.includes('mock');
    }

    Object.keys(appData[cwPath]).forEach(topKey => {
        let fullTopKey = cwPath + " > " + topKey;
        if (isPdfFolder(fullTopKey, topKey)) return;

        if (topKey === "MCQs Practice" && typeof appData[cwPath][topKey] === 'object') {
            Object.keys(appData[cwPath][topKey]).forEach(subKey => {
                let relPath = `MCQs Practice > ${subKey}`;
                topicMap.set(relPath, subKey.replace(/^\d+\.\s*/, ''));
            });
        } else if (topKey !== "Mock Test") {
            topicMap.set(topKey, topKey.replace(/^\d+\.\s*/, ''));
        }
    });

    let prefix = cwPath + " > ";
    Object.keys(customTopicTypes).forEach(key => {
        if (key.startsWith(prefix)) {
            if (isPdfFolder(key, key.split(' > ').pop())) return;
            let rel = key.slice(prefix.length);
            let parts = rel.split(' > ');
            if (parts[0] === "MCQs Practice" && parts.length >= 2) {
                let subRel = `MCQs Practice > ${parts[1]}`;
                if (!topicMap.has(subRel)) topicMap.set(subRel, parts[1].replace(/^\d+\.\s*/, ''));
            } else if (parts[0] !== "Mock Test" && parts[0] !== "MCQs Practice") {
                if (!topicMap.has(parts[0])) topicMap.set(parts[0], parts[0].replace(/^\d+\.\s*/, ''));
            }
        }
    });

    Array.from(topicMap.entries()).forEach(([relPath, label]) => {
        subjectsHtml += `<option value="${relPath.replace(/"/g, '&quot;')}">${label}</option>`;
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

    if (!cwSubjEl || !cwDiffEl || !cwNumEl) return;

    cwSubject = cwSubjEl.value;
    cwDiff = cwDiffEl.value;
    cwLimit = parseInt(cwNumEl.value, 10);
    if(isNaN(cwLimit) || cwLimit < 1) cwLimit = 25;

    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title" style="justify-content:center;">🔍 Compiling Custom Practice...</h2><p style="color:var(--text-muted);">Fetching ${cwLimit} questions from database...</p></div>`;

    let targetPath = cwPath;
    if (cwSubject !== "Mixed") targetPath += " > " + cwSubject;

    try {
        // Safe query that avoids Firestore multi-field inequality composite index errors
        let snapshot = await db.collection("content")
            .where("path", ">=", targetPath)
            .where("path", "<=", targetPath + "\uf8ff")
            .where("type", "==", "mcq")
            .limit(300)
            .get();

        let allDocs = [];
        snapshot.forEach(doc => {
            let d = doc.data();
            if (cwDiff === "Mixed" || d.level === cwDiff) {
                allDocs.push({ id: doc.id, ...d });
            }
        });

        if (allDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="justify-content:center;">No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find any questions matching "${targetPath}" (${cwDiff}).</p><button class="btn-exam" onclick="cwStep2()" style="margin-top:20px; background:#0d1527; border-color:var(--border-color);">&larr; Adjust Filters</button></div>`;
            return;
        }

        // Fisher-Yates shuffle
        for (let i = allDocs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allDocs[i], allDocs[j]] = [allDocs[j], allDocs[i]];
        }
        allDocs = allDocs.slice(0, cwLimit);
        
        currentQuestions = allDocs; 
        currentQuizPath = targetPath;
        currentIndex = 0;
        userAnswers = {};
        timeSpent = {};

        document.body.classList.add('hide-bottom-bar');
        if(typeof renderQuizInterface === 'function') renderQuizInterface();
        if(typeof startQuestionTimer === 'function') startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p><button class="btn-exam" onclick="cwStep2()">&larr; Back</button></div>`;
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
        if (typeof renderQuizInterface === 'function' && window.location.hash === '#/quiz') renderQuizInterface();
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
        
        allDocs.forEach((q) => {
            html += `
            <div class="review-item" id="bmCard_${q.id}">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:var(--text-muted); font-size:12px; font-weight:bold;">${(q.path || '').split(' > ').pop()}</span>
                    <button onclick="removeBookmark('${q.id}')" style="background:none; border:none; color:var(--wrong-red); cursor:pointer; font-size:18px;" title="Remove">✕</button>
                </div>
                <div style="font-weight:500; font-size:15px; margin-bottom:15px; color:#fff;" id="bmQ_${q.id}">${q.question}</div>
                ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-height:150px; border-radius:6px; margin-bottom:15px; display:block; border: 1px solid #333;">` : ''}
                
                <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
                    ${['A','B','C','D'].map(opt => {
                        let text = q.options ? q.options[opt] : ''; if(!text) return '';
                        let isTrueCorrect = (q.correctAnswers || []).includes(opt);
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

        const mathDelims = [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ];
        allDocs.forEach(q => {
            let elQ = document.getElementById('bmQ_'+q.id); if(elQ && typeof renderMathInElement === 'function') renderMathInElement(elQ, { delimiters: mathDelims, throwOnError: false });
            ['A','B','C','D'].forEach(opt => {
                let elO = document.getElementById(`bmOpt_${q.id}_${opt}`); if(elO && typeof renderMathInElement === 'function') renderMathInElement(elO, { delimiters: mathDelims, throwOnError: false });
            });
            let elE = document.getElementById('bmExp_'+q.id); if(elE && typeof renderMathInElement === 'function') renderMathInElement(elE, { delimiters: mathDelims, throwOnError: false });
        });

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

// ==========================================
// MODAL, REPORTS, RATING & SEARCH FUNCTIONS
// ==========================================

// Global Rating Loader
async function loadGlobalRating() {
    try {
        const snap = await db.collection("platform_feedback").limit(100).get();
        if (snap.empty) return;
        let sum = 0; let count = 0;
        snap.forEach(doc => {
            let r = Number(doc.data().rating);
            if (r >= 1 && r <= 5) { sum += r; count++; }
        });
        if (count > 0) {
            const el = document.getElementById('global-rating-display');
            if (el) el.innerText = (sum / count).toFixed(1);
        }
    } catch (e) {}
}

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
            btn.classList.toggle('active', i <= rating);
            btn.style.color = i <= rating ? '#fdb813' : '#3b4961';
        }
    }
}
async function submitPlatformFeedback() {
    const text = document.getElementById('platformFeedbackText').value.trim();
    if(!text) { showNotification("⚠️ Please enter your feedback"); return; }
    if(currentRating === 0) { showNotification("⚠️ Please select a star rating"); return; }

    const btn = document.getElementById('submitFeedbackBtn');
    if (btn) { btn.innerText = "Submitting..."; btn.disabled = true; }

    try {
        let uid = currentUser ? currentUser.uid : 'anonymous_' + Date.now();
        await db.collection("platform_feedback").add({
            rating: currentRating,
            feedback: text,
            text: text,
            studentId: uid,
            userId: uid,
            studentName: currentUser ? currentUser.displayName : 'Anonymous',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("✅ Thank you for your feedback!");
        closeFeedbackModal();
        document.getElementById('platformFeedbackText').value = '';
        updateStarUI(0);
        loadGlobalRating();
    } catch(e) {
        showNotification("❌ Failed to submit feedback");
    }
    if (btn) { btn.innerText = "Submit"; btn.disabled = false; }
}

// Report Mistake Modal (RESTORED)
let activeReportPayload = { questionId: '', questionText: '', path: '' };

function openReportModal(questionId, questionText = '', path = '') {
    if ((!questionText || !path) && typeof currentQuestions !== 'undefined') {
        let found = currentQuestions.find(q => q.id === questionId);
        if (found) {
            questionText = found.question || '';
            path = found.path || '';
        }
    }
    activeReportPayload = { questionId, questionText, path };
    const descEl = document.getElementById('reportDescription');
    if (descEl) descEl.value = '';
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'flex';
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
}

async function submitReport() {
    if (!activeReportPayload.questionId) { closeReportModal(); return; }
    const reason = document.getElementById('reportReason').value;
    const description = document.getElementById('reportDescription').value.trim();

    try {
        await db.collection("reported_mistakes").add({
            questionId: activeReportPayload.questionId,
            questionText: activeReportPayload.questionText,
            path: activeReportPayload.path,
            reason: reason,
            description: description,
            studentId: currentUser ? currentUser.uid : 'anonymous',
            studentName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest Student',
            status: 'pending',
            seenByStudent: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("🚨 Report submitted! Admin will review this question.");
        closeReportModal();
    } catch (e) {
        showNotification("❌ Failed to submit report: " + e.message);
    }
}

// User Reports Status Modal (RESTORED)
async function openUserReportsModal() {
    const modal = document.getElementById('userReportsModal');
    const listEl = document.getElementById('user-reports-list');
    if (!modal || !listEl) return;
    modal.style.display = 'flex';

    if (!currentUser) {
        listEl.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Please sign in to track your submitted reports.</p>`;
        return;
    }

    listEl.innerHTML = `<p style="color:var(--primary-yellow); text-align:center; padding:20px;">Loading your reports...</p>`;
    try {
        const snap = await db.collection("reported_mistakes")
            .where("studentId", "==", currentUser.uid)
            .get();

        if (snap.empty) {
            listEl.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">You haven't reported any questions yet.</p>`;
            return;
        }

        let items = [];
        let unseenBatch = db.batch();
        let hasUnseen = false;

        snap.forEach(doc => {
            let d = doc.data();
            items.push({ id: doc.id, ...d });
            if (d.seenByStudent === false) {
                unseenBatch.update(doc.ref, { seenByStudent: true });
                hasUnseen = true;
            }
        });

        items.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        listEl.innerHTML = items.map(r => {
            let isResolved = r.status === 'resolved';
            let statusBadge = isResolved
                ? `<span style="background:rgba(16,185,129,0.15); color:var(--correct-green); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">✅ Resolved by Admin</span>`
                : `<span style="background:rgba(253,184,19,0.15); color:var(--primary-yellow); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">⏳ Under Review</span>`;
            return `
            <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:14px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:11px; color:var(--text-muted);">${r.path || 'General'}</span>
                    ${statusBadge}
                </div>
                <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:6px;">${r.questionText || 'Reported Question'}</div>
                <div style="font-size:12px; color:var(--wrong-red);">Issue: ${r.reason} ${r.description ? `— ${r.description}` : ''}</div>
            </div>`;
        }).join('');

        if (hasUnseen) {
            await unseenBatch.commit();
            const profileDot = document.getElementById('profileNotifDot');
            const reportDot = document.getElementById('reportMenuDot');
            if (profileDot) profileDot.style.display = 'none';
            if (reportDot) reportDot.style.display = 'none';
        }
    } catch (e) {
        listEl.innerHTML = `<p style="color:var(--wrong-red); text-align:center;">Error loading reports: ${e.message}</p>`;
    }
}

function closeUserReportsModal() {
    const modal = document.getElementById('userReportsModal');
    if (modal) modal.style.display = 'none';
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

// Search Engine (Searches both Dynamic Topic Tree AND Firestore Questions)
function openSearch() {
    const wrapper = document.getElementById('searchWrapper');
    if(wrapper) {
        wrapper.classList.add('active');
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }
}
function closeSearch() {
    const wrapper = document.getElementById('searchWrapper');
    const suggestions = document.getElementById('searchSuggestions');
    if(wrapper) wrapper.classList.remove('active');
    if(suggestions) suggestions.style.display = 'none';
}
let searchTimeout;
function delayCloseSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const wrapper = document.getElementById('searchWrapper');
        if(wrapper && !wrapper.contains(document.activeElement)) {
            closeSearch();
        }
    }, 250);
}
async function handleLiveSearch() {
    const rawQuery = document.getElementById('searchInput').value.trim();
    const suggestions = document.getElementById('searchSuggestions');
    if(!suggestions) return;

    if(rawQuery.length < 2) {
        suggestions.style.display = 'none';
        return;
    }

    const qLower = rawQuery.toLowerCase();
    let html = '';

    // 1. Search Topics/Folders in appData (case-insensitive)
    let topicMatches = [];
    function scanTopics(obj, pathArr = []) {
        for (let k in obj) {
            if (k === "Daily Quiz Challenge") continue;
            let nextPath = [...pathArr, k];
            if (k.toLowerCase().includes(qLower)) {
                topicMatches.push(nextPath);
            }
            if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
                scanTopics(obj[k], nextPath);
            }
        }
    }
    scanTopics(appData);

    topicMatches.slice(0, 5).forEach(pathArr => {
        let leaf = pathArr[pathArr.length - 1].replace(/^\d+\.\s*/, '');
        let encodedPath = pathArr.map(encodeURIComponent).join('/');
        html += `<div class="search-result-item" onmousedown="window.location.hash='#/path/${encodedPath}'; closeSearch();">
            <div style="font-size:13px; color:var(--primary-yellow); font-weight:700; margin-bottom:2px;">📂 ${leaf}</div>
            <div style="font-size:11px; color:var(--text-muted);">${pathArr.join(' > ')}</div>
        </div>`;
    });

    // 2. Search Questions in Firestore
    try {
        const snap = await db.collection("content")
            .where("question", ">=", rawQuery)
            .where("question", "<=", rawQuery + "\uf8ff")
            .limit(8)
            .get();

        snap.forEach(doc => {
            const data = doc.data();
            if (!data.path || !data.question) return;
            const cleanPath = data.path.split(' > ').pop();
            const encodedPath = data.path.split(' > ').map(encodeURIComponent).join('/');
            html += `<div class="search-result-item" onmousedown="window.location.hash='#/path/${encodedPath}'; closeSearch();">
                <div style="font-size:13px; color:#fff; margin-bottom:4px;">📝 ${data.question.substring(0, 65)}${data.question.length > 65 ? '...' : ''}</div>
                <div style="font-size:11px; color:var(--text-muted);">${cleanPath}</div>
            </div>`;
        });
    } catch(e) {
        console.error("Search error:", e);
    }

    if (!html) {
        html = `<div style="padding:14px 18px; color:var(--text-muted); font-size:13px;">No matching chapters or questions found.</div>`;
    }

    suggestions.innerHTML = html;
    suggestions.style.display = 'block';
}
