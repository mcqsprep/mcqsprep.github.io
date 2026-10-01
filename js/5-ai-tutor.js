// ==========================================
// 7. GEMINI-STYLE AI CHAT ENGINE
// ==========================================
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
    }
    // FIX: Removed the openAIModal() trigger here so it doesn't conflict with the native HTML onclick
}

let cropper = null; let aiChatHistory = []; let lastExtractedQuestion = null;
let pendingBase64Image = null; 

function autoExpandTextarea(field) {
    field.style.height = 'auto';
    field.style.height = Math.min(field.scrollHeight, 200) + 'px';
    if (field.scrollHeight > 200) {
        field.style.overflowY = 'auto';
    } else {
        field.style.overflowY = 'hidden';
    }
}

function toggleAttachMenu() {
    const menu = document.getElementById('ai-attach-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function handleAIPaste(e) {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (!file) continue;
            e.preventDefault(); 
            
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('ai-idle-view').style.display = 'none';
                Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
                    if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
                        child.style.display = 'none';
                    }
                });
                document.getElementById('ai-cropper-view').style.display = 'flex';
                
                const imgNode = document.getElementById('aiCropperImage'); 
                imgNode.src = event.target.result;
                if(cropper) cropper.destroy(); 
                cropper = new Cropper(imgNode, { viewMode: 1, autoCropArea: 0.85, background: false });
            };
            reader.readAsDataURL(file);
            break; 
        }
    }
}

function openAIModal() {
    document.body.classList.add('hide-bottom-bar'); // Hide dock so chat bar is fully visible
    document.getElementById('aiModal').style.display = 'flex'; 
    document.getElementById('ai-idle-view').style.display = 'flex';
    document.getElementById('ai-cropper-view').style.display = 'none';
    
    const historyContainer = document.getElementById('gemini-chat-history');
    const children = Array.from(historyContainer.children);
    children.forEach(child => {
        if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
            historyContainer.removeChild(child);
        }
    });

    const input = document.getElementById('aiTextInput');
    input.value = '';
    autoExpandTextarea(input);
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    document.getElementById('ai-attach-menu').style.display = 'none';
    clearPendingImage();
    
    aiChatHistory = []; 
    lastExtractedQuestion = null;
}

function closeAIModal() { 
    document.getElementById('aiModal').style.display = 'none'; 
    document.body.classList.remove('hide-bottom-bar'); // Restore dock
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
        box.innerHTML = `<div class="ai-fuzzy-item" style="color:var(--text-muted); padding: 12px 16px; font-size: 13px;">No direct syllabus match found — AI will solve autonomously using NCERT references 🌐</div>`; 
    } else { 
        box.innerHTML = matches.slice(0, 5).map(m => `<div class="ai-fuzzy-item" onclick="insertAISuggestion('${m.text.replace(/'/g, "\\'")}')" style="padding: 12px 16px; border-bottom: 1px solid #2b2b36; cursor: pointer; display: flex; justify-content: space-between; color: #fff; font-size: 13px;"><span>📚 <b>${m.type}:</b>${m.title}</span><span style="color:var(--primary-yellow);">Use Topic &rarr;</span></div>`).join(''); 
    }
    box.style.display = 'block';
}

function insertAISuggestion(text) { 
    const input = document.getElementById('aiTextInput');
    input.value = text + ": "; 
    autoExpandTextarea(input);
    document.getElementById('ai-fuzzy-box').style.display = 'none'; 
    input.focus(); 
}

function handleAIImageUpload(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('ai-idle-view').style.display = 'none';
        
        Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
            if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
                child.style.display = 'none';
            }
        });
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
    
    Array.from(document.getElementById('gemini-chat-history').children).forEach(child => {
        if (child.id !== 'ai-idle-view' && child.id !== 'ai-cropper-view') {
            child.style.display = 'block';
        }
    });
    if (aiChatHistory.length === 0) document.getElementById('ai-idle-view').style.display = 'flex';
    
    document.getElementById('aiImageInput').value = ""; 
    document.getElementById('aiCameraInput').value = ""; 
}

function confirmCropAndSolve() {
    if(!cropper) return; 
    const canvas = cropper.getCroppedCanvas(); 
    pendingBase64Image = canvas.toDataURL('image/jpeg').split(',')[1]; 
    
    cancelCropper(); 
    
    document.getElementById('ai-input-image-preview').src = "data:image/jpeg;base64," + pendingBase64Image;
    document.getElementById('ai-image-preview-container').style.display = 'block';
    document.getElementById('aiTextInput').focus();
}

