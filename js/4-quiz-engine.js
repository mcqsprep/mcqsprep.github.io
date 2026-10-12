// ==========================================
// 5. CUSTOM QUIZ ENGINE
// ==========================================
let currentQuizPath = "";
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = {};
let currentTimer = null;
let timeSpent = {};

async function _initiateQuizEngine() {
    const mc = document.getElementById('dynamic-content');
    let targetPath = currentPath.join(" > ");
    if (!targetPath) { mc.innerHTML = "<div class='card'><p>Invalid quiz path.</p><button class='btn-exam' onclick='goBack()'>Go Back</button></div>"; return; }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;">
        <h2 class="section-title">⚙️ Preparing Practice Session...</h2>
        <p style="color:var(--text-muted);">Fetching the latest questions for ${targetPath}.</p>
    </div>`;

    try {
        const snapshot = await db.collection("content")
            .where("path", ">=", targetPath)
            .where("path", "<=", targetPath + "\uf8ff")
            .where("type", "==", "mcq")
            .limit(100)
            .get();

        let allDocs = [];
        snapshot.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));

        if (allDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;">
                <h2 class="section-title">No Questions Found</h2>
                <p style="color:var(--text-muted); margin-bottom:25px;">Content for this topic is currently being updated. Please check back later.</p>
                <button class="btn-exam" onclick="goBack()" style="background:#333; border:none; width: 150px;">&larr; Go Back</button>
            </div>`;
            return;
        }

        allDocs.sort(() => Math.random() - 0.5);
        currentQuestions = allDocs.slice(0, 50); 
        currentQuizPath = targetPath;
        currentIndex = 0;
        userAnswers = {};
        timeSpent = {};

        renderQuizInterface();
        startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Go Back</button></div>`;
    }
}

function renderQuizInterface() {
    const mc = document.getElementById('dynamic-content');
    let q = currentQuestions[currentIndex];
    if(!q) return;

    let total = currentQuestions.length;
    let progressPct = ((currentIndex) / total) * 100;
    
    let isReviewMode = false;
    let savedAnswer = userAnswers[q.id];

    let html = `
    <div class="card page-transition">
        <div class="quiz-header">
            <div>
                <span class="badge-path">${q.path.split(' > ').pop()}</span>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px; text-transform: uppercase; font-weight: 600;">Question ${currentIndex + 1} of ${total}</div>
            </div>
            <div class="quiz-timer" id="qTimerDisplay">⏱ 00:00</div>
        </div>
        
        <div style="width: 100%; background: #1c1c24; height: 6px; border-radius: 3px; margin-bottom: 25px; overflow: hidden; border: 1px solid var(--border-color);">
            <div style="width: ${progressPct}%; background: var(--primary-yellow); height: 100%; transition: width 0.3s ease;"></div>
        </div>

        <div class="quiz-question-text" id="qText">${q.question}</div>
        ${q.imageUrl ? `<img src="${q.imageUrl}" class="quiz-image" onclick="window.open(this.src, '_blank')">` : ''}
        
        <div id="options-container">
            ${['A', 'B', 'C', 'D'].map(opt => {
                let text = q.options[opt];
                if(!text) return '';
                
                let btnClass = 'quiz-option';
                if(savedAnswer === opt) btnClass += ' selected';
                
                return `<div class="${btnClass}" onclick="selectOption('${opt}')">
                    <span style="background: rgba(255,255,255,0.1); width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; margin-right: 12px; font-weight: bold; font-size: 13px;">${opt}</span>
                    <span id="optText_${opt}" style="flex:1;">${text}</span>
                </div>`;
            }).join('')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:30px; gap:10px;">
            <button class="btn-exam" onclick="prevQuestion()" ${currentIndex === 0 ? 'disabled' : ''} style="flex:1; max-width: 120px; background:#1c1c24;">&larr; Prev</button>
            <div style="display:flex; gap:10px; flex:1; justify-content:flex-end;">
                <button class="btn-exam" onclick="bookmarkQuestion('${q.id}')" style="background:rgba(255,255,255,0.05); color:var(--text-light); border: 1px solid rgba(255,255,255,0.1);">🔖 Bookmark</button>
                <button class="btn-exam" onclick="openReportModal('${q.id}', '${q.question.replace(/'/g, "\\'")}', '${q.path}')" style="background:rgba(244, 67, 54, 0.1); color:var(--wrong-red); border: 1px solid rgba(244,67,54,0.3);">🚨 Report</button>
                ${currentIndex === total - 1 
                    ? `<button class="btn-exam" onclick="submitQuiz()" style="background: var(--correct-green); color: white; border: none; font-size: 15px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">Submit Quiz ✔</button>` 
                    : `<button class="btn-exam" onclick="nextQuestion()" style="background: var(--primary-yellow); color: black; border: none; font-size: 15px; box-shadow: 0 4px 15px rgba(253, 184, 19, 0.3);">Next &rarr;</button>`}
            </div>
        </div>
    </div>`;

    mc.innerHTML = html;
    
    // RENDER MATH FOR ALL ELEMENTS
    renderMathInElement(document.getElementById('qText'), { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
    ['A','B','C','D'].forEach(opt => {
        let el = document.getElementById('optText_'+opt);
        if(el) renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
    });
}

function selectOption(opt) {
    let q = currentQuestions[currentIndex];
    userAnswers[q.id] = opt;
    renderQuizInterface();
}

function nextQuestion() {
    stopQuestionTimer();
    if(currentIndex < currentQuestions.length - 1) {
        currentIndex++;
        renderQuizInterface();
        startQuestionTimer();
    }
}

function prevQuestion() {
    stopQuestionTimer();
    if(currentIndex > 0) {
        currentIndex--;
        renderQuizInterface();
        startQuestionTimer();
    }
}

let qStartTime = 0;
function startQuestionTimer() {
    qStartTime = Date.now();
    let qId = currentQuestions[currentIndex].id;
    if(!timeSpent[qId]) timeSpent[qId] = 0;
    
    if(currentTimer) clearInterval(currentTimer);
    currentTimer = setInterval(() => {
        let totalS = Math.floor((timeSpent[qId] + (Date.now() - qStartTime)) / 1000);
        let m = String(Math.floor(totalS / 60)).padStart(2, '0');
        let s = String(totalS % 60).padStart(2, '0');
        let d = document.getElementById('qTimerDisplay');
        if(d) d.innerText = `⏱ ${m}:${s}`;
    }, 1000);
}

function stopQuestionTimer() {
    if(currentTimer) clearInterval(currentTimer);
    let qId = currentQuestions[currentIndex].id;
    timeSpent[qId] += (Date.now() - qStartTime);
}

async function submitQuiz() {
    stopQuestionTimer();
    if(!confirm("Are you sure you want to submit your test?")) { startQuestionTimer(); return; }

    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title">📊 Calculating Results...</h2></div>`;

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalTimeC = 0;
    let totalTimeW = 0;
    
    let subjectBreakdown = {};

    currentQuestions.forEach(q => {
        let uAns = userAnswers[q.id];
        let isCorrect = q.correctAnswers.includes(uAns);
        let tSpent = Math.floor((timeSpent[q.id] || 0) / 1000);
        
        // Find subject from path (e.g. "NEET > Botany > Chapter 1" -> "Botany")
        let pathParts = q.path.split(' > ');
        let subject = pathParts.length > 1 ? pathParts[1] : 'General';
        
        if(!subjectBreakdown[subject]) subjectBreakdown[subject] = { attempts: 0, correct: 0 };

        if(uAns) {
            subjectBreakdown[subject].attempts++;
            if(isCorrect) { 
                score += 4; correctCount++; totalTimeC += tSpent; 
                subjectBreakdown[subject].correct++;
            }
            else { score -= 1; wrongCount++; totalTimeW += tSpent; }
        } else {
            skippedCount++;
        }
    });

    let accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
    let avgTimeCorrect = correctCount > 0 ? Math.round(totalTimeC / correctCount) : 0;
    let avgTimeWrong = wrongCount > 0 ? Math.round(totalTimeW / wrongCount) : 0;
    let totalTimeTaken = Math.floor(Object.values(timeSpent).reduce((a, b) => a + b, 0) / 1000);
    
    let timeM = Math.floor(totalTimeTaken / 60);
    let timeS = totalTimeTaken % 60;
    let timeStr = `${timeM}m ${timeS}s`;

    let attemptedIds = currentQuestions.map(q => q.id);

    if (currentUser) {
        try {
            await db.collection("leaderboards").add({
                userId: currentUser.uid,
                userName: currentUser.displayName,
                quizPath: currentQuizPath,
                examCategory: currentQuizPath.split(' > ')[0],
                score: score,
                accuracy: accuracy,
                attemptedQuestions: currentQuestions.length,
                correctCount: correctCount,
                wrongCount: wrongCount,
                skippedCount: skippedCount,
                timeTakenSeconds: totalTimeTaken,
                timeStr: timeStr,
                avgTimeCorrect: avgTimeCorrect,
                avgTimeWrong: avgTimeWrong,
                subjectBreakdown: subjectBreakdown,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await saveAttemptedIdsForPath(currentQuizPath, attemptedIds);
            
            // Streak Logic update
            const userRef = db.collection("users").doc(currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                if (doc.exists) {
                    let d = doc.data();
                    let todayStr = new Date().toISOString().split('T')[0];
                    let lastActiveStr = d.lastActiveDate || "";
                    let streak = d.currentStreak || 0;
                    
                    if (lastActiveStr !== todayStr) {
                        let yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        let yesterdayStr = yesterday.toISOString().split('T')[0];
                        
                        if (lastActiveStr === yesterdayStr) { streak++; } 
                        else { streak = 1; }
                        
                        transaction.update(userRef, { currentStreak: streak, lastActiveDate: todayStr });
                        document.getElementById('nav-streak-display').innerText = streak;
                    }
                }
            });
        } catch(e) { console.error("Error saving score:", e); }
    }

    _renderQuizResults(score, accuracy, correctCount, wrongCount, skippedCount, timeStr);
}

