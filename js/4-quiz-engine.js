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
    let targetPath = window.currentPath.join(" > ");
    if (!targetPath) { mc.innerHTML = "<div class='card'><p>Invalid quiz path.</p><button class='btn-exam' onclick='goBack()'>Go Back</button></div>"; return; }

    // 🔴 SMART DAILY QUIZ ROUTER: If they clicked Daily Quiz Challenge -> JEE, actually fetch from JEE!
    let isDailyQuiz = false;
    let originalPath = targetPath;
    if (window.currentPath[0] === "Daily Quiz Challenge" && window.currentPath.length > 1) {
        isDailyQuiz = true;
        targetPath = window.currentPath.slice(1).join(" > "); // Look inside the actual root folder
    }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;">
        <h2 class="section-title" style="justify-content:center;">⚙️ Preparing Practice Session...</h2>
        <p style="color:var(--text-muted);">Fetching the latest questions for ${originalPath}.</p>
    </div>`;

    try {
        let query = db.collection("content")
            .where("path", ">=", targetPath)
            .where("path", "<=", targetPath + "\uf8ff")
            .where("type", "==", "mcq");

        let allDocs = [];
        
        if (isDailyQuiz) {
            let randomStart = Math.random();
            let snapshot = await query.where("randomKey", ">=", randomStart).orderBy("randomKey").limit(25).get();
            snapshot.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
            
            if (allDocs.length < 25) {
                let remainder = 25 - allDocs.length;
                let snapshot2 = await query.where("randomKey", "<", randomStart).orderBy("randomKey").limit(remainder).get();
                snapshot2.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
            }
        } else {
            let snapshot = await query.limit(100).get();
            snapshot.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
            allDocs.sort(() => Math.random() - 0.5);
            allDocs = allDocs.slice(0, 50); 
        }

        if (allDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;">
                <h2 class="section-title" style="justify-content:center;">No Questions Found</h2>
                <p style="color:var(--text-muted); margin-bottom:25px;">Content for this topic is currently being updated. Please check back later.</p>
                <button class="btn-exam" onclick="goBack()" style="background:#0d1527; border:1px solid var(--border-color); width: 150px;">&larr; Go Back</button>
            </div>`;
            return;
        }

        currentQuestions = allDocs; 
        currentQuizPath = originalPath;
        currentIndex = 0;
        userAnswers = {};
        timeSpent = {};

        renderQuizInterface();
        startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card"><h2 class="section-title" style="color:var(--wrong-red); justify-content:center;">Error</h2><p style="text-align:center;">${err.message}</p><div style="text-align:center;"><button class="btn-exam" onclick="goBack()">Go Back</button></div></div>`;
    }
}

function renderQuizInterface() {
    const mc = document.getElementById('dynamic-content');
    let q = currentQuestions[currentIndex];
    if(!q) return;

    let total = currentQuestions.length;
    let progressPct = ((currentIndex) / total) * 100;
    
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
    
    renderMathInElement(document.getElementById('qText'), { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
    ['A','B','C','D'].forEach(opt => {
        let el = document.getElementById('optText_'+opt);
        if(el) renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
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
    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 50px 20px;"><h2 class="section-title" style="justify-content:center;">📊 Calculating Results...</h2></div>`;

    let score = 0; let correctCount = 0; let wrongCount = 0; let skippedCount = 0; let totalTimeC = 0; let totalTimeW = 0;
    let subjectBreakdown = {};

    currentQuestions.forEach(q => {
        let uAns = userAnswers[q.id];
        let isCorrect = q.correctAnswers.includes(uAns);
        let tSpent = Math.floor((timeSpent[q.id] || 0) / 1000);
        
        let pathParts = q.path.split(' > ');
        let subject = pathParts.length > 1 ? pathParts[1] : 'General';
        if(!subjectBreakdown[subject]) subjectBreakdown[subject] = { attempts: 0, correct: 0 };

        if(uAns) {
            subjectBreakdown[subject].attempts++;
            if(isCorrect) { score += 4; correctCount++; totalTimeC += tSpent; subjectBreakdown[subject].correct++; }
            else { score -= 1; wrongCount++; totalTimeW += tSpent; }
        } else { skippedCount++; }
    });

    let accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
    let avgTimeCorrect = correctCount > 0 ? Math.round(totalTimeC / correctCount) : 0;
    let avgTimeWrong = wrongCount > 0 ? Math.round(totalTimeW / wrongCount) : 0;
    let totalTimeTaken = Math.floor(Object.values(timeSpent).reduce((a, b) => a + b, 0) / 1000);
    
    let timeM = Math.floor(totalTimeTaken / 60); let timeS = totalTimeTaken % 60; let timeStr = `${timeM}m ${timeS}s`;
    let attemptedIds = currentQuestions.map(q => q.id);

    if (window.currentUser) {
        try {
            await db.collection("leaderboards").add({
                userId: window.currentUser.uid,
                userName: window.currentUser.displayName,
                quizPath: currentQuizPath,
                examCategory: currentQuizPath.split(' > ')[0],
                score: score, accuracy: accuracy, attemptedQuestions: currentQuestions.length,
                correctCount: correctCount, wrongCount: wrongCount, skippedCount: skippedCount,
                timeTakenSeconds: totalTimeTaken, timeStr: timeStr,
                avgTimeCorrect: avgTimeCorrect, avgTimeWrong: avgTimeWrong,
                subjectBreakdown: subjectBreakdown, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await saveAttemptedIdsForPath(currentQuizPath, attemptedIds);
            
            const userRef = db.collection("users").doc(window.currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(userRef);
                if (doc.exists) {
                    let d = doc.data();
                    let todayStr = new Date().toISOString().split('T')[0];
                    let lastActiveStr = d.lastActiveDate || "";
                    let streak = d.currentStreak || 0;
                    
                    if (lastActiveStr !== todayStr) {
                        let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                        let yesterdayStr = yesterday.toISOString().split('T')[0];
                        if (lastActiveStr === yesterdayStr) { streak++; } else { streak = 1; }
                        transaction.update(userRef, { currentStreak: streak, lastActiveDate: todayStr });
                        document.getElementById('nav-streak-display').innerText = streak;
                    }
                }
            });
        } catch(e) {}
    }

    _renderQuizResults(score, accuracy, correctCount, wrongCount, skippedCount, timeStr);
}

function _renderQuizResults(score, accuracy, correctCount, wrongCount, skippedCount, timeStr) {
    const mc = document.getElementById('dynamic-content');
    
    let message = "Good effort! Keep practicing."; let scoreColor = "var(--primary-yellow)";
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
                        <span style="font-weight:bold; font-size:12px; opacity:0.8;">${opt}</span> ${text}
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
        let elQ = document.getElementById('revQ_'+q.id); if(elQ) renderMathInElement(elQ, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
        ['A','B','C','D'].forEach(opt => {
            let elO = document.getElementById(`revOpt_${q.id}_${opt}`); if(elO) renderMathInElement(elO, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
        });
        let elE = document.getElementById('revExp_'+q.id); if(elE) renderMathInElement(elE, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
    });
}

function toggleViewAnswer(id) {
    const el = document.getElementById(id);
    if(el.style.display === 'none' || el.style.display === '') el.style.display = 'block';
    else el.style.display = 'none';
}