function clearPendingImage() {
    pendingBase64Image = null;
    document.getElementById('ai-image-preview-container').style.display = 'none';
}

function editUserMessage(btn) {
    const rawText = btn.getAttribute('data-text');
    const inputEl = document.getElementById('aiTextInput');
    inputEl.value = rawText;
    autoExpandTextarea(inputEl);
    inputEl.focus();
}

function appendChatBubble(role, htmlContent, rawText = "") {
    const historyContainer = document.getElementById('gemini-chat-history');
    
    if (role === 'user') {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `align-self: flex-end; max-width: 85%; display: flex; align-items: flex-end; gap: 8px; margin-bottom: 5px;`;
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Edit';
        editBtn.setAttribute('data-text', rawText.replace(/"/g, '&quot;'));
        editBtn.style.cssText = `background: rgba(255,255,255,0.08); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; font-size: 12px;`;
        wrapper.onmouseover = () => editBtn.style.opacity = '1';
        wrapper.onmouseout = () => editBtn.style.opacity = '0';
        editBtn.onclick = () => editUserMessage(editBtn);

        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.style.cssText = `background: #1c1c28; color: white; padding: 12px 16px; border-radius: 18px 18px 0 18px; font-size: 14px; border: 1px solid rgba(255,255,255,0.1);`;
        bubble.innerHTML = htmlContent;

        wrapper.appendChild(editBtn);
        wrapper.appendChild(bubble);
        historyContainer.appendChild(wrapper);
        
    } else if (role === 'loading') {
        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.id = 'ai-typing-indicator';
        bubble.style.cssText = `background: transparent; color: var(--primary-yellow); padding: 8px 0; max-width: 85%; align-self: flex-start; font-size: 14px; display: flex; align-items: center; gap: 8px;`;
        bubble.innerHTML = `<span style="font-size: 18px; animation: pulse 1s infinite;">🤖</span> <i id="loading-text-msg">${htmlContent}</i>`;
        historyContainer.appendChild(bubble);
        
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'ai-chat-bubble';
        bubble.style.cssText = `background: transparent; color: #e3e3e3; padding: 0; max-width: 100%; align-self: flex-start; font-size: 14px; line-height: 1.6; margin-bottom: 12px;`;
        bubble.innerHTML = htmlContent;
        historyContainer.appendChild(bubble);
        
        renderMathInElement(bubble, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] });
    }
    
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

async function handleAISend() {
    const inputEl = document.getElementById('aiTextInput');
    let text = inputEl.value.trim();
    
    if (!text && !pendingBase64Image) return; 
    if (!text && pendingBase64Image) text = "Please solve the question in this image.";
    
    inputEl.value = '';
    autoExpandTextarea(inputEl);
    document.getElementById('ai-fuzzy-box').style.display = 'none';
    document.getElementById('ai-idle-view').style.display = 'none';
    
    let displayHtml = text;
    if (pendingBase64Image) {
        displayHtml = `<img src="data:image/jpeg;base64,${pendingBase64Image}" style="max-height:120px; border-radius:8px; margin-bottom:10px; display:block; border:1px solid #444;">` + text;
    }
    
    appendChatBubble('user', displayHtml, text);
    
    let isVision = !!pendingBase64Image;
    let currentImg = pendingBase64Image;
    clearPendingImage(); 
    
    if (aiChatHistory.length === 0 || isVision) {
        if (!isVision) {
            try {
                const cacheSnap = await db.collection("ai_doubt_diary").where("questionText", "==", text).limit(1).get();
                if (!cacheSnap.empty) {
                    const cachedData = cacheSnap.docs[0].data();
                    const syntheticPayload = { extractedQuestion: cachedData.questionText, subject: cachedData.subject, solution: cachedData.solution, searchKeywords: [] };
                    renderAISolution(syntheticPayload, true); 
                    return; 
                }
            } catch(e) {}
        }
        
        let payload = isVision ? { mode: 'solve', text: text, image: currentImg, mimeType: 'image/jpeg' } : { mode: 'solve', text: text };
        await callAIWorker(payload, 3, text);
    } else {
        aiChatHistory.push({ role: 'user', text: text });
        await callAIWorker({ mode: 'chat', text: text, conversationHistory: aiChatHistory.slice(0, -1) }, 3, text);
    }
}

async function callAIWorker(payload, retries = 3, originalUserText = "") {
    appendChatBubble('loading', 'Analyzing your query...');
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if(attempt > 1) {
                const indicatorText = document.getElementById('loading-text-msg');
                if (indicatorText) indicatorText.innerHTML = `<span style="color:var(--wrong-red);">High demand, retrying... (${attempt}/${retries})</span>`;
            }

            const res = await fetch(AI_WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json(); 
            if(data.error) throw new Error(data.error);

            if (payload.mode === 'solve') { 
                renderAISolution(data, false); 
            } else {
                const indicator = document.getElementById('ai-typing-indicator');
                if (indicator) indicator.remove();
                
                aiChatHistory.push({ role: 'model', text: data.reply }); 
                
                let bubbleId = 'msg_' + Date.now();
                window.chatDoubts = window.chatDoubts || {};
                window.chatDoubts[bubbleId] = { q: originalUserText, a: data.reply };
                
                let parsedHTML = formatTextWithMath(data.reply);
                let saveBtnHTML = `<div style="margin-top:12px;"><button onclick="saveChatDoubt('${bubbleId}', this)" style="background:rgba(253, 184, 19, 0.1); color:var(--primary-yellow); padding: 7px 14px; border: 1px solid rgba(253,184,19,0.4); border-radius:20px; cursor:pointer; font-size:12px;">📔 Save Explanation to Diary</button></div>`;
                
                appendChatBubble('model', parsedHTML + saveBtnHTML);
            }
            return; 
        } catch(e) {
            let errorMsg = e.message.toLowerCase();
            let isHighDemand = errorMsg.includes("high demand") || errorMsg.includes("overloaded") || errorMsg.includes("503") || errorMsg.includes("429");
            
            if (isHighDemand && attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 2500));
            } else {
                const indicator = document.getElementById('ai-typing-indicator');
                if (indicator) indicator.remove();
                showNotification("❌ AI Error: " + e.message); 
                appendChatBubble('model', `<div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid var(--wrong-red); padding: 10px; border-radius: 4px;"><span style="color:var(--wrong-red); font-size: 13px;">❌ AI Error: ${e.message}</span></div>`);
                return; 
            }
        }
    }
}