function _renderQuizResults(score, accuracy, correctCount, wrongCount, skippedCount, timeStr) {
    const mc = document.getElementById('dynamic-content');
    
    let message = "Good effort! Keep practicing.";
    let scoreColor = "var(--primary-yellow)";
    if (accuracy >= 80) { message = "Excellent work! 🔥"; scoreColor = "var(--correct-green)"; }
    else if (accuracy <= 40) { message = "Needs review. Check the solutions below. 📚"; scoreColor = "var(--wrong-red)"; }

    mc.innerHTML = `
    <div class="card page-transition" style="text-align:center; padding: 40px 20px;">
        <h2 class="section-title" style="justify-content:center; font-size: 26px;">Quiz Completed!</h2>
        <p style="color:var(--text-muted); font-size: 15px; margin-bottom: 30px;">${message}</p>
        
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:15px; margin-bottom: 30px;">
            <div style="background: #1c1c24; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; min-width: 140px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="font-size: 32px; font-weight: 800; color: ${scoreColor};">${score}</div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-top: 8px;">Total Score</div>
            </div>
            <div style="background: #1c1c24; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; min-width: 140px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="font-size: 32px; font-weight: 800; color: #fff;">${accuracy}%</div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-top: 8px;">Accuracy</div>
            </div>
        </div>

        <div style="display:flex; justify-content:center; gap:20px; margin-bottom:30px; flex-wrap:wrap;">
            <span style="background:rgba(76, 175, 80, 0.1); color:var(--correct-green); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; border:1px solid rgba(76,175,80,0.3);">✅ Correct: ${correctCount}</span>
            <span style="background:rgba(244, 67, 54, 0.1); color:var(--wrong-red); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; border:1px solid rgba(244,67,54,0.3);">❌ Wrong: ${wrongCount}</span>
            <span style="background:rgba(255, 255, 255, 0.05); color:#aaa; padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; border:1px solid rgba(255,255,255,0.1);">⏭ Skipped: ${skippedCount}</span>
            <span style="background:rgba(33, 150, 243, 0.1); color:#2196F3; padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; border:1px solid rgba(33,150,243,0.3);">⏱ Time: ${timeStr}</span>
        </div>

        <div style="display:flex; gap:15px; justify-content:center; flex-wrap:wrap;">
            <button class="btn-exam" onclick="_renderQuizReview('all')" style="background:var(--primary-yellow); color:black; border:none; padding:12px 24px; font-size:15px; box-shadow: 0 4px 15px rgba(253, 184, 19, 0.3);">Review Solutions 📚</button>
            <button class="btn-exam" onclick="goBack()" style="background:#1c1c24; border:1px solid #333; padding:12px 24px; font-size:15px;">Exit to Dashboard</button>
        </div>
    </div>`;
}

