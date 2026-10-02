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
            <button class="btn-exam" onclick="goHome()" style="margin-top:20px; background:#333; border:none; width:100%;">Cancel</button>
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
            <div style="display:flex; justify-content:space-between; gap:15px;">
                <button class="btn-exam" onclick="cwStep1()" style="background:#333; border:none; flex:1;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep2()" style="background:var(--primary-yellow); color:black; border:none; flex:2;">Next: Select Chapters &rarr;</button>
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
            <h2 style="color:var(--primary-yellow);">📑 Select Chapters</h2>
            <p style="color:var(--text-muted); margin-bottom:20px;">Step 3: Pick the specific topics you want to practice.</p>
            <input type="text" id="cwSubtopicSearch" class="input-field" placeholder="🔍 Search chapters..." oninput="cwFilterSubtopics()">
            <div style="margin-bottom:15px;">
                <button onclick="cwSelectAll(true)" style="background:none; border:none; color:var(--primary-yellow); cursor:pointer; font-size:14px;">Select All</button> | 
                <button onclick="cwSelectAll(false)" style="background:none; border:none; color:var(--primary-yellow); cursor:pointer; font-size:14px;">Deselect All</button>
            </div>
            <div id="cw-subtopic-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap:10px; max-height:40vh; overflow-y:auto; padding:10px; background:#111; border-radius:8px; border:1px solid #333; margin-bottom:25px;">
                ${leafs.map(l => `<label class="cw-sub-lbl" style="background:#2a2a2a; border:1px solid #444; padding:12px; border-radius:6px; cursor:pointer; display:flex; align-items:flex-start; gap:10px;"><input type="checkbox" value="${l}" class="cw-sub-cb" checked> <span style="font-size:14px;">${l.split(' > ').pop()}<br><span style="font-size:11px; color:#888;">${l}</span></span></label>`).join('')}
            </div>
            <div style="display:flex; justify-content:space-between; gap:15px;">
                <button class="btn-exam" onclick="cwStep2(cwState.exam)" style="background:#333; border:none; flex:1;">&larr; Back</button>
                <button class="btn-exam" onclick="cwProcessStep3()" style="background:var(--primary-yellow); color:black; border:none; flex:2;">Next: Set Difficulty &rarr;</button>
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
    if(cbs.length === 0) return showNotification("⚠ Select at least one chapter.");
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
            <div style="display:flex; justify-content:space-between; gap:15px;">
                <button class="btn-exam" onclick="cwStep3()" style="background:#333; border:none; flex:1;">&larr; Back</button>
                <button class="btn-exam" onclick="cwLaunchQuiz()" style="background:var(--correct-green); color:white; font-size:18px; padding:15px 30px; border:none; box-shadow:0 4px 15px rgba(76,175,80,0.4); flex:2;">🚀 Start Custom Quiz</button>
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
// 9. SCALED QUIZ ENGINE, PERSISTENCE & BOOKMARKS
// ==========================================
let quizState = { questions: [], currentIndex: 0, userAnswers: {}, showAnswerTriggered: {}, flaggedDoubts: {}, viewedQuestions: [], timer: null, secondsPassed: 0, isTimerPaused: false, isCustom: false, timePerQuestion: {}, currentQEntryTime: 0, isBookmarkQuiz: false, bookmarkStats: {} };

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
            await db.collection("users").doc(currentUser.uid).collection("bookmarks").doc(questionId).set({ 
                savedAt: firebase.firestore.FieldValue.serverTimestamp(),
                interval: 1,
                easeFactor: 2.5,
                consecutiveCorrect: 0,
                nextReview: firebase.firestore.FieldValue.serverTimestamp()
            });
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
        const snap = await db.collection("users").doc(currentUser.uid).collection("bookmarks").get();
        let dueBookmarks = [];
        let allStats = {};
        const now = Date.now();
        
        snap.forEach(doc => {
            let data = doc.data();
            allStats[doc.id] = data;
            let nextReview = data.nextReview ? (data.nextReview.toMillis ? data.nextReview.toMillis() : new Date(data.nextReview).getTime()) : 0;
            if (nextReview <= now) dueBookmarks.push(doc.id);
        });

        if (Object.keys(allStats).length === 0) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Bookmarks Found</h2><p style="color:var(--text-muted);">You haven't bookmarked any questions yet. Click the 🔖 Bookmark button during a quiz to save questions here for revision.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none; width: 100%;">Back</button></div>`;
            return;
        }
        
        if (dueBookmarks.length === 0) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>🎉 All Caught Up!</h2><p style="color:var(--correct-green);">You have no pending Spaced Repetition reviews for today. Check back tomorrow!</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none; width: 100%;">Back</button></div>`;
            return;
        }

        let availableQuestions = [];
        const batches = [];
        for (let i = 0; i < dueBookmarks.length; i += 10) { batches.push(dueBookmarks.slice(i, i + 10)); }
        
        for (let b of batches) {
            const snap = await db.collection("content").where(firebase.firestore.FieldPath.documentId(), "in", b).get();
            snap.forEach(doc => { availableQuestions.push({ id: doc.id, ...doc.data() }); });
        }

        if (availableQuestions.length === 0) {
            mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>Error</h2><p>Could not load bookmarked questions.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none; width: 100%;">Back</button></div>`;
            return;
        }

        quizState.questions = availableQuestions;
        quizState.isCustom = true; 
        quizState.isBookmarkQuiz = true;
        quizState.bookmarkStats = allStats;
        quizState.currentIndex = 0; quizState.userAnswers = {}; quizState.showAnswerTriggered = {}; quizState.flaggedDoubts = {}; quizState.viewedQuestions = []; quizState.secondsPassed = 0; quizState.isTimerPaused = false; quizState.timePerQuestion = {};
        
        clearInterval(quizState.timer);
        quizState.timer = setInterval(() => {
            if (!quizState.isTimerPaused) { 
                quizState.secondsPassed++; 
                let disp = document.getElementById('quizTimeDisplay'); 
                if(disp) disp.innerText = formatTime(quizState.secondsPassed); 
                if (quizState.secondsPassed % 5 === 0) saveQuizSession();
            }
        }, 1000);
        
        quizState.currentQEntryTime = Date.now();
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
            isCustom: quizState.isCustom,
            timePerQuestion: quizState.timePerQuestion,
            isBookmarkQuiz: quizState.isBookmarkQuiz,
            bookmarkStats: quizState.bookmarkStats
        },
        userId: currentUser ? currentUser.uid : 'anonymous'
    };
    localStorage.setItem('mcq_active_session', JSON.stringify(sessionData));
}