async function renderAISolution(data, isCached = false) {
    const typingIndicator = document.getElementById('ai-typing-indicator');
    if (typingIndicator) typingIndicator.remove();
    
    lastExtractedQuestion = data; 
    aiChatHistory = [{ role: 'user', text: "Solve this: " + data.extractedQuestion }];
    
    let html = ``;
    
    if (isCached) {
        html += `<div style="border: 1px solid rgba(253, 184, 19, 0.3); background: rgba(253, 184, 19, 0.1); padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; display: inline-block;"><div><b style="color:var(--primary-yellow); font-size:12px;">⚡ Instant Cache Match!</b></div></div><br>`;
    } else {
        const isFound = await checkDatabaseForQuestion(data.searchKeywords);
        if (isFound) { 
            html += `<div style="border: 1px solid rgba(76, 175, 80, 0.3); background: rgba(76, 175, 80, 0.1); padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; display: inline-block;"><div><b style="color:var(--correct-green); font-size:13px;">✅ Verified Match in MCQsPrep!</b><br><span style="font-size:12px; color:var(--text-light);">${isFound.path}</span></div><button onclick="closeAIModal(); jumpToSection(${JSON.stringify(isFound.path.split(' > ')).replace(/"/g, "'")}); window.location.hash='#/quiz';" style="margin-top:8px; background:var(--correct-green); border:none; padding:6px 12px; color:white; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">Go Practice 🚀</button></div><br>`; 
        } else { 
            html += `<div style="border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 12px; color: #ccc; display: inline-block;">🌐 Solved autonomously using verified NCERT syllabus standards.</div><br>`; 
        }
    }
    
    let solutionMarkdown = `**Extracted Question:** ${data.extractedQuestion}\n\n**Core Concept:** ${data.solution.keyConcept}\n\n**Step-by-Step Explanation:**\n${data.solution.stepByStep}\n\n**Final Conclusion & Answer:** ${data.solution.finalAnswer}`;
    aiChatHistory.push({ role: 'model', text: solutionMarkdown }); 
    
    let parsedHTML = formatTextWithMath(solutionMarkdown);
    html += `<div style="margin-bottom: 12px;">${parsedHTML}</div>`;
    html += `<button onclick="saveToDoubtDiary()" style="background:rgba(253, 184, 19, 0.1); color:var(--primary-yellow); padding: 7px 14px; border: 1px solid rgba(253,184,19,0.4); border-radius:20px; cursor:pointer; font-size:12px;">📔 Save Explanation to Doubt Diary</button>`;

    appendChatBubble('model', html);
}