function _renderQuizReview(filterMode) {
    const mc = document.getElementById('dynamic-content');
    
    let tabsHtml = `
    <div class="review-tabs">
        <button class="review-tab-btn ${filterMode === 'all' ? 'active' : ''}" style="${filterMode === 'all' ? 'background:rgba(255,255,255,0.1); color:white; border-color:white;' : ''}" onclick="_renderQuizReview('all')">All (${currentQuestions.length})</button>
        <button class="review-tab-btn ${filterMode === 'wrong' ? 'active wrong' : ''}" onclick="_renderQuizReview('wrong')">Wrong Only</button>
        <button class="review-tab-btn ${filterMode === 'skipped' ? 'active skipped' : ''}" onclick="_renderQuizReview('skipped')">Skipped</button>
    </div>`;

    let html = `<div class="card page-transition"><h2 class="section-title">Detailed Solutions</h2>${tabsHtml}<div id="review-list">`;
    
    let count = 0;
    currentQuestions.forEach((q, index) => {
        let uAns = userAnswers[q.id];
        let isCorrect = q.correctAnswers.includes(uAns);
        
        if (filterMode === 'wrong' && (isCorrect || !uAns)) return;
        if (filterMode === 'skipped' && uAns) return;
        count++;

        let badge = isCorrect ? `<span style="background:var(--correct-green); color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">✅ Correct</span>` : 
                    (!uAns ? `<span style="background:#555; color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">⏭ Skipped</span>` : 
                             `<span style="background:var(--wrong-red); color:white; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold;">❌ Wrong</span>`);

        html += `
        <div class="review-item">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="color:var(--text-muted); font-size:12px; font-weight:bold;">Q${index + 1}</span>
                ${badge}
            </div>
            <div style="font-weight:500; font-size:15px; margin-bottom:15px; color:#fff;" id="revQ_${q.id}">${q.question}</div>
            ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-height:150px; border-radius:6px; margin-bottom:15px; display:block; border: 1px solid #333;">` : ''}
            
            <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
                ${['A','B','C','D'].map(opt => {
                    let text = q.options[opt];
                    if(!text) return '';
                    let isTrueCorrect = q.correctAnswers.includes(opt);
                    let isUserSelect = (uAns === opt);
                    
                    let bg = "rgba(255,255,255,0.03)"; let border = "#333"; let color = "#aaa";
                    if (isTrueCorrect) { bg = "rgba(76, 175, 80, 0.15)"; border = "var(--correct-green)"; color = "#fff"; }
                    else if (isUserSelect && !isTrueCorrect) { bg = "rgba(244, 67, 54, 0.15)"; border = "var(--wrong-red)"; color = "#fff"; }
                    
                    return `<div style="background:${bg}; border:1px solid ${border}; color:${color}; padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:center; gap:10px;" id="revOpt_${q.id}_${opt}">
                        <span style="font-weight:bold; font-size:12px; opacity:0.8;">${opt}</span>${text}
                    </div>`;
                }).join('')}
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <button onclick="toggleViewAnswer('sol_${q.id}')" style="background:#1c1c24; color:white; border:1px solid #444; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; transition:0.2s;">👁 View Explanation</button>
                <div style="display:flex; gap:10px;">
                    <button onclick="bookmarkQuestion('${q.id}')" style="background:transparent; color:var(--text-muted); border:none; cursor:pointer; font-size:18px;" title="Bookmark">🔖</button>
                    <button onclick="openReportModal('${q.id}', '${q.question.replace(/'/g, "\\'")}', '${q.path}')" style="background:transparent; color:var(--wrong-red); border:none; cursor:pointer; font-size:18px;" title="Report Mistake">🚨</button>
                </div>
            </div>
            
            <div id="sol_${q.id}" class="quiz-explanation">
                <strong style="color:var(--primary-yellow); display:block; margin-bottom:8px;">Explanation:</strong>
                <span id="revExp_${q.id}">${q.explanation || "No detailed explanation provided by the author."}</span>
            </div>
        </div>`;
    });

    if(count === 0) html += `<p style="text-align:center; color:var(--text-muted); padding:20px;">No questions match this filter.</p>`;
    
    html += `<button class="btn-exam" onclick="goBack()" style="width:100%; margin-top:20px; background:#1c1c24; border-color:#333;">&larr; Exit to Dashboard</button></div></div>`;
    mc.innerHTML = html;
    
    currentQuestions.forEach(q => {
        let elQ = document.getElementById('revQ_'+q.id); if(elQ) renderMathInElement(elQ, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
        ['A','B','C','D'].forEach(opt => {
            let elO = document.getElementById(`revOpt_${q.id}_${opt}`); if(elO) renderMathInElement(elO, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
        });
        let elE = document.getElementById('revExp_'+q.id); if(elE) renderMathInElement(elE, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
    });
}

function toggleViewAnswer(id) {
    const el = document.getElementById(id);
    if(el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
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
            // Smart Icon for Custom Practice Buttons
            let t = k.toLowerCase();
            let i = "📁";
            if(t.includes('neet')) i = "🩺";
            else if(t.includes('jee')) i = "🚀";
            else if(t.includes('gk') || t.includes('knowledge')) i = "🌍";
            else if(t.includes('ssc') || t.includes('banking')) i = "🏛️";
            
            let cleanKey = k.replace(/'/g, "\\'");
            
            html += `<button class="btn-exam" onclick="cwSetPath('${cleanKey}')" style="background:#1c1c24; border-color:#333; padding:16px; font-size:16px;">${i} ${k}</button>`;
        });
        
    html += `
        </div>
        <button class="btn-exam" onclick="goBack()" style="width:100%; background:transparent; color:var(--text-muted); border:none;">Cancel</button>
    </div>`;
    mc.innerHTML = html;
}

function cwSetPath(path) { cwPath = path; cwStep2(); }

function cwStep2() {
    const mc = document.getElementById('dynamic-content');
    
    let subjectsHtml = `<option value="Mixed">All Subjects (Full Mock)</option>`;
    if (appData[cwPath] && appData[cwPath]["MCQs Practice"]) {
        let subjects = Object.keys(appData[cwPath]["MCQs Practice"]);
        subjects.forEach(s => { subjectsHtml += `<option value="${s.replace(/'/g, "\\'")}">${s}</option>`; });
    }

    mc.innerHTML = `
    <div class="card page-transition" style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 class="section-title" style="margin-bottom: 25px; color:var(--primary-yellow); justify-content:center;">🎯 Customize Your Test</h2>
        
        <div style="margin-bottom: 20px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:13px; font-weight:bold; text-transform:uppercase;">Select Subject/Topic</label>
            <select id="cwSubj" class="input-field" style="font-size:15px; padding:14px;">${subjectsHtml}</select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:13px; font-weight:bold; text-transform:uppercase;">Difficulty Level</label>
            <select id="cwDiffSelect" class="input-field" style="font-size:15px; padding:14px;">
                <option value="Mixed">Mixed (Real Exam Balance)</option>
                <option value="Easy">Easy (Warmup)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Challenge)</option>
            </select>
        </div>
        
        <div style="margin-bottom: 30px;">
            <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:13px; font-weight:bold; text-transform:uppercase;">Number of Questions</label>
            <select id="cwNum" class="input-field" style="font-size:15px; padding:14px;">
                <option value="10">10 Questions (Quick)</option>
                <option value="25" selected>25 Questions (Standard)</option>
                <option value="50">50 Questions (Half Mock)</option>
                <option value="100">100 Questions (Full Length)</option>
                <option value="200">200 Questions (Marathon)</option>
                <option value="250">250 Questions (Extreme Limit)</option>
            </select>
        </div>

        <div style="display:flex; gap:15px;">
            <button class="btn-exam" onclick="cwStep1()" style="flex:1; background:#1c1c24; border-color:#333;">&larr; Back</button>
            <button class="btn-exam" onclick="cwLaunch()" style="flex:2; background:var(--primary-yellow); color:black; border:none; box-shadow: 0 4px 15px rgba(253,184,19,0.3);">Launch Practice 🚀</button>
        </div>
    </div>`;
}