function clearQuizSession() {
    localStorage.removeItem('mcq_active_session');
}

function recordQuestionTime() {
    if(!quizState.currentQEntryTime) return;
    let timeSpent = Date.now() - quizState.currentQEntryTime;
    quizState.timePerQuestion[quizState.currentIndex] = (quizState.timePerQuestion[quizState.currentIndex] || 0) + timeSpent;
    quizState.currentQEntryTime = Date.now();
}

async function _initiateQuizEngine(isCustomLaunch = false) {
    const pathString = currentPath.join(' > ');

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
                    quizState.currentQEntryTime = Date.now();
                    
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

            let snapshot = await db.collection("content")
                .where("path", ">=", pathString)
                .where("path", "<=", pathString + "\uf8ff")
                .limit(150)
                .get();

            let unattemptedPool = [];
            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.type === 'mcq') {
                    totalQuestionsInDB++;
                    if (!previouslyAttemptedIds.includes(doc.id)) {
                        unattemptedPool.push({ id: doc.id, ...data });
                    }
                }
            });

            availableQuestions = unattemptedPool.sort(() => 0.5 - Math.random()).slice(0, 20);
            
            quizState.questions = availableQuestions;
            quizState.isCustom = false;
        }

        if (availableQuestions.length === 0) { 
            if(isCustomLaunch) mainContent.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Questions Found</h2><p style="color:var(--text-muted);">We couldn't find any unattempted questions matching your selected chapters and difficulty level.</p><button class="btn-exam" onclick="goHome()" style="background:#333; border:none; width:100%;">Back</button></div>`;
            else if(totalQuestionsInDB === 0) mainContent.innerHTML = `<div class="card page-transition"><h2>No Questions Available</h2><p style="color:var(--text-muted);">Not enough questions available in the database for this section.</p><button class="btn-exam" onclick="goHome()" style="background:#333; border:none; width:100%;">Back</button></div>`; 
            else {
                let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
                mainContent.innerHTML = `<div class="card page-transition" style="text-align:center; padding: 40px 20px;"><h2 style="color: var(--primary-yellow); font-size: 28px; margin-bottom: 15px;">🎉 Section Completed!</h2><p style="color: var(--text-muted); font-size: 16px; margin-bottom: 25px;">You have successfully attempted all available questions in this section.</p><div style="display:flex; flex-direction:column; gap:15px;"><button class="btn-exam" onclick="resetProgress('${safePath}')" style="background: #333; color: white; border:none;">🔄 Reset My Progress</button><button class="btn-exam" onclick="window.history.back()" style="background:#333; border:none;">Explore Other Topics</button></div></div>`;
            }
            return; 
        }
        
        quizState.currentIndex = 0; quizState.userAnswers = {}; quizState.showAnswerTriggered = {}; quizState.flaggedDoubts = {}; quizState.viewedQuestions = []; quizState.secondsPassed = 0; quizState.isTimerPaused = false; quizState.isBookmarkQuiz = false; quizState.bookmarkStats = {}; quizState.timePerQuestion = {};
        
        clearInterval(quizState.timer);
        quizState.timer = setInterval(() => {
            if (!quizState.isTimerPaused) { 
                quizState.secondsPassed++; 
                let disp = document.getElementById('quizTimeDisplay'); 
                if(disp) disp.innerText = formatTime(quizState.secondsPassed); 
                if (quizState.secondsPassed % 5 === 0) saveQuizSession();
            }
        }, 1000);
        quizState.currentQEntryTime = Date.now();
        saveQuizSession();
        _renderQuizQuestion();
    } catch (error) { mainContent.innerHTML = `<div class="card"><h2>Error</h2><p>${error.message}</p><button class="btn-exam" onclick="goBack()" style="width:100%;">&larr; Go Back</button></div>`; }
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
                <div style="display:flex; gap:10px; flex:1;"><button class="btn-exam" onclick="_prevQuestion()" ${quizState.currentIndex === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} style="flex:1;">&larr; Prev</button><button class="btn-exam" onclick="_nextQuestion()" ${quizState.currentIndex === quizState.questions.length - 1 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''} style="flex:1;">Next &rarr;</button></div>
                <div style="display:flex; gap:10px; flex:1;"><button class="btn-exam" onclick="checkAnswer()" style="background:#333; border:none; flex:1; ${hasPeeked ? 'display:none;' : ''}">Check</button><button class="btn-exam" onclick="finishQuiz()" style="background:var(--wrong-red); border:none; color:white; flex:1;">Finish</button></div>
            </div>
        </div>`;
    mainContent.innerHTML = html;
    
    // FIX: ADDED throwOnError: false TO PREVENT KATEX CRASHES IN THE QUIZ ENGINE
    document.querySelectorAll('.katex-render-target').forEach(el => {
        renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
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

function jumpToQuestion(index) { recordQuestionTime(); quizState.currentIndex = index; _renderQuizQuestion(); }
function _nextQuestion() { if(quizState.currentIndex < quizState.questions.length - 1) { recordQuestionTime(); quizState.currentIndex++; _renderQuizQuestion(); } }
function _prevQuestion() { if(quizState.currentIndex > 0) { recordQuestionTime(); quizState.currentIndex--; _renderQuizQuestion(); } }
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
    recordQuestionTime();
    clearInterval(quizState.timer); 
    clearQuizSession();
    
    let attempted = 0; let totalScore = 0; let correctCount = 0; let wrongCount = 0;
    let sessionAttemptedIds = []; let skippedCount = 0; let isDailyQuiz = currentPath[0] === 'Daily Quiz Challenge';
    let correctHtml = ''; let wrongHtml = ''; let skippedHtml = ''; let flaggedListHtml = '';
    
    let totalTimeCorrect = 0; let totalTimeWrong = 0;
    let isNeetSection = isDailyQuiz ? (currentPath[1] === "NEET") : (currentPath[0] === "NEET");
    if(quizState.isCustom) {
        isNeetSection = customQuizConfig.exam === 'NEET';
    }

    let subjectBreakdown = {};

    quizState.questions.forEach((q, index) => {
        let userAnsArray = quizState.userAnswers[index] || []; let isAttempted = userAnsArray.length > 0; let isCorrect = false; let isViewed = quizState.viewedQuestions.includes(index);
        let ms = quizState.timePerQuestion[index] || 0;

        if (isAttempted) { 
            attempted++; sessionAttemptedIds.push(q.id); 
            let userAnsStr = userAnsArray.sort().join(','); let correctAnsStr = q.correctAnswers.sort().join(','); 
            if (userAnsStr === correctAnsStr) { isCorrect = true; correctCount++; totalTimeCorrect += ms; } 
        }
        
        if (isAttempted && !isCorrect) { wrongCount++; totalTimeWrong += ms; }
        
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

    if (quizState.isBookmarkQuiz && currentUser) {
        let bmUpdates = [];
        quizState.questions.forEach((q, index) => {
            let userAnsArray = quizState.userAnswers[index] || [];
            if (userAnsArray.length > 0) {
                let isCorrect = userAnsArray.sort().join(',') === q.correctAnswers.sort().join(',');
                let srs = quizState.bookmarkStats[q.id] || { interval: 0, easeFactor: 2.5, consecutiveCorrect: 0 };
                
                if (isCorrect) {
                    srs.consecutiveCorrect = (srs.consecutiveCorrect || 0) + 1;
                    if (srs.consecutiveCorrect === 1) srs.interval = 1;
                    else if (srs.consecutiveCorrect === 2) srs.interval = 6;
                    else srs.interval = Math.round(srs.interval * srs.easeFactor);
                    srs.easeFactor = srs.easeFactor + 0.1;
                } else {
                    srs.consecutiveCorrect = 0;
                    srs.interval = 1;
                    srs.easeFactor = Math.max(1.3, srs.easeFactor - 0.2);
                }
                
                let nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + srs.interval);
                
                bmUpdates.push(db.collection("users").doc(currentUser.uid).collection("bookmarks").doc(q.id).update({
                    interval: srs.interval,
                    easeFactor: srs.easeFactor,
                    consecutiveCorrect: srs.consecutiveCorrect,
                    nextReview: firebase.firestore.Timestamp.fromDate(nextDate)
                }));
            }
        });
        Promise.all(bmUpdates).catch(e => console.error("SRS Update failed", e));
    }

    if (sessionAttemptedIds.length > 0) {
        if (!isDailyQuiz && !quizState.isCustom) {
            let safePath = "prog_" + currentPath.join('_').replace(/[^a-zA-Z0-9]/g, '_');
            await saveAttemptedIdsForPath(safePath, sessionAttemptedIds);
        } else if (quizState.isCustom && !quizState.isBookmarkQuiz) {
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

    if (currentUser && attempted > 0) {
        db.collection("users").doc(currentUser.uid).get().then(doc => {
            if (doc.exists) {
                let data = doc.data();
                let lastDateStr = data.lastTestDate || "";
                let todayStr = new Date().toLocaleDateString();
                let yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                let yesterdayStr = yesterday.toLocaleDateString();
                
                let streak = data.currentStreak || 0;
                if (lastDateStr === yesterdayStr) {
                    streak++;
                } else if (lastDateStr !== todayStr) {
                    streak = 1; 
                }
                
                db.collection("users").doc(currentUser.uid).update({
                    lastTestDate: todayStr,
                    currentStreak: streak,
                    bestStreak: Math.max(streak, data.bestStreak || 0)
                });
                document.getElementById('nav-streak-display').innerText = streak;
            }
        });
    }

    let accuracy = attempted === 0 ? 0 : Math.round((correctCount / attempted) * 100); 
    let timeStr = formatTime(quizState.secondsPassed); 
    let examCategory = isNeetSection ? "NEET" : "General Knowledge";
    let pathString = quizState.isCustom ? (quizState.isBookmarkQuiz ? "My Bookmarks (SRS)" : `Custom Practice - ${examCategory}`) : currentPath.join(' > '); 
    let studentName = currentUser ? currentUser.displayName.split(" ")[0] : "Student";
    
    let avgTimeCorrect = correctCount > 0 ? Math.round((totalTimeCorrect / correctCount) / 1000) : 0;
    let avgTimeWrong = wrongCount > 0 ? Math.round((totalTimeWrong / wrongCount) / 1000) : 0;

    if (currentUser && attempted > 0 && !isDailyQuiz && !quizState.isBookmarkQuiz) { 
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
            avgTimeCorrect: avgTimeCorrect,
            avgTimeWrong: avgTimeWrong,
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
            ${quizState.isBookmarkQuiz ? `<div style="background:rgba(76, 175, 80, 0.1); border-left:4px solid var(--correct-green); padding:10px; margin-bottom:20px; border-radius:4px; font-size:14px; text-align:left;"><b style="color:var(--correct-green);">Memory Interval Updated:</b> Questions you got right will be pushed further into the future. Questions you got wrong will reappear tomorrow!</div>` : ''}
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
            <button class="btn-exam" onclick="window.history.back()" style="width: 100%; margin-top:30px; background:#333; border:none;">&larr; Exit to Dashboard</button>
        </div>
    `;
    
    // FIX: ADDED throwOnError: false TO PREVENT KATEX CRASHES IN THE REVIEW SCREEN
    document.querySelectorAll('.katex-render-target, .review-item').forEach(el => {
        renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ], throwOnError: false });
    });
}