async function saveChatDoubt(bubbleId, btnEl) {
    if (!currentUser) { showAuthModal(); return; }
    let data = window.chatDoubts[bubbleId];
    if (!data) return;
    
    btnEl.innerText = "Saving..."; 
    btnEl.disabled = true;
    
    try {
        await db.collection("ai_doubt_diary").add({
            userId: currentUser.uid,
            questionText: data.q,
            subject: lastExtractedQuestion ? lastExtractedQuestion.subject : "Follow-up Doubt",
            solution: {
                keyConcept: "AI Chat Conversation",
                stepByStep: data.a,
                finalAnswer: "Review details above."
            },
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        btnEl.innerHTML = "✅ Saved to Diary";
        btnEl.style.background = "var(--correct-green)";
        btnEl.style.color = "white";
        btnEl.style.borderColor = "var(--correct-green)";
        showNotification("📔 Follow-up saved to your Doubt Diary!");
    } catch(e) {
        btnEl.innerText = "❌ Failed to Save";
        showNotification("❌ Error: " + e.message);
    }
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

async function saveToDoubtDiary() {
    if (!currentUser) { showAuthModal(); return; } 
    if (!lastExtractedQuestion) return;
    try { 
        await db.collection("ai_doubt_diary").add({ userId: currentUser.uid, questionText: lastExtractedQuestion.extractedQuestion, subject: lastExtractedQuestion.subject, solution: lastExtractedQuestion.solution, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); 
        showNotification("📔 Saved to your Doubt Diary!"); 
    } catch(e) { showNotification("❌ Failed to save: " + e.message); }
}

async function _renderDoubtDiary() {
    if (!currentUser) return document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠️ Sign In Required</h2><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`;
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Doubt Diary";
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card page-transition"><h2>📔 Loading Doubt Diary...</h2></div>`;
    try {
        const snap = await db.collection("ai_doubt_diary").where("userId", "==", currentUser.uid).orderBy("timestamp", "desc").limit(30).get();
        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { 
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>📔 Doubt Diary Empty</h2><p style="color:var(--text-muted);">Use the ✨ Ask AI feature to scan questions and save explanations here for rapid revision.</p><button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
            return; 
        }
        
        let html = `<div class="card page-transition"><h2 style="color:var(--primary-yellow);">📔 Your Saved Explanations</h2><p style="color:var(--text-muted); margin-bottom:18px;">Review your previously solved doubts here.</p>`;
        items.forEach(d => {
            let dateStr = d.timestamp ? new Date(d.timestamp.toMillis()).toLocaleDateString() : '';
            let md = `**Core Concept:** ${d.solution.keyConcept}\n\n**Step-by-Step:**\n${d.solution.stepByStep}\n\n**Final Answer:** ${d.solution.finalAnswer}`;
            html += `<div style="background:#13131a; border-left: 4px solid var(--primary-yellow); padding: 14px; border-radius: 6px; margin-bottom: 16px;"><div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span class="badge-path">${d.subject}</span><span style="font-size:11px; color:var(--text-muted);">${dateStr}</span></div><p style="font-weight:600; font-size:15px; margin: 0 0 10px 0;">Q: ${d.questionText}</p><button onclick="toggleViewAnswer('diary_sol_${d.id}')" style="background:#222; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">👁️️ Show Solution</button><div id="diary_sol_${d.id}" class="katex-render-target" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid #282834; line-height:1.6; font-size:14px;">${formatTextWithMath(md)}</div></div>`;
        });
        html += `<button class="btn-exam" onclick="goBack()" style="background:#333; border:none;">Back</button></div>`; 
        mc.innerHTML = html;
        document.querySelectorAll('.katex-render-target').forEach(el => { renderMathInElement(el, { delimiters: [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '\\[', right: '\\]', display: true} ] }); });
    } catch(e) { mc.innerHTML = `<div class="card"><h2>Error</h2><p>${e.message}</p></div>`; }
}