async function cwLaunch() {
    cwSubject = document.getElementById('cwSubj').value;
    cwDiff = document.getElementById('cwDiffSelect').value;
    cwLimit = parseInt(document.getElementById('cwNum').value);
    
    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title">🔍 Compiling Custom Practice...</h2><p style="color:var(--text-muted);">Fetching ${cwLimit} questions from database...</p></div>`;

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
            mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 class="section-title">No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find enough questions matching these exact filters.</p><button class="btn-exam" onclick="cwStep2()" style="margin-top:20px; background:#333; border:none;">&larr; Adjust Filters</button></div>`;
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
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Go Back</button></div>`;
    }
}

// -----------------------------------------
// BOOKMARK MANAGER
// -----------------------------------------
let userBookmarks = [];

async function loadUserBookmarks() {
    if(!currentUser) return;
    try {
        const doc = await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").get();
        if(doc.exists && Array.isArray(doc.data().list)) { userBookmarks = doc.data().list; }
    } catch(e){}
}

async function bookmarkQuestion(qId) {
    if(!currentUser) { showAuthModal(); return; }
    if(userBookmarks.includes(qId)) { showNotification("⚠️ Already bookmarked!"); return; }
    
    userBookmarks.push(qId);
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({
            list: userBookmarks, lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        showNotification("🔖 Question saved to Bookmarks!");
    } catch(e) { showNotification("❌ Failed to bookmark"); }
}

async function removeBookmark(qId) {
    if(!currentUser) return;
    userBookmarks = userBookmarks.filter(id => id !== qId);
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({ list: userBookmarks }, {merge:true});
        let card = document.getElementById('bmCard_'+qId);
        if(card) card.remove();
        showNotification("🗑 Bookmark removed");
    } catch(e){}
}

async function _initiateBookmarkQuiz() {
    const mc = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Bookmarks";
    
    if(!currentUser) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; return; }
    if(userBookmarks.length === 0) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>🔖 No Bookmarks Yet</h2><p style="color:var(--text-muted);">Questions you bookmark during practice will appear here.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none; margin-top:20px;">Back to Home</button></div>`; return; }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding:50px;"><h2 class="section-title">🔖 Loading Bookmarks...</h2></div>`;

    try {
        let allDocs = [];
        for(let i=0; i<userBookmarks.length; i+=10) {
            let chunk = userBookmarks.slice(i, i+10);
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
                        let bg = isTrueCorrect ? "rgba(76, 175, 80, 0.15)" : "rgba(255,255,255,0.03)";
                        let border = isTrueCorrect ? "var(--correct-green)" : "#333";
                        let color = isTrueCorrect ? "#fff" : "#aaa";
                        return `<div style="background:${bg}; border:1px solid ${border}; color:${color}; padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:center; gap:10px;" id="bmOpt_${q.id}_${opt}">
                            <span style="font-weight:bold; font-size:12px; opacity:0.8;">${opt}</span>${text}
                        </div>`;
                    }).join('')}
                </div>
                
                <button onclick="toggleViewAnswer('bmSol_${q.id}')" style="background:#1c1c24; color:white; border:1px solid #444; padding:8px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">👁 View Explanation</button>
                
                <div id="bmSol_${q.id}" class="quiz-explanation">
                    <strong style="color:var(--primary-yellow); display:block; margin-bottom:8px;">Explanation:</strong>
                    <span id="bmExp_${q.id}">${q.explanation || "No detailed explanation provided by the author."}</span>
                </div>
            </div>`;
        });
        
        html += `<button class="btn-exam" onclick="goBack()" style="width:100%; margin-top:20px; background:#1c1c24; border-color:#333;">&larr; Exit</button></div>`;
        mc.innerHTML = html;

        allDocs.forEach(q => {
            let elQ = document.getElementById('bmQ_'+q.id); if(elQ) renderMathInElement(elQ, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
            ['A','B','C','D'].forEach(opt => {
                let elO = document.getElementById(`bmOpt_${q.id}_${opt}`); if(elO) renderMathInElement(elO, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
            });
            let elE = document.getElementById('bmExp_'+q.id); if(elE) renderMathInElement(elE, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ], throwOnError: false });
        });

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}
