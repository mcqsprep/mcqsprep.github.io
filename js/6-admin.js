// ==========================================
// 10. SMART ADMIN PANEL, BULK CREATOR, PDF MANAGER, SIDEBAR & CUSTOM PRACTICE
// ==========================================
let adminCurrentTab = 'upload';
let adminNewTopicPath = [];
let adminMultiTargetChildren = [];
let adminSelectedPath = [];
let adminManageSelectedPath = [];
let adminManageContentTypeFilter = 'ALL'; // 'ALL' | 'mcq' | 'material'

// Folder Split Mode: 'LINE' (Default: keeps commas inside single topic names like "Art, Culture & Heritage") | 'COMMA'
let adminFolderSplitMode = 'LINE';

// State for Edit / Delete Topics Filter & Bulk Actions
let adminTopicFilterPath = [];
let adminTopicScopeFilter = 'ALL'; // 'ALL' | 'MAIN' | 'SUB'
let adminTopicTypeFilter = 'ALL';  // 'ALL' | 'both' | 'mcq' | 'pdf'
let unifiedAdminTopics = [];
let adminBulkSelectedPaths = new Set();

// State for Manual Quick Links & Essential Practice Manager
let adminSidebarPickPath = [];

// State for Manual Custom Practice (Subjects & Chapters) Manager
let adminCpSelectedExam = '';
let adminCpSubjectPickPath = [];
let adminCpTargetSubjectPath = '';
let adminCpChapterPickPath = [];

let lastManageDoc = null;
let isFetchingManageContent = false;

// Patch STUDY_ICON_RULES so "Art", "Art, Culture & Heritage", and "Art, Heritage & Culture" get 🎭 instead of 🏥
(function patchArtAndCultureIconRule() {
    if (typeof STUDY_ICON_RULES === 'undefined' || !Array.isArray(STUDY_ICON_RULES)) return;
    STUDY_ICON_RULES.forEach(rule => {
        if (rule.i === "🏥" && Array.isArray(rule.keys)) {
            rule.keys = rule.keys.map(k => k === "art" ? "assisted reproductive technology" : k);
        }
        if (rule.i === "🎭" && Array.isArray(rule.keys)) {
            ["art", "culture", "heritage", "art culture", "art heritage", "culture heritage"].forEach(k => {
                if (!rule.keys.includes(k)) rule.keys.unshift(k);
            });
        }
    });
})();

const adminStyles = `
<style>
    .admin-nav-pills {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 14px;
        margin-bottom: 25px;
        scrollbar-width: thin;
        scrollbar-color: #fdb813 #12121a;
    }
    .admin-nav-pills::-webkit-scrollbar { height: 8px; display: block; }
    .admin-nav-pills::-webkit-scrollbar-track { background: #12121a; border-radius: 10px; border: 1px solid #2b2b36; }
    .admin-nav-pills::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #fdb813, #f97316); border-radius: 10px; box-shadow: 0 0 10px rgba(253, 184, 19, 0.45); cursor: pointer; }
    .admin-nav-pills::-webkit-scrollbar-thumb:hover { background: #fdb813; }

    .admin-pill { background: #1c1c24; border: 1px solid #2b2b36; color: #9e9ea7; padding: 10px 18px; border-radius: 30px; cursor: pointer; white-space: nowrap; font-size: 13.5px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .admin-pill:hover { background: #252530; color: #fff; border-color: #444; }
    .admin-pill.active { background: rgba(253, 184, 19, 0.15); border-color: #fdb813; color: #fdb813; box-shadow: 0 0 12px rgba(253,184,19,0.2); }
    
    .admin-panel-card { background: #17171e; border: 1px solid #2b2b36; border-radius: 16px; padding: 25px; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .admin-section-header { font-size: 18px; color: #fff; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #2b2b36; padding-bottom: 15px; font-weight: 600; }
    
    .admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .admin-label { display: block; color: #9e9ea7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    
    .admin-checkbox-group { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .admin-cb-label { flex: 1; min-width: 60px; background: #23232c; border: 1px solid #2b2b36; text-align: center; padding: 12px; border-radius: 10px; cursor: pointer; color: #fff; font-size: 16px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .admin-cb-label:hover { border-color: #555; background: #2a2a35; }
    .admin-cb-label:has(input:checked) { background: rgba(76, 175, 80, 0.15); border-color: #4CAF50; color: #4CAF50; }
    .admin-cb-label input { display: none; }

    .admin-preset-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .admin-preset-chip { background: rgba(253, 184, 19, 0.1); border: 1px solid rgba(253, 184, 19, 0.35); color: #fdb813; padding: 6px 12px; border-radius: 20px; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; gap: 5px; }
    .admin-preset-chip:hover { background: rgba(253, 184, 19, 0.22); transform: translateY(-1px); box-shadow: 0 2px 10px rgba(253,184,19,0.2); }

    .admin-split-mode-toggle { display: inline-flex; background: #111420; border: 1px solid #2b354f; border-radius: 8px; padding: 3px; gap: 4px; }
    .admin-split-mode-btn { border: none; background: transparent; color: #94a3b8; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.15s; }
    .admin-split-mode-btn.active { background: rgba(253, 184, 19, 0.2); color: #fdb813; border: 1px solid rgba(253, 184, 19, 0.45); }

    .admin-multi-target-box { background: #111420; border: 1px solid #2b354f; border-radius: 12px; padding: 14px 16px; margin-top: 14px; margin-bottom: 18px; }
    .admin-multi-target-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; max-height: 210px; overflow-y: auto; padding-top: 8px; }
    .admin-target-item { display: flex; align-items: center; gap: 8px; background: #181d2f; border: 1px solid #2b354f; padding: 8px 11px; border-radius: 8px; cursor: pointer; font-size: 12.5px; color: #d1d5db; font-weight: 600; user-select: none; transition: 0.15s; }
    .admin-target-item:hover { border-color: #fdb813; color: #fff; }
    .admin-target-item.checked { background: rgba(253, 184, 19, 0.15); border-color: #fdb813; color: #fff; box-shadow: 0 0 10px rgba(253,184,19,0.18); }
    .admin-target-item input { accent-color: #fdb813; width: 15px; height: 15px; margin: 0; cursor: pointer; flex-shrink: 0; }

    .admin-scope-bar { display: flex; gap: 8px; flex-wrap: wrap; background: #111117; padding: 6px; border-radius: 12px; border: 1px solid #2b2b36; }
    .admin-scope-btn { flex: 1; min-width: 130px; padding: 10px 14px; border-radius: 8px; border: none; background: transparent; color: #9e9ea7; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; text-align: center; }
    .admin-scope-btn:hover { color: #fff; }
    .admin-scope-btn.active { background: var(--primary-yellow); color: #000; box-shadow: 0 2px 10px rgba(253,184,19,0.3); }

    .admin-topic-group-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(253, 184, 19, 0.08); border: 1px solid rgba(253,184,19,0.25); border-left: 4px solid var(--primary-yellow); border-radius: 10px; margin: 22px 0 14px 0; font-size: 15px; font-weight: 700; color: #fff; }
    .admin-topic-group-count { font-size: 12px; background: rgba(255,255,255,0.08); color: var(--primary-yellow); padding: 4px 12px; border-radius: 20px; font-weight: 700; }

    .admin-bulk-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: linear-gradient(135deg, rgba(253,184,19,0.12), rgba(56,189,248,0.1)); border: 1px solid rgba(253,184,19,0.4); padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; }

    .admin-chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .admin-chap-chip { display: inline-flex; align-items: center; gap: 8px; background: #121829; border: 1px solid #2b3954; color: #e2e8f0; padding: 6px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 600; }
    .admin-chap-chip button { background: rgba(239,68,68,0.18); border: none; color: #ef4444; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 11px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; }
    .admin-chap-chip button:hover { background: #ef4444; color: #fff; }
    
    @media (max-width: 768px) { 
        .admin-grid-2 { grid-template-columns: 1fr; gap: 15px; } 
        .admin-panel-card { padding: 18px; }
    }
</style>
`;

function _renderAdminLogin() { 
    document.getElementById('breadcrumb-text').innerText = "Security / Admin Login"; 
    document.getElementById('dynamic-content').innerHTML = `
    <div class="card page-transition" style="max-width: 400px; margin: 40px auto; text-align: center; padding: 40px 20px; border-top: 4px solid var(--primary-yellow);">
        <div style="font-size: 40px; margin-bottom: 15px;">🔐</div>
        <h2 style="margin-top: 0;">Restricted Access</h2>
        <p style="color: var(--text-muted); margin-bottom: 25px; font-size: 14px;">Please enter the master password to access the MCQsPrep Control Center.</p>
        <input type="password" id="adminPassInput" class="input-field" style="margin: 0 auto 20px auto; text-align: center; font-size: 18px; letter-spacing: 2px;" placeholder="••••••••" onkeydown="if(event.key==='Enter') verifyAdmin()">
        <button id="loginBtn" class="btn-exam btn-yellow-glow" onclick="verifyAdmin()" style="width: 100%; max-width: 300px; font-size: 16px;">Authenticate</button>
    </div>`; 
}

async function verifyAdmin() {
    const inputPass = document.getElementById('adminPassInput').value; 
    const btn = document.getElementById('loginBtn'); 
    btn.innerText = "Verifying..."; btn.disabled = true;
    try { 
        const doc = await db.collection("settings").doc("admin_auth").get(); 
        let correctPass = "mcqs2026"; 
        if (doc.exists && doc.data().password) correctPass = doc.data().password;
        if (inputPass === correctPass) { 
            sessionStorage.setItem('admin_verified', 'true'); 
            window.location.hash = '#/admin-panel'; 
            showNotification("✅ Admin Access Granted"); 
        } else { 
            showNotification("❌ Incorrect Password"); 
        }
    } catch (e) { showNotification("❌ Verification error: " + e.message); }
    if (btn) { btn.innerText = "Authenticate"; btn.disabled = false; }
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_verified');
    showNotification("🔒 Admin session locked");
    goHome();
}

function setAdminFolderSplitMode(mode) {
    adminFolderSplitMode = (mode === 'COMMA') ? 'COMMA' : 'LINE';
    const btnLine = document.getElementById('splitModeBtnLine');
    const btnComma = document.getElementById('splitModeBtnComma');
    const tipEl = document.getElementById('folderSplitModeTip');
    if (btnLine) btnLine.classList.toggle('active', adminFolderSplitMode === 'LINE');
    if (btnComma) btnComma.classList.toggle('active', adminFolderSplitMode === 'COMMA');
    if (tipEl) {
        tipEl.innerText = adminFolderSplitMode === 'LINE'
            ? '*Commas stay inside your topic name (e.g. "Art, Culture & Heritage" stays 1 folder). Press Enter (new line) or use ; to add multiple folders!'
            : '*Comma Batch Mode: Splits on commas, while still keeping "X, Y & Z" titles (like "Art, Culture & Heritage") together!';
    }
    updateLiveAutoIconPreview();
}

function parseFolderNamesList(rawInput) {
    if (!rawInput) return [];
    let lines = rawInput.split(/[\r\n;]+/).map(s => s.trim()).filter(Boolean);
    if (adminFolderSplitMode !== 'COMMA') {
        return lines;
    }

    let finalNames = [];
    lines.forEach(line => {
        if (/,\s*[^,]+(?:\s+and\s+|\s*&\s*)/i.test(line)) {
            finalNames.push(line);
        } else {
            line.split(',').map(s => s.trim()).filter(Boolean).forEach(part => finalNames.push(part));
        }
    });
    return finalNames;
}

function setCreateTopicIconMode(mode) {
    const customOverride = document.getElementById('newFolderIcon');
    if (!customOverride) return;
    if (mode === 'AUTO') {
        customOverride.value = '';
    } else if (mode === 'NONE') {
        customOverride.value = 'NONE';
    }
    updateLiveAutoIconPreview();
}

function updateLiveAutoIconPreview() {
    const nameInput = document.getElementById('newFolderName');
    const typeSelect = document.getElementById('newFolderType');
    const customOverride = document.getElementById('newFolderIcon');
    const previewBox = document.getElementById('autoIconPreviewBadge');
    const previewText = document.getElementById('autoIconPreviewName');
    if (!previewBox) return;

    // Automatically upgrade the pink-circled #newFolderIcon input so it accepts any pasted multi-byte emoji/icon + adds Auto & No-Icon buttons
    if (customOverride && !customOverride.dataset.upgraded) {
        customOverride.dataset.upgraded = 'true';
        customOverride.removeAttribute('maxlength');
        customOverride.setAttribute('maxlength', '16');
        customOverride.placeholder = 'Paste Icon';
        customOverride.style.width = '92px';
        customOverride.style.fontSize = '15px';
        customOverride.style.borderColor = '#fdb813';

        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex; flex-direction:column; gap:4px; flex-shrink:0;';
        btnWrap.innerHTML = `
            <button type="button" onclick="setCreateTopicIconMode('AUTO')" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:6px; padding:3px 8px; font-size:10.5px; font-weight:700; cursor:pointer;">✨ Auto</button>
            <button type="button" onclick="setCreateTopicIconMode('NONE')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); border-radius:6px; padding:3px 8px; font-size:10.5px; font-weight:700; cursor:pointer;">🚫 No Icon</button>
        `;
        customOverride.parentNode.appendChild(btnWrap);
    }

    let rawName = nameInput ? nameInput.value.trim() : "";
    let namesArr = parseFolderNamesList(rawName);
    let folderType = typeSelect ? typeSelect.value : "both";
    let manualEmoji = customOverride ? customOverride.value.trim() : "";
    let isNoIcon = manualEmoji.toUpperCase() === "NONE";

    let sampleName = namesArr[0] || "New Study Topic";
    let fallbackIcon = folderType === 'pdf' ? '📄' : (folderType === 'mcq' ? '📝' : '📘');
    let parentCtx = adminNewTopicPath.join(' > ');
    let theme = typeof getAutoTopicTheme === 'function'
        ? getAutoTopicTheme(sampleName, manualEmoji || null, 0, null, fallbackIcon, null, parentCtx)
        : { i: manualEmoji || fallbackIcon, c: '#fdb813', bg: 'rgba(253,184,19,0.16)', border: 'rgba(253,184,19,0.6)', glow: 'rgba(253,184,19,0.28)' };

    previewBox.style.background = theme.bg;
    previewBox.style.color = theme.c;
    previewBox.style.borderColor = theme.border;
    previewBox.style.boxShadow = `0 0 14px ${theme.glow}`;
    previewBox.innerText = isNoIcon ? "🚫" : theme.i;

    let modeLabel = isNoIcon
        ? 'No Icon Mode'
        : (manualEmoji ? 'Custom Pasted Icon' : 'Auto-assigned');

    if (previewText) {
        if (namesArr.length === 0) {
            previewText.innerHTML = manualEmoji
                ? `<b style="color:${theme.c};">${isNoIcon ? '🚫 No Icon' : manualEmoji}</b> <span style="color:#38bdf8; font-size:11px;">(${modeLabel} active — type folder name)</span>`
                : `<span style="color:#aaa;">Type folder name(s) or paste any icon in the box on the right!</span>`;
        } else if (namesArr.length === 1) {
            let shownIcon = isNoIcon ? '' : `${theme.i} `;
            previewText.innerHTML = `<b style="color:${theme.c};">${shownIcon}${namesArr[0].replace(/^\d+\.\s*/, '')}</b> <span style="color:#888; font-size:11px;">(1 Folder • ${modeLabel})</span>`;
        } else {
            let usedIcons = new Set();
            let usedColors = new Set();
            let previewChips = namesArr.slice(0, 6).map((n, idx) => {
                let t = typeof getAutoTopicTheme === 'function'
                    ? getAutoTopicTheme(n, manualEmoji || null, idx, usedColors, fallbackIcon, usedIcons, parentCtx)
                    : theme;
                let chipIcon = t.i === "NONE" ? '' : `${t.i} `;
                return `<span style="display:inline-flex; align-items:center; gap:4px; background:${t.bg}; color:${t.c}; border:1px solid ${t.border}; padding:2px 8px; border-radius:6px; font-size:11.5px; font-weight:700; margin:2px;">${chipIcon}${n.replace(/^\d+\.\s*/, '')}</span>`;
            }).join('');
            let extra = namesArr.length > 6 ? `<span style="font-size:11px; color:#aaa; margin-left:4px;">+${namesArr.length - 6} more</span>` : '';
            previewText.innerHTML = `<div style="font-size:11px; color:var(--primary-yellow); font-weight:700; margin-bottom:4px;">⚡ Batch Mode: Creating ${namesArr.length} Folders (${modeLabel})</div><div>${previewChips}${extra}</div>`;
        }
    }
}

function applyFolderPreset(presetType) {
    const nameInput = document.getElementById('newFolderName');
    const typeSelect = document.getElementById('newFolderType');
    if (!nameInput) return;

    if (presetType === 'DIFF_4') {
        nameInput.value = ["Easy", "Medium", "Hard", "Mixed"].join('\n');
        if (typeSelect) typeSelect.value = "mcq";
    } else if (presetType === 'DIFF_3') {
        nameInput.value = ["Easy", "Medium", "Hard"].join('\n');
        if (typeSelect) typeSelect.value = "mcq";
    } else if (presetType === 'NEET_SUBJ') {
        nameInput.value = ["Botany", "Zoology", "Physics", "Organic Chemistry", "Physical Chemistry", "Inorganic Chemistry"].join('\n');
        if (typeSelect) typeSelect.value = "both";
    } else if (presetType === 'JEE_SUBJ') {
        nameInput.value = ["Physics", "Mathematics", "Organic Chemistry", "Physical Chemistry", "Inorganic Chemistry"].join('\n');
        if (typeSelect) typeSelect.value = "both";
    } else if (presetType === 'EXAM_SECTIONS') {
        nameInput.value = ["NCERT Book", "PYQs", "Practice Paper", "MCQs Practice", "Mock Test"].join('\n');
        if (typeSelect) typeSelect.value = "both";
    } else if (presetType === 'AUTO_NUM') {
        let list = parseFolderNamesList(nameInput.value);
        if (list.length === 0) {
            showNotification("⚠️ Type or paste folder names (one per line) first.");
            return;
        }
        nameInput.value = list.map((name, i) => {
            let clean = name.replace(/^\d+\.\s*/, '');
            return `${String(i + 1).padStart(2, '0')}. ${clean}`;
        }).join('\n');
    }
    updateLiveAutoIconPreview();
}

function parseQuickPasteMCQ() {
    const rawEl = document.getElementById('admSmartPasteInput');
    if (!rawEl || !rawEl.value.trim()) {
        showNotification("⚠️ Paste a question with options first.");
        return;
    }
    let text = rawEl.value.trim();

    let expMatch = text.match(/(?:Explanation|Exp|Solution|Sol)\s*[:\-]\s*([\s\S]+)$/i);
    if (expMatch) {
        document.getElementById('admExplanation').value = expMatch[1].trim();
        text = text.slice(0, expMatch.index).trim();
    }

    let ansMatch = text.match(/(?:Answer|Ans|Correct(?:\s*Answer)?)\s*[:\-]\s*([A-Da-d](?:\s*,\s*[A-Da-d])*)/i);
    if (ansMatch) {
        let ansLetters = ansMatch[1].toUpperCase().split(',').map(s => s.trim());
        document.querySelectorAll('.admCorrectCb').forEach(cb => {
            cb.checked = ansLetters.includes(cb.value);
        });
        text = text.slice(0, ansMatch.index).trim();
    }

    let optRegex = /(?:^|\n|\s)\(?([A-D])[\)\.\:]\s*([\s\S]*?)(?=(?:\n|\s+)\(?[B-D][\)\.\:]|\s*$)/gi;
    let matches = [...text.matchAll(optRegex)];
    if (matches.length >= 2) {
        let firstOptIndex = matches[0].index;
        let qRaw = text.slice(0, firstOptIndex).replace(/^(?:Q(?:uestion)?\s*\d*[\.\:\)]\s*)/i, '').trim();
        if (qRaw) document.getElementById('admQuestion').value = qRaw;

        matches.forEach(m => {
            let letter = m[1].toUpperCase();
            let val = m[2].trim();
            let inputEl = document.getElementById('admOpt' + letter);
            if (inputEl) inputEl.value = val;
        });
        showNotification("✨ Question, Options & Answer auto-filled!");
    } else {
        document.getElementById('admQuestion').value = text;
        showNotification("📝 Question text filled (format options as A) ... B) ... for full auto-fill).");
    }
}

async function _renderAdminPanel() {
    if (!sessionStorage.getItem('admin_verified')) { window.location.hash = '#/admin'; return; }
    document.getElementById('breadcrumb-text').innerText = "Admin Workspace";
    
    const mc = document.getElementById('dynamic-content');
    if (!mc) return;

    mc.innerHTML = adminStyles + `
        <div class="page-transition">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <h2 style="color: white; margin:0; font-size: 24px;">⚙️ Admin Workspace</h2>
                <div style="display:flex; gap:10px;">
                    <button class="btn-exam" onclick="goHome()" style="background:#1c1c24; border:1px solid #333; padding:8px 14px; font-size:12px;">🏠 View Live Site</button>
                    <button class="btn-exam" onclick="logoutAdmin()" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.3); padding:8px 14px; font-size:12px;">🔒 Lock Admin</button>
                </div>
            </div>
            
            <div class="admin-nav-pills">
                <div class="admin-pill ${adminCurrentTab === 'upload' ? 'active' : ''}" onclick="switchAdminTab('upload')">➕ Rapid Upload</div>
                <div class="admin-pill ${adminCurrentTab === 'topics' ? 'active' : ''}" onclick="switchAdminTab('topics')">📁 Create Topic</div>
                <div class="admin-pill ${adminCurrentTab === 'edit-topics' ? 'active' : ''}" onclick="switchAdminTab('edit-topics')">🗂️ Edit / Delete Topics</div>
                <div class="admin-pill ${adminCurrentTab === 'subtopic-search' ? 'active' : ''}" onclick="switchAdminTab('subtopic-search')">🔍 Subtopic Search Bars</div>
                <div class="admin-pill ${adminCurrentTab === 'sidebar-links' ? 'active' : ''}" onclick="switchAdminTab('sidebar-links')">🔗 Quick Links & Essential</div>
                <div class="admin-pill ${adminCurrentTab === 'custom-practice' ? 'active' : ''}" onclick="switchAdminTab('custom-practice')">🎯 Custom Practice</div>
                <div class="admin-pill ${adminCurrentTab === 'manage' ? 'active' : ''}" onclick="switchAdminTab('manage')">📋 Edit MCQs / PDFs</div>
                <div class="admin-pill ${adminCurrentTab === 'reports' ? 'active' : ''}" onclick="switchAdminTab('reports')">🚨 Reports</div>
                <div class="admin-pill ${adminCurrentTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👥 Users</div>
                <div class="admin-pill ${adminCurrentTab === 'doubts' ? 'active' : ''}" onclick="switchAdminTab('doubts')">🚩 Doubts</div>
                <div class="admin-pill ${adminCurrentTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">🛠️ Settings</div>
            </div>
            
           <!-- 1. UPLOAD TAB -->
            <div id="admin-upload-view" style="display:${adminCurrentTab === 'upload' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <h3 class="admin-section-header"><span>🎯</span> 1. Select Target Destination</h3>
                    <div id="dynamic-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap;"></div>
                    <div id="upload-path-display" style="margin-top:15px; font-size:14px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); padding: 12px; border-radius: 8px; color:var(--correct-green); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div><b>Uploading To:</b> <span id="upload-path-text" style="color:white;">None</span></div>
                        <button type="button" class="btn-exam" onclick="jumpToUploadedFolderLive()" style="background:#1c1c24; border:1px solid rgba(76,175,80,0.5); color:var(--correct-green); padding:5px 12px; font-size:11.5px;">👁️ View This Folder Live &rarr;</button>
                    </div>
                </div>
                
                <div id="upload-form-area" style="display:none;">
                    <!-- 🎲 AUTO-GENERATE MIXED LEVEL QUESTIONS PANEL -->
                    <div class="admin-panel-card" style="border-color:rgba(168,85,247,0.45); background:linear-gradient(145deg, rgba(168,85,247,0.06), rgba(23,23,30,0.98));">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid rgba(168,85,247,0.25); padding-bottom:12px; margin-bottom:16px;">
                            <div>
                                <h3 style="margin:0; font-size:17px; color:#c084fc; display:flex; align-items:center; gap:8px;">🎲 Auto-Generate "Mixed" Level Questions (Randomly Shuffled)</h3>
                                <span style="font-size:12px; color:var(--text-muted);">Automatically pull questions from <b>Easy</b>, <b>Medium</b> &amp; <b>Hard</b> of this subtopic and combine them in true random order (never serially arranged).</span>
                            </div>
                            <button type="button" class="btn-exam" onclick="refreshAutoMixAvailableCounts()" style="background:#1c1c24; border:1px solid #c084fc; color:#c084fc; padding:6px 12px; font-size:11.5px;">🔄 Check Available Counts</button>
                        </div>

                        <div id="autoMixSubtopicStatusBar" style="background:#111522; border:1px solid #2b354f; border-radius:10px; padding:10px 14px; margin-bottom:14px; font-size:12.5px; color:#cbd5e1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div><b>Target Subtopic:</b> <span id="autoMixDetectedSubtopicText" style="color:var(--primary-yellow);">Detecting...</span></div>
                            <div id="autoMixLiveCountsBadges" style="display:flex; gap:8px; flex-wrap:wrap;"></div>
                        </div>

                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:14px;">
                            <div style="background:#121624; border:1px solid rgba(16,185,129,0.35); border-left:4px solid #10b981; padding:10px 12px; border-radius:10px;">
                                <label class="admin-label" style="color:#10b981; margin-bottom:6px;">🟢 From Easy Level</label>
                                <input type="number" id="autoMixEasyCount" class="input-field" value="10" min="0" max="200" style="margin-bottom:0; padding:8px 10px; font-size:14px; font-weight:700;">
                            </div>
                            <div style="background:#121624; border:1px solid rgba(234,179,8,0.35); border-left:4px solid #eab308; padding:10px 12px; border-radius:10px;">
                                <label class="admin-label" style="color:#eab308; margin-bottom:6px;">🟡 From Medium Level</label>
                                <input type="number" id="autoMixMediumCount" class="input-field" value="10" min="0" max="200" style="margin-bottom:0; padding:8px 10px; font-size:14px; font-weight:700;">
                            </div>
                            <div style="background:#121624; border:1px solid rgba(244,63,94,0.35); border-left:4px solid #f43f5e; padding:10px 12px; border-radius:10px;">
                                <label class="admin-label" style="color:#f43f5e; margin-bottom:6px;">🔴 From Hard Level</label>
                                <input type="number" id="autoMixHardCount" class="input-field" value="10" min="0" max="200" style="margin-bottom:0; padding:8px 10px; font-size:14px; font-weight:700;">
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px; color:#cbd5e1; user-select:none;">
                                <input type="checkbox" id="autoMixReplaceExisting" checked style="accent-color:#c084fc; width:16px; height:16px; cursor:pointer;">
                                <span>Replace previous Mixed questions in this subtopic (prevents duplicates)</span>
                            </label>
                            <button type="button" id="btnRunAutoMix" class="btn-exam btn-yellow-glow" onclick="generateAutoMixedQuestionsForSubtopic()" style="background:linear-gradient(135deg, #a855f7, #ec4899) !important; color:#fff !important; border:none !important; padding:10px 20px; font-size:13.5px; font-weight:800;">🎲 Auto-Combine &amp; Shuffle into Mixed Level</button>
                        </div>
                    </div>

                    <div class="admin-panel-card">
                        <h3 class="admin-section-header" style="justify-content: space-between; flex-wrap:wrap; gap:10px;">
                            <div style="display:flex; align-items:center; gap:10px;"><span>📝</span> 2. Draft Content</div>
                            <select id="admResourceType" class="input-field" onchange="toggleAdminFormType()" style="margin: 0; width: auto; min-width: 190px; padding: 7px 14px; font-weight:700; border-color:var(--primary-yellow);">
                                <option value="mcq">📝 MCQ Format</option>
                                <option value="pdf">📄 PDF / Study Material</option>
                            </select>
                        </h3>
                        
                        <div id="admin-mcq-form">
                            <!-- ⚡ SMART SINGLE & BULK MULTI-QUESTION AUTO-PARSER -->
                            <div style="background:linear-gradient(145deg, #111522, #151a2e); border:1.5px dashed rgba(253,184,19,0.55); border-radius:12px; padding:15px; margin-bottom:18px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
                                    <div>
                                        <span style="font-size:13px; font-weight:800; color:var(--primary-yellow); display:flex; align-items:center; gap:6px;">⚡ 1-CLICK SINGLE &amp; BULK MULTI-QUESTION SMART PARSER</span>
                                        <span style="font-size:11.5px; color:#94a3b8;">Paste <b>1 question</b> OR <b>multiple questions at once</b>. Automatically detects &amp; fills the <b>Correct Option</b>, keeps <i>italics</i>/formulas, and lets you edit any question manually before saving!</span>
                                    </div>
                                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                        <button type="button" class="btn-exam" onclick="parseQuickPasteMCQ('single')" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.45); padding:7px 13px; font-size:12px; font-weight:700;">✨ Fill Single Form Below</button>
                                        <button type="button" class="btn-exam btn-yellow-glow" onclick="parseQuickPasteMCQ('bulk')" style="padding:7px 16px; font-size:12.5px; font-weight:800;">📚 Read &amp; Place Multiple Questions (Auto-Detect Answers)</button>
                                        <button type="button" class="btn-exam" onclick="document.getElementById('admSmartPasteInput').value=''; clearBulkStagedQueue();" style="background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.35); padding:7px 11px; font-size:11.5px;">✕ Clear</button>
                                    </div>
                                </div>
                                <textarea id="admSmartPasteInput" class="input-field" style="min-height:105px; margin-bottom:0; font-size:13px; line-height:1.5;" placeholder="Paste 1 or multiple MCQs here (Q1... (A)... (B)... (C)... (D)... Correct Option: (C) Explanation: ...) and click '📚 Read & Place Multiple Questions'!"></textarea>

                                <!-- 📚 INTERACTIVE BULK STAGING, MANUAL EDITING & 1-CLICK UPLOAD QUEUE -->
                                <div id="admBulkStagingPanel" style="display:none; margin-top:16px; border-top:1px solid #2b3954; padding-top:16px;">
                                    <div style="background:#0b0f19; border:1px solid #2b3954; border-radius:10px; padding:12px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; position:sticky; top:68px; z-index:40; box-shadow:0 10px 25px rgba(0,0,0,0.75);">
                                        <div id="admBulkQueueSummaryBadges" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"></div>
                                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                            <select id="admBulkGlobalDifficulty" class="input-field" onchange="applyBulkGlobalDifficulty(this.value)" style="margin:0; width:auto; padding:6px 10px; font-size:12px; font-weight:700; border-color:#38bdf8;">
                                                <option value="">🎯 Set All Difficulty...</option>
                                                <option value="Easy">🟢 Set All: Easy</option>
                                                <option value="Medium">🟡 Set All: Medium</option>
                                                <option value="Hard">🔴 Set All: Hard</option>
                                                <option value="Mixed">⚡ Set All: Mixed</option>
                                            </select>
                                            <button type="button" class="btn-exam" onclick="bulkAutoSplitAllStatements()" style="background:rgba(168,85,247,0.16); color:#c084fc; border:1px solid rgba(168,85,247,0.4); padding:6px 11px; font-size:11.5px; font-weight:700;">📑 Split All Statements</button>
                                            <button type="button" class="btn-exam" onclick="bulkAutoFormatAllChemistry()" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:6px 11px; font-size:11.5px; font-weight:700;">🪄 Format All Reactions</button>
                                            <button type="button" class="btn-exam" onclick="addBlankQuestionToBulkQueue()" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:6px 11px; font-size:11.5px;">➕ Add Blank Question</button>
                                            <button type="button" id="btnUploadAllBulkMCQs" class="btn-exam btn-green-glow" onclick="uploadAllBulkStagedMCQs()" style="padding:8px 18px; font-size:13px; font-weight:800;">☁️ Upload All Questions Now</button>
                                        </div>
                                    </div>
                                    <div id="admBulkCardsList" style="display:flex; flex-direction:column; gap:16px;"></div>
                                </div>
                            </div>

                            <!-- 🧪 1-CLICK TEXT STYLE, LINE SPACING, CHEMICAL REACTION & MATH FORMULA BAR -->
                            <div style="background:#101626; border:1px solid #2b3954; border-radius:12px; padding:12px 14px; margin-bottom:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                                    <span style="font-size:11.5px; font-weight:800; color:#38bdf8; text-transform:uppercase;">✍️ Text Styles, Statement Line-Breaks, Reactions &amp; Math Toolbar (Works in Single Form &amp; Bulk Cards!)</span>
                                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                        <button type="button" onclick="autoSeparateStatementsInActiveInput()" style="background:rgba(168,85,247,0.18); color:#c084fc; border:1px solid rgba(168,85,247,0.45); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;" title="Automatically puts I., II., III., IV., Statement I/II, Assertion/Reason on separate lines">📑 Auto-Split Statements (I, II, III)</button>
                                        <button type="button" onclick="formatPlainChemistryToLatex()" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;" title="Automatically converts H2SO4, ->, <=>, ^2+ in active box into clean formulas">🪄 Auto-Format Reaction / Formula</button>
                                    </div>
                                </div>
                                <!-- Row 1: Text Styling & Line Spacing -->
                                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
                                    <button type="button" class="admin-preset-chip" style="color:#f472b6; border-color:rgba(244,114,182,0.45); background:rgba(244,114,182,0.12);" onclick="applyAdminTextStyleTag('i')" title="Shortcut: Ctrl+I"><i>𝐼 Italic</i></button>
                                    <button type="button" class="admin-preset-chip" style="color:#f472b6; border-color:rgba(244,114,182,0.45); background:rgba(244,114,182,0.12);" onclick="applyAdminTextStyleTag('b')" title="Shortcut: Ctrl+B"><b>𝐁 Bold</b></button>
                                    <button type="button" class="admin-preset-chip" style="color:#f472b6; border-color:rgba(244,114,182,0.45); background:rgba(244,114,182,0.12);" onclick="applyAdminTextStyleTag('u')" title="Shortcut: Ctrl+U"><u>U Underline</u></button>
                                    <button type="button" class="admin-preset-chip" style="color:#f472b6; border-color:rgba(244,114,182,0.45); background:rgba(244,114,182,0.12);" onclick="applyAdminTextStyleTag('sub')">X<sub>2</sub> Subscript</button>
                                    <button type="button" class="admin-preset-chip" style="color:#f472b6; border-color:rgba(244,114,182,0.45); background:rgba(244,114,182,0.12);" onclick="applyAdminTextStyleTag('sup')">X<sup>2</sup> Superscript</button>
                                    <button type="button" class="admin-preset-chip" style="color:#a855f7; border-color:rgba(168,85,247,0.45); background:rgba(168,85,247,0.12);" onclick="insertBlankLineSpacingInActiveInput()" title="Insert an empty line space at cursor">↕️ + Blank Line Space</button>
                                    <button type="button" class="admin-preset-chip" style="color:#94a3b8; border-color:rgba(148,163,184,0.35); background:rgba(148,163,184,0.1);" onclick="stripHtmlStyleTagsFromActiveInput()" title="Remove style tags from selected text">🧹 Clear Style Tags</button>
                                </div>
                                <!-- Row 2: Chemistry Reactions -->
                                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\rightarrow$')">→ Reaction</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\rightleftharpoons$')">⇌ Equilibrium</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow{\\Delta}$')">—Δ→ Heat</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow{\\text{cat.}}$')">—cat→ Catalyst</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow[\\text{temp}]{\\text{reagent}}$')">—[Reagent]→</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$_2$')">X₂ Math Sub</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$^{2+}$')">X²⁺ Ion/Power</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\uparrow$')">↑ Gas</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\downarrow$')">↓ Precipitate</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\Delta H^\\circ$')">ΔH°</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\Delta G^\\circ$')">ΔG°</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('⌬')">⌬ Benzene</button>
                                </div>
                                <!-- Row 3: Physics & Math Symbols -->
                                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\frac{a}{b}$')">a/b Fraction</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\sqrt{x}$')">√x Root</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\int_{a}^{b}$')">∫ Integral</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\sum$')">∑ Sum</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\vec{A}$')">vec(A)</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\times 10^{-6}$')">×10⁻ⁿ</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\theta$')">θ</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\lambda$')">λ</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\mu$')">μ</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\Omega$')">Ω</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\pi$')">π</button>
                                    <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.35); background:rgba(56,189,248,0.08);" onclick="insertAdminFormulaAtCursor('$\\pm$')">±</button>
                                </div>
                            </div>

                            <!-- QUESTION TEXT + SCREENSHOT PASTE / FILE UPLOAD -->
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                                <label class="admin-label" style="margin-bottom:0;">Question Text (Optional if you upload/paste a Question Screenshot below)</label>
                                <span style="font-size:11px; color:#10b981;">💡 Supports $LaTeX$, chemical reactions &amp; Ctrl+V screenshot paste!</span>
                            </div>
                            <textarea id="admQuestion" class="input-field" style="min-height: 95px; font-size: 15px; margin-bottom:10px;" placeholder="Type question or chemical reaction here... OR press Ctrl+V / click Paste Screenshot below!" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()" onpaste="handleUniversalImagePaste(event, 'QUESTION')"></textarea>

                            <!-- 📸 QUESTION SCREENSHOT PASTE & UPLOAD BAR -->
                            <div style="background:#111522; border:1px solid rgba(56,189,248,0.35); border-left:4px solid #38bdf8; border-radius:10px; padding:12px 14px; margin-bottom:16px;" onpaste="handleUniversalImagePaste(event, 'QUESTION')">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                    <div>
                                        <div style="font-size:12.5px; font-weight:800; color:#38bdf8;">📸 Question Image / Screenshot (Upload File OR Paste Screenshot)</div>
                                        <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">Take a screenshot on desktop or mobile and click <b>📋 Paste Screenshot</b> (or press <b>Ctrl+V</b>), or upload from device.</div>
                                    </div>
                                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                        <input type="file" id="admQTextImageFile" accept="image/*" style="display:none;" onchange="handleUniversalFileSelect(this, 'QUESTION')">
                                        <button type="button" class="btn-exam" onclick="triggerClipboardImagePaste('QUESTION')" style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.45); padding:7px 13px; font-size:12px; font-weight:800;">📋 Paste Screenshot</button>
                                        <button type="button" class="btn-exam" onclick="document.getElementById('admQTextImageFile').click()" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:7px 13px; font-size:12px;">📁 Upload Image</button>
                                        <button type="button" class="btn-exam" onclick="clearUniversalImageSlot('QUESTION')" id="btnClearQTextImg" style="display:none; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:7px 12px; font-size:12px;">✕ Remove</button>
                                    </div>
                                </div>
                                <div id="admQTextImgPreviewWrap" style="display:none; margin-top:12px; background:#fff; padding:10px; border-radius:8px; text-align:center; max-width:100%; overflow:hidden;">
                                    <img id="admQTextImgPreview" src="" style="max-height:170px; max-width:100%; object-fit:contain; display:block; margin:0 auto; border-radius:4px;">
                                </div>
                            </div>

                            <!-- 📊 MATCH-THE-COLUMN / CUSTOM TABLE BUILDER (DISPLAYS JUST UNDER QUESTION) -->
                            <div style="background:#111522; border:1px solid rgba(168,85,247,0.4); border-left:4px solid #a855f7; border-radius:10px; padding:12px 14px; margin-bottom:18px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:800; color:#c084fc; user-select:none;">
                                        <input type="checkbox" id="admEnableMatchTable" onchange="toggleAdminMatchTableBuilder(this.checked)" style="accent-color:#a855f7; width:17px; height:17px; cursor:pointer;">
                                        <span>📊 Add Match-the-Column / Custom Table (Displays Just Under Question)</span>
                                    </label>
                                    <span style="font-size:11px; color:#94a3b8;">Customize rows &amp; columns • Supports text, formulas &amp; reactions</span>
                                </div>

                                <div id="admMatchTableBuilderWrap" style="display:none; margin-top:14px; border-top:1px solid #2b354f; padding-top:14px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                            <span style="font-size:11.5px; color:#cbd5e1; font-weight:700;">Rows:</span>
                                            <button type="button" onclick="resizeAdminMatchTable(-1, 0)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; width:28px; height:28px; cursor:pointer; font-weight:bold;">−</button>
                                            <span id="admTableRowsBadge" style="font-size:13px; font-weight:800; color:#fdb813; min-width:20px; text-align:center;">4</span>
                                            <button type="button" onclick="resizeAdminMatchTable(1, 0)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; width:28px; height:28px; cursor:pointer; font-weight:bold;">+</button>

                                            <span style="font-size:11.5px; color:#cbd5e1; font-weight:700; margin-left:10px;">Columns:</span>
                                            <button type="button" onclick="resizeAdminMatchTable(0, -1)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; width:28px; height:28px; cursor:pointer; font-weight:bold;">−</button>
                                            <span id="admTableColsBadge" style="font-size:13px; font-weight:800; color:#38bdf8; min-width:20px; text-align:center;">2</span>
                                            <button type="button" onclick="resizeAdminMatchTable(0, 1)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:6px; width:28px; height:28px; cursor:pointer; font-weight:bold;">+</button>
                                        </div>

                                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                            <button type="button" class="admin-preset-chip" onclick="applyMatchTablePrefixPreset('abcd_roman')">🔤 a, b, c, d + i, ii, iii, iv</button>
                                            <button type="button" class="admin-preset-chip" onclick="applyMatchTablePrefixPreset('ABCD_1234')">🔠 A, B, C, D + 1, 2, 3, 4</button>
                                            <button type="button" class="admin-preset-chip" onclick="applyMatchTablePrefixPreset('PQRS_1234')">🔢 P, Q, R, S + 1, 2, 3, 4</button>
                                            <button type="button" class="admin-preset-chip" style="color:#ef4444; border-color:rgba(239,68,68,0.35); background:rgba(239,68,68,0.1);" onclick="resetAdminMatchTableCells()">🧹 Clear Cells</button>
                                        </div>
                                    </div>

                                    <div id="admMatchTableInputsContainer" style="overflow-x:auto;"></div>
                                </div>
                            </div>

                            <!-- 📐 DEDICATED DIAGRAM SECTION (UPLOAD FILE + PASTE SCREENSHOT) -->
                            <div class="admin-grid-2" style="margin-bottom: 15px;">
                                <div style="background:#111522; border:1px solid rgba(253,184,19,0.4); border-left:4px solid #fdb813; border-radius:10px; padding:12px 14px;" onpaste="handleUniversalImagePaste(event, 'DIAGRAM')">
                                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                                        <label class="admin-label" style="color:var(--primary-yellow); margin-bottom:0;">📐 Dedicated Diagram / Figure / Circuit (Optional)</label>
                                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                            <button type="button" onclick="triggerClipboardImagePaste('DIAGRAM')" style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.45); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:800; cursor:pointer;">📋 Paste Screenshot</button>
                                            <button type="button" onclick="document.getElementById('admQImage').click()" style="background:rgba(253,184,19,0.15); color:#fdb813; border:1px solid rgba(253,184,19,0.4); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;">📁 Upload File</button>
                                            <button type="button" onclick="clearUniversalImageSlot('DIAGRAM')" id="btnClearDiagramImg" style="display:none; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); border-radius:6px; padding:4px 9px; font-size:11px; font-weight:700; cursor:pointer;">✕ Remove</button>
                                        </div>
                                    </div>
                                    <input type="file" id="admQImage" class="input-field" accept="image/*" style="padding: 7px 10px; margin-bottom:8px; font-size:12px;" onchange="handleUniversalFileSelect(this, 'DIAGRAM')">
                                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                        <input type="text" id="admDiagramCaption" class="input-field" placeholder="Diagram Label/Caption (or click here & press Ctrl+V to paste diagram)" style="flex:2; min-width:140px; margin-bottom:0; padding:8px 10px; font-size:12px;" onpaste="handleUniversalImagePaste(event, 'DIAGRAM')">
                                        <select id="admDiagramBgMode" class="input-field" style="flex:1; min-width:130px; margin-bottom:0; padding:8px 10px; font-size:12px;" onchange="updateAdminDiagramPreviewBg()">
                                            <option value="light">☀️ Crisp White Backing</option>
                                            <option value="dark">🌙 Dark Backing</option>
                                        </select>
                                    </div>
                                    <div id="admDiagramPreviewWrap" style="display:none; margin-top:10px; background:#ffffff; padding:10px; border-radius:8px; text-align:center; border:1px solid #334155;">
                                        <img id="admDiagramPreviewImg" src="" style="max-height:160px; max-width:100%; object-fit:contain; display:block; margin:0 auto;">
                                    </div>
                                </div>
                                <div>
                                    <label class="admin-label">Difficulty Level</label>
                                    <select id="admDifficulty" class="input-field">
                                        <option value="Mixed">Mixed (Default)</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                    <div style="background:#111522; border:1px solid #2b2b36; border-radius:10px; padding:10px 12px; font-size:12px; color:#94a3b8; line-height:1.5;">
                                        💡 <b>Tip:</b> Upload your questions into <b>Easy</b>, <b>Medium</b>, and <b>Hard</b> folders, then use the <b>🎲 Auto-Generate Mixed Level</b> box above to build your <b>Mixed</b> set automatically!
                                    </div>
                                </div>
                            </div>
                            
                            <label class="admin-label" style="margin-top: 20px;">Multiple Choice Options (Supports Formulas &amp; Reactions)</label>
                            <div class="admin-grid-2">
                                <input type="text" id="admOptA" class="input-field" placeholder="Option A (e.g. a-iii, b-iv, c-i, d-ii)" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()">
                                <input type="text" id="admOptB" class="input-field" placeholder="Option B" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()">
                                <input type="text" id="admOptC" class="input-field" placeholder="Option C" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()">
                                <input type="text" id="admOptD" class="input-field" placeholder="Option D" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()">
                            </div>
                            
                            <label class="admin-label" style="margin-top: 15px;">Select Correct Answer(s)</label>
                            <div class="admin-checkbox-group">
                                <label class="admin-cb-label"><input type="checkbox" value="A" class="admCorrectCb"> A</label>
                                <label class="admin-cb-label"><input type="checkbox" value="B" class="admCorrectCb"> B</label>
                                <label class="admin-cb-label"><input type="checkbox" value="C" class="admCorrectCb"> C</label>
                                <label class="admin-cb-label"><input type="checkbox" value="D" class="admCorrectCb"> D</label>
                            </div>
                            
                            <!-- EXPLANATION TEXT + SCREENSHOT PASTE & UPLOAD -->
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                                <label class="admin-label" style="margin-bottom:0;">Explanation (Optional — Type Text/Formulas AND/OR Paste/Upload Solution Image)</label>
                                <span style="font-size:11px; color:#10b981;">💡 Press Ctrl+V inside box or click Paste Screenshot to attach handwritten/printed solution!</span>
                            </div>
                            <textarea id="admExplanation" class="input-field" style="min-height: 80px; margin-bottom:10px;" placeholder="Explain why the answer is correct... OR press Ctrl+V / click Paste Screenshot below to attach a solution image!" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()" onpaste="handleUniversalImagePaste(event, 'EXPLANATION')"></textarea>

                            <!-- 📸 EXPLANATION SCREENSHOT PASTE & UPLOAD BAR -->
                            <div style="background:#111522; border:1px solid rgba(16,185,129,0.35); border-left:4px solid #10b981; border-radius:10px; padding:12px 14px; margin-bottom:14px;" onpaste="handleUniversalImagePaste(event, 'EXPLANATION')">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                    <div>
                                        <div style="font-size:12.5px; font-weight:800; color:#10b981;">🖼️ Explanation / Solution Image (Upload File OR Paste Screenshot)</div>
                                        <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">Attach a screenshot of a step-by-step derivation, mechanism, or NCERT solution paragraph.</div>
                                    </div>
                                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                        <input type="file" id="admExpImageFile" accept="image/*" style="display:none;" onchange="handleUniversalFileSelect(this, 'EXPLANATION')">
                                        <button type="button" class="btn-exam" onclick="triggerClipboardImagePaste('EXPLANATION')" style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.45); padding:7px 13px; font-size:12px; font-weight:800;">📋 Paste Screenshot</button>
                                        <button type="button" class="btn-exam" onclick="document.getElementById('admExpImageFile').click()" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:7px 13px; font-size:12px;">📁 Upload Image</button>
                                        <button type="button" class="btn-exam" onclick="clearUniversalImageSlot('EXPLANATION')" id="btnClearExpImg" style="display:none; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:7px 12px; font-size:12px;">✕ Remove</button>
                                    </div>
                                </div>
                                <div id="admExpImgPreviewWrap" style="display:none; margin-top:12px; background:#fff; padding:10px; border-radius:8px; text-align:center; max-width:100%; overflow:hidden;">
                                    <img id="admExpImgPreview" src="" style="max-height:170px; max-width:100%; object-fit:contain; display:block; margin:0 auto; border-radius:4px;">
                                </div>
                            </div>

                            <!-- 👁️ LIVE STUDENT VIEW & FORMULA / TABLE / REACTION PREVIEW -->
                            <div id="admLiveFormulaPreviewCard" style="display:none; background:#090e1a; border:1px solid rgba(253,184,19,0.35); border-radius:12px; padding:14px 16px; margin-top:14px;">
                                <div style="font-size:11px; font-weight:800; color:var(--primary-yellow); text-transform:uppercase; margin-bottom:8px;">👁️ Live Student Preview (Question + Match Table + Options + Explanation)</div>
                                <div id="admLiveFormulaPreviewContent" style="font-size:14.5px; color:#fff; line-height:1.6;"></div>
                            </div>
                        </div>
                        
                        <div id="admin-pdf-form" style="display:none;">
                            <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.3); border-radius:10px; padding:12px 15px; margin-bottom:18px; font-size:12.5px; color:#cbd5e1;">
                                💡 <b>Smart PDF Uploader:</b> Upload one or multiple PDF/Image files from your device, <b>OR</b> paste a direct PDF / Google Drive link below. Uploaded PDFs appear immediately inside this folder on both Website &amp; App!
                            </div>

                            <label class="admin-label">Document Title (Optional if uploading multiple files — uses file names automatically)</label>
                            <input type="text" id="admPdfTitle" class="input-field" placeholder="e.g. 01. Class 11 NCERT Chapter 1 - The Living World">

                            <div class="admin-grid-2" style="margin-top: 10px;">
                                <div>
                                    <label class="admin-label">Option A: Select File(s) from Device (PDF or Image)</label>
                                    <input type="file" id="admPdfFile" class="input-field" accept=".pdf,application/pdf,image/*" multiple style="padding: 9px 14px;" onchange="autoFillPdfTitleFromFile(this)">
                                    <span style="font-size:11px; color:#888;">*You can select 1 or multiple PDF files at once!</span>
                                </div>
                                <div>
                                    <label class="admin-label">Option B: Or Paste Direct PDF / Google Drive Link</label>
                                    <input type="url" id="admPdfDirectUrl" class="input-field" placeholder="https://drive.google.com/... or direct .pdf link">
                                    <span style="font-size:11px; color:#888;">*Great for large NCERT books (&gt;10 MB) hosted on Google Drive!</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px; border-top: 1px solid #2b2b36; padding-top: 20px;">
                            <button id="uploadBtn" class="btn-exam btn-green-glow" onclick="processAdminUpload()" style="flex: 2; font-size: 16px;">☁️ Upload &amp; Save</button>
                            <button class="btn-exam" onclick="clearAdminUploadForm(false)" style="background-color: transparent; color: var(--wrong-red); border: 1px solid var(--wrong-red); flex: 1;">Clear Fields</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 2. SMART CREATE TOPIC TAB -->
            <div id="admin-topics-view" style="display:${adminCurrentTab === 'topics' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color: rgba(253, 184, 19, 0.4); background: rgba(253, 184, 19, 0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom: 1px solid rgba(253, 184, 19, 0.2); padding-bottom: 15px; margin-bottom: 20px;">
                        <div>
                            <h3 style="color:var(--primary-yellow); margin:0; font-size:18px; display:flex; align-items:center; gap:10px;">📁 Smart Batch Topic & Subtopic Creator</h3>
                            <span style="font-size:12px; color:var(--text-muted);">Create single topics (even with commas like "Art, Culture & Heritage") or multiple folders in a single click.</span>
                        </div>
                        <button class="btn-exam" onclick="switchAdminTab('edit-topics')" style="background:#1c1c24; border:1px solid var(--primary-yellow); color:var(--primary-yellow); padding:7px 14px; font-size:12px;">🗂️ Manage Existing Topics &rarr;</button>
                    </div>

                    <label class="admin-label">1. Select Base Parent Path (Leave at Root to create a Main Exam Category)</label>
                    <div id="dynamic-new-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap;"></div>
                    <div id="new-topic-path-display" style="margin-top:10px; font-size:13px; color:var(--primary-yellow); margin-bottom: 14px;">
                        <b>Active Base Path:</b> <span id="new-topic-path-text" style="color:white;">Root (Main Menu)</span>
                    </div>

                    <div id="admin-multi-target-container"></div>
                    
                    <div class="admin-grid-2">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                                <label class="admin-label" style="margin-bottom:0;">2. Folder Name(s)</label>
                                <div class="admin-split-mode-toggle">
                                    <button type="button" id="splitModeBtnLine" class="admin-split-mode-btn ${adminFolderSplitMode === 'LINE' ? 'active' : ''}" onclick="setAdminFolderSplitMode('LINE')">↵ 1 Topic Per Line (Commas Kept)</button>
                                    <button type="button" id="splitModeBtnComma" class="admin-split-mode-btn ${adminFolderSplitMode === 'COMMA' ? 'active' : ''}" onclick="setAdminFolderSplitMode('COMMA')">➗ Split by Comma</button>
                                </div>
                            </div>
                            <div class="admin-preset-bar">
                                <button type="button" class="admin-preset-chip" onclick="applyFolderPreset('DIFF_4')">🟢🟡🔴⚡ + Difficulty Set (4)</button>
                                <button type="button" class="admin-preset-chip" onclick="applyFolderPreset('DIFF_3')">🟢🟡🔴 + Easy/Med/Hard</button>
                                <button type="button" class="admin-preset-chip" onclick="applyFolderPreset('NEET_SUBJ')">🩺 + NEET Subjects</button>
                                <button type="button" class="admin-preset-chip" onclick="applyFolderPreset('JEE_SUBJ')">🚀 + JEE Subjects</button>
                                <button type="button" class="admin-preset-chip" onclick="applyFolderPreset('EXAM_SECTIONS')">📂 + Exam Sections</button>
                                <button type="button" class="admin-preset-chip" style="color:#38bdf8; border-color:rgba(56,189,248,0.4); background:rgba(56,189,248,0.1);" onclick="applyFolderPreset('AUTO_NUM')">🔢 Auto-Number List</button>
                            </div>
                            <textarea id="newFolderName" class="input-field" style="min-height:76px; font-size:14px; margin-bottom:4px;" placeholder="Type a folder name (e.g. Art, Culture & Heritage). Press Enter (new line) to add multiple folders at once..." oninput="updateLiveAutoIconPreview()"></textarea>
                            <span id="folderSplitModeTip" style="font-size: 11px; color: #38bdf8;">*Commas stay inside your topic name (e.g. "Art, Culture & Heritage" stays 1 folder). Press Enter (new line) or use ; to add multiple folders!</span>
                        </div>
                        <div>
                            <label class="admin-label">3. Automatic Study Icon & Glow Preview (No Typing Needed!)</label>
                            <div style="display:flex; align-items:center; gap:12px; background:#111522; border:1px solid #2b2b36; padding:12px 14px; border-radius:10px; min-height:76px; box-sizing:border-box;">
                                <div id="autoIconPreviewBadge" style="width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(253,184,19,0.5); background:rgba(253,184,19,0.15); flex-shrink:0;">📘</div>
                                <div style="flex:1; font-size:13px;" id="autoIconPreviewName">
                                    <span style="color:#aaa;">Type folder name(s) or click a preset chip — icons & colors assign automatically!</span>
                                </div>
                                <input type="text" id="newFolderIcon" class="input-field" placeholder="Auto" maxlength="2" title="Optional manual emoji override" oninput="updateLiveAutoIconPreview()" style="width:62px; margin:0; padding:8px; text-align:center; font-size:14px;">
                            </div>
                            <span style="font-size: 11px; color: var(--correct-green); display:block; margin-top:6px;">✅ 100% Automatic — recognizes 200+ study subjects, chapters & exams automatically.</span>
                        </div>
                    </div>

                    <div class="admin-grid-2" style="margin-top: 16px; align-items: center;">
                        <div>
                            <label class="admin-label">4. Expected Content Type</label>
                            <select id="newFolderType" class="input-field" style="margin-bottom:0;" onchange="updateLiveAutoIconPreview()">
                                <option value="both">📂 Parent Category (To hold sub-folders inside)</option>
                                <option value="mcq">📝 MCQs Practice (End Topic)</option>
                                <option value="pdf">📄 PDF / Image Material (End Topic)</option>
                            </select>
                        </div>
                        <div style="background:#111522; border:1px solid #2b354f; padding:12px 15px; border-radius:10px; margin-top:18px;">
                            <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; color:#fff; font-weight:600; user-select:none;">
                                <input type="checkbox" id="autoAddDiffInsideToggle" style="accent-color:#fdb813; width:17px; height:17px; cursor:pointer;">
                                <span>⚡ Also auto-create <b>Easy, Medium, Hard, Mixed</b> inside each new folder created above</span>
                            </label>
                        </div>
                    </div>

                    <button id="createFolderBtn" class="btn-exam btn-yellow-glow" onclick="createCustomTopic()" style="width:100%; max-width:320px; margin-top: 20px; font-size:15px; padding:13px 20px;">+ Create Folder(s)</button>
                </div>
            </div>

            <!-- 3. CLEAN EDIT & DELETE TOPICS / SUBTOPICS TAB -->
            <div id="admin-edit-topics-view" style="display:${adminCurrentTab === 'edit-topics' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #2b2b36; padding-bottom:15px; margin-bottom:20px;">
                        <div>
                            <h3 style="margin:0; font-size:18px; color:#fff;">🗂️ Filter & Bulk Manage Topics / Subtopics</h3>
                            <span style="font-size:12px; color:var(--text-muted);">Filter by hierarchy, edit individual folders, or select multiple folders to bulk-add difficulty levels or bulk-delete.</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-exam" onclick="resetAdminTopicFilters()" style="background:#23232c; border:1px solid #444; color:#fff; padding:7px 14px; font-size:12px;">🔄 Reset Filters</button>
                            <button class="btn-exam" onclick="switchAdminTab('topics')" style="background:rgba(253,184,19,0.15); border:1px solid var(--primary-yellow); color:var(--primary-yellow); padding:7px 14px; font-size:12px;">+ New Folder</button>
                        </div>
                    </div>

                    <div class="admin-grid-2" style="margin-bottom: 18px; align-items: end;">
                        <div>
                            <label class="admin-label">1. View Level</label>
                            <div class="admin-scope-bar">
                                <button type="button" class="admin-scope-btn ${adminTopicScopeFilter === 'ALL' ? 'active' : ''}" onclick="setAdminTopicScope('ALL')">All Topics</button>
                                <button type="button" class="admin-scope-btn ${adminTopicScopeFilter === 'MAIN' ? 'active' : ''}" onclick="setAdminTopicScope('MAIN')">🌟 Main Topics</button>
                                <button type="button" class="admin-scope-btn ${adminTopicScopeFilter === 'SUB' ? 'active' : ''}" onclick="setAdminTopicScope('SUB')">📂 Subtopics</button>
                            </div>
                        </div>
                        <div>
                            <label class="admin-label">2. Content Type</label>
                            <select id="adminTopicTypeSelect" class="input-field" style="margin-bottom:0;" onchange="handleAdminTopicTypeChange(this.value)">
                                <option value="ALL" ${adminTopicTypeFilter === 'ALL' ? 'selected' : ''}>All Content Types</option>
                                <option value="both" ${adminTopicTypeFilter === 'both' ? 'selected' : ''}>📂 Parent Category</option>
                                <option value="mcq" ${adminTopicTypeFilter === 'mcq' ? 'selected' : ''}>📝 MCQs Practice</option>
                                <option value="pdf" ${adminTopicTypeFilter === 'pdf' ? 'selected' : ''}>📄 PDF Material</option>
                            </select>
                        </div>
                    </div>

                    <div id="admin-subtopic-path-filter-box" style="display:${adminTopicScopeFilter === 'MAIN' ? 'none' : 'block'}; background:#121218; padding:16px; border-radius:12px; border:1px solid #2b2b36;">
                        <label class="admin-label" style="margin-bottom:10px;">3. Drill Down by Exam Category & Parent Folder</label>
                        <div id="admin-topic-filter-selectors" style="display:flex; gap:12px; flex-wrap:wrap;"></div>
                        <div style="margin-top:10px; font-size:12.5px; color:var(--text-muted);">
                            <b>Showing Folders Under:</b> <span id="admin-topic-filter-path-text" style="color:var(--primary-yellow); font-weight:700;">All Exam Categories</span>
                        </div>
                    </div>
                </div>

                <div class="admin-bulk-toolbar">
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="btn-exam" onclick="toggleSelectAllFilteredTopics(true)" style="background:#1c1c24; border:1px solid #444; padding:6px 12px; font-size:12px;">☑️ Select All Shown</button>
                        <button type="button" class="btn-exam" onclick="toggleSelectAllFilteredTopics(false)" style="background:#1c1c24; border:1px solid #444; padding:6px 12px; font-size:12px;">Clear</button>
                        <span id="adminBulkSelectedCount" style="font-size:13px; font-weight:700; color:var(--primary-yellow);">0 Folders Selected</span>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="btn-exam btn-yellow-glow" onclick="bulkInjectDifficultyToSelectedTopics()" style="padding:7px 14px; font-size:12px;">⚡ Add Difficulty Set (Easy/Med/Hard/Mixed) to Selected</button>
                        <button type="button" class="btn-exam" onclick="bulkDeleteSelectedTopics()" style="background:rgba(239,68,68,0.18); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.45); padding:7px 14px; font-size:12px;">🗑️ Delete Selected</button>
                    </div>
                </div>

                <div id="admin-topic-list-container"></div>
            </div>

            <!-- 4. SUBTOPIC SEARCH BARS MANAGER TAB -->
            <div id="admin-subtopic-search-view" style="display:${adminCurrentTab === 'subtopic-search' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 15px; margin-bottom: 20px;">
                        <div>
                            <h3 style="color:#38bdf8; margin:0; font-size:18px; display:flex; align-items:center; gap:10px;">🔍 Subtopic Search Bars Manager</h3>
                            <span style="font-size:12px; color:var(--text-muted);">Enable secondary search bars inside large folders (like Class 9–12 State/Board lists) so students can instantly find their state or board.</span>
                        </div>
                    </div>

                    <div class="admin-grid-2" style="margin-bottom: 20px;">
                        <div>
                            <label class="admin-label">1. Select Folder to Configure Search Bar</label>
                            <div id="admin-subsearch-pick-selectors" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;"></div>
                            <div style="font-size:13px; color:#38bdf8; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25); padding:10px 14px; border-radius:8px;">
                                <b>Selected Folder Path:</b> <span id="admin-subsearch-pick-text" style="color:#fff;">None selected</span>
                            </div>
                        </div>
                        <div>
                            <label class="admin-label">2. Search Bar Settings</label>
                            <div style="background:#121218; border:1px solid #2b2b36; padding:15px; border-radius:12px; display:flex; flex-direction:column; gap:12px;">
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13.5px; color:#fff; font-weight:600;">
                                    <input type="checkbox" id="subSearchToggleState" style="accent-color:#38bdf8; width:18px; height:18px; cursor:pointer;">
                                    <span>Enable Secondary Search Bar on this Folder</span>
                                </label>
                                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; color:#cbd5e1;">
                                    <input type="checkbox" id="subSearchIncludeChildrenToggle" style="accent-color:#38bdf8; width:16px; height:16px; cursor:pointer;">
                                    <span>Apply automatically to all subfolders inside this path</span>
                                </label>
                                <div>
                                    <label class="admin-label" style="font-size:11px; margin-bottom:4px;">Custom Placeholder Text (Optional)</label>
                                    <input type="text" id="subSearchPlaceholderInput" class="input-field" placeholder="e.g. Search State or Board (Assam, CBSE)..." style="margin-bottom:0; font-size:13px; padding:9px 12px;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
                        <button class="btn-exam btn-yellow-glow" onclick="saveSubtopicSearchConfigForSelectedPath()" style="background:#38bdf8 !important; color:#000 !important; border:none; padding:12px 24px; font-size:14px; font-weight:800;">💾 Save Search Bar Config</button>
                        <button class="btn-exam" onclick="disableSubtopicSearchForSelectedPath()" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.35); padding:12px 20px; font-size:14px;">🚫 Disable on Folder</button>
                    </div>
                </div>

                <div class="admin-panel-card">
                    <h3 class="admin-section-header">📋 Currently Active Subtopic Search Bars</h3>
                    <div id="admin-active-subsearch-list"></div>
                </div>
            </div>
            <!-- 5. MANUAL QUICK LINKS & ESSENTIAL PRACTICE MANAGER TAB -->
            <div id="admin-sidebar-links-view" style="display:${adminCurrentTab === 'sidebar-links' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color:rgba(168,85,247,0.4);">
                    <h3 class="admin-section-header" style="color:#c084fc;">🔗 Add Existing Topic / Subtopic to Home Sidebar</h3>
                    <label class="admin-label">1. Select Existing Topic or Subtopic Folder</label>
                    <div id="admin-sidebar-pick-selectors" style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px;"></div>
                    <div style="font-size:13px; color:var(--correct-green); background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); padding:10px 14px; border-radius:8px; margin-bottom:18px;">
                        <b>Selected Folder Path:</b> <span id="admin-sidebar-pick-text" style="color:#fff;">None selected</span>
                    </div>

                    <div class="admin-grid-2">
                        <div>
                            <label class="admin-label">2. Target Sidebar Section</label>
                            <select id="adminSidebarSectionType" class="input-field">
                                <option value="quickLinks">📚 Quick Links Section</option>
                                <option value="essentialPractice">⚡ Essential Practice Section</option>
                            </select>
                        </div>
                        <div>
                            <label class="admin-label">3. Display Title (Optional Override)</label>
                            <input type="text" id="adminSidebarCustomTitle" class="input-field" placeholder="Leave blank to use folder name">
                        </div>
                    </div>

                    <button class="btn-exam btn-yellow-glow" onclick="addTopicToSidebarSection()" style="padding:12px 24px; font-size:14px;">+ Add to Sidebar Section</button>
                </div>

                <div class="admin-grid-2">
                    <div class="admin-panel-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2b2b36; padding-bottom:12px; margin-bottom:16px;">
                            <h3 style="margin:0; font-size:16px; color:#c084fc;">📚 Active Quick Links</h3>
                            <button class="btn-exam" onclick="clearAllSidebarSection('quickLinks')" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.35); padding:5px 12px; font-size:11px;">🗑️ Delete All</button>
                        </div>
                        <div id="admin-quick-links-list"></div>
                    </div>

                    <div class="admin-panel-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #2b2b36; padding-bottom:12px; margin-bottom:16px;">
                            <h3 style="margin:0; font-size:16px; color:#38bdf8;">⚡ Active Essential Practice</h3>
                            <button class="btn-exam" onclick="clearAllSidebarSection('essentialPractice')" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.35); padding:5px 12px; font-size:11px;">🗑️ Delete Manual Links</button>
                        </div>
                        <div style="background:rgba(253,184,19,0.1); border:1px solid rgba(253,184,19,0.35); border-left:4px solid #fdb813; border-radius:10px; padding:12px 15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="font-weight:700; color:#fdb813; font-size:14px;">📅 Daily Quiz Challenge</div>
                                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Automatic System Hub — Auto-includes NEET, JEE, GK & all future exams</div>
                            </div>
                            <span style="font-size:10.5px; background:rgba(16,185,129,0.2); color:var(--correct-green); padding:4px 8px; border-radius:6px; font-weight:700;">AUTO ACTIVE</span>
                        </div>
                        <div id="admin-essential-practice-list"></div>
                    </div>
                </div>
            </div>

            <!-- 6. MANUAL CUSTOM PRACTICE MANAGER TAB -->
            <div id="admin-custom-practice-view" style="display:${adminCurrentTab === 'custom-practice' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color:rgba(253,184,19,0.4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #2b2b36; padding-bottom:15px; margin-bottom:20px;">
                        <div>
                            <h3 style="margin:0; font-size:18px; color:var(--primary-yellow);">🎯 Custom Practice — Subjects & Chapters Manager</h3>
                            <span style="font-size:12px; color:var(--text-muted);">Manually add or delete existing Subjects and Chapters for each Exam Category in Custom Practice.</span>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap;">
                            <button class="btn-exam" onclick="autoImportExamToCustomPractice()" style="background:rgba(16,185,129,0.15); color:var(--correct-green); border:1px solid rgba(16,185,129,0.4); padding:7px 14px; font-size:12px;">⚡ Auto-Import Existing Subjects & Chapters</button>
                            <button class="btn-exam" onclick="clearExamCustomPracticeConfig()" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.4); padding:7px 14px; font-size:12px;">🗑️ Delete All for Exam</button>
                        </div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <label class="admin-label">1. Select Exam Category to Configure</label>
                        <select id="adminCpExamSelect" class="input-field" style="max-width:360px; margin-bottom:0;" onchange="handleAdminCpExamChange(this.value)"></select>
                    </div>

                    <div class="admin-grid-2">
                        <div style="background:#121218; border:1px solid #2b2b36; border-radius:12px; padding:18px;">
                            <label class="admin-label" style="color:var(--primary-yellow);">2A. Add Existing Subject Folder</label>
                            <div id="admin-cp-subj-selectors" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;"></div>
                            <div style="font-size:12px; color:#ccc; margin-bottom:12px;"><b>Selected Subject Path:</b> <span id="admin-cp-subj-path-text" style="color:var(--primary-yellow);">None</span></div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                <button class="btn-exam btn-yellow-glow" onclick="addSubjectToCustomPractice(false)" style="padding:9px 16px; font-size:12.5px;">+ Add Subject Only</button>
                                <button class="btn-exam" onclick="addSubjectToCustomPractice(true)" style="background:rgba(253,184,19,0.15); color:var(--primary-yellow); border:1px solid var(--primary-yellow); padding:9px 16px; font-size:12.5px;">+ Add Subject & Its Chapters</button>
                            </div>
                        </div>

                        <div style="background:#121218; border:1px solid #2b2b36; border-radius:12px; padding:18px;">
                            <label class="admin-label" style="color:#38bdf8;">2B. Add Existing Chapter Under a Subject</label>
                            <label class="admin-label" style="margin-top:8px;">Target Subject in Custom Practice</label>
                            <select id="adminCpTargetSubjSelect" class="input-field" style="margin-bottom:12px;" onchange="handleAdminCpTargetSubjChange(this.value)"></select>

                            <label class="admin-label">Select Existing Chapter Folder</label>
                            <div id="admin-cp-chap-selectors" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;"></div>
                            <div style="font-size:12px; color:#ccc; margin-bottom:12px;"><b>Selected Chapter Path:</b> <span id="admin-cp-chap-path-text" style="color:#38bdf8;">None</span></div>
                            <button class="btn-exam" onclick="addChapterToCustomPractice()" style="background:#38bdf8; color:#000; border:none; padding:9px 18px; font-size:12.5px; font-weight:800; box-shadow:0 2px 10px rgba(56,189,248,0.3);">+ Add Chapter to Subject</button>
                        </div>
                    </div>
                </div>

                <div id="admin-cp-configured-list"></div>
            </div>

            <!-- 7. MANAGE CONTENT TAB -->
            <div id="admin-manage-view" style="display:${adminCurrentTab === 'manage' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <h3 class="admin-section-header">🔍 Filter & Fetch MCQs / PDFs</h3>
                    <div id="manage-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:16px;"></div>
                    <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
                        <select id="admManageTypeFilter" class="input-field" style="width:auto; min-width:200px; margin-bottom:0;" onchange="adminManageContentTypeFilter = this.value; loadContentForManagement(false);">
                            <option value="ALL" ${adminManageContentTypeFilter === 'ALL' ? 'selected' : ''}>📂 All Items (MCQs + PDFs)</option>
                            <option value="mcq" ${adminManageContentTypeFilter === 'mcq' ? 'selected' : ''}>📝 MCQs Only</option>
                            <option value="material" ${adminManageContentTypeFilter === 'material' ? 'selected' : ''}>📄 PDFs / Study Materials Only</option>
                        </select>
                        <button class="btn-exam btn-yellow-glow" onclick="loadContentForManagement(false)" style="padding:12px 24px; font-size:14px;">🔍 Fetch Content</button>
                    </div>
                </div>
                <div id="manage-content-list">
                    <p style="color:var(--text-muted); text-align: center; padding: 40px; border: 1px dashed #333; border-radius: 12px;">Select a folder above and click Fetch to load items.</p>
                </div>
            </div>

            <!-- 8. REPORTS TAB -->
            <div id="admin-reports-view" style="display:${adminCurrentTab === 'reports' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminReports()" style="margin-bottom:20px;">🔄 Refresh Reports</button>
                <div id="reports-list-container"></div>
            </div>

            <!-- 9. USERS TAB -->
            <div id="admin-users-view" style="display:${adminCurrentTab === 'users' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminUsers()" style="margin-bottom:20px;">🔄 Refresh Students List</button>
                <div id="users-table-container" class="admin-panel-card" style="overflow-x:auto; padding: 0;"></div>
            </div>

            <!-- 10. DOUBTS TAB -->
            <div id="admin-doubts-view" style="display:${adminCurrentTab === 'doubts' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminDoubts()" style="margin-bottom:20px;">🔄 Refresh Flagged Doubts</button>
                <div id="doubts-list-container"></div>
            </div>

            <!-- 11. SETTINGS TAB -->
            <div id="admin-settings-view" style="display:${adminCurrentTab === 'settings' ? 'block' : 'none'};">
                <div class="admin-grid-2">
                    <div class="admin-panel-card" style="margin-bottom: 0;">
                        <h3 class="admin-section-header">🔐 Admin Password</h3>
                        <label class="admin-label">New Password (Min 6 chars)</label>
                        <input type="password" id="newAdminPass" class="input-field">
                        <label class="admin-label">Confirm Password</label>
                        <input type="password" id="confirmAdminPass" class="input-field">
                        <button class="btn-exam btn-yellow-glow" onclick="changeAdminPassword()" style="width:100%; margin-top: 10px;">Update Password</button>
                    </div>

                    <div class="admin-panel-card" style="margin-bottom: 0; border-color: rgba(76, 175, 80, 0.4);">
                        <h3 class="admin-section-header" style="color:var(--correct-green); border-color: rgba(76, 175, 80, 0.2);">⚡ Database Scalability</h3>
                        <p style="color:var(--text-muted); font-size:13px; line-height:1.6; margin-bottom:25px;">
                            Batch indexes existing MCQs with <code>randomKey</code> attributes so the custom quiz engine can perform sub-second random selections at massive scale.
                        </p>
                        <button id="btnMigrateKeys" class="btn-exam btn-green-glow" onclick="runRandomKeyMigration()" style="width:100%;">Run Index Migration</button>
                    </div>
                </div>
            </div>
        </div>`;
        
    if (adminCurrentTab === 'upload') { _buildAdminSelectors(); }
    else if (adminCurrentTab === 'topics') { _buildAdminNewTopicSelectors(); updateLiveAutoIconPreview(); }
    else if (adminCurrentTab === 'edit-topics') { _buildAdminTopicFilterSelectors(); loadAdminTopicsList(); }
    else if (adminCurrentTab === 'subtopic-search') { initAdminSubtopicSearchTab(); }
    else if (adminCurrentTab === 'sidebar-links') { initAdminSidebarLinksTab(); }
    else if (adminCurrentTab === 'custom-practice') { initAdminCustomPracticeTab(); }
    else if (adminCurrentTab === 'manage') { _buildManageSelectors(); loadContentForManagement(false); }
    else if (adminCurrentTab === 'reports') loadAdminReports();
    else if (adminCurrentTab === 'users') loadAdminUsers();
    else if (adminCurrentTab === 'doubts') loadAdminDoubts();
}

function switchAdminTab(tab) { adminCurrentTab = tab; _renderAdminPanel(); }

function toggleAdminFormType() {
    let el = document.getElementById('admResourceType');
    if (!el) return;
    let val = el.value;
    const mcqForm = document.getElementById('admin-mcq-form');
    const pdfForm = document.getElementById('admin-pdf-form');
    if (mcqForm) mcqForm.style.display = val === 'mcq' ? 'block' : 'none';
    if (pdfForm) pdfForm.style.display = val === 'pdf' ? 'block' : 'none';
}

function autoFillPdfTitleFromFile(fileInput) {
    const titleInput = document.getElementById('admPdfTitle');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0 || !titleInput) return;
    if (fileInput.files.length === 1 && !titleInput.value.trim()) {
        let rawName = fileInput.files[0].name.replace(/\.[^/.]+$/, "");
        titleInput.value = rawName;
    }
}

function jumpToUploadedFolderLive() {
    if (!adminSelectedPath || adminSelectedPath.length === 0) {
        showNotification("⚠️ Select a target folder first.");
        return;
    }
    jumpToSection(adminSelectedPath);
}

function clearAdminUploadForm(isSmartClear = false) {
    if(!isSmartClear && !confirm("Are you sure you want to clear all typed fields?")) return;
    
    if (document.getElementById('admQuestion')) document.getElementById('admQuestion').value = ""; 
    if (document.getElementById('admQImage')) document.getElementById('admQImage').value = ""; 
    if (document.getElementById('admExplanation')) document.getElementById('admExplanation').value = "";
    if (document.getElementById('admOptA')) document.getElementById('admOptA').value = ""; 
    if (document.getElementById('admOptB')) document.getElementById('admOptB').value = ""; 
    if (document.getElementById('admOptC')) document.getElementById('admOptC').value = ""; 
    if (document.getElementById('admOptD')) document.getElementById('admOptD').value = "";
    if (document.getElementById('admSmartPasteInput')) document.getElementById('admSmartPasteInput').value = "";
    document.querySelectorAll('.admCorrectCb').forEach(cb => cb.checked = false); 
    if (document.getElementById('admPdfTitle')) document.getElementById('admPdfTitle').value = ""; 
    if (document.getElementById('admPdfFile')) document.getElementById('admPdfFile').value = ""; 
    if (document.getElementById('admPdfDirectUrl')) document.getElementById('admPdfDirectUrl').value = "";
    
    if(!isSmartClear) {
        if (document.getElementById('admDifficulty')) document.getElementById('admDifficulty').value = "Mixed";
        showNotification("🧹 Form cleared!");
    }
}

function getMergedChildKeysAtPath(pathArr) {
    let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
    let keys = new Set();

    let curr = appData;
    for (let seg of pathArr) {
        curr = (curr && typeof curr === 'object') ? curr[seg] : null;
    }
    if (curr && typeof curr === 'object' && !Array.isArray(curr)) {
        Object.keys(curr).forEach(k => {
            if (pathArr.length === 0 && k === "Daily Quiz Challenge") return;
            let full = pathArr.length > 0 ? `${pathArr.join(' > ')} > ${k}` : k;
            if (!deletedSet.has(full)) keys.add(k);
        });
    }

    let prefix = pathArr.length > 0 ? (pathArr.join(' > ') + ' > ') : '';
    Object.keys(customTopicTypes).forEach(dbKey => {
        if (deletedSet.has(dbKey)) return;
        if (pathArr.length === 0) {
            let root = dbKey.split(' > ')[0];
            if (root && root !== "Daily Quiz Challenge" && !deletedSet.has(root)) keys.add(root);
        } else if (dbKey.startsWith(prefix)) {
            let nextSeg = dbKey.slice(prefix.length).split(' > ')[0];
            let nextFull = prefix + nextSeg;
            if (nextSeg && !deletedSet.has(nextFull)) keys.add(nextSeg);
        }
    });

    return Array.from(keys).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function doesTopicPathExist(fullPathStr) {
    let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
    if (deletedSet.has(fullPathStr)) return false;
    if (customTopicTypes[fullPathStr]) return true;
    let parts = fullPathStr.split(' > ').filter(Boolean);
    let curr = appData;
    for (let p of parts) {
        if (!curr || typeof curr !== 'object' || curr[p] === undefined) return false;
        curr = curr[p];
    }
    return true;
}

// ==========================================
// UNIFIED TOPIC & SUBTOPIC FILTER, EDIT, DELETE & BULK ACTIONS
// ==========================================
function inferTopicType(fullPath, name, hasChildren) {
    const meta = customTopicTypes[fullPath];
    if (meta && meta.type) return meta.type;
    if (hasChildren) return 'both';
    const lower = (name || '').toLowerCase();
    const pdfTags = ['ncert', 'book', 'pyq', 'previous', 'pdf', 'note', 'material', 'syllabus'];
    if (pdfTags.some(t => lower.includes(t)) && !lower.includes('mcq') && !lower.includes('practice')) {
        return 'pdf';
    }
    return 'mcq';
}

function _buildAdminTopicFilterSelectors() {
    const box = document.getElementById('admin-topic-filter-selectors');
    if (!box) return;

    let markup = '';
    for (let depth = 0; depth <= adminTopicFilterPath.length; depth++) {
        const slice = adminTopicFilterPath.slice(0, depth);
        const childKeys = getMergedChildKeysAtPath(slice);
        if (!childKeys.length) break;

        const label = depth === 0
            ? '-- All Exam Categories --'
            : `-- All Subfolders Under ${adminTopicFilterPath[depth - 1].replace(/^\d+\.\s*/, '')} --`;

        markup += `<select class="input-field" style="flex:1; min-width:180px; margin-bottom:0;" onchange="handleAdminTopicFilterPathChange(event, ${depth})">`;
        markup += `<option value="" ${!adminTopicFilterPath[depth] ? 'selected' : ''}>${label}</option>`;
        childKeys.forEach(k => {
            const sel = adminTopicFilterPath[depth] === k ? 'selected' : '';
            markup += `<option value="${k.replace(/"/g, '&quot;')}" ${sel}>${k}</option>`;
        });
        markup += `</select>`;

        if (!adminTopicFilterPath[depth]) break;
    }
    box.innerHTML = markup;

    const summaryEl = document.getElementById('admin-topic-filter-path-text');
    if (summaryEl) {
        summaryEl.innerText = adminTopicFilterPath.length ? adminTopicFilterPath.join(' > ') : 'All Exam Categories';
    }
}

function handleAdminTopicFilterPathChange(event, depth) {
    const chosen = event.target.value;
    adminTopicFilterPath = adminTopicFilterPath.slice(0, depth);
    if (chosen !== '') adminTopicFilterPath.push(chosen);
    _buildAdminTopicFilterSelectors();
    filterAdminTopics();
}

function setAdminTopicScope(scopeVal) {
    adminTopicScopeFilter = scopeVal;
    _renderAdminPanel();
}

function handleAdminTopicTypeChange(typeVal) {
    adminTopicTypeFilter = typeVal;
    filterAdminTopics();
}

function resetAdminTopicFilters() {
    adminTopicFilterPath = [];
    adminTopicScopeFilter = 'ALL';
    adminTopicTypeFilter = 'ALL';
    adminBulkSelectedPaths.clear();
    _renderAdminPanel();
}

async function loadAdminTopicsList() {
    const holder = document.getElementById('admin-topic-list-container');
    if (!holder) return;
    holder.innerHTML = `<p style="color:#777; text-align:center; padding:25px;">Loading all topics and subtopics...</p>`;

    try {
        await loadCustomTopics();
        const topicMap = new Map();
        const removedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);

        const walkTree = (node, trail = []) => {
            if (!node || typeof node !== 'object') return;
            Object.keys(node).forEach(k => {
                if (trail.length === 0 && k === 'Daily Quiz Challenge') return;
                const nextTrail = [...trail, k];
                const fullKey = nextTrail.join(' > ');
                if (removedSet.has(fullKey)) return;

                const parentStr = trail.join(' > ');
                const subNode = node[k];
                const hasSub = subNode && typeof subNode === 'object' && Object.keys(subNode).length > 0;
                const info = customTopicTypes[fullKey] || {};
                const shownTitle = info.displayName || k;

                topicMap.set(fullKey, {
                    fullPath: fullKey,
                    parentPath: parentStr,
                    name: shownTitle,
                    rawKey: k,
                    type: inferTopicType(fullKey, shownTitle, hasSub),
                    icon: info.icon || null,
                    docId: info.docId || null
                });

                if (hasSub) walkTree(subNode, nextTrail);
            });
        };
        walkTree(appData, []);

        const snap = await db.collection('custom_topics').get();
        snap.forEach(doc => {
            const d = doc.data();
            const pStr = (d.parentPath || '').trim();
            const fKey = pStr ? `${pStr} > ${d.name}` : d.name;
            if (removedSet.has(fKey)) return;

            const prev = topicMap.get(fKey);
            topicMap.set(fKey, {
                fullPath: fKey,
                parentPath: pStr,
                name: (prev && prev.name) || d.name,
                rawKey: d.name,
                type: d.type || (prev ? prev.type : 'both'),
                icon: d.icon || (prev ? prev.icon : null),
                docId: doc.id
            });
        });

        unifiedAdminTopics = Array.from(topicMap.values()).sort((a, b) => {
            const cmp = (a.parentPath || '').localeCompare(b.parentPath || '', undefined, { numeric: true, sensitivity: 'base' });
            return cmp !== 0 ? cmp : (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
        });

        _buildAdminTopicFilterSelectors();
        filterAdminTopics();
    } catch (err) {
        holder.innerHTML = `<p style="color:var(--wrong-red);">Error loading topics: ${err.message}</p>`;
    }
}

let currentFilteredAdminTopics = [];
function filterAdminTopics() {
    const prefix = adminTopicFilterPath.join(' > ');
    currentFilteredAdminTopics = unifiedAdminTopics.filter(item => {
        const isRoot = !item.parentPath;
        if (adminTopicScopeFilter === 'MAIN' && !isRoot) return false;
        if (adminTopicScopeFilter === 'SUB' && isRoot) return false;
        if (adminTopicTypeFilter !== 'ALL' && item.type !== adminTopicTypeFilter) return false;

        if (prefix && adminTopicScopeFilter !== 'MAIN') {
            if (isRoot) return item.rawKey === adminTopicFilterPath[0];
            return item.parentPath === prefix || item.parentPath.startsWith(prefix + ' > ') || item.fullPath === prefix;
        }
        return true;
    });

    renderAdminTopicsList(currentFilteredAdminTopics);
    updateAdminBulkSelectedCounter();
}

function updateAdminBulkSelectedCounter() {
    const badge = document.getElementById('adminBulkSelectedCount');
    if (badge) badge.innerText = `${adminBulkSelectedPaths.size} Folder${adminBulkSelectedPaths.size === 1 ? '' : 's'} Selected`;
}

function toggleAdminBulkTopicSelect(fullPath, checked) {
    if (checked) adminBulkSelectedPaths.add(fullPath);
    else adminBulkSelectedPaths.delete(fullPath);
    updateAdminBulkSelectedCounter();
}

function toggleSelectAllFilteredTopics(selectAll) {
    if (selectAll) currentFilteredAdminTopics.forEach(t => adminBulkSelectedPaths.add(t.fullPath));
    else adminBulkSelectedPaths.clear();
    renderAdminTopicsList(currentFilteredAdminTopics);
    updateAdminBulkSelectedCounter();
}

async function bulkInjectDifficultyToSelectedTopics() {
    if (!adminBulkSelectedPaths.size) return showNotification('⚠️ Select at least one folder first.');
    const levels = ['Easy', 'Medium', 'Hard', 'Mixed'];
    const targets = Array.from(adminBulkSelectedPaths);
    if (!confirm(`Add Easy, Medium, Hard, Mixed inside ${targets.length} selected folder(s)?`)) return;

    try {
        const pending = [];
        targets.forEach(pPath => {
            levels.forEach(lvl => {
                const combined = `${pPath} > ${lvl}`;
                if (!doesTopicPathExist(combined)) {
                    const ic = typeof getAutomaticIconForName === 'function' ? getAutomaticIconForName(lvl, 'mcq', pPath) : '📝';
                    pending.push({ parentPath: pPath, name: lvl, type: 'mcq', icon: ic });
                }
            });
        });

        for (let i = 0; i < pending.length; i += 400) {
            const batch = db.batch();
            pending.slice(i, i + 400).forEach(entry => {
                batch.set(db.collection('custom_topics').doc(), {
                    ...entry,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        showNotification(`✅ Added ${pending.length} difficulty folder(s)!`);
        adminBulkSelectedPaths.clear();
        await loadAdminTopicsList();
    } catch (e) {
        showNotification('❌ Bulk error: ' + e.message);
    }
}

async function bulkDeleteSelectedTopics() {
    if (!adminBulkSelectedPaths.size) return showNotification('⚠️ Select at least one folder first.');
    const targets = Array.from(adminBulkSelectedPaths);
    if (!confirm(`Delete ${targets.length} selected folder(s)?`)) return;

    try {
        const snap = await db.collection('custom_topics').get();
        const batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            const d = doc.data();
            const p = (d.parentPath || '').trim();
            const f = p ? `${p} > ${d.name}` : d.name;
            if (targets.some(t => f === t || p === t || p.startsWith(t + ' > '))) {
                batch.delete(doc.ref);
                count++;
            }
        });
        if (count > 0) await batch.commit();

        topicOverrides.deletedPaths = Array.from(new Set([...(topicOverrides.deletedPaths || []), ...targets]));
        await db.collection('settings').doc('topic_overrides').set(topicOverrides, { merge: true });

        adminBulkSelectedPaths.clear();
        showNotification(`🗑️ Deleted ${targets.length} folder(s)!`);
        await loadAdminTopicsList();
    } catch (e) {
        showNotification('❌ Delete error: ' + e.message);
    }
}

function buildAdminTopicCardHtml(item, idx, usedIconsSet = null, usedColorsSet = null) {
    const idToken = item.docId ? `doc:${item.docId}` : `builtin:${item.fullPath}`;
    const escId = idToken.replace(/'/g, "\\'");
    const escPath = item.fullPath.replace(/'/g, "\\'");
    const escName = (item.name || '').replace(/'/g, "\\'");
    const escIcon = item.icon ? item.icon.replace(/'/g, "\\'") : '';
    const badge = item.type === 'both' ? 'PARENT CATEGORY' : (item.type || 'mcq').toUpperCase();
    const pText = item.parentPath || 'Root (Main Menu)';
    const checked = adminBulkSelectedPaths.has(item.fullPath);
    const th = typeof getAutoTopicTheme === 'function'
        ? getAutoTopicTheme(item.name || '', item.icon, idx, usedColorsSet, '📁', usedIconsSet, item.fullPath)
        : { i: item.icon || '📁', c: '#fdb813' };

    const cfgMap = (window.subtopicSearchConfig && window.subtopicSearchConfig.enabledPaths) || {};
    const searchEntry = cfgMap[item.fullPath];
    const isSearchOn = searchEntry && (searchEntry === true || searchEntry.enabled !== false);

    return `
    <div style="background:#1c1c24; border:1px solid ${checked ? '#fdb813' : '#2b2b36'}; border-left:4px solid ${th.c}; border-radius:12px; padding:14px 18px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
        <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:220px;">
            <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleAdminBulkTopicSelect('${escPath}', this.checked)" style="accent-color:#fdb813; width:18px; height:18px; cursor:pointer;">
            <div>
                <span style="color:var(--text-muted); font-size:12px; display:block; margin-bottom:4px;">Path: ${pText}</span>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <b style="font-size:15.5px; color:#fff;">${th.i} ${item.name}</b>
                    <span style="font-size:10.5px; background:#2b2b36; color:#ccc; padding:3px 9px; border-radius:6px; font-weight:700;">${badge}</span>
                </div>
            </div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button onclick="quickToggleSubtopicSearchOnCard('${escPath}')" style="background:${isSearchOn ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)'}; border:1px solid ${isSearchOn ? '#10b981' : '#3b3b48'}; color:${isSearchOn ? '#10b981' : '#94a3b8'}; padding:8px 13px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px;" title="Toggle Secondary Search Bar inside this folder">🔍 Search: ${isSearchOn ? 'ON' : 'OFF'}</button>
            <button onclick="openEditTopicModal('${escId}', '${escName}', '${item.type}', '${escIcon}', '${escPath}')" style="background:rgba(33,150,243,0.15); border:1px solid rgba(33,150,243,0.4); color:#38bdf8; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">Edit</button>
            <button onclick="deleteUnifiedTopic('${escId}', '${escPath}')" style="background:rgba(244,67,54,0.15); border:1px solid rgba(244,67,54,0.4); color:var(--wrong-red); padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">Delete</button>
        </div>
    </div>`;
}

function renderAdminTopicsList(list) {
    const holder = document.getElementById('admin-topic-list-container');
    if (!holder) return;
    if (!list.length) {
        holder.innerHTML = `<div class="admin-panel-card" style="text-align:center; color:#888; padding:35px;">No folders match the selected filters.</div>`;
        return;
    }

    const mains = list.filter(t => !t.parentPath);
    const subs = list.filter(t => Boolean(t.parentPath));
    let out = '';

    if (adminTopicScopeFilter !== 'SUB' && mains.length) {
        let usedMainIcons = new Set();
        let usedMainColors = new Set();
        out += `<div class="admin-topic-group-header"><span>🌟 Main Topics</span><span class="admin-topic-group-count">${mains.length}</span></div>`;
        mains.forEach((d, i) => { out += buildAdminTopicCardHtml(d, i, usedMainIcons, usedMainColors); });
    }
    if (adminTopicScopeFilter !== 'MAIN' && subs.length) {
        let lastParent = null;
        let usedSubIcons = new Set();
        let usedSubColors = new Set();
        out += `<div class="admin-topic-group-header" style="border-left-color:#38bdf8; background:rgba(56,189,248,0.08); border-color:rgba(56,189,248,0.25);"><span>📂 Subtopics & Chapters</span><span class="admin-topic-group-count" style="color:#38bdf8;">${subs.length}</span></div>`;
        subs.forEach((d, i) => {
            if (d.parentPath !== lastParent) {
                usedSubIcons = new Set();
                usedSubColors = new Set();
                lastParent = d.parentPath;
            }
            out += buildAdminTopicCardHtml(d, i + 4, usedSubIcons, usedSubColors);
        });
    }
    holder.innerHTML = out;
}

let activeEditFullPath = '';

function updateEditModalIconHelperUI() {
    const nameEl = document.getElementById('editTopicName');
    const typeEl = document.getElementById('editTopicType');
    const iconEl = document.getElementById('editTopicIcon');
    const badgeEl = document.getElementById('editModalLiveIconBadge');
    const statusEl = document.getElementById('editModalLiveIconStatus');
    if (!iconEl || !badgeEl || !statusEl) return;

    const folderName = (nameEl ? nameEl.value.trim() : '') || 'Folder';
    const folderType = typeEl ? typeEl.value : 'both';
    const rawIcon = iconEl.value.trim();

    if (rawIcon.toUpperCase() === 'NONE') {
        badgeEl.innerText = '🚫';
        badgeEl.style.opacity = '0.5';
        statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">🚫 No Icon</span> (This folder will display without any icon)`;
    } else if (rawIcon) {
        badgeEl.innerText = rawIcon;
        badgeEl.style.opacity = '1';
        statusEl.innerHTML = `<span style="color:#10b981; font-weight:700;">✍️ Manual Icon: ${rawIcon}</span> (Overrides auto icon)`;
    } else {
        const autoIc = typeof getAutomaticIconForName === 'function'
            ? getAutomaticIconForName(folderName, folderType, activeEditFullPath)
            : '📘';
        badgeEl.innerText = autoIc;
        badgeEl.style.opacity = '1';
        statusEl.innerHTML = `<span style="color:#38bdf8; font-weight:700;">✨ Auto Icon: ${autoIc}</span> (Matched from folder name)`;
    }
}

function setEditModalIconAction(action) {
    const nameEl = document.getElementById('editTopicName');
    const typeEl = document.getElementById('editTopicType');
    const iconEl = document.getElementById('editTopicIcon');
    if (!iconEl) return;

    if (action === 'AUTO') {
        const folderName = (nameEl ? nameEl.value.trim() : '') || 'Folder';
        const folderType = typeEl ? typeEl.value : 'both';
        iconEl.value = typeof getAutomaticIconForName === 'function'
            ? getAutomaticIconForName(folderName, folderType, activeEditFullPath)
            : '📘';
    } else if (action === 'NONE') {
        iconEl.value = 'NONE';
    }
    updateEditModalIconHelperUI();
}

function openEditTopicModal(idToken, name, type, icon = '', fullPath = '') {
    activeEditFullPath = fullPath;
    document.getElementById('editTopicId').value = idToken;
    const nameEl = document.getElementById('editTopicName');
    const typeEl = document.getElementById('editTopicType');
    const iconEl = document.getElementById('editTopicIcon');

    if (nameEl) {
        nameEl.value = name;
        nameEl.oninput = updateEditModalIconHelperUI;
    }
    if (typeEl) {
        typeEl.value = type || 'both';
        typeEl.onchange = updateEditModalIconHelperUI;
    }
    if (iconEl) {
        iconEl.removeAttribute('maxlength');
        iconEl.setAttribute('maxlength', '16');
        iconEl.placeholder = 'Paste any icon/emoji here, or click Auto / Delete Icon below';
        iconEl.value = icon || '';
        iconEl.oninput = updateEditModalIconHelperUI;

        if (!document.getElementById('editModalIconControlBar')) {
            const bar = document.createElement('div');
            bar.id = 'editModalIconControlBar';
            bar.style.cssText = 'background:#111522; border:1px solid #2b354f; border-radius:10px; padding:10px 12px; margin-bottom:14px;';
            bar.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div id="editModalLiveIconBadge" style="width:36px; height:36px; border-radius:8px; background:rgba(253,184,19,0.15); border:1px solid rgba(253,184,19,0.5); display:flex; align-items:center; justify-content:center; font-size:19px;">📘</div>
                        <div id="editModalLiveIconStatus" style="font-size:12px; color:#cbd5e1;"></div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="setEditModalIconAction('AUTO')" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700; cursor:pointer;">✨ Auto Icon</button>
                        <button type="button" onclick="setEditModalIconAction('NONE')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); border-radius:6px; padding:6px 10px; font-size:11.5px; font-weight:700; cursor:pointer;">🚫 Delete Icon (No Icon)</button>
                    </div>
                </div>
            `;
            iconEl.parentNode.insertBefore(bar, iconEl.nextSibling);
        }
    }

    updateEditModalIconHelperUI();
    document.getElementById('editTopicModal').style.display = 'flex';
}

function closeEditTopicModal() {
    document.getElementById('editTopicModal').style.display = 'none';
}

async function saveEditedTopic() {
    const idToken = document.getElementById('editTopicId').value;
    const name = document.getElementById('editTopicName').value.trim();
    const type = document.getElementById('editTopicType').value;
    let rawIcon = document.getElementById('editTopicIcon').value.trim();
    if (!name) return alert('Folder name is required.');

    let finalIcon;
    if (rawIcon.toUpperCase() === 'NONE') {
        finalIcon = 'NONE';
    } else if (rawIcon) {
        finalIcon = rawIcon;
    } else {
        finalIcon = typeof getAutomaticIconForName === 'function'
            ? getAutomaticIconForName(name, type, activeEditFullPath)
            : '📘';
    }

    try {
        if (idToken.startsWith('doc:')) {
            await db.collection('custom_topics').doc(idToken.slice(4)).update({ name, type, icon: finalIcon });
        }
        if (activeEditFullPath) {
            topicOverrides.editedPaths = topicOverrides.editedPaths || {};
            topicOverrides.editedPaths[activeEditFullPath] = { displayName: name, type, icon: finalIcon };
            await db.collection('settings').doc('topic_overrides').set(topicOverrides, { merge: true });
        }
        closeEditTopicModal();
        showNotification(finalIcon === 'NONE' ? '✅ Saved without icon!' : `✅ Folder updated (${finalIcon})!`);
        await loadAdminTopicsList();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteUnifiedTopic(idToken, fullPath) {
    if (!confirm(`Delete "${fullPath}" from the menu?`)) return;
    try {
        if (idToken.startsWith('doc:')) {
            await db.collection('custom_topics').doc(idToken.slice(4)).delete();
        }
        const snap = await db.collection('custom_topics').get();
        const batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            const d = doc.data();
            const p = (d.parentPath || '').trim();
            const f = p ? `${p} > ${d.name}` : d.name;
            if (f === fullPath || p === fullPath || p.startsWith(fullPath + ' > ')) {
                batch.delete(doc.ref);
                count++;
            }
        });
        if (count > 0) await batch.commit();

        topicOverrides.deletedPaths = Array.from(new Set([...(topicOverrides.deletedPaths || []), fullPath]));
        await db.collection('settings').doc('topic_overrides').set(topicOverrides, { merge: true });
        adminBulkSelectedPaths.delete(fullPath);
        showNotification('🗑️ Topic deleted!');
        await loadAdminTopicsList();
    } catch (e) {
        showNotification('❌ Delete error: ' + e.message);
    }
}

// ==========================================
// SIDEBAR & CUSTOM PRACTICE MANAGERS
// ==========================================
function initAdminSidebarLinksTab() {
    _buildAdminSidebarPickSelectors();
    renderAdminSidebarConfigLists();
}

function _buildAdminSidebarPickSelectors() {
    const box = document.getElementById('admin-sidebar-pick-selectors');
    if (!box) return;
    let html = '';
    for (let i = 0; i <= adminSidebarPickPath.length; i++) {
        const keys = getMergedChildKeysAtPath(adminSidebarPickPath.slice(0, i));
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:170px; margin-bottom:0;" onchange="handleAdminSidebarPickChange(event, ${i})">`;
        html += `<option value="" ${!adminSidebarPickPath[i] ? 'selected' : ''}>${i === 0 ? '-- Select Main Topic --' : '-- Stop Here / Select Subtopic --'}</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminSidebarPickPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminSidebarPickPath[i]) break;
    }
    box.innerHTML = html;
    const txt = document.getElementById('admin-sidebar-pick-text');
    if (txt) txt.innerText = adminSidebarPickPath.length ? adminSidebarPickPath.join(' > ') : 'None selected';
}

function handleAdminSidebarPickChange(event, depth) {
    adminSidebarPickPath = adminSidebarPickPath.slice(0, depth);
    if (event.target.value !== '') adminSidebarPickPath.push(event.target.value);
    _buildAdminSidebarPickSelectors();
}

async function addTopicToSidebarSection() {
    if (!adminSidebarPickPath.length) return showNotification('⚠️ Select a folder first.');
    const sec = document.getElementById('adminSidebarSectionType').value;
    const customInput = document.getElementById('adminSidebarCustomTitle');
    const fullPath = adminSidebarPickPath.join(' > ');
    const leaf = adminSidebarPickPath[adminSidebarPickPath.length - 1].replace(/^\d+\.\s*/, '');
    const defaultTitle = adminSidebarPickPath.length > 1 ? `${leaf} (${adminSidebarPickPath[0].replace(/^\d+\.\s*/, '')})` : leaf;
    const title = (customInput && customInput.value.trim()) ? customInput.value.trim() : defaultTitle;

    const list = window.sidebarConfig[sec] || [];
    if (list.some(x => x.path === fullPath)) return showNotification('⚠️ Already in that section.');
    list.push({ id: 'sb_' + Date.now(), title, path: fullPath });
    window.sidebarConfig[sec] = list;

    await db.collection('settings').doc('sidebar_config').set(window.sidebarConfig, { merge: true });
    if (customInput) customInput.value = '';
    showNotification('✅ Added to Sidebar!');
    renderAdminSidebarConfigLists();
    if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
}

async function removeSidebarConfigItem(sec, itemId) {
    window.sidebarConfig[sec] = (window.sidebarConfig[sec] || []).filter(x => x.id !== itemId);
    await db.collection('settings').doc('sidebar_config').set(window.sidebarConfig, { merge: true });
    showNotification('🗑️ Removed!');
    renderAdminSidebarConfigLists();
    if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
}

async function clearAllSidebarSection(sec) {
    if (!confirm('Delete all manual items in this section?')) return;
    window.sidebarConfig[sec] = [];
    await db.collection('settings').doc('sidebar_config').set(window.sidebarConfig, { merge: true });
    renderAdminSidebarConfigLists();
    if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
}

function renderAdminSidebarConfigLists() {
    const qEl = document.getElementById('admin-quick-links-list');
    const eEl = document.getElementById('admin-essential-practice-list');
    if (!qEl || !eEl) return;

    const draw = (arr, sec, col) => {
        if (!arr || !arr.length) return `<p style="color:#777; font-size:13px; text-align:center; padding:18px; border:1px dashed #2b2b36; border-radius:10px; margin:0;">No manual links added.</p>`;
        let usedIcons = new Set();
        let usedColors = new Set();
        return arr.map((it, idx) => {
            const th = typeof getAutoTopicTheme === 'function' ? getAutoTopicTheme(it.title, null, idx, usedColors, '📂', usedIcons, it.path) : { i: '📂', c: col };
            return `<div style="background:#1c1c24; border:1px solid #2b2b36; border-left:4px solid ${th.c}; border-radius:10px; padding:12px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <div><div style="font-weight:700; color:#fff; font-size:14px;">${th.i} ${it.title}</div><div style="font-size:11px; color:var(--text-muted);">${it.path}</div></div>
                <button onclick="removeSidebarConfigItem('${sec}', '${it.id}')" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:var(--wrong-red); padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">Delete</button>
            </div>`;
        }).join('');
    };
    qEl.innerHTML = draw(window.sidebarConfig.quickLinks, 'quickLinks', '#a855f7');
    eEl.innerHTML = draw(window.sidebarConfig.essentialPractice, 'essentialPractice', '#38bdf8');
}

function getAllCandidateSubjectsForExam(examKey) {
    if (!examKey) return [];
    const map = new Map();
    (window.customPracticeConfig?.exams?.[examKey]?.subjects || []).forEach(s => {
        map.set(s.path, { path: s.path, label: (s.label || s.path.split(' > ').pop()).replace(/^\d+\.\s*/, '') });
    });
    if (typeof buildCwCatalogForExam === 'function') {
        buildCwCatalogForExam(examKey, true).forEach(s => {
            if (!map.has(s.fullPath)) map.set(s.fullPath, { path: s.fullPath, label: s.label });
        });
    }
    getMergedChildKeysAtPath([examKey]).forEach(k => {
        if (k === 'MCQs Practice' || k === 'Mock Test') {
            getMergedChildKeysAtPath([examKey, k]).forEach(sc => {
                const f = `${examKey} > ${k} > ${sc}`;
                if (!map.has(f)) map.set(f, { path: f, label: sc.replace(/^\d+\.\s*/, '') });
            });
        } else {
            const f = `${examKey} > ${k}`;
            if (!map.has(f)) map.set(f, { path: f, label: k.replace(/^\d+\.\s*/, '') });
        }
    });
    return Array.from(map.values());
}

async function toggleExamInCustomPractice(examKey, removeExam) {
    window.customPracticeConfig = window.customPracticeConfig || { exams: {}, excludedExams: [] };
    let excluded = new Set(Array.isArray(window.customPracticeConfig.excludedExams) ? window.customPracticeConfig.excludedExams : []);
    if (removeExam) {
        if (!confirm(`Remove "${examKey.replace(/^\d+\.\s*/, '')}" from Custom Practice Setup? (It will stay on the Home page, just hidden from Custom Practice)`)) return;
        excluded.add(examKey);
    } else {
        excluded.delete(examKey);
    }
    window.customPracticeConfig.excludedExams = Array.from(excluded);
    await saveAdminCustomPracticeConfig();
    showNotification(removeExam ? `🗑️ Removed "${examKey}" from Custom Practice!` : `✅ Restored "${examKey}" to Custom Practice!`);
    initAdminCustomPracticeTab();
}

function initAdminCustomPracticeTab() {
    const sel = document.getElementById('adminCpExamSelect');
    if (!sel) return;
    window.customPracticeConfig = window.customPracticeConfig || { exams: {}, excludedExams: [] };
    const excludedSet = new Set(Array.isArray(window.customPracticeConfig.excludedExams) ? window.customPracticeConfig.excludedExams : []);
    const allExams = getMergedChildKeysAtPath([]);
    const activeExams = allExams.filter(k => !excludedSet.has(k));
    const removedExams = allExams.filter(k => excludedSet.has(k));

    if (!adminCpSelectedExam || !activeExams.includes(adminCpSelectedExam)) {
        adminCpSelectedExam = activeExams[0] || '';
    }

    sel.innerHTML = activeExams.length
        ? activeExams.map(k => `<option value="${k.replace(/"/g, '&quot;')}" ${k === adminCpSelectedExam ? 'selected' : ''}>${k.replace(/^\d+\.\s*/, '')}</option>`).join('')
        : `<option value="">-- No Active Exams in Custom Practice --</option>`;

    // Inject a clean Exam Category Manager Bar right next to the dropdown so Admin can delete "Board" (or any exam) from Custom Practice in 1 click!
    let examMgrBar = document.getElementById('adminCpExamCategoryControlBar');
    if (!examMgrBar) {
        examMgrBar = document.createElement('div');
        examMgrBar.id = 'adminCpExamCategoryControlBar';
        examMgrBar.style.marginTop = '12px';
        sel.parentNode.appendChild(examMgrBar);
    }

    let activeChips = activeExams.map(k => {
        let esc = k.replace(/'/g, "\\'");
        let clean = k.replace(/^\d+\.\s*/, '');
        let isCur = k === adminCpSelectedExam;
        return `<div style="display:inline-flex; align-items:center; gap:8px; background:${isCur ? 'rgba(253,184,19,0.16)' : '#181c2a'}; border:1px solid ${isCur ? '#fdb813' : '#2b354f'}; padding:6px 12px; border-radius:20px; font-size:12.5px; font-weight:700; color:#fff;">
            <span style="cursor:pointer;" onclick="handleAdminCpExamChange('${esc}')">${clean}</span>
            <button type="button" onclick="toggleExamInCustomPractice('${esc}', true)" title="Remove ${clean} from Custom Practice" style="background:rgba(239,68,68,0.2); border:none; color:#ef4444; border-radius:50%; width:20px; height:20px; cursor:pointer; font-weight:bold; font-size:11px;">✕</button>
        </div>`;
    }).join('');

    let removedChips = removedExams.map(k => {
        let esc = k.replace(/'/g, "\\'");
        let clean = k.replace(/^\d+\.\s*/, '');
        return `<button type="button" onclick="toggleExamInCustomPractice('${esc}', false)" style="background:rgba(16,185,129,0.12); border:1px dashed rgba(16,185,129,0.45); color:#10b981; padding:5px 11px; border-radius:20px; font-size:11.5px; font-weight:700; cursor:pointer;">+ Restore ${clean}</button>`;
    }).join('');

    examMgrBar.innerHTML = `
        <div style="background:#111522; border:1px solid #2b354f; border-radius:12px; padding:12px 15px;">
            <div style="font-size:11.5px; color:#94a3b8; font-weight:700; margin-bottom:8px; text-transform:uppercase;">Active Exam Categories in Custom Practice (Click ✕ to remove an exam like "Board"):</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                ${activeChips || '<span style="color:#888; font-size:12px;">None active</span>'}
                ${removedChips}
            </div>
        </div>
    `;

    // If current exam hasn't been saved in customPracticeConfig yet, auto-populate its subjects once so you can see & delete individual subjects immediately!
    if (adminCpSelectedExam && (!window.customPracticeConfig.exams || !window.customPracticeConfig.exams[adminCpSelectedExam])) {
        const scanned = typeof buildCwCatalogForExam === 'function' ? buildCwCatalogForExam(adminCpSelectedExam, true) : [];
        if (scanned.length > 0) {
            window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
            window.customPracticeConfig.exams[adminCpSelectedExam] = {
                subjects: scanned.map(s => ({
                    path: s.fullPath,
                    label: s.label,
                    chapters: (s.chapters || []).map(c => ({ path: c.fullPath, label: c.label }))
                }))
            };
        }
    }

    adminCpSubjectPickPath = [];
    adminCpChapterPickPath = [];
    _buildAdminCpSubjectPickSelectors();
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

function handleAdminCpExamChange(examKey) {
    adminCpSelectedExam = examKey;
    const sel = document.getElementById('adminCpExamSelect');
    if (sel) sel.value = examKey;
    initAdminCustomPracticeTab();
}

function _buildAdminCpSubjectPickSelectors() {
    const box = document.getElementById('admin-cp-subj-selectors');
    const txt = document.getElementById('admin-cp-subj-path-text');
    if (!box) return;
    if (!adminCpSelectedExam) {
        box.innerHTML = `<span style="color:#888; font-size:12px;">Select or restore an exam above first.</span>`;
        return;
    }
    let html = '';
    for (let i = 0; i <= adminCpSubjectPickPath.length; i++) {
        const keys = getMergedChildKeysAtPath([adminCpSelectedExam, ...adminCpSubjectPickPath.slice(0, i)]);
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminCpSubjPickChange(event, ${i})">`;
        html += `<option value="" ${!adminCpSubjectPickPath[i] ? 'selected' : ''}>-- Select Folder --</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminCpSubjectPickPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminCpSubjectPickPath[i]) break;
    }
    box.innerHTML = html || `<span style="color:#f59e0b; font-size:12px;">No subfolders under ${adminCpSelectedExam} yet.</span>`;
    if (txt) txt.innerText = adminCpSubjectPickPath.length ? `${adminCpSelectedExam} > ${adminCpSubjectPickPath.join(' > ')}` : 'None';
}

function handleAdminCpSubjPickChange(event, depth) {
    adminCpSubjectPickPath = adminCpSubjectPickPath.slice(0, depth);
    if (event.target.value !== '') adminCpSubjectPickPath.push(event.target.value);
    _buildAdminCpSubjectPickSelectors();
}

function _syncAdminCpTargetSubjectDropdown() {
    const sel = document.getElementById('adminCpTargetSubjSelect');
    if (!sel) return;
    const configured = window.customPracticeConfig?.exams?.[adminCpSelectedExam]?.subjects || [];
    const cands = configured.length > 0 ? configured : getAllCandidateSubjectsForExam(adminCpSelectedExam);
    if (!cands.length) {
        adminCpTargetSubjectPath = '';
        sel.innerHTML = `<option value="">-- No Subjects Yet --</option>`;
        return;
    }
    if (!adminCpTargetSubjectPath || !cands.some(s => s.path === adminCpTargetSubjectPath)) {
        adminCpTargetSubjectPath = cands[0].path;
    }
    sel.innerHTML = cands.map(s => `<option value="${s.path.replace(/"/g, '&quot;')}" ${s.path === adminCpTargetSubjectPath ? 'selected' : ''}>📘 ${s.label} (${s.path})</option>`).join('');
}

function handleAdminCpTargetSubjChange(subjPath) {
    adminCpTargetSubjectPath = subjPath;
    adminCpChapterPickPath = [];
    _buildAdminCpChapterPickSelectors();
}

function _buildAdminCpChapterPickSelectors() {
    const box = document.getElementById('admin-cp-chap-selectors');
    const txt = document.getElementById('admin-cp-chap-path-text');
    if (!box || !adminCpTargetSubjectPath) return;
    const base = adminCpTargetSubjectPath.split(' > ').filter(Boolean);
    let html = '';
    for (let i = 0; i <= adminCpChapterPickPath.length; i++) {
        const keys = getMergedChildKeysAtPath([...base, ...adminCpChapterPickPath.slice(0, i)]).filter(k => typeof isCwDifficultyFolder === 'function' ? !isCwDifficultyFolder(k) : true);
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminCpChapPickChange(event, ${i})">`;
        html += `<option value="" ${!adminCpChapterPickPath[i] ? 'selected' : ''}>-- Select Chapter --</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminCpChapterPickPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminCpChapterPickPath[i]) break;
    }
    box.innerHTML = html || `<span style="color:#f59e0b; font-size:12px;">No chapters inside selected subject yet.</span>`;
    if (txt) txt.innerText = adminCpChapterPickPath.length ? `${adminCpTargetSubjectPath} > ${adminCpChapterPickPath.join(' > ')}` : 'None';
}

function handleAdminCpChapPickChange(event, depth) {
    adminCpChapterPickPath = adminCpChapterPickPath.slice(0, depth);
    if (event.target.value !== '') adminCpChapterPickPath.push(event.target.value);
    _buildAdminCpChapterPickSelectors();
}

async function saveAdminCustomPracticeConfig() {
    await db.collection('settings').doc('custom_practice_config').set(window.customPracticeConfig, { merge: true });
}

function collectDirectChaptersFromAppData(subjPath) {
    const base = subjPath.split(' > ').filter(Boolean);
    return getMergedChildKeysAtPath(base)
        .filter(k => typeof isCwDifficultyFolder === 'function' ? !isCwDifficultyFolder(k) : true)
        .map(k => ({ path: `${subjPath} > ${k}`, label: k.replace(/^\d+\.\s*/, '') }));
}

async function addSubjectToCustomPractice(withChaps = false) {
    if (!adminCpSelectedExam || !adminCpSubjectPickPath.length) return showNotification('⚠️ Select a Subject folder first.');
    const full = `${adminCpSelectedExam} > ${adminCpSubjectPickPath.join(' > ')}`;
    const lbl = adminCpSubjectPickPath[adminCpSubjectPickPath.length - 1].replace(/^\d+\.\s*/, '');
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = window.customPracticeConfig.exams[adminCpSelectedExam] || { subjects: [] };
    const list = window.customPracticeConfig.exams[adminCpSelectedExam].subjects;
    if (list.some(s => s.path === full)) return showNotification('⚠️ Subject already added.');
    list.push({ path: full, label: lbl, chapters: withChaps ? collectDirectChaptersFromAppData(full) : [] });
    adminCpTargetSubjectPath = full;
    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Subject "${lbl}" added!`);
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

async function addChapterToCustomPractice() {
    if (!adminCpSelectedExam || !adminCpTargetSubjectPath || !adminCpChapterPickPath.length) return showNotification('⚠️ Select a Subject and Chapter first.');
    const fullChap = `${adminCpTargetSubjectPath} > ${adminCpChapterPickPath.join(' > ')}`;
    const lbl = adminCpChapterPickPath[adminCpChapterPickPath.length - 1].replace(/^\d+\.\s*/, '');
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = window.customPracticeConfig.exams[adminCpSelectedExam] || { subjects: [] };
    const list = window.customPracticeConfig.exams[adminCpSelectedExam].subjects;
    let subj = list.find(s => s.path === adminCpTargetSubjectPath);
    if (!subj) {
        subj = { path: adminCpTargetSubjectPath, label: adminCpTargetSubjectPath.split(' > ').pop().replace(/^\d+\.\s*/, ''), chapters: [] };
        list.push(subj);
    }
    subj.chapters = subj.chapters || [];
    if (subj.chapters.some(c => c.path === fullChap)) return showNotification('⚠️ Chapter already added.');
    subj.chapters.push({ path: fullChap, label: lbl });
    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Chapter "${lbl}" added!`);
    renderAdminCpConfiguredList();
}

async function addAllChaptersForConfiguredSubject(subjPath) {
    const list = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    const subj = list.find(s => s.path === subjPath);
    if (!subj) return;
    const existing = new Set((subj.chapters || []).map(c => c.path));
    collectDirectChaptersFromAppData(subjPath).forEach(ch => {
        if (!existing.has(ch.path)) subj.chapters.push(ch);
    });
    await saveAdminCustomPracticeConfig();
    showNotification('✅ Imported chapters!');
    renderAdminCpConfiguredList();
}

async function removeSubjectFromCustomPractice(subjPath) {
    if (!confirm('Remove this Subject from Custom Practice?')) return;
    const list = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    window.customPracticeConfig.exams[adminCpSelectedExam].subjects = list.filter(s => s.path !== subjPath);
    await saveAdminCustomPracticeConfig();
    _syncAdminCpTargetSubjectDropdown();
    renderAdminCpConfiguredList();
}

async function removeChapterFromCustomPractice(subjPath, chapPath) {
    const subj = (window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || []).find(s => s.path === subjPath);
    if (!subj) return;
    subj.chapters = (subj.chapters || []).filter(c => c.path !== chapPath);
    await saveAdminCustomPracticeConfig();
    renderAdminCpConfiguredList();
}

async function autoImportExamToCustomPractice() {
    if (!adminCpSelectedExam) return;
    if (window.customPracticeConfig.exams) delete window.customPracticeConfig.exams[adminCpSelectedExam];
    const scanned = typeof buildCwCatalogForExam === 'function' ? buildCwCatalogForExam(adminCpSelectedExam, true) : [];
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = {
        subjects: scanned.map(s => ({
            path: s.fullPath,
            label: s.label,
            chapters: (s.chapters || []).map(c => ({ path: c.fullPath, label: c.label }))
        }))
    };
    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Imported ${scanned.length} subject(s)!`);
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

async function clearExamCustomPracticeConfig() {
    if (!adminCpSelectedExam || !confirm(`Clear all Custom Practice subjects for ${adminCpSelectedExam}?`)) return;
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = { subjects: [] };
    await saveAdminCustomPracticeConfig();
    _syncAdminCpTargetSubjectDropdown();
    renderAdminCpConfiguredList();
}

function renderAdminCpConfiguredList() {
    const box = document.getElementById('admin-cp-configured-list');
    if (!box) return;
    if (!adminCpSelectedExam) {
        box.innerHTML = `<div class="admin-panel-card" style="text-align:center; color:#888; padding:30px;">No Exam Category selected.</div>`;
        return;
    }
    const subjects = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    if (!subjects.length) {
        box.innerHTML = `<div class="admin-panel-card" style="text-align:center; color:#888; padding:30px;">No Subjects configured for <b>${adminCpSelectedExam}</b>. Click <b>⚡ Auto-Import</b> above or add a Subject folder.</div>`;
        return;
    }
    let usedSubjIcons = new Set();
    let usedSubjColors = new Set();
    box.innerHTML = subjects.map((s, i) => {
        const th = typeof getAutoTopicTheme === 'function' ? getAutoTopicTheme(s.label, null, i, usedSubjColors, '📘', usedSubjIcons, s.path) : { i: '📘', c: '#fdb813' };
        const escS = s.path.replace(/'/g, "\\'");
        const chaps = s.chapters || [];
        const chips = chaps.length
            ? chaps.map(c => `<div class="admin-chap-chip"><span>${c.label}</span><button onclick="removeChapterFromCustomPractice('${escS}', '${c.path.replace(/'/g, "\\'")}')">✕</button></div>`).join('')
            : `<span style="color:#777; font-size:12px;">Uses all questions under ${s.label}.</span>`;
        return `<div class="admin-panel-card" style="border-left:4px solid ${th.c}; padding:20px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #2b2b36; padding-bottom:12px;">
                <div><b style="font-size:17px; color:#fff;">${th.i} ${s.label}</b> <span style="font-size:11px; color:#888;">(${chaps.length} Chapters)</span></div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-exam" onclick="addAllChaptersForConfiguredSubject('${escS}')" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.35); padding:6px 12px; font-size:11.5px;">+ Import Chapters</button>
                    <button class="btn-exam" onclick="removeSubjectFromCustomPractice('${escS}')" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.35); padding:6px 12px; font-size:11.5px;">🗑️ Delete Subject</button>
                </div>
            </div>
            <div class="admin-chip-list">${chips}</div>
        </div>`;
    }).join('');
}
// ==========================================
// SUBTOPIC SEARCH BARS MANAGER (SCOPED SECONDARY SEARCH)
// ==========================================
let adminSubSearchPickPath = [];

async function initAdminSubtopicSearchTab() {
    try {
        const doc = await db.collection('settings').doc('subtopic_search_config').get();
        if (doc.exists && doc.data()) {
            window.subtopicSearchConfig = {
                enabledPaths: doc.data().enabledPaths || {},
                autoThreshold: doc.data().autoThreshold !== undefined ? Number(doc.data().autoThreshold) : 8
            };
            localStorage.setItem('mcqs_subtopic_search_cfg_v1', JSON.stringify(window.subtopicSearchConfig));
        }
    } catch (e) {}
    _buildAdminSubSearchPickSelectors();
    renderAdminActiveSubSearchList();
}

function _buildAdminSubSearchPickSelectors() {
    const box = document.getElementById('admin-subsearch-pick-selectors');
    if (!box) return;
    let html = '';
    for (let i = 0; i <= adminSubSearchPickPath.length; i++) {
        const keys = getMergedChildKeysAtPath(adminSubSearchPickPath.slice(0, i));
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:170px; margin-bottom:0;" onchange="handleAdminSubSearchPickChange(event, ${i})">`;
        html += `<option value="" ${!adminSubSearchPickPath[i] ? 'selected' : ''}>${i === 0 ? '-- Select Main Exam / Category --' : '-- Stop Here / Select Subtopic --'}</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminSubSearchPickPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminSubSearchPickPath[i]) break;
    }
    box.innerHTML = html;

    const fullPath = adminSubSearchPickPath.join(' > ');
    const txt = document.getElementById('admin-subsearch-pick-text');
    if (txt) txt.innerText = fullPath || 'None selected';

    syncSubSearchFormInputsForSelectedPath();
}

function handleAdminSubSearchPickChange(event, depth) {
    adminSubSearchPickPath = adminSubSearchPickPath.slice(0, depth);
    if (event.target.value !== '') adminSubSearchPickPath.push(event.target.value);
    _buildAdminSubSearchPickSelectors();
}

function syncSubSearchFormInputsForSelectedPath() {
    const fullPath = adminSubSearchPickPath.join(' > ');
    const enableCb = document.getElementById('subSearchToggleState');
    const childrenCb = document.getElementById('subSearchIncludeChildrenToggle');
    const phInput = document.getElementById('subSearchPlaceholderInput');
    if (!enableCb || !childrenCb || !phInput) return;

    const map = (window.subtopicSearchConfig && window.subtopicSearchConfig.enabledPaths) || {};
    const entry = map[fullPath];

    if (entry && typeof entry === 'object') {
        enableCb.checked = entry.enabled !== false;
        childrenCb.checked = Boolean(entry.includeChildren);
        phInput.value = entry.placeholder || '';
    } else if (typeof entry === 'boolean') {
        enableCb.checked = entry;
        childrenCb.checked = false;
        phInput.value = '';
    } else {
        enableCb.checked = true;
        childrenCb.checked = false;
        phInput.value = '';
    }
}

async function saveSubtopicSearchConfigToFirestore() {
    window.subtopicSearchConfig = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
    await db.collection('settings').doc('subtopic_search_config').set(window.subtopicSearchConfig, { merge: true });
    try {
        localStorage.setItem('mcqs_subtopic_search_cfg_v1', JSON.stringify(window.subtopicSearchConfig));
    } catch (e) {}
}

async function saveSubtopicSearchConfigForSelectedPath() {
    if (!adminSubSearchPickPath.length) {
        return showNotification('⚠️ Select a folder path first.');
    }
    const fullPath = adminSubSearchPickPath.join(' > ');
    const enabled = document.getElementById('subSearchToggleState')?.checked ?? true;
    const includeChildren = document.getElementById('subSearchIncludeChildrenToggle')?.checked ?? false;
    const placeholder = (document.getElementById('subSearchPlaceholderInput')?.value || '').trim();

    window.subtopicSearchConfig = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
    window.subtopicSearchConfig.enabledPaths = window.subtopicSearchConfig.enabledPaths || {};
    window.subtopicSearchConfig.enabledPaths[fullPath] = {
        enabled: enabled,
        includeChildren: includeChildren,
        placeholder: placeholder,
        updatedAt: Date.now()
    };

    try {
        await saveSubtopicSearchConfigToFirestore();
        showNotification(`✅ Secondary Search Bar ${enabled ? 'enabled' : 'updated'} for "${fullPath}"!`);
        renderAdminActiveSubSearchList();
    } catch (e) {
        showNotification('❌ Error saving search bar config: ' + e.message);
    }
}

async function disableSubtopicSearchForSelectedPath() {
    if (!adminSubSearchPickPath.length) {
        return showNotification('⚠️ Select a folder path first.');
    }
    const fullPath = adminSubSearchPickPath.join(' > ');
    window.subtopicSearchConfig = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
    window.subtopicSearchConfig.enabledPaths = window.subtopicSearchConfig.enabledPaths || {};
    window.subtopicSearchConfig.enabledPaths[fullPath] = {
        enabled: false,
        includeChildren: false,
        placeholder: '',
        updatedAt: Date.now()
    };

    try {
        await saveSubtopicSearchConfigToFirestore();
        syncSubSearchFormInputsForSelectedPath();
        showNotification(`🚫 Search bar disabled on "${fullPath}".`);
        renderAdminActiveSubSearchList();
    } catch (e) {
        showNotification('❌ Error: ' + e.message);
    }
}

async function removeSubtopicSearchRule(fullPath) {
    if (!window.subtopicSearchConfig || !window.subtopicSearchConfig.enabledPaths) return;
    delete window.subtopicSearchConfig.enabledPaths[fullPath];
    try {
        await saveSubtopicSearchConfigToFirestore();
        showNotification('🗑️ Search bar rule removed.');
        renderAdminActiveSubSearchList();
    } catch (e) {
        showNotification('❌ Error: ' + e.message);
    }
}

async function quickToggleSubtopicSearchOnCard(fullPath) {
    window.subtopicSearchConfig = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
    window.subtopicSearchConfig.enabledPaths = window.subtopicSearchConfig.enabledPaths || {};
    const current = window.subtopicSearchConfig.enabledPaths[fullPath];
    const currentlyOn = current && (current === true || current.enabled !== false);

    if (currentlyOn) {
        window.subtopicSearchConfig.enabledPaths[fullPath] = { enabled: false, includeChildren: false, placeholder: '' };
    } else {
        window.subtopicSearchConfig.enabledPaths[fullPath] = { enabled: true, includeChildren: true, placeholder: '' };
    }

    try {
        await saveSubtopicSearchConfigToFirestore();
        showNotification(`🔍 Secondary Search Bar ${!currentlyOn ? 'ENABLED' : 'DISABLED'} on "${fullPath}"!`);
        renderAdminTopicsList(currentFilteredAdminTopics);
    } catch (e) {
        showNotification('❌ Error toggling search bar: ' + e.message);
    }
}

function renderAdminActiveSubSearchList() {
    const listEl = document.getElementById('admin-active-subsearch-list');
    if (!listEl) return;

    const map = (window.subtopicSearchConfig && window.subtopicSearchConfig.enabledPaths) || {};
    const keys = Object.keys(map);

    if (keys.length === 0) {
        listEl.innerHTML = `<p style="color:#888; font-size:13px; text-align:center; padding:22px; border:1px dashed #2b2b36; border-radius:10px; margin:0;">No custom folder search rules saved yet. Note: <b>Board &gt; Class 9–12</b> folders automatically display a search bar once 4+ states/boards are added inside them!</p>`;
        return;
    }

    let usedIcons = new Set();
    let usedColors = new Set();
    listEl.innerHTML = keys.map((pathStr, idx) => {
        const cfg = map[pathStr];
        const isEnabled = cfg === true || (cfg && cfg.enabled !== false);
        const incChildren = cfg && cfg.includeChildren;
        const leaf = pathStr.split(' > ').pop() || pathStr;
        const th = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(leaf, null, idx, usedColors, '🔍', usedIcons, pathStr)
            : { i: '🔍', c: '#38bdf8' };
        const escPath = pathStr.replace(/'/g, "\\'");

        return `
        <div style="background:#1c1c24; border:1px solid #2b2b36; border-left:4px solid ${isEnabled ? th.c : '#ef4444'}; border-radius:10px; padding:14px 18px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <b style="color:#fff; font-size:15px;">${th.i} ${pathStr}</b>
                    <span style="font-size:10.5px; padding:3px 9px; border-radius:20px; font-weight:800; background:${isEnabled ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}; color:${isEnabled ? '#10b981' : '#ef4444'};">${isEnabled ? 'SEARCH BAR ON' : 'DISABLED'}</span>
                    ${incChildren ? `<span style="font-size:10.5px; padding:3px 9px; border-radius:20px; font-weight:700; background:rgba(56,189,248,0.15); color:#38bdf8;">+ Includes Subfolders</span>` : ''}
                </div>
                ${cfg && cfg.placeholder ? `<div style="font-size:12px; color:#94a3b8; margin-top:4px;">Placeholder: "${cfg.placeholder}"</div>` : ''}
            </div>
            <div style="display:flex; gap:8px;">
                <button onclick="removeSubtopicSearchRule('${escPath}')" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:var(--wrong-red); padding:7px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px;">Delete Rule</button>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// MULTI-TARGET CREATE TOPIC & RAPID UPLOAD ENGINE
// ==========================================
function _buildAdminNewTopicSelectors() {
    const box = document.getElementById('dynamic-new-path-selectors');
    if (!box) return;
    let html = '';
    for (let i = 0; i <= adminNewTopicPath.length; i++) {
        const keys = getMergedChildKeysAtPath(adminNewTopicPath.slice(0, i));
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminNewTopicPathChange(event, ${i})">`;
        html += `<option value="">-- Stop Here / Select Child --</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminNewTopicPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminNewTopicPath[i]) break;
    }
    box.innerHTML = html;
    renderAdminMultiTargetSelector();
    updateAdminDestinationSummaryText();
    updateLiveAutoIconPreview();
}

function renderAdminMultiTargetSelector() {
    const box = document.getElementById('admin-multi-target-container');
    if (!box) return;
    const children = getMergedChildKeysAtPath(adminNewTopicPath);
    adminMultiTargetChildren = adminMultiTargetChildren.filter(c => children.includes(c));
    if (!children.length) { box.innerHTML = ''; return; }

    const parentPathStr = adminNewTopicPath.join(' > ');
    const parentName = adminNewTopicPath.length ? adminNewTopicPath[adminNewTopicPath.length - 1].replace(/^\d+\.\s*/, '') : 'Root';
    let usedIcons = new Set();
    let usedColors = new Set();
    const grid = children.map((c, idx) => {
        const ck = adminMultiTargetChildren.includes(c);
        const childFull = parentPathStr ? `${parentPathStr} > ${c}` : c;
        const th = typeof getAutoTopicTheme === 'function'
            ? getAutoTopicTheme(c, null, idx, usedColors, '📁', usedIcons, childFull)
            : { i: '📁' };
        return `<label class="admin-target-item ${ck ? 'checked' : ''}" id="admTargetItem_${idx}">
            <input type="checkbox" ${ck ? 'checked' : ''} onchange="toggleAdminMultiTargetChild('${c.replace(/'/g, "\\'")}', this.checked, ${idx})">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${th.i} ${c.replace(/^\d+\.\s*/, '')}</span>
        </label>`;
    }).join('');

    box.innerHTML = `<div class="admin-multi-target-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span style="font-size:12px; font-weight:800; color:#38bdf8;">🎯 1B. Multi-Target Batch Selector Inside "${parentName}" (Optional)</span>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="selectAllAdminMultiTargetChildren(true)" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;">☑️ Select All (${children.length})</button>
                <button type="button" onclick="selectAllAdminMultiTargetChildren(false)" style="background:rgba(255,255,255,0.06); color:#aaa; border:1px solid #333; border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;">Clear</button>
            </div>
        </div>
        <div class="admin-multi-target-grid">${grid}</div>
    </div>`;
}

function toggleAdminMultiTargetChild(key, checked, idx) {
    if (checked && !adminMultiTargetChildren.includes(key)) adminMultiTargetChildren.push(key);
    else if (!checked) adminMultiTargetChildren = adminMultiTargetChildren.filter(c => c !== key);
    const el = document.getElementById('admTargetItem_' + idx);
    if (el) el.classList.toggle('checked', checked);
    updateAdminDestinationSummaryText();
}

function selectAllAdminMultiTargetChildren(all) {
    adminMultiTargetChildren = all ? [...getMergedChildKeysAtPath(adminNewTopicPath)] : [];
    renderAdminMultiTargetSelector();
    updateAdminDestinationSummaryText();
}

function updateAdminDestinationSummaryText() {
    const el = document.getElementById('new-topic-path-text');
    if (!el) return;
    const base = adminNewTopicPath.length ? adminNewTopicPath.join(' > ') : 'Root (Main Menu)';
    el.innerHTML = adminMultiTargetChildren.length
        ? `<span style="color:#38bdf8; font-weight:800;">${adminMultiTargetChildren.length} Selected Folders under ${base}</span>`
        : `<span style="color:#fff;">${base}</span>`;
}

function handleAdminNewTopicPathChange(event, depth) {
    adminNewTopicPath = adminNewTopicPath.slice(0, depth);
    if (event.target.value !== '') adminNewTopicPath.push(event.target.value);
    adminMultiTargetChildren = [];
    _buildAdminNewTopicSelectors();
}

async function createCustomTopic() {
    const input = document.getElementById('newFolderName');
    const names = parseFolderNamesList(input ? input.value.trim() : '');
    if (!names.length) return showNotification('⚠️ Enter at least one folder name.');

    const fType = document.getElementById('newFolderType').value;
    const customIc = document.getElementById('newFolderIcon')?.value.trim() || '';
    const autoDiff = document.getElementById('autoAddDiffInsideToggle')?.checked || false;
    const btn = document.getElementById('createFolderBtn');
    if (btn) { btn.innerText = 'Creating...'; btn.disabled = true; }

    try {
        const base = adminNewTopicPath.join(' > ');
        const parents = adminMultiTargetChildren.length
            ? adminMultiTargetChildren.map(c => base ? `${base} > ${c}` : c)
            : [base];

        const queue = [];
        const restorePaths = [];

        parents.forEach(pStr => {
            let siblingIcons = new Set();
            let siblingColors = new Set();
            names.forEach((n, idx) => {
                const full = pStr ? `${pStr} > ${n}` : n;
                restorePaths.push(full);
                const effType = autoDiff ? 'both' : fType;
                let ic = customIc;
                if (!ic) {
                    if (typeof getAutoTopicTheme === 'function') {
                        ic = getAutoTopicTheme(n, null, idx, siblingColors, '📘', siblingIcons, full).i;
                    } else if (typeof getAutomaticIconForName === 'function') {
                        ic = getAutomaticIconForName(n, effType, pStr);
                    } else {
                        ic = '📘';
                    }
                }
                if (!doesTopicPathExist(full)) queue.push({ parentPath: pStr, name: n, type: effType, icon: ic });

                if (autoDiff) {
                    ['Easy', 'Medium', 'Hard', 'Mixed'].forEach(d => {
                        const df = `${full} > ${d}`;
                        restorePaths.push(df);
                        if (!doesTopicPathExist(df)) {
                            const dic = typeof getAutomaticIconForName === 'function' ? getAutomaticIconForName(d, 'mcq', full) : '📝';
                            queue.push({ parentPath: full, name: d, type: 'mcq', icon: dic });
                        }
                    });
                }
            });
        });

        if (topicOverrides && Array.isArray(topicOverrides.deletedPaths)) {
            const rSet = new Set(restorePaths);
            topicOverrides.deletedPaths = topicOverrides.deletedPaths.filter(p => !rSet.has(p));
            await db.collection('settings').doc('topic_overrides').set(topicOverrides, { merge: true });
        }

        for (let i = 0; i < queue.length; i += 400) {
            const batch = db.batch();
            queue.slice(i, i + 400).forEach(item => {
                batch.set(db.collection('custom_topics').doc(), {
                    ...item,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        showNotification(`✅ Created ${queue.length} folder(s)!`);
        if (input) input.value = '';
        adminMultiTargetChildren = [];
        await loadCustomTopics();
        _buildAdminNewTopicSelectors();
        updateLiveAutoIconPreview();
    } catch (e) {
        showNotification('❌ Error: ' + e.message);
    }
    if (btn) { btn.innerText = '+ Create Folder(s)'; btn.disabled = false; }
}

function _buildAdminSelectors() {
    const box = document.getElementById('dynamic-path-selectors');
    if (!box) return;
    let html = '';
    for (let i = 0; i <= adminSelectedPath.length; i++) {
        const keys = getMergedChildKeysAtPath(adminSelectedPath.slice(0, i));
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminPathChange(event, ${i})"><option value="" ${!adminSelectedPath[i] ? 'selected' : ''}>-- Upload Here / Select Child --</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminSelectedPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminSelectedPath[i]) break;
    }
    box.innerHTML = html;

    const area = document.getElementById('upload-form-area');
    if (area) area.style.display = adminSelectedPath.length ? 'block' : 'none';

    const fullStr = adminSelectedPath.join(' > ');
    const txt = document.getElementById('upload-path-text');
    if (txt) txt.innerText = fullStr || 'Please select a destination above';

    const typeSel = document.getElementById('admResourceType');
    if (typeSel && fullStr) {
        const lower = fullStr.toLowerCase();
        const metaType = customTopicTypes[fullStr]?.type;
        if (metaType === 'pdf' || lower.includes('ncert book') || lower.includes('pyq') || lower.includes('pdf')) {
            typeSel.value = 'pdf';
        } else {
            typeSel.value = 'mcq';
        }
        toggleAdminFormType();
    }
}

function handleAdminPathChange(event, depth) {
    adminSelectedPath = adminSelectedPath.slice(0, depth);
    if (event.target.value !== '') adminSelectedPath.push(event.target.value);
    _buildAdminSelectors();
}

// ==========================================
// MANAGE CONTENT, CLOUDINARY & PDF UPLOADER
// ==========================================
function _buildManageSelectors() {
    const box = document.getElementById('manage-path-selectors');
    if (!box) return;
    let html = '';
    for (let i = 0; i <= adminManageSelectedPath.length; i++) {
        const keys = getMergedChildKeysAtPath(adminManageSelectedPath.slice(0, i));
        if (!keys.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleManagePathChange(event, ${i})"><option value="" ${!adminManageSelectedPath[i] ? 'selected' : ''}>-- All Folders --</option>`;
        keys.forEach(k => {
            html += `<option value="${k.replace(/"/g, '&quot;')}" ${adminManageSelectedPath[i] === k ? 'selected' : ''}>${k}</option>`;
        });
        html += `</select>`;
        if (!adminManageSelectedPath[i]) break;
    }
    box.innerHTML = html;
}

function handleManagePathChange(event, depth) {
    adminManageSelectedPath = adminManageSelectedPath.slice(0, depth);
    if (event.target.value !== '') adminManageSelectedPath.push(event.target.value);
    _buildManageSelectors();
}

async function uploadFileToCloudinary(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    const isPdf = file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
    const uploadEndpoint = isPdf ? CLOUDINARY_URL.replace('/auto/upload', '/raw/upload') : CLOUDINARY_URL;
    const res = await fetch(uploadEndpoint, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'File upload failed');
    return data.secure_url;
}

// ==========================================
// FORMULA TOOLBAR, BULK SMART PARSER, UNIVERSAL MATCH-TABLE DETECTOR & QUIZ ENGINE UPGRADES
// ==========================================
(function injectStudentDiagramTableAndQuizUpgradeStyles() {
    if (document.getElementById('mcqs-diagram-qimg-styles')) return;
    const st = document.createElement('style');
    st.id = 'mcqs-diagram-qimg-styles';
    st.textContent = `
        .mcq-question-text-img-wrap, .mcq-explanation-img-wrap {
            margin: 10px 0 14px 0;
            background: #ffffff;
            border: 1.5px solid rgba(56, 189, 248, 0.45);
            border-radius: 12px;
            padding: 10px 14px;
            text-align: center;
            max-width: 100%;
            box-sizing: border-box;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        }
        .mcq-question-text-img-wrap img, .mcq-explanation-img-wrap img {
            max-width: 100%;
            max-height: 250px;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            border-radius: 6px;
            cursor: zoom-in;
        }
        .mcq-diagram-card {
            margin: 14px auto 16px auto;
            border: 1.5px solid rgba(253, 184, 19, 0.45);
            border-radius: 12px;
            padding: 12px 14px;
            text-align: center;
            max-width: 540px;
            width: 100%;
            box-sizing: border-box;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            overflow: hidden;
        }
        .mcq-diagram-card.bg-light {
            background: #ffffff;
            color: #0f172a;
        }
        .mcq-diagram-card.bg-dark {
            background: #0d1527;
            color: #f8fafc;
        }
        .mcq-diagram-card img {
            max-width: 100%;
            max-height: 230px;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            border-radius: 6px;
            cursor: zoom-in;
        }
        .mcq-diagram-caption {
            margin-top: 8px;
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            opacity: 0.88;
        }
        .mcq-match-table-wrap {
            margin: 14px 0 16px 0;
            width: 100%;
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid #2b354f;
            background: #141821;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            box-sizing: border-box;
        }
        .mcq-match-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 14.5px;
            color: #f1f5f9;
        }
        .mcq-match-table th {
            background: #1f2633;
            color: #e2e8f0;
            font-weight: 700;
            padding: 12px 16px;
            border-bottom: 1px solid #2e3846;
            border-right: 1px solid rgba(255, 255, 255, 0.06);
        }
        .mcq-match-table th:last-child {
            border-right: none;
        }
        .mcq-match-table td {
            padding: 11px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            vertical-align: top;
            line-height: 1.5;
        }
        .mcq-match-table td:last-child {
            border-right: none;
        }
        .mcq-match-table tr:last-child td {
            border-bottom: none;
        }
        .btn-anytime-submit {
            background: linear-gradient(135deg, #10b981, #059669) !important;
            color: #ffffff !important;
            border: 1px solid rgba(16, 185, 129, 0.6) !important;
            font-weight: 800 !important;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-anytime-submit:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
        }
    `;
    document.head.appendChild(st);
})();

var lastFocusedFormulaInput = null;

var adminImageSlots = {
    QUESTION: null,
    DIAGRAM: null,
    EXPLANATION: null
};

var adminMatchTableState = {
    enabled: false,
    rows: 4,
    cols: 2,
    headers: ['Column I', 'Column II', 'Column III', 'Column IV', 'Column V'],
    cells: [
        ['a. ', 'i. ', '', '', ''],
        ['b. ', 'ii. ', '', '', ''],
        ['c. ', 'iii. ', '', '', ''],
        ['d. ', 'iv. ', '', '', ''],
        ['e. ', 'v. ', '', '', ''],
        ['f. ', 'vi. ', '', '', ''],
        ['g. ', 'vii. ', '', '', ''],
        ['h. ', 'viii. ', '', '', ''],
        ['i. ', 'ix. ', '', '', ''],
        ['j. ', 'x. ', '', '', '']
    ]
};

function setLastFocusedFormulaInput(el) {
    if (el) lastFocusedFormulaInput = el;
}

function formatMultilineTextToHtml(rawText) {
    if (!rawText) return '';
    let str = String(rawText).replace(/\r\n?/g, '\n');
    str = str.replace(/ {2,}/g, match => ' ' + '&nbsp;'.repeat(match.length - 1));
    str = str.replace(/\n/g, '<br>');
    return str;
}

function autoSeparateStatementsInActiveInput() {
    let target = (lastFocusedFormulaInput && lastFocusedFormulaInput.tagName === 'TEXTAREA')
        ? lastFocusedFormulaInput
        : document.getElementById('admQuestion');
    if (!target || !target.value.trim()) {
        return showNotification('⚠️ Click inside a Question Text box first.');
    }

    let s = target.value;
    s = s.replace(/([^\n])\s+(\b(?:I|II|III|IV|V|VI|VII)\.\s+)/g, '$1\n$2');
    s = s.replace(/([^\n])\s+(\((?:i\vert{}ii\vert{}iii\vert{}iv\vert{}v\vert{}vi\vert{}I\vert{}II\vert{}III\vert{}IV\vert{}V\vert{}VI)\)\s+)/g, '$1\n$2');
    s = s.replace(/([^\n])\s+(\b(?:Statement\s*(?:I|II|III|IV|1|2|3|4)|Assertion\s*\(?A\)?|Reason\s*\(?R\)?)\s*[:\-])/gi, '$1\n$2');
    s = s.replace(/([^\n])\s+((?:Which\s+of\s+the\s+(?:above|following)|Select\s+the\s+correct|Choose\s+the\s+correct|In\s+the\s+light\s+of|How\s+many\s+of\s+the\s+above)\b)/gi, '$1\n\n$2');

    target.value = s;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
    showNotification('📑 Statements separated onto clean lines!');
}

function insertBlankLineSpacingInActiveInput() {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target) return;
    target.focus();
    const start = target.selectionStart !== undefined ? target.selectionStart : target.value.length;
    const end = target.selectionEnd !== undefined ? target.selectionEnd : target.value.length;
    const text = target.value;
    const prefix = (start > 0 && text[start - 1] !== '\n') ? '\n\n' : '\n';
    target.value = text.substring(0, start) + prefix + text.substring(end);
    target.selectionStart = target.selectionEnd = start + prefix.length;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
}

function applyAdminTextStyleTag(tag) {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target) return;
    target.focus();

    const start = target.selectionStart !== undefined ? target.selectionStart : target.value.length;
    const end = target.selectionEnd !== undefined ? target.selectionEnd : target.value.length;
    const text = target.value;
    const selected = text.substring(start, end);
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;

    if (selected.startsWith(openTag) && selected.endsWith(closeTag)) {
        const unwrapped = selected.slice(openTag.length, selected.length - closeTag.length);
        target.value = text.substring(0, start) + unwrapped + text.substring(end);
        target.selectionStart = start;
        target.selectionEnd = start + unwrapped.length;
    } else {
        const replacement = `${openTag}${selected}${closeTag}`;
        target.value = text.substring(0, start) + replacement + text.substring(end);
        if (selected.length > 0) {
            target.selectionStart = start;
            target.selectionEnd = start + replacement.length;
        } else {
            target.selectionStart = target.selectionEnd = start + openTag.length;
        }
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
}

function stripHtmlStyleTagsFromActiveInput() {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target || !target.value) return;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    if (start !== end) {
        const cleaned = target.value.substring(start, end).replace(/<\/?(?:i|em|b|strong|u|sub|sup|s)>/gi, '');
        target.value = target.value.substring(0, start) + cleaned + target.value.substring(end);
    } else {
        target.value = target.value.replace(/<\/?(?:i|em|b|strong|u|sub|sup|s)>/gi, '');
    }
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
    showNotification('🧹 Style tags cleared!');
}

function convertUnicodeMathStylesToHtml(str) {
    if (!str) return '';
    let out = '';
    let currentMode = null;

    for (const ch of str) {
        const cp = ch.codePointAt(0);
        let mappedChar = null;
        let mode = null;

        if (cp >= 0x1D434 && cp <= 0x1D44D) { mappedChar = String.fromCharCode(65 + (cp - 0x1D434)); mode = 'i'; }
        else if (cp === 0x210E) { mappedChar = 'h'; mode = 'i'; }
        else if (cp >= 0x1D44E && cp <= 0x1D467) { mappedChar = String.fromCharCode(97 + (cp - 0x1D44E)); mode = 'i'; }
        else if (cp >= 0x1D608 && cp <= 0x1D621) { mappedChar = String.fromCharCode(65 + (cp - 0x1D608)); mode = 'i'; }
        else if (cp >= 0x1D622 && cp <= 0x1D63B) { mappedChar = String.fromCharCode(97 + (cp - 0x1D622)); mode = 'i'; }
        else if (cp >= 0x1D468 && cp <= 0x1D481) { mappedChar = String.fromCharCode(65 + (cp - 0x1D468)); mode = 'i'; }
        else if (cp >= 0x1D482 && cp <= 0x1D49B) { mappedChar = String.fromCharCode(97 + (cp - 0x1D482)); mode = 'i'; }
        else if (cp >= 0x1D63C && cp <= 0x1D655) { mappedChar = String.fromCharCode(65 + (cp - 0x1D63C)); mode = 'i'; }
        else if (cp >= 0x1D656 && cp <= 0x1D66F) { mappedChar = String.fromCharCode(97 + (cp - 0x1D656)); mode = 'i'; }

        if (mode !== currentMode) {
            if (currentMode) out += `</${currentMode}>`;
            if (mode) out += `<${mode}>`;
            currentMode = mode;
        }
        out += mappedChar !== null ? mappedChar : ch;
    }
    if (currentMode) out += `</${currentMode}>`;
    return out;
}

function extractStyledTextFromClipboardHtml(htmlStr, plainFallback, preserveLineBreaks = true) {
    const cleanPlain = convertUnicodeMathStylesToHtml(plainFallback || '').replace(/\r\n?/g, '\n').replace(/[ \t]*\bPDF(?:\s*\+\s*\d+)?\b/g, '');
    if (!htmlStr || typeof DOMParser === 'undefined') {
        return cleanPlain;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlStr, 'text/html');

        doc.querySelectorAll('script, style, button, svg, sup.citation, a[href*="pdf"]').forEach(el => el.remove());

        // Convert HTML <table> into pipe format so our Universal Match-Column Detector turns it into an editable Match Table!
        doc.querySelectorAll('table').forEach(tbl => {
            const rows = Array.from(tbl.querySelectorAll('tr'));
            if (!rows.length) return;
            let mdRows = [];
            rows.forEach((tr) => {
                const cells = Array.from(tr.querySelectorAll('th, td'));
                if (!cells.length) return;
                const rowStr = '| ' + cells.map(c => (c.innerHTML || '').replace(/<\/?(?:p|div|br)[^>]*>/gi, ' ').replace(/\s+/g, ' ').trim()).join(' | ') + ' |';
                mdRows.push(rowStr);
            });
            const textMarker = doc.createTextNode('\n' + mdRows.join('\n') + '\n');
            tbl.parentNode.replaceChild(textMarker, tbl);
        });

        const blockTags = new Set(['P', 'DIV', 'LI', 'TR', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE']);

        function serializeNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let txt = node.nodeValue || '';
                if (!preserveLineBreaks) {
                    return convertUnicodeMathStylesToHtml(txt.replace(/\s+/g, ' '));
                }
                return convertUnicodeMathStylesToHtml(txt.replace(/\r\n?/g, '\n'));
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return '';

            const tag = node.tagName.toUpperCase();
            if (tag === 'BR') return preserveLineBreaks ? '\n' : ' ';

            const rawText = (node.textContent || '').trim();
            if (/^PDF(?:\s*\+\s*\d+)?$/i.test(rawText) && rawText.length <= 12) {
                return '';
            }

            const styleAttr = (node.getAttribute('style') || '').toLowerCase();
            const isItalic = tag === 'I' || tag === 'EM' || /font-style\s*:\s*italic/.test(styleAttr);
            const isUnderline = tag === 'U' || /text-decoration[^;]*underline/.test(styleAttr);
            const isSub = tag === 'SUB' || /vertical-align\s*:\s*sub/.test(styleAttr);
            const isSup = tag === 'SUP' || /vertical-align\s*:\s*super/.test(styleAttr);
            const isBold = (tag === 'B' || tag === 'STRONG' || /font-weight\s*:\s*(bold|[6789]00)/.test(styleAttr)) &&
                           !/^(?:Q\d*|(?:Correct\s*)?(?:Option|Answer|Ans)|(?:NCERT\s*)?(?:Explanation|Exp|Solution)|[\(\[]?[A-D][\)\]\.])\b/i.test(rawText);

            let inner = '';
            node.childNodes.forEach(child => {
                inner += serializeNode(child);
            });

            if (!inner.trim()) {
                return (preserveLineBreaks && blockTags.has(tag)) ? '\n' : inner;
            }

            if (isSub) inner = `<sub>${inner}</sub>`;
            if (isSup) inner = `<sup>${inner}</sup>`;
            if (isUnderline) inner = `<u>${inner}</u>`;
            if (isItalic) inner = `<i>${inner}</i>`;
            if (isBold && inner.length < 120) inner = `<b>${inner}</b>`;

            if (preserveLineBreaks && blockTags.has(tag)) {
                return (inner.endsWith('\n') ? inner : inner + '\n');
            }
            return inner;
        }

        let result = serializeNode(doc.body);
        result = result
            .replace(/[ \t]*\bPDF(?:\s*\+\s*\d+)?\b/g, '')
            .replace(/<i>\s*<i>/g, '<i>').replace(/<\/i>\s*<\/i>/g, '</i>')
            .replace(/<b>\s*<b>/g, '<b>').replace(/<\/b>\s*<\/b>/g, '</b>')
            .replace(/<\/i>([ \t]*)<i>/g, '$1')
            .replace(/<\/b>([ \t]*)<b>/g, '$1');

        if (preserveLineBreaks) {
            result = result.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').trim();
            const plainLines = cleanPlain.trim().split('\n').filter(Boolean);
            const htmlLines = result.split('\n').filter(Boolean);
            if (plainLines.length > 1 && htmlLines.length <= 1) {
                plainLines.forEach((pLine, idx) => {
                    if (idx === 0) return;
                    const probe = pLine.trim().slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    if (probe.length >= 3) {
                        result = result.replace(new RegExp(`[ \\t]+(?=(?:<[iIbBuU]>)*${probe})`), '\n');
                    }
                });
            }
        } else {
            result = result.replace(/\s+/g, ' ').trim();
        }

        return result || cleanPlain;
    } catch (e) {
        return cleanPlain;
    }
}

(function attachAdminRichStylePasteAndShortcuts() {
    if (window._adminRichStylePasteAttached) return;
    window._adminRichStylePasteAttached = true;

    const richFieldIds = new Set([
        'admSmartPasteInput', 'admQuestion', 'admOptA', 'admOptB', 'admOptC', 'admOptD', 'admExplanation',
        'editQuestion', 'editOptA', 'editOptB', 'editOptC', 'editOptD', 'editExplanation'
    ]);

    function isRichAdminField(el) {
        if (!el || (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT')) return false;
        if (richFieldIds.has(el.id)) return true;
        if (el.closest && (el.closest('#admMatchTableInputsContainer') || el.closest('#admBulkCardsList'))) return true;
        return false;
    }

    document.addEventListener('paste', function(event) {
        const target = event.target;
        if (!isRichAdminField(target)) return;

        const cb = event.clipboardData;
        if (!cb) return;

        if (cb.items) {
            for (let item of cb.items) {
                if (item.type && item.type.indexOf('image') !== -1) return;
            }
        }

        const htmlData = cb.getData('text/html');
        const plainData = cb.getData('text/plain');

        const hasRichTags = htmlData && /<(?:i|em|b|strong|u|sub|sup|table)\b|font-style\s*:\s*italic|text-decoration[^;]*underline|vertical-align\s*:\s*(?:sub|super)/i.test(htmlData);
        const hasUnicodeMath = plainData && /[\u{1D400}-\u{1D7FF}\u210E]/u.test(plainData);
        const hasPdfBadge = plainData && /\bPDF(?:\s*\+\s*\d+)?\b/.test(plainData);

        if (!hasRichTags && !hasUnicodeMath && !hasPdfBadge) {
            setTimeout(updateAdminLiveFormulaPreview, 20);
            return;
        }

        event.preventDefault();
        const isMultiline = target.tagName === 'TEXTAREA';
        const styledText = extractStyledTextFromClipboardHtml(htmlData, plainData, isMultiline);

        const start = target.selectionStart !== undefined ? target.selectionStart : target.value.length;
        const end = target.selectionEnd !== undefined ? target.selectionEnd : target.value.length;
        target.value = target.value.substring(0, start) + styledText + target.value.substring(end);
        const nextCursor = start + styledText.length;
        target.selectionStart = target.selectionEnd = nextCursor;

        target.dispatchEvent(new Event('input', { bubbles: true }));
        updateAdminLiveFormulaPreview();
    }, true);

    document.addEventListener('keydown', function(event) {
        const target = event.target;
        if (!isRichAdminField(target)) return;
        if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

        const key = (event.key || '').toLowerCase();
        if (key === 'i' || key === 'b' || key === 'u') {
            event.preventDefault();
            lastFocusedFormulaInput = target;
            applyAdminTextStyleTag(key);
        }
    });
})();

// ==========================================
// 📊 UNIVERSAL MATCH-THE-COLUMN AUTO-DETECTOR (ANY TEXT/TABLE STYLE -> STRUCTURED TABLE)
// ==========================================
function autoExtractUniversalMatchTableFromQuestionStem(rawQuestionStem) {
    let text = String(rawQuestionStem || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return { cleanQuestion: '', matchTable: null };

    const makeTableObj = (headers, rowsArr) => {
        const numCols = Math.min(5, Math.max(2, headers.length || 2));
        const numRows = Math.min(10, Math.max(2, rowsArr.length));
        const paddedHeaders = ['Column I', 'Column II', 'Column III', 'Column IV', 'Column V'];
        for (let c = 0; c < numCols; c++) {
            if (headers[c] && headers[c].trim()) paddedHeaders[c] = headers[c].trim();
        }
        const paddedCells = [];
        for (let r = 0; r < Math.max(6, numRows); r++) {
            const row = ['', '', '', '', ''];
            if (rowsArr[r]) {
                for (let c = 0; c < numCols; c++) {
                    row[c] = (rowsArr[r][c] || '').trim();
                }
            }
            paddedCells.push(row);
        }
        return {
            enabled: true,
            rows: numRows,
            cols: numCols,
            headers: paddedHeaders,
            cells: paddedCells
        };
    };

    // 1. Check for Markdown Pipe Table: | Column I | Column II |
    const lines = text.split('\n');
    let pipeStart = -1, pipeEnd = -1;
    for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (t.startsWith('|') && t.endsWith('|') && t.split('|').length >= 4) {
            if (pipeStart === -1) pipeStart = i;
            pipeEnd = i;
        } else if (pipeStart !== -1) {
            break;
        }
    }
    if (pipeStart !== -1 && (pipeEnd - pipeStart + 1) >= 2) {
        const pipeLines = lines.slice(pipeStart, pipeEnd + 1).map(l => l.trim()).filter(l => !/^\|[\s\-:|]+\|$/.test(l));
        if (pipeLines.length >= 2) {
            const firstRow = pipeLines[0].slice(1, -1).split('|').map(c => c.trim());
            const isHeader = /column|list|group|item|part|feature|organism|phylum|order|family|class|term|function/i.test(firstRow.join(' '));
            const headers = isHeader ? firstRow : ['Column I', 'Column II'];
            const dataLines = isHeader ? pipeLines.slice(1) : pipeLines;
            const rowsArr = dataLines.map(l => l.slice(1, -1).split('|').map(c => c.trim()));
            if (rowsArr.length >= 2) {
                const cleanQ = [...lines.slice(0, pipeStart), ...lines.slice(pipeEnd + 1)].join('\n').trim();
                return { cleanQuestion: cleanQ || 'Match the columns and select the correct option:', matchTable: makeTableObj(headers, rowsArr) };
            }
        }
    }

    // 2. Check for Side-by-Side Lines (Tab, 2+ Spaces, or Inline Right-Marker like "a. Primata   i. Anacardiaceae" or "(a) Primata - (i) Anacardiaceae")
    const leftMarkerStr = '(?:\\(?[a-fA-FP-Up-u1-6][\\.\\)]\\s+)';
    const rightMarkerStr = '(?:\\(?(:?i|ii|iii|iv|v|vi|I|II|III|IV|V|VI|1|2|3|4|5|6|p|q|r|s|P|Q|R|S)[\\.\\)]\\s+)';
    const sideBySideLineRegex = new RegExp(`^\\s*(${leftMarkerStr}.+?)\\s*(?:\\t|\\s{2,}|\\s+[–—\\-]\\s+)(${rightMarkerStr}.+)$`, 'i');
    const inlineRomanSplitRegex = new RegExp(`^\\s*(${leftMarkerStr}.+?)\\s+(\\(?(:?i|ii|iii|iv|v|vi|I|II|III|IV|V|VI)[\\.\\)]\\s+.+)$`);

    let sbsIndices = [];
    let sbsPairs = [];
    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i].trim();
        let m = ln.match(sideBySideLineRegex) || ln.match(inlineRomanSplitRegex);
        if (m) {
            sbsIndices.push(i);
            sbsPairs.push([m[1].trim(), m[2].trim()]);
        }
    }
    if (sbsPairs.length >= 2) {
        let headers = ['Column I', 'Column II'];
        const firstIdx = sbsIndices[0];
        const removeSet = new Set(sbsIndices);
        if (firstIdx > 0) {
            const prevLine = lines[firstIdx - 1].trim();
            const hdrMatch = prevLine.match(/^((?:Column|List|Group|Part)\s*[\-I1A]+\b[^\t]*?)(?:\t|\s{2,}|\s+\/\s+|\s+and\s+)((?:Column|List|Group|Part)\s*[\-II2B]+\b.*)$/i);
            if (hdrMatch) {
                headers = [hdrMatch[1].trim(), hdrMatch[2].trim()];
                removeSet.add(firstIdx - 1);
            }
        }
        const cleanQ = lines.filter((_, idx) => !removeSet.has(idx)).join('\n').trim();
        return { cleanQuestion: cleanQ || 'Match the following columns:', matchTable: makeTableObj(headers, sbsPairs) };
    }

    // 3. Check for Stacked / Sequential Blocks (e.g. Column I followed by a, b, c, d then Column II followed by i, ii, iii, iv)
    const colHeaderLineRegex = /^\s*(?:<b>|<I>)?\s*((?:Column|List|Group)\s*[\-\s]*(?:I|II|1|2|A|B)(?:\s*\([^)]+\))?)\s*(?:<\/b>|<\/I>)?\s*:?\s*$/i;
    const leftItemStartRegex = /^\s*(\(?[a-fA-FP-Up-u][\.\)]|\([1-6]\))\s+(.+)$/;
    const rightItemStartRegex = /^\s*(\(?(?:i|ii|iii|iv|v|vi|I|II|III|IV|V|VI|1|2|3|4|5|6|p|q|r|s)[\.\)])\s+(.+)$/;

    let colHeadersFound = [];
    let leftItems = [];
    let rightItems = [];
    let usedLineIndices = new Set();
    let mode = 'NONE'; // 'LEFT' | 'RIGHT'

    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i].trim();
        if (!ln) continue;

        const hdrM = ln.match(colHeaderLineRegex);
        if (hdrM) {
            colHeadersFound.push(hdrM[1].trim());
            usedLineIndices.add(i);
            mode = colHeadersFound.length === 1 ? 'LEFT' : 'RIGHT';
            continue;
        }

        const isLeft = leftItemStartRegex.test(ln);
        const isRight = rightItemStartRegex.test(ln);

        if (mode === 'LEFT' && isLeft) {
            leftItems.push(ln);
            usedLineIndices.add(i);
        } else if ((mode === 'LEFT' || mode === 'RIGHT') && isRight && leftItems.length >= 2) {
            mode = 'RIGHT';
            rightItems.push(ln);
            usedLineIndices.add(i);
        } else if (mode === 'NONE' && isLeft) {
            // Stacked items even without explicit "Column I" header line
            leftItems.push(ln);
            usedLineIndices.add(i);
            mode = 'LEFT';
        } else if (mode === 'LEFT' && !isLeft && !isRight && leftItems.length < 2) {
            // Reset if it was a false start
            leftItems = [];
            usedLineIndices.clear();
            mode = 'NONE';
        }
    }

    if (leftItems.length >= 2 && rightItems.length >= 2 && Math.abs(leftItems.length - rightItems.length) <= 2) {
        const rowCount = Math.max(leftItems.length, rightItems.length);
        const pairedRows = [];
        for (let r = 0; r < rowCount; r++) {
            pairedRows.push([leftItems[r] || '', rightItems[r] || '']);
        }
        const headers = [
            colHeadersFound[0] || 'Column I',
            colHeadersFound[1] || 'Column II'
        ];
        const cleanQ = lines.filter((_, idx) => !usedLineIndices.has(idx)).join('\n').trim();
        return { cleanQuestion: cleanQ || 'Match Column I with Column II:', matchTable: makeTableObj(headers, pairedRows) };
    }

    return { cleanQuestion: text, matchTable: null };
}

// ==========================================
// 📚 200% ACCURATE MULTI-QUESTION BULK PARSER (SUPPORTS 60 to 250+ QUESTIONS AT ONCE)
// ==========================================
var adminBulkStagedQuestions = [];

function splitRawTextIntoMCQBlocks(rawText) {
    let cleaned = String(rawText || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]*\bPDF(?:\s*\+\s*\d+)?\b/g, '')
        .trim();
    if (!cleaned) return [];

    // Pre-split any inline "Q2." or "Question 2:" that got glued onto the end of a previous line
    cleaned = cleaned.replace(/([^\n])\s+((?:Q(?:uestion|ue|ns)?\s*[\.\:\-]?\s*\d+[\.\:\)\-]\s+))/gi, '$1\n$2');

    const lines = cleaned.split('\n');
    const blocks = [];
    let currentLines = [];
    let currentOptionLettersSeen = new Set();
    let hasSeenAnswerLine = false;
    let hasSeenExpLine = false;

    const explicitQHeaderRegex = /^\s*(?:<[bBiI]>\s*)?(?:Q(?:uestion|ue|ns)?\s*[\.\:\-#]?\s*\d+[\.\:\)\-]?|Question\s*#\d+|\[\s*Q\d+\s*\])/i;
    const numberedLineRegex = /^\s*(?:<[bBiI]>\s*)?(?:\d{1,3}[\.\)\:]|\(\d{1,3}\))\s+\S+/;
    const dividerLineRegex = /^\s*(?:\-{3,}|={3,}|\*{3,})\s*$/;

    const optionLineRegex = /(?:^|\s{2,})\(?([A-Da-d])[\)\.\:]\s+\S+/g;
    const ansDetectionRegex = /^\s*(?:[•○◦o\-\*👉✓✔]\s*)?(?:<[bBiI]>\s*)?(?:Correct\s*(?:Option|Options|Answer|Answers|Ans|Choice)?|Right\s*(?:Option|Answer)|Answer|Ans|Key)\s*[\.\:\-\=]/i;
    const expDetectionRegex = /^\s*(?:[•○◦o\-\*💡]\s*)?(?:<[bBiI]>\s*)?(?:NCERT\s+)?(?:Explanation|Exp|Solution|Sol|Hint|Reason\s+for\s+Answer)\s*[\.\:\-]/i;

    const flushCurrentBlock = () => {
        if (currentLines.length > 0) {
            const joined = currentLines.join('\n').trim();
            if (joined.length > 5) blocks.push(joined);
        }
        currentLines = [];
        currentOptionLettersSeen = new Set();
        hasSeenAnswerLine = false;
        hasSeenExpLine = false;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (dividerLineRegex.test(trimmed)) {
            if (currentLines.length > 0 && (currentOptionLettersSeen.size >= 2 || hasSeenAnswerLine || hasSeenExpLine)) {
                flushCurrentBlock();
                continue;
            }
        }

        const isExplicitQ = explicitQHeaderRegex.test(trimmed);
        const isNumberedStart = numberedLineRegex.test(trimmed);

        // Start a new question block if:
        // 1. Explicit "Q1.", "Q2.", "Question 3:" header
        // 2. Numbered line ("1.", "2.", "60.") AFTER we have already seen at least 2 options (A & B) OR an Answer/Explanation line
        if (currentLines.length > 0 && (
            isExplicitQ ||
            (isNumberedStart && (hasSeenAnswerLine || hasSeenExpLine || currentOptionLettersSeen.size >= 3))
        )) {
            flushCurrentBlock();
            currentLines.push(line);
            continue;
        }

        currentLines.push(line);

        if (!/Assertion\s*\(A\)|Statement\s*\(A\)/i.test(trimmed)) {
            const optMatches = [...trimmed.matchAll(optionLineRegex)];
            optMatches.forEach(m => currentOptionLettersSeen.add(m[1].toUpperCase()));
        }
        if (ansDetectionRegex.test(trimmed)) hasSeenAnswerLine = true;
        if (expDetectionRegex.test(trimmed)) hasSeenExpLine = true;
    }

    flushCurrentBlock();
    return blocks;
}

function extractAnswerLettersFromString(rawAnsStr) {
    if (!rawAnsStr) return [];
    const clean = String(rawAnsStr).replace(/<\/?(?:b|strong|i|em|u)>/gi, '').trim();

    const leadingMatch = clean.match(/^(?:Option\s+|Choice\s+)?[\(\[]?([A-Da-d])[\)\]\.\:\-]?(?:\s|$)/i);
    if (leadingMatch && !/^[A-Da-d]\s*[,&\/]\s*[A-Da-d]/i.test(clean)) {
        return [leadingMatch[1].toUpperCase()];
    }

    const multiMatch = clean.match(/^(?:[\(\[]?[A-Da-d][\)\]]?\s*(?:[,&\/]|\band\b)\s*)+[\(\[]?[A-Da-d][\)\]]?$/i);
    if (multiMatch) {
        return [...new Set([...clean.matchAll(/[A-Da-d]/g)].map(m => m[0].toUpperCase()))];
    }

    const parenMatch = clean.match(/(?:Option\s+|Choice\s+)?[\(\[]([A-Da-d])[\)\]]/i);
    if (parenMatch) return [parenMatch[1].toUpperCase()];

    const wordMatch = clean.match(/\b(?:Option|Choice|Ans|Answer)\s+([A-Da-d])\b/i);
    if (wordMatch) return [wordMatch[1].toUpperCase()];

    return [];
}

function parseSingleMCQBlockAccurate(rawBlock, defaultDifficulty = 'Mixed') {
    let text = String(rawBlock || '').trim();

    let explanation = '';
    let correctAnswers = [];
    let options = { A: '', B: '', C: '', D: '' };

    // 1. Extract Explanation
    const expRegex = /(?:^|\n)\s*(?:[•○◦o\-\*💡]\s*)?(?:<[bBiI]>\s*)?(?:NCERT\s+)?(?:Explanation|Exp|Solution|Sol|Hint)\s*[\.\:\-]\s*(?:<\/[bBiI]>\s*)?([\s\S]+)$/i;
    const expMatch = text.match(expRegex);
    if (expMatch) {
        explanation = expMatch[1]
            .replace(/^\s*<\/(?:b|strong|i|em)>\s*/i, '')
            .replace(/\s*<\/(?:b|strong)>\s*$/i, '')
            .trim();
        text = text.slice(0, expMatch.index).trim();
    }

    // 2. Check if Answer line was inside Explanation
    const ansInsideExpRegex = /(?:^|\n)\s*(?:[•○◦o\-\*👉✓✔]\s*)?(?:<[bBiI]>\s*)?(?:Correct\s*(?:Option|Options|Answer|Answers|Ans|Choice)?|Right\s*(?:Option|Answer)|Answer|Ans|Key)\s*[\.\:\-\=]\s*(?:<\/[bBiI]>\s*)?([^\n]+)/i;
    if (explanation) {
        const ansInExp = explanation.match(ansInsideExpRegex);
        if (ansInExp) {
            const extracted = extractAnswerLettersFromString(ansInExp[1]);
            if (extracted.length > 0) correctAnswers = extracted;
            explanation = explanation.replace(ansInExp[0], '').trim();
        }
    }

    // 3. Extract Explicit Answer Line from main text
    const ansRegex = /(?:^|\n)\s*(?:[•○◦o\-\*👉✓✔]\s*)?(?:<[bBiI]>\s*)?(?:Correct\s*(?:Option|Options|Answer|Answers|Ans|Choice)?|Right\s*(?:Option|Answer)|Answer|Ans|Key)\s*[\.\:\-\=]\s*(?:<\/[bBiI]>\s*)?([^\n]+)$/i;
    const ansMatch = text.match(ansRegex);
    if (ansMatch) {
        const extracted = extractAnswerLettersFromString(ansMatch[1]);
        if (extracted.length > 0) correctAnswers = extracted;
        text = text.slice(0, ansMatch.index).trim();
    }

    const inlineAnsEndRegex = /[\(\[]?\b(?:Correct\s*(?:Option|Answer|Ans)|Answer|Ans)\s*[\.\:\-\=]\s*[\(\[]?([A-Da-d])[\)\]]?[\)\]]?\s*$/i;
    const inlineEndMatch = text.match(inlineAnsEndRegex);
    if (inlineEndMatch) {
        const letter = inlineEndMatch[1].toUpperCase();
        if (!correctAnswers.includes(letter)) correctAnswers.push(letter);
        text = text.slice(0, inlineEndMatch.index).trim();
    }

    // 4. Extract Options A, B, C, D safely (taking the last 4 options so Match-the-Column items a,b,c,d are never confused with MCQ options!)
    const optRegexUpper = /(?:^|\n|\s{2,})(?!(?:Assertion|Statement|Column|List|Part|Section|Group|Fig)\s*)\(?([A-D])[\)\.\:]\s+([\s\S]*?)(?=(?:\n|\s{2,})\(?[B-D][\)\.\:]\s+|\s*$)/g;
    let matches = [...text.matchAll(optRegexUpper)];

    if (matches.length < 2) {
        const optRegexAny = /(?:^|\n|\s{2,})\(?([A-Da-d])[\)\.\:]\s+([\s\S]*?)(?=(?:\n|\s{2,})\(?[B-Db-d][\)\.\:]\s+|\s*$)/gi;
        const allCandidateMatches = [...text.matchAll(optRegexAny)];
        if (allCandidateMatches.length >= 4) {
            matches = allCandidateMatches.slice(-4);
        } else {
            matches = allCandidateMatches;
        }
    }

    let questionStem = text;
    if (matches.length >= 2) {
        let firstOptStartIdx = matches[0].index;
        questionStem = text.slice(0, firstOptStartIdx).trim();

        matches.forEach(m => {
            const letter = m[1].toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(letter)) {
                let optVal = m[2].replace(/[ \t]*\bPDF(?:\s*\+\s*\d+)?\b/g, '').trim();
                if (/[✅✔☑]/.test(optVal) || /\(\s*correct\s*\)/i.test(optVal)) {
                    optVal = optVal.replace(/[✅✔☑]|\(\s*correct\s*\)/gi, '').trim();
                    if (!correctAnswers.includes(letter)) correctAnswers.push(letter);
                }
                options[letter] = optVal;
            }
        });
    }

    // 5. Fallback answer check inside Explanation
    if (correctAnswers.length === 0 && explanation) {
        const expHintMatch = explanation.match(/(?:option|answer|choice)\s+\(?([A-Da-d])\)?\s+is\s+correct|correct\s+(?:option|answer|choice)\s+is\s+\(?([A-Da-d])\)?|hence\s*,?\s*\(?([A-Da-d])\)?\s+is\s+correct/i);
        if (expHintMatch) {
            const detectedLetter = (expHintMatch[1] || expHintMatch[2] || expHintMatch[3] || '').toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(detectedLetter)) {
                correctAnswers.push(detectedLetter);
            }
        }
    }

    // Strip leading Q1. / 1.
    questionStem = questionStem
        .replace(/^\s*(?:<[bBiI]>\s*)?(?:Q(?:uestion|ue|ns)?\s*[\.\:\-#]?\s*\d*[\.\:\)\-]\s*|\d{1,3}[\.\)\:]\s+|\(\d{1,3}\)\s+)(?:<\/[bBiI]>\s*)?/i, '')
        .trim();

    // 6. Automatically detect Match-the-Column written in ANY style and convert it into the structured Match Table!
    const matchDetection = autoExtractUniversalMatchTableFromQuestionStem(questionStem);
    questionStem = matchDetection.cleanQuestion;

    const defaultMatchTable = matchDetection.matchTable || {
        enabled: false,
        rows: 4,
        cols: 2,
        headers: ['Column I', 'Column II', 'Column III', 'Column IV'],
        cells: [
            ['a. ', 'i. ', '', ''],
            ['b. ', 'ii. ', '', ''],
            ['c. ', 'iii. ', '', ''],
            ['d. ', 'iv. ', '', ''],
            ['e. ', 'v. ', '', ''],
            ['f. ', 'vi. ', '', '']
        ]
    };

    return {
        id: 'bulk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        question: questionStem.trim(),
        options,
        correctAnswers,
        explanation: explanation.trim(),
        level: defaultDifficulty,
        showTools: Boolean(matchDetection.matchTable),
        questionImageBlob: null,
        questionImagePreviewUrl: '',
        diagramBlob: null,
        diagramPreviewUrl: '',
        diagramCaption: '',
        diagramBgMode: 'light',
        explanationImageBlob: null,
        explanationImagePreviewUrl: '',
        matchTable: defaultMatchTable
    };
}

parseQuickPasteMCQ = function(mode = 'auto') {
    const rawEl = document.getElementById('admSmartPasteInput');
    if (!rawEl || !rawEl.value.trim()) {
        showNotification('⚠️ Paste 1 or multiple questions with options first.');
        return;
    }

    const blocks = splitRawTextIntoMCQBlocks(rawEl.value);
    const defaultDiff = document.getElementById('admDifficulty')?.value || 'Mixed';

    if (mode === 'single' && blocks.length === 1) {
        const parsed = parseSingleMCQBlockAccurate(blocks[0], defaultDiff);
        document.getElementById('admQuestion').value = parsed.question;
        document.getElementById('admOptA').value = parsed.options.A || '';
        document.getElementById('admOptB').value = parsed.options.B || '';
        document.getElementById('admOptC').value = parsed.options.C || '';
        document.getElementById('admOptD').value = parsed.options.D || '';
        document.getElementById('admExplanation').value = parsed.explanation || '';
        document.querySelectorAll('.admCorrectCb').forEach(cb => {
            cb.checked = parsed.correctAnswers.includes(cb.value);
        });

        // If a Match-the-Column table was auto-detected, populate the Single Form Match Table Builder automatically!
        if (parsed.matchTable && parsed.matchTable.enabled) {
            adminMatchTableState.enabled = true;
            adminMatchTableState.rows = parsed.matchTable.rows;
            adminMatchTableState.cols = parsed.matchTable.cols;
            adminMatchTableState.headers = [...parsed.matchTable.headers];
            adminMatchTableState.cells = parsed.matchTable.cells.map(r => [...r]);
            const tblCb = document.getElementById('admEnableMatchTable');
            if (tblCb) tblCb.checked = true;
            toggleAdminMatchTableBuilder(true);
        }

        updateAdminLiveFormulaPreview();
        showNotification(`✨ Single Question${parsed.matchTable?.enabled ? ' + Auto Match-Table' : ''} & Answer (${parsed.correctAnswers.join(', ') || 'None'}) filled!`);
        return;
    }

    adminBulkStagedQuestions = blocks.map(b => parseSingleMCQBlockAccurate(b, defaultDiff));
    renderAdminBulkStagingQueue();
    const autoAnsCount = adminBulkStagedQuestions.filter(q => q.correctAnswers.length > 0).length;
    const autoTblCount = adminBulkStagedQuestions.filter(q => q.matchTable && q.matchTable.enabled).length;
    showNotification(`📚 Placed ${adminBulkStagedQuestions.length} MCQs (${autoAnsCount} Answers & ${autoTblCount} Match-Tables auto-built)!`);
};

function loadBulkCardIntoMainSingleForm(idx) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    document.getElementById('admQuestion').value = item.question || '';
    document.getElementById('admOptA').value = item.options.A || '';
    document.getElementById('admOptB').value = item.options.B || '';
    document.getElementById('admOptC').value = item.options.C || '';
    document.getElementById('admOptD').value = item.options.D || '';
    document.getElementById('admExplanation').value = item.explanation || '';
    const diffEl = document.getElementById('admDifficulty');
    if (diffEl) diffEl.value = item.level || 'Mixed';
    document.querySelectorAll('.admCorrectCb').forEach(cb => {
        cb.checked = item.correctAnswers.includes(cb.value);
    });
    if (item.matchTable && item.matchTable.enabled) {
        adminMatchTableState.enabled = true;
        adminMatchTableState.rows = item.matchTable.rows;
        adminMatchTableState.cols = item.matchTable.cols;
        adminMatchTableState.headers = [...item.matchTable.headers];
        adminMatchTableState.cells = item.matchTable.cells.map(r => [...r]);
        const tblCb = document.getElementById('admEnableMatchTable');
        if (tblCb) tblCb.checked = true;
        toggleAdminMatchTableBuilder(true);
    }
    updateAdminLiveFormulaPreview();
    const qBox = document.getElementById('admQuestion');
    if (qBox) {
        qBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qBox.focus();
    }
    showNotification(`✏️ Loaded Question #${idx + 1} into the Main Editor below!`);
}

function clearBulkStagedQueue() {
    adminBulkStagedQuestions = [];
    const panel = document.getElementById('admBulkStagingPanel');
    const list = document.getElementById('admBulkCardsList');
    if (list) list.innerHTML = '';
    if (panel) panel.style.display = 'none';
}

function buildBulkItemMatchTableHtml(item) {
    if (!item || !item.matchTable || !item.matchTable.enabled) return '';
    const mt = item.matchTable;
    let hasContent = false;
    let thead = '<tr>';
    for (let c = 0; c < mt.cols; c++) {
        thead += `<th>${(mt.headers[c] || `Column ${c + 1}`).trim()}</th>`;
    }
    thead += '</tr>';

    let tbody = '';
    for (let r = 0; r < mt.rows; r++) {
        let rowCells = [];
        let rowHas = false;
        for (let c = 0; c < mt.cols; c++) {
            const val = (mt.cells[r] && mt.cells[r][c]) ? mt.cells[r][c].trim() : '';
            if (val) rowHas = true;
            rowCells.push(`<td>${formatCellWithBoldPrefix(val)}</td>`);
        }
        if (rowHas) {
            hasContent = true;
            tbody += `<tr>${rowCells.join('')}</tr>`;
        }
    }
    if (!hasContent) return '';
    return `<div class="mcq-match-table-wrap"><table class="mcq-match-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
}

function isBulkItemReady(item) {
    const hasQ = Boolean(item.question.trim() || item.questionImageBlob || (item.matchTable && item.matchTable.enabled));
    const hasOpts = Boolean(item.options.A.trim() && item.options.B.trim());
    const hasAns = Array.isArray(item.correctAnswers) && item.correctAnswers.length > 0;
    return hasQ && hasOpts && hasAns;
}

function updateBulkQueueSummaryHeader() {
    const badgeWrap = document.getElementById('admBulkQueueSummaryBadges');
    const uploadBtn = document.getElementById('btnUploadAllBulkMCQs');
    if (!badgeWrap) return;

    const total = adminBulkStagedQuestions.length;
    const readyCount = adminBulkStagedQuestions.filter(isBulkItemReady).length;
    const missingCount = total - readyCount;
    const tableCount = adminBulkStagedQuestions.filter(q => q.matchTable && q.matchTable.enabled).length;

    badgeWrap.innerHTML = `
        <span style="background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">📚 Total Staged: ${total} MCQs</span>
        <span style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">🟢 Ready: ${readyCount}</span>
        ${tableCount > 0 ? `<span style="background:rgba(168,85,247,0.18); color:#c084fc; border:1px solid rgba(168,85,247,0.45); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">📊 Auto Match-Tables: ${tableCount}</span>` : ''}
        ${missingCount > 0 ? `<span style="background:rgba(239,68,68,0.18); color:#ef4444; border:1px solid rgba(239,68,68,0.45); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">⚠️ Needs Manual Check: ${missingCount}</span>` : `<span style="background:rgba(16,185,129,0.18); color:#10b981; border:1px solid rgba(16,185,129,0.45); padding:5px 12px; border-radius:20px; font-size:12px; font-weight:800;">✨ All Answers Verified</span>`}
    `;
    if (uploadBtn) {
        uploadBtn.innerText = `☁️ Upload All ${total} Question${total === 1 ? '' : 's'} Now (1-Click)`;
    }
}

function refreshSingleBulkCardPreview(idx) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    const prevEl = document.getElementById(`bulkCardLivePreview_${idx}`);
    const statusBadge = document.getElementById(`bulkCardStatusBadge_${idx}`);
    const cardEl = document.getElementById(`bulkStagedCard_${idx}`);

    const ready = isBulkItemReady(item);
    if (statusBadge) {
        statusBadge.style.background = ready ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.18)';
        statusBadge.style.color = ready ? '#10b981' : '#ef4444';
        statusBadge.style.borderColor = ready ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.45)';
        statusBadge.innerHTML = ready
            ? `🟢 Correct Option Auto-Filled: (${item.correctAnswers.join(', ')})${item.matchTable?.enabled ? ' • 📊 Table Auto-Built' : ''}`
            : '⚠️ Click A / B / C / D below to select Correct Answer';
    }
    if (cardEl) {
        cardEl.style.borderColor = ready ? 'rgba(56,189,248,0.35)' : 'rgba(239,68,68,0.65)';
    }

    if (prevEl) {
        const qHtml = formatMultilineTextToHtml(item.question);
        const tblHtml = buildBulkItemMatchTableHtml(item);
        const expHtml = formatMultilineTextToHtml(item.explanation);
        prevEl.innerHTML = `
            <div style="font-size:10.5px; font-weight:800; color:var(--primary-yellow); text-transform:uppercase; margin-bottom:6px;">👁️ Live Student Preview (#${idx + 1})</div>
            ${qHtml ? `<div style="margin-bottom:8px; line-height:1.65; color:#fff;"><b>Q${idx + 1}:</b> ${qHtml}</div>` : ''}
            ${item.questionImagePreviewUrl ? `<div class="mcq-question-text-img-wrap"><img src="${item.questionImagePreviewUrl}" style="max-height:160px;"></div>` : ''}
            ${tblHtml}
            ${item.diagramPreviewUrl ? `<div class="mcq-diagram-card ${item.diagramBgMode === 'dark' ? 'bg-dark' : 'bg-light'}"><img src="${item.diagramPreviewUrl}" style="max-height:160px;">${item.diagramCaption ? `<div class="mcq-diagram-caption">📐 ${item.diagramCaption}</div>` : ''}</div>` : ''}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12.5px; color:#cbd5e1; margin-top:6px;">
                <div style="${item.correctAnswers.includes('A') ? 'color:#10b981; font-weight:700;' : ''}"><b>A)</b> ${item.options.A || '-'} ${item.correctAnswers.includes('A') ? '✓' : ''}</div>
                <div style="${item.correctAnswers.includes('B') ? 'color:#10b981; font-weight:700;' : ''}"><b>B)</b> ${item.options.B || '-'} ${item.correctAnswers.includes('B') ? '✓' : ''}</div>
                <div style="${item.correctAnswers.includes('C') ? 'color:#10b981; font-weight:700;' : ''}"><b>C)</b> ${item.options.C || '-'} ${item.correctAnswers.includes('C') ? '✓' : ''}</div>
                <div style="${item.correctAnswers.includes('D') ? 'color:#10b981; font-weight:700;' : ''}"><b>D)</b> ${item.options.D || '-'} ${item.correctAnswers.includes('D') ? '✓' : ''}</div>
            </div>
            ${(expHtml || item.explanationImagePreviewUrl) ? `<div style="margin-top:8px; font-size:12px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:6px; line-height:1.6;"><b>Exp:</b> ${expHtml}${item.explanationImagePreviewUrl ? `<div class="mcq-explanation-img-wrap"><img src="${item.explanationImagePreviewUrl}" style="max-height:140px;"></div>` : ''}</div>` : ''}
        `;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(prevEl, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }
    updateBulkQueueSummaryHeader();
}

function updateBulkItemField(idx, field, value) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    if (field === 'A' || field === 'B' || field === 'C' || field === 'D') {
        item.options[field] = value;
    } else {
        item[field] = value;
    }
    refreshSingleBulkCardPreview(idx);
}

function toggleBulkItemCorrectAns(idx, letter, checked) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    if (checked && !item.correctAnswers.includes(letter)) {
        item.correctAnswers.push(letter);
    } else if (!checked) {
        item.correctAnswers = item.correctAnswers.filter(x => x !== letter);
    }
    renderAdminBulkStagingQueue();
}

function toggleBulkCardExtraTools(idx) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    item.showTools = !item.showTools;
    const drawer = document.getElementById(`bulkCardToolsDrawer_${idx}`);
    if (drawer) drawer.style.display = item.showTools ? 'block' : 'none';
}

function handleBulkCardImageBlob(idx, slot, blob) {
    const item = adminBulkStagedQuestions[idx];
    if (!item || !blob) return;
    const url = URL.createObjectURL(blob);
    if (slot === 'QUESTION') {
        item.questionImageBlob = blob;
        item.questionImagePreviewUrl = url;
    } else if (slot === 'DIAGRAM') {
        item.diagramBlob = blob;
        item.diagramPreviewUrl = url;
    } else if (slot === 'EXPLANATION') {
        item.explanationImageBlob = blob;
        item.explanationImagePreviewUrl = url;
    }
    renderAdminBulkStagingQueue();
    showNotification(`📸 Attached ${slot.toLowerCase()} image to Question #${idx + 1}!`);
}

function handleBulkCardFileSelect(inputEl, idx, slot) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    handleBulkCardImageBlob(idx, slot, inputEl.files[0]);
}

function handleBulkCardPasteImage(event, idx, slot) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let it of items) {
        if (it.type && it.type.indexOf('image') !== -1) {
            event.preventDefault();
            event.stopPropagation();
            handleBulkCardImageBlob(idx, slot, it.getAsFile());
            return;
        }
    }
}

async function triggerBulkCardClipboardPaste(idx, slot) {
    try {
        if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
            const clipItems = await navigator.clipboard.read();
            for (const clipItem of clipItems) {
                const imgType = clipItem.types.find(t => t.startsWith('image/'));
                if (imgType) {
                    const blob = await clipItem.getType(imgType);
                    handleBulkCardImageBlob(idx, slot, blob);
                    return;
                }
            }
            showNotification('⚠️ No screenshot found on clipboard. Take a screenshot first!');
        } else {
            throw new Error('Clipboard read unsupported');
        }
    } catch (e) {
        showNotification('📋 Click inside the Question/Explanation box on this card and press Ctrl+V to paste screenshot!');
    }
}

function clearBulkCardImageSlot(idx, slot) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    if (slot === 'QUESTION') {
        item.questionImageBlob = null;
        item.questionImagePreviewUrl = '';
    } else if (slot === 'DIAGRAM') {
        item.diagramBlob = null;
        item.diagramPreviewUrl = '';
        item.diagramCaption = '';
    } else if (slot === 'EXPLANATION') {
        item.explanationImageBlob = null;
        item.explanationImagePreviewUrl = '';
    }
    renderAdminBulkStagingQueue();
}

function toggleBulkCardMatchTable(idx, enabled) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    item.matchTable.enabled = Boolean(enabled);
    renderAdminBulkStagingQueue();
}

function resizeBulkCardMatchTable(idx, dRows, dCols) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    item.matchTable.rows = Math.min(10, Math.max(1, item.matchTable.rows + dRows));
    item.matchTable.cols = Math.min(5, Math.max(1, item.matchTable.cols + dCols));
    while (item.matchTable.cells.length < item.matchTable.rows) {
        item.matchTable.cells.push(['', '', '', '', '']);
    }
    renderAdminBulkStagingQueue();
}

function updateBulkCardMatchHeader(idx, colIdx, val) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    item.matchTable.headers[colIdx] = val;
    refreshSingleBulkCardPreview(idx);
}

function updateBulkCardMatchCell(idx, rowIdx, colIdx, val) {
    const item = adminBulkStagedQuestions[idx];
    if (!item) return;
    if (!item.matchTable.cells[rowIdx]) item.matchTable.cells[rowIdx] = ['', '', '', '', ''];
    item.matchTable.cells[rowIdx][colIdx] = val;
    refreshSingleBulkCardPreview(idx);
}

function removeBulkStagedCard(idx) {
    adminBulkStagedQuestions.splice(idx, 1);
    if (adminBulkStagedQuestions.length === 0) {
        clearBulkStagedQueue();
    } else {
        renderAdminBulkStagingQueue();
    }
}

function addBlankQuestionToBulkQueue() {
    const defaultDiff = document.getElementById('admDifficulty')?.value || 'Mixed';
    adminBulkStagedQuestions.push(parseSingleMCQBlockAccurate('', defaultDiff));
    renderAdminBulkStagingQueue();
}

function applyBulkGlobalDifficulty(level) {
    if (!level) return;
    adminBulkStagedQuestions.forEach(q => { q.level = level; });
    renderAdminBulkStagingQueue();
    showNotification(`🎯 Set difficulty of all ${adminBulkStagedQuestions.length} questions to ${level}!`);
}

function bulkAutoSplitAllStatements() {
    adminBulkStagedQuestions.forEach(item => {
        // Also run Match-the-Column auto-detection if not already enabled
        if (!item.matchTable || !item.matchTable.enabled) {
            const det = autoExtractUniversalMatchTableFromQuestionStem(item.question);
            if (det.matchTable) {
                item.question = det.cleanQuestion;
                item.matchTable = det.matchTable;
                item.showTools = true;
            }
        }
        let s = item.question || '';
        s = s.replace(/([^\n])\s+(\b(?:I|II|III|IV|V|VI|VII)\.\s+)/g, '$1\n$2');
        s = s.replace(/([^\n])\s+(\((?:i|ii|iii|iv|v|vi|I|II|III|IV|V|VI)\)\s+)/g, '$1\n$2');
        s = s.replace(/([^\n])\s+(\b(?:Statement\s*(?:I|II|III|IV|1|2|3|4)|Assertion\s*\(?A\)?|Reason\s*\(?R\)?)\s*[:\-])/gi, '$1\n$2');
        s = s.replace(/([^\n])\s+((?:Which\s+of\s+the\s+(?:above|following)|Select\s+the\s+correct|Choose\s+the\s+correct|In\s+the\s+light\s+of|How\s+many\s+of\s+the\s+above)\b)/gi, '$1\n\n$2');
        item.question = s;
    });
    renderAdminBulkStagingQueue();
    showNotification('📑 Statements separated & Match Tables checked across all staged questions!');
}

function bulkAutoFormatAllChemistry() {
    const fmt = (str) => {
        if (!str) return '';
        return str
            .replace(/<=>|<-->/g, '$\\rightleftharpoons$')
            .replace(/-->|->/g, '$\\rightarrow$')
            .replace(/\b([A-Z][a-z]?)(\d+)\b/g, '$1$_$2$')
            .replace(/\^(\d+[+\-]|[+\-]\d*)/g, '$^{$1}$');
    };
    adminBulkStagedQuestions.forEach(item => {
        item.question = fmt(item.question);
        item.options.A = fmt(item.options.A);
        item.options.B = fmt(item.options.B);
        item.options.C = fmt(item.options.C);
        item.options.D = fmt(item.options.D);
        item.explanation = fmt(item.explanation);
    });
    renderAdminBulkStagingQueue();
    showNotification('🪄 Formatted chemical reactions & subscripts across all staged questions!');
}

function renderAdminBulkStagingQueue() {
    const panel = document.getElementById('admBulkStagingPanel');
    const list = document.getElementById('admBulkCardsList');
    if (!panel || !list) return;

    if (!adminBulkStagedQuestions.length) {
        panel.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    panel.style.display = 'block';
    updateBulkQueueSummaryHeader();

    const escAttr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

    list.innerHTML = adminBulkStagedQuestions.map((item, idx) => {
        const ready = isBulkItemReady(item);
        const mt = item.matchTable;
        let matchTableGridHtml = '';
        if (mt.enabled) {
            let ths = '';
            for (let c = 0; c < mt.cols; c++) {
                ths += `<th style="padding:4px;"><input type="text" class="input-field" value="${escAttr(mt.headers[c] || `Column ${c + 1}`)}" onfocus="setLastFocusedFormulaInput(this)" oninput="updateBulkCardMatchHeader(${idx}, ${c}, this.value)" style="margin:0; padding:6px 8px; font-size:12px; font-weight:800; color:#fdb813; background:#0f1523;"></th>`;
            }
            let trs = '';
            for (let r = 0; r < mt.rows; r++) {
                let tds = '';
                for (let c = 0; c < mt.cols; c++) {
                    const cellVal = (mt.cells[r] && mt.cells[r][c]) || '';
                    tds += `<td style="padding:4px;"><input type="text" class="input-field" value="${escAttr(cellVal)}" onfocus="setLastFocusedFormulaInput(this)" oninput="updateBulkCardMatchCell(${idx}, ${r}, ${c}, this.value)" style="margin:0; padding:6px 8px; font-size:12px;"></td>`;
                }
                trs += `<tr>${tds}</tr>`;
            }
            matchTableGridHtml = `
                <div style="margin-top:8px; background:#0d1322; border:1px solid #2b3954; border-radius:8px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                        <span style="font-size:11.5px; color:#c084fc; font-weight:800;">📊 Auto-Built Match-the-Column Table (#${idx + 1})</span>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span style="font-size:11px; color:#94a3b8;">Rows: ${mt.rows}</span>
                            <button type="button" onclick="resizeBulkCardMatchTable(${idx}, -1, 0)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px 7px; cursor:pointer;">−</button>
                            <button type="button" onclick="resizeBulkCardMatchTable(${idx}, 1, 0)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px 7px; cursor:pointer;">+</button>
                            <span style="font-size:11px; color:#94a3b8; margin-left:6px;">Cols: ${mt.cols}</span>
                            <button type="button" onclick="resizeBulkCardMatchTable(${idx}, 0, -1)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px 7px; cursor:pointer;">−</button>
                            <button type="button" onclick="resizeBulkCardMatchTable(${idx}, 0, 1)" style="background:#1e293b; color:#fff; border:1px solid #334155; border-radius:4px; padding:2px 7px; cursor:pointer;">+</button>
                        </div>
                    </div>
                    <div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>
                </div>
            `;
        }

        return `
            <div id="bulkStagedCard_${idx}" style="background:#0d121f; border:1.5px solid ${ready ? 'rgba(56,189,248,0.35)' : 'rgba(239,68,68,0.65)'}; border-radius:12px; padding:14px; transition:0.2s;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #1e293b;">
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <span style="background:var(--primary-yellow); color:#000; font-weight:900; font-size:12px; padding:3px 10px; border-radius:6px;">Q #${idx + 1}</span>
                        <span id="bulkCardStatusBadge_${idx}" style="background:${ready ? 'rgba(16,185,129,0.16)' : 'rgba(239,68,68,0.18)'}; color:${ready ? '#10b981' : '#ef4444'}; border:1px solid ${ready ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.45)'}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:800;">
                            ${ready ? `🟢 Correct Option Auto-Filled: (${item.correctAnswers.join(', ')})${mt.enabled ? ' • 📊 Table Auto-Built' : ''}` : '⚠️ Click A / B / C / D below to select Correct Answer'}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <button type="button" onclick="loadBulkCardIntoMainSingleForm(${idx})" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:6px; padding:5px 10px; font-size:11px; font-weight:700; cursor:pointer;">⬆️ Edit in Main Form</button>
                        <button type="button" onclick="toggleBulkCardExtraTools(${idx})" style="background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.4); border-radius:6px; padding:5px 10px; font-size:11px; font-weight:700; cursor:pointer;">
                            🖼️ + Image / Diagram / Match Table ${(item.questionImageBlob || item.diagramBlob || item.explanationImageBlob || mt.enabled) ? '●' : ''}
                        </button>
                        <select class="input-field" onchange="updateBulkItemField(${idx}, 'level', this.value)" style="margin:0; width:auto; padding:4px 9px; font-size:11.5px; font-weight:700;">
                            <option value="Mixed" ${item.level === 'Mixed' ? 'selected' : ''}>Mixed</option>
                            <option value="Easy" ${item.level === 'Easy' ? 'selected' : ''}>Easy</option>
                            <option value="Medium" ${item.level === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="Hard" ${item.level === 'Hard' ? 'selected' : ''}>Hard</option>
                        </select>
                        <button type="button" onclick="removeBulkStagedCard(${idx})" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.35); border-radius:6px; padding:4px 9px; font-size:11px; font-weight:700; cursor:pointer;">🗑️ Remove</button>
                    </div>
                </div>

                <div style="font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:700;">✏️ Edit Question Text Manually (if needed):</div>
                <textarea class="input-field" style="min-height:68px; font-size:13.5px; margin-bottom:8px;" placeholder="Question #${idx + 1} text (or paste screenshot with Ctrl+V)..." onfocus="setLastFocusedFormulaInput(this)" oninput="updateBulkItemField(${idx}, 'question', this.value)" onpaste="handleBulkCardPasteImage(event, ${idx}, 'QUESTION')">${item.question}</textarea>

                <div id="bulkCardToolsDrawer_${idx}" style="display:${item.showTools ? 'block' : 'none'}; background:#111729; border:1px dashed #334155; border-radius:10px; padding:12px; margin-bottom:10px;">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px;">
                        <div style="background:#0b0f19; border:1px solid rgba(56,189,248,0.35); border-radius:8px; padding:9px;" onpaste="handleBulkCardPasteImage(event, ${idx}, 'QUESTION')">
                            <div style="font-size:11.5px; font-weight:800; color:#38bdf8; margin-bottom:6px;">📸 Question Image / Screenshot</div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <input type="file" id="bulkQImgFile_${idx}" accept="image/*" style="display:none;" onchange="handleBulkCardFileSelect(this, ${idx}, 'QUESTION')">
                                <button type="button" onclick="triggerBulkCardClipboardPaste(${idx}, 'QUESTION')" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:5px; padding:4px 8px; font-size:11px; font-weight:700; cursor:pointer;">📋 Paste</button>
                                <button type="button" onclick="document.getElementById('bulkQImgFile_${idx}').click()" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">📁 Upload</button>
                                ${item.questionImagePreviewUrl ? `<button type="button" onclick="clearBulkCardImageSlot(${idx}, 'QUESTION')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:none; border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">✕</button>` : ''}
                            </div>
                        </div>

                        <div style="background:#0b0f19; border:1px solid rgba(253,184,19,0.35); border-radius:8px; padding:9px;" onpaste="handleBulkCardPasteImage(event, ${idx}, 'DIAGRAM')">
                            <div style="font-size:11.5px; font-weight:800; color:#fdb813; margin-bottom:6px;">📐 Dedicated Diagram / Circuit</div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
                                <input type="file" id="bulkDiagFile_${idx}" accept="image/*" style="display:none;" onchange="handleBulkCardFileSelect(this, ${idx}, 'DIAGRAM')">
                                <button type="button" onclick="triggerBulkCardClipboardPaste(${idx}, 'DIAGRAM')" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:5px; padding:4px 8px; font-size:11px; font-weight:700; cursor:pointer;">📋 Paste</button>
                                <button type="button" onclick="document.getElementById('bulkDiagFile_${idx}').click()" style="background:rgba(253,184,19,0.15); color:#fdb813; border:1px solid rgba(253,184,19,0.4); border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">📁 Upload</button>
                                ${item.diagramPreviewUrl ? `<button type="button" onclick="clearBulkCardImageSlot(${idx}, 'DIAGRAM')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:none; border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">✕</button>` : ''}
                            </div>
                            <div style="display:flex; gap:5px;">
                                <input type="text" class="input-field" placeholder="Caption (e.g. Fig 1)" value="${escAttr(item.diagramCaption)}" oninput="updateBulkItemField(${idx}, 'diagramCaption', this.value)" style="margin:0; padding:4px 7px; font-size:11px; flex:1;">
                                <select class="input-field" onchange="updateBulkItemField(${idx}, 'diagramBgMode', this.value)" style="margin:0; padding:4px 6px; font-size:11px; width:auto;">
                                    <option value="light" ${item.diagramBgMode === 'light' ? 'selected' : ''}>☀️ White</option>
                                    <option value="dark" ${item.diagramBgMode === 'dark' ? 'selected' : ''}>🌙 Dark</option>
                                </select>
                            </div>
                        </div>

                        <div style="background:#0b0f19; border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:9px;" onpaste="handleBulkCardPasteImage(event, ${idx}, 'EXPLANATION')">
                            <div style="font-size:11.5px; font-weight:800; color:#10b981; margin-bottom:6px;">🖼️ Explanation Solution Image</div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <input type="file" id="bulkExpFile_${idx}" accept="image/*" style="display:none;" onchange="handleBulkCardFileSelect(this, ${idx}, 'EXPLANATION')">
                                <button type="button" onclick="triggerBulkCardClipboardPaste(${idx}, 'EXPLANATION')" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:5px; padding:4px 8px; font-size:11px; font-weight:700; cursor:pointer;">📋 Paste</button>
                                <button type="button" onclick="document.getElementById('bulkExpFile_${idx}').click()" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">📁 Upload</button>
                                ${item.explanationImagePreviewUrl ? `<button type="button" onclick="clearBulkCardImageSlot(${idx}, 'EXPLANATION')" style="background:rgba(239,68,68,0.15); color:#ef4444; border:none; border-radius:5px; padding:4px 8px; font-size:11px; cursor:pointer;">✕</button>` : ''}
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:8px;">
                        <label style="display:inline-flex; align-items:center; gap:7px; font-size:12px; color:#c084fc; font-weight:700; cursor:pointer;">
                            <input type="checkbox" ${mt.enabled ? 'checked' : ''} onchange="toggleBulkCardMatchTable(${idx}, this.checked)" style="accent-color:#a855f7;">
                            <span>📊 Enable Custom Match-the-Column Table for Q #${idx + 1}</span>
                        </label>
                        ${matchTableGridHtml}
                    </div>
                </div>

                <div style="font-size:11px; color:#94a3b8; margin-bottom:4px; font-weight:700;">✅ Options &amp; Auto-Detected Correct Answer (Click checkbox A/B/C/D or edit option text anytime):</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                    ${['A', 'B', 'C', 'D'].map(letter => `
                        <div style="display:flex; align-items:center; gap:6px; background:${item.correctAnswers.includes(letter) ? 'rgba(16,185,129,0.12)' : '#13192a'}; border:1.5px solid ${item.correctAnswers.includes(letter) ? '#10b981' : '#263147'}; border-radius:8px; padding:4px 8px;">
                            <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-weight:900; font-size:13px; color:${item.correctAnswers.includes(letter) ? '#10b981' : '#94a3b8'}; user-select:none;" title="Mark ${letter} as Correct Answer">
                                <input type="checkbox" ${item.correctAnswers.includes(letter) ? 'checked' : ''} onchange="toggleBulkItemCorrectAns(${idx}, '${letter}', this.checked)" style="accent-color:#10b981; width:16px; height:16px; cursor:pointer;">
                                ${letter}
                            </label>
                            <input type="text" class="input-field" value="${escAttr(item.options[letter])}" placeholder="Option ${letter}" onfocus="setLastFocusedFormulaInput(this)" oninput="updateBulkItemField(${idx}, '${letter}', this.value)" style="margin:0; border:none; background:transparent; padding:5px 4px; font-size:13px; color:#fff;">
                        </div>
                    `).join('')}
                </div>

                <textarea class="input-field" style="min-height:48px; font-size:12.5px; margin-bottom:8px;" placeholder="Explanation (Optional — edit text or press Ctrl+V to paste solution screenshot)..." onfocus="setLastFocusedFormulaInput(this)" oninput="updateBulkItemField(${idx}, 'explanation', this.value)" onpaste="handleBulkCardPasteImage(event, ${idx}, 'EXPLANATION')">${item.explanation}</textarea>

                <div id="bulkCardLivePreview_${idx}" style="background:#080c15; border:1px solid rgba(253,184,19,0.28); border-radius:8px; padding:10px 12px; font-size:13px;"></div>
            </div>
        `;
    }).join('');

    adminBulkStagedQuestions.forEach((_, idx) => refreshSingleBulkCardPreview(idx));
}

async function uploadAllBulkStagedMCQs() {
    if (!adminBulkStagedQuestions.length) return showNotification('⚠️ No questions in the bulk queue.');
    const targetPath = adminSelectedPath.join(' > ');
    if (!targetPath) return showNotification('⚠️ Select a Target Destination folder in Step 1 first.');

    const incompleteIdx = adminBulkStagedQuestions.findIndex(q => !isBulkItemReady(q));
    if (incompleteIdx !== -1) {
        const card = document.getElementById(`bulkStagedCard_${incompleteIdx}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return alert(`⚠️ Question #${incompleteIdx + 1} is missing a Correct Answer or Option A/B. Please check card #${incompleteIdx + 1} and tick its Correct Answer checkbox before uploading!`);
    }

    const btn = document.getElementById('btnUploadAllBulkMCQs');
    if (btn) { btn.disabled = true; btn.innerText = '⏳ Uploading Batch...'; }

    try {
        const leaf = (adminSelectedPath[adminSelectedPath.length - 1] || '').replace(/^\d+\.\s*/, '').trim();
        const total = adminBulkStagedQuestions.length;
        const preparedDocs = [];

        for (let i = 0; i < total; i++) {
            const item = adminBulkStagedQuestions[i];
            if (btn) btn.innerText = `⏳ Processing Q ${i + 1} of ${total}...`;

            let questionImageUrl = null;
            if (item.questionImageBlob) {
                if (btn) btn.innerText = `☁️ Uploading Q#${i + 1} Image...`;
                questionImageUrl = await uploadFileToCloudinary(item.questionImageBlob);
            }

            let diagramUrl = null;
            if (item.diagramBlob) {
                if (btn) btn.innerText = `☁️ Uploading Q#${i + 1} Diagram...`;
                diagramUrl = await uploadFileToCloudinary(item.diagramBlob);
            }

            let explanationImageUrl = null;
            if (item.explanationImageBlob) {
                if (btn) btn.innerText = `☁️ Uploading Q#${i + 1} Solution Image...`;
                explanationImageUrl = await uploadFileToCloudinary(item.explanationImageBlob);
            }

            let finalQuestionHtml = formatMultilineTextToHtml(item.question.trim());
            const matchTableHtml = buildBulkItemMatchTableHtml(item);

            if (questionImageUrl) {
                const safeQUrl = questionImageUrl.replace(/'/g, "\\'");
                const qImgBlock = `<div class="mcq-question-text-img-wrap"><img src="${questionImageUrl}" alt="Question" onclick="openStudentDiagramLightbox('${safeQUrl}', 'Question Image')" title="Tap to zoom"></div>`;
                finalQuestionHtml = finalQuestionHtml ? `${finalQuestionHtml}${qImgBlock}` : qImgBlock;
            }
            if (matchTableHtml) {
                finalQuestionHtml = `${finalQuestionHtml}${matchTableHtml}`;
            }
            if (diagramUrl) {
                const safeDUrl = diagramUrl.replace(/'/g, "\\'");
                const safeCap = (item.diagramCaption || '').replace(/'/g, "\\'");
                const bgClass = item.diagramBgMode === 'dark' ? 'bg-dark' : 'bg-light';
                const capHtml = item.diagramCaption
                    ? `<div class="mcq-diagram-caption">📐 ${item.diagramCaption} <span style="font-size:10.5px; opacity:0.7;">(Tap to zoom)</span></div>`
                    : `<div class="mcq-diagram-caption" style="font-size:11px; opacity:0.7;">🔍 Tap diagram to zoom</div>`;
                const diagBlock = `<div class="mcq-diagram-card ${bgClass}"><img src="${diagramUrl}" alt="Diagram" onclick="openStudentDiagramLightbox('${safeDUrl}', '${safeCap}')">${capHtml}</div>`;
                finalQuestionHtml = `${finalQuestionHtml}${diagBlock}`;
            }

            let finalExplanationHtml = formatMultilineTextToHtml(item.explanation.trim());
            if (explanationImageUrl) {
                const safeEUrl = explanationImageUrl.replace(/'/g, "\\'");
                const expImgBlock = `<div class="mcq-explanation-img-wrap"><img src="${explanationImageUrl}" alt="Explanation Solution" onclick="openStudentDiagramLightbox('${safeEUrl}', 'Solution / Explanation')" title="Tap to zoom"></div>`;
                finalExplanationHtml = finalExplanationHtml ? `${finalExplanationHtml}${expImgBlock}` : expImgBlock;
            }

            let level = item.level || 'Mixed';
            if (['Easy', 'Medium', 'Hard', 'Mixed'].includes(leaf) && level === 'Mixed') level = leaf;

            preparedDocs.push({
                type: 'mcq',
                path: targetPath,
                level,
                question: finalQuestionHtml,
                rawQuestionText: item.question.trim(),
                options: {
                    A: item.options.A.trim(),
                    B: item.options.B.trim(),
                    C: item.options.C.trim(),
                    D: item.options.D.trim()
                },
                correctAnswers: item.correctAnswers,
                explanation: finalExplanationHtml,
                imageUrl: null,
                questionImageUrl,
                diagramUrl,
                diagramCaption: item.diagramCaption || '',
                explanationImageUrl,
                randomKey: Math.random()
            });
        }

        const nowMs = Date.now();
        for (let i = 0; i < preparedDocs.length; i += 400) {
            const batch = db.batch();
            preparedDocs.slice(i, i + 400).forEach((docData, idx) => {
                const ref = db.collection('content').doc();
                batch.set(ref, {
                    ...docData,
                    timestamp: firebase.firestore.Timestamp.fromMillis(nowMs - (i + idx) * 1000)
                });
            });
            await batch.commit();
        }

        document.getElementById('admSmartPasteInput').value = '';
        clearBulkStagedQueue();
        showNotification(`🎉 Successfully uploaded all ${preparedDocs.length} questions in 1 click!`);
        refreshAutoMixAvailableCounts();
    } catch (err) {
        alert('⚠️ Bulk Upload Error: ' + err.message);
    }
    if (btn) {
        btn.disabled = false;
        btn.innerText = '☁️ Upload All Questions Now';
    }
}

function insertAdminFormulaAtCursor(snippet) {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target) return;
    target.focus();
    const start = target.selectionStart !== undefined ? target.selectionStart : target.value.length;
    const end = target.selectionEnd !== undefined ? target.selectionEnd : target.value.length;
    const text = target.value;
    target.value = text.substring(0, start) + snippet + text.substring(end);
    const nextPos = start + snippet.length;
    target.selectionStart = target.selectionEnd = nextPos;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
}

function formatPlainChemistryToLatex() {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target || !target.value.trim()) {
        return showNotification('⚠️ Click inside Question, Table Cell, Option, or Explanation with text first.');
    }
    let s = target.value;
    s = s.replace(/<=>|<-->/g, '$\\rightleftharpoons$');
    s = s.replace(/-->|->/g, '$\\rightarrow$');
    s = s.replace(/\b([A-Z][a-z]?)(\d+)\b/g, '$1$_$2$');
    s = s.replace(/\^(\d+[+\-]|[+\-]\d*)/g, '$^{$1}$');
    target.value = s;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    updateAdminLiveFormulaPreview();
    showNotification('✨ Reactions & subscripts formatted!');
}

// ==========================================
// 📊 MATCH-THE-COLUMN / CUSTOM TABLE BUILDER FUNCTIONS
// ==========================================
function toggleAdminMatchTableBuilder(checked) {
    adminMatchTableState.enabled = Boolean(checked);
    const wrap = document.getElementById('admMatchTableBuilderWrap');
    if (wrap) wrap.style.display = adminMatchTableState.enabled ? 'block' : 'none';
    if (adminMatchTableState.enabled) {
        renderAdminMatchTableInputs();
    }
    updateAdminLiveFormulaPreview();
}

function resizeAdminMatchTable(deltaRows, deltaCols) {
    adminMatchTableState.rows = Math.min(10, Math.max(1, adminMatchTableState.rows + deltaRows));
    adminMatchTableState.cols = Math.min(5, Math.max(1, adminMatchTableState.cols + deltaCols));
    while (adminMatchTableState.cells.length < adminMatchTableState.rows) {
        adminMatchTableState.cells.push(['', '', '', '', '']);
    }
    renderAdminMatchTableInputs();
    updateAdminLiveFormulaPreview();
}

function updateAdminMatchTableHeader(colIdx, val) {
    adminMatchTableState.headers[colIdx] = val;
    updateAdminLiveFormulaPreview();
}

function updateAdminMatchTableCell(rowIdx, colIdx, val) {
    if (!adminMatchTableState.cells[rowIdx]) adminMatchTableState.cells[rowIdx] = ['', '', '', '', ''];
    adminMatchTableState.cells[rowIdx][colIdx] = val;
    updateAdminLiveFormulaPreview();
}

function applyMatchTablePrefixPreset(preset) {
    const roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    const lower = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const upper = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const pqrs  = ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];

    for (let r = 0; r < adminMatchTableState.rows; r++) {
        let c0 = (adminMatchTableState.cells[r][0] || '').replace(/^[a-zA-Z0-9\(\)\.\-]+\s*/, '');
        let c1 = (adminMatchTableState.cells[r][1] || '').replace(/^[a-zA-Z0-9\(\)\.\-]+\s*/, '');
        if (preset === 'abcd_roman') {
            adminMatchTableState.cells[r][0] = `${lower[r]}. ${c0}`;
            if (adminMatchTableState.cols >= 2) adminMatchTableState.cells[r][1] = `${roman[r]}. ${c1}`;
        } else if (preset === 'ABCD_1234') {
            adminMatchTableState.cells[r][0] = `${upper[r]}. ${c0}`;
            if (adminMatchTableState.cols >= 2) adminMatchTableState.cells[r][1] = `${r + 1}. ${c1}`;
        } else if (preset === 'PQRS_1234') {
            adminMatchTableState.cells[r][0] = `${pqrs[r]}. ${c0}`;
            if (adminMatchTableState.cols >= 2) adminMatchTableState.cells[r][1] = `${r + 1}. ${c1}`;
        }
    }
    renderAdminMatchTableInputs();
    updateAdminLiveFormulaPreview();
}

function resetAdminMatchTableCells() {
    for (let r = 0; r < 10; r++) {
        adminMatchTableState.cells[r] = ['', '', '', '', ''];
    }
    renderAdminMatchTableInputs();
    updateAdminLiveFormulaPreview();
}

function renderAdminMatchTableInputs() {
    const container = document.getElementById('admMatchTableInputsContainer');
    const rBadge = document.getElementById('admTableRowsBadge');
    const cBadge = document.getElementById('admTableColsBadge');
    if (rBadge) rBadge.innerText = adminMatchTableState.rows;
    if (cBadge) cBadge.innerText = adminMatchTableState.cols;
    if (!container) return;

    const cols = adminMatchTableState.cols;
    const rows = adminMatchTableState.rows;

    let html = `<table style="width:100%; border-collapse:collapse; min-width:420px;"><thead><tr>`;
    for (let c = 0; c < cols; c++) {
        const hVal = (adminMatchTableState.headers[c] || `Column ${c + 1}`).replace(/"/g, '&quot;');
        html += `<th style="padding:6px; background:#1a2234; border:1px solid #2b3954;">
            <input type="text" class="input-field" value="${hVal}" placeholder="Column Header ${c + 1} (e.g. Column I (Order))" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminMatchTableHeader(${c}, this.value)" style="margin:0; padding:8px 10px; font-weight:800; font-size:13px; color:#fdb813; background:#0f1523; border-color:#334155;">
        </th>`;
    }
    html += `</tr></thead><tbody>`;

    for (let r = 0; r < rows; r++) {
        html += `<tr>`;
        for (let c = 0; c < cols; c++) {
            const cVal = ((adminMatchTableState.cells[r] && adminMatchTableState.cells[r][c]) || '').replace(/"/g, '&quot;');
            html += `<td style="padding:5px; background:#131824; border:1px solid #263147;">
                <input type="text" class="input-field" value="${cVal}" placeholder="Row ${r + 1}, Col ${c + 1}" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminMatchTableCell(${r}, ${c}, this.value)" style="margin:0; padding:8px 10px; font-size:13px; color:#fff; background:#0b0f19;">
            </td>`;
        }
        html += `</tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function formatCellWithBoldPrefix(rawCell) {
    let safe = String(rawCell || '').trim();
    if (!safe) return '';
    return safe.replace(/^([a-zA-Z0-9\(\)]{1,5}[\.\)])(\s+)/, '<b>$1</b>$2');
}

function buildMatchTableHtmlForQuestion() {
    if (!adminMatchTableState.enabled) return '';
    const cols = adminMatchTableState.cols;
    const rows = adminMatchTableState.rows;

    let hasAnyContent = false;
    let theadHtml = '<tr>';
    for (let c = 0; c < cols; c++) {
        let hText = (adminMatchTableState.headers[c] || '').trim();
        theadHtml += `<th>${hText || `Column ${c + 1}`}</th>`;
    }
    theadHtml += '</tr>';

    let tbodyHtml = '';
    for (let r = 0; r < rows; r++) {
        let rowCells = [];
        let rowHasText = false;
        for (let c = 0; c < cols; c++) {
            let val = (adminMatchTableState.cells[r] && adminMatchTableState.cells[r][c]) ? adminMatchTableState.cells[r][c].trim() : '';
            if (val) rowHasText = true;
            rowCells.push(`<td>${formatCellWithBoldPrefix(val)}</td>`);
        }
        if (rowHasText) {
            hasAnyContent = true;
            tbodyHtml += `<tr>${rowCells.join('')}</tr>`;
        }
    }

    if (!hasAnyContent) return '';
    return `<div class="mcq-match-table-wrap"><table class="mcq-match-table"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></div>`;
}

// ==========================================
// 📸 UNIVERSAL SCREENSHOT PASTE & FILE UPLOAD (QUESTION, DIAGRAM, EXPLANATION)
// ==========================================
function getSlotDomIds(slot) {
    if (slot === 'QUESTION') {
        return { fileId: 'admQTextImageFile', wrapId: 'admQTextImgPreviewWrap', imgId: 'admQTextImgPreview', clrId: 'btnClearQTextImg', label: 'Question Image' };
    } else if (slot === 'DIAGRAM') {
        return { fileId: 'admQImage', wrapId: 'admDiagramPreviewWrap', imgId: 'admDiagramPreviewImg', clrId: 'btnClearDiagramImg', label: 'Diagram Image' };
    } else {
        return { fileId: 'admExpImageFile', wrapId: 'admExpImgPreviewWrap', imgId: 'admExpImgPreview', clrId: 'btnClearExpImg', label: 'Explanation Image' };
    }
}

function applyBlobOrFileToSlot(slot, blobOrFile) {
    if (!blobOrFile) return;
    adminImageSlots[slot] = blobOrFile;
    const { wrapId, imgId, clrId, label } = getSlotDomIds(slot);
    const url = URL.createObjectURL(blobOrFile);
    const wrap = document.getElementById(wrapId);
    const img = document.getElementById(imgId);
    const clr = document.getElementById(clrId);
    if (img) img.src = url;
    if (wrap) wrap.style.display = 'block';
    if (clr) clr.style.display = 'inline-block';
    if (slot === 'DIAGRAM') updateAdminDiagramPreviewBg();
    showNotification(`📸 ${label} attached!`);
}

function handleUniversalFileSelect(inputEl, slot) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    applyBlobOrFileToSlot(slot, inputEl.files[0]);
}

function handleUniversalImagePaste(event, slot) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
        if (item.type && item.type.indexOf('image') !== -1) {
            event.preventDefault();
            event.stopPropagation();
            const blob = item.getAsFile();
            applyBlobOrFileToSlot(slot, blob);
            return;
        }
    }
}

async function triggerClipboardImagePaste(slot) {
    try {
        if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imgType = item.types.find(t => t.startsWith('image/'));
                if (imgType) {
                    const blob = await item.getType(imgType);
                    applyBlobOrFileToSlot(slot, blob);
                    return;
                }
            }
            showNotification('⚠️ No screenshot found on clipboard. Take a screenshot first, then click Paste Screenshot!');
        } else {
            throw new Error('Clipboard read API not supported');
        }
    } catch (e) {
        const focusId = slot === 'QUESTION' ? 'admQuestion' : (slot === 'DIAGRAM' ? 'admDiagramCaption' : 'admExplanation');
        const el = document.getElementById(focusId);
        if (el) el.focus();
        showNotification('📋 Box focused! Now press Ctrl+V (Desktop) or Long-Press -> Paste (Mobile) to paste your screenshot.');
    }
}

function clearUniversalImageSlot(slot) {
    adminImageSlots[slot] = null;
    const { fileId, wrapId, imgId, clrId } = getSlotDomIds(slot);
    const f = document.getElementById(fileId);
    const wrap = document.getElementById(wrapId);
    const img = document.getElementById(imgId);
    const clr = document.getElementById(clrId);
    if (f) f.value = '';
    if (img) img.src = '';
    if (wrap) wrap.style.display = 'none';
    if (clr) clr.style.display = 'none';
    if (slot === 'DIAGRAM') {
        const cap = document.getElementById('admDiagramCaption');
        if (cap) cap.value = '';
    }
}

function updateAdminDiagramPreviewBg() {
    const mode = document.getElementById('admDiagramBgMode')?.value || 'light';
    const wrap = document.getElementById('admDiagramPreviewWrap');
    if (wrap) wrap.style.background = mode === 'dark' ? '#0d1527' : '#ffffff';
}

function updateAdminLiveFormulaPreview() {
    const card = document.getElementById('admLiveFormulaPreviewCard');
    const content = document.getElementById('admLiveFormulaPreviewContent');
    if (!card || !content) return;

    const qRaw = document.getElementById('admQuestion')?.value.trim() || '';
    const qFormatted = formatMultilineTextToHtml(qRaw);
    const tableHtml = buildMatchTableHtmlForQuestion();
    const a = document.getElementById('admOptA')?.value.trim() || '';
    const b = document.getElementById('admOptB')?.value.trim() || '';
    const c = document.getElementById('admOptC')?.value.trim() || '';
    const d = document.getElementById('admOptD')?.value.trim() || '';
    const expRaw = document.getElementById('admExplanation')?.value.trim() || '';
    const expFormatted = formatMultilineTextToHtml(expRaw);

    if (!qFormatted && !tableHtml && !a && !b && !c && !d && !expFormatted) {
        card.style.display = 'none';
        return;
    }
    card.style.display = 'block';
    content.innerHTML = `
        ${qFormatted ? `<div style="margin-bottom:10px; line-height:1.7;"><b>Q:</b> ${qFormatted}</div>` : ''}
        ${tableHtml}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:13px; color:#cbd5e1; margin-top:8px;">
            ${a ? `<div><b>A)</b> ${a}</div>` : ''}
            ${b ? `<div><b>B)</b> ${b}</div>` : ''}
            ${c ? `<div><b>C)</b> ${c}</div>` : ''}
            ${d ? `<div><b>D)</b> ${d}</div>` : ''}
        </div>
        ${expFormatted ? `<div style="margin-top:10px; font-size:12.5px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:8px; line-height:1.65;"><b>Exp:</b> ${expFormatted}</div>` : ''}
    `;

    if (typeof renderMathInElement === 'function') {
        renderMathInElement(content, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
}

function openStudentDiagramLightbox(imgSrc, captionText = '') {
    if (!imgSrc) return;
    let modal = document.getElementById('studentDiagramZoomModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'studentDiagramZoomModal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(5,8,17,0.94); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px;';
        modal.onclick = () => { modal.style.display = 'none'; };
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div style="max-width:95vw; max-height:85vh; background:#ffffff; padding:14px; border-radius:14px; box-shadow:0 15px 45px rgba(0,0,0,0.85); text-align:center;" onclick="event.stopPropagation()">
            <img src="${imgSrc}" style="max-width:88vw; max-height:74vh; object-fit:contain; display:block; margin:0 auto; border-radius:6px;">
            ${captionText ? `<div style="color:#0f172a; font-weight:800; font-size:14px; margin-top:10px;">${captionText}</div>` : ''}
        </div>
        <button type="button" style="margin-top:16px; background:#ef4444; color:#fff; border:none; padding:9px 22px; border-radius:30px; font-weight:800; cursor:pointer;">✕ Close Zoom</button>
    `;
    modal.style.display = 'flex';
}

function getBaseSubtopicPathForMixed() {
    if (!Array.isArray(adminSelectedPath) || adminSelectedPath.length === 0) return '';
    const last = adminSelectedPath[adminSelectedPath.length - 1].replace(/^\d+\.\s*/, '').trim().toLowerCase();
    if (['easy', 'medium', 'hard', 'mixed'].includes(last) && adminSelectedPath.length > 1) {
        return adminSelectedPath.slice(0, -1).join(' > ');
    }
    return adminSelectedPath.join(' > ');
}

async function fetchSubtopicDifficultyPools(baseSubtopicPath) {
    const snap = await db.collection('content')
        .where('path', '>=', baseSubtopicPath)
        .where('path', '<=', baseSubtopicPath + '\uf8ff')
        .get();

    const pools = { Easy: [], Medium: [], Hard: [], MixedDocs: [] };
    const seenSig = { Easy: new Set(), Medium: new Set(), Hard: new Set() };

    snap.forEach(doc => {
        const d = doc.data();
        if (d.type && d.type !== 'mcq') return;
        const p = (d.path || '').trim();
        const leaf = p.split(' > ').pop().replace(/^\d+\.\s*/, '').trim().toLowerCase();
        const lvl = (d.level || '').trim().toLowerCase();

        if (p === `${baseSubtopicPath} > Mixed` || leaf === 'mixed') {
            pools.MixedDocs.push({ id: doc.id, ref: doc.ref, data: d });
            return;
        }

        let targetBucket = null;
        if (leaf === 'easy' || lvl === 'easy') targetBucket = 'Easy';
        else if (leaf === 'medium' || lvl === 'medium') targetBucket = 'Medium';
        else if (leaf === 'hard' || lvl === 'hard') targetBucket = 'Hard';

        if (targetBucket) {
            const sig = `${d.question || ''}_${d.options?.A || ''}`;
            if (!seenSig[targetBucket].has(sig)) {
                seenSig[targetBucket].add(sig);
                pools[targetBucket].push({ id: doc.id, ...d, sourceLevel: targetBucket });
            }
        }
    });
    return pools;
}

async function refreshAutoMixAvailableCounts() {
    const baseSub = getBaseSubtopicPathForMixed();
    const txtEl = document.getElementById('autoMixDetectedSubtopicText');
    const badgesEl = document.getElementById('autoMixLiveCountsBadges');
    if (txtEl) txtEl.innerText = baseSub || 'Select a Subtopic above';
    if (!baseSub || !badgesEl) return;

    badgesEl.innerHTML = `<span style="color:#94a3b8; font-size:11.5px;">Checking...</span>`;
    try {
        const pools = await fetchSubtopicDifficultyPools(baseSub);
        badgesEl.innerHTML = `
            <span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:3px 9px; border-radius:20px; font-size:11px; font-weight:800;">🟢 Easy: ${pools.Easy.length}</span>
            <span style="background:rgba(234,179,8,0.15); color:#eab308; border:1px solid rgba(234,179,8,0.4); padding:3px 9px; border-radius:20px; font-size:11px; font-weight:800;">🟡 Medium: ${pools.Medium.length}</span>
            <span style="background:rgba(244,63,94,0.15); color:#f43f5e; border:1px solid rgba(244,63,94,0.4); padding:3px 9px; border-radius:20px; font-size:11px; font-weight:800;">🔴 Hard: ${pools.Hard.length}</span>
            <span style="background:rgba(168,85,247,0.18); color:#c084fc; border:1px solid rgba(168,85,247,0.4); padding:3px 9px; border-radius:20px; font-size:11px; font-weight:800;">⚡ In Mixed: ${pools.MixedDocs.length}</span>
        `;
    } catch (e) {
        badgesEl.innerHTML = `<span style="color:#ef4444; font-size:11px;">Could not load counts</span>`;
    }
}

function shuffleArrayNonSerial(arr) {
    const copy = [...arr];
    for (let pass = 0; pass < 3; pass++) {
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
    }
    return copy;
}

async function generateAutoMixedQuestionsForSubtopic() {
    const baseSub = getBaseSubtopicPathForMixed();
    if (!baseSub) return showNotification('⚠️ Select a subtopic folder in Step 1 first.');

    const nEasy = Math.max(0, parseInt(document.getElementById('autoMixEasyCount')?.value || '0', 10));
    const nMed = Math.max(0, parseInt(document.getElementById('autoMixMediumCount')?.value || '0', 10));
    const nHard = Math.max(0, parseInt(document.getElementById('autoMixHardCount')?.value || '0', 10));
    const replaceExisting = document.getElementById('autoMixReplaceExisting')?.checked ?? true;

    if (nEasy + nMed + nHard === 0) {
        return showNotification('⚠️ Enter at least 1 question count for Easy, Medium, or Hard.');
    }

    const btn = document.getElementById('btnRunAutoMix');
    if (btn) { btn.innerText = '🎲 Shuffling & Building Mixed Set...'; btn.disabled = true; }

    try {
        const pools = await fetchSubtopicDifficultyPools(baseSub);
        const pickedEasy = shuffleArrayNonSerial(pools.Easy).slice(0, nEasy);
        const pickedMed = shuffleArrayNonSerial(pools.Medium).slice(0, nMed);
        const pickedHard = shuffleArrayNonSerial(pools.Hard).slice(0, nHard);

        const combined = shuffleArrayNonSerial([...pickedEasy, ...pickedMed, ...pickedHard]);
        if (combined.length === 0) {
            throw new Error(`No Easy, Medium, or Hard questions found under "${baseSub}" yet. Upload questions to Easy, Medium, or Hard first!`);
        }

        const mixedPath = `${baseSub} > Mixed`;
        if (!doesTopicPathExist(mixedPath)) {
            await db.collection('custom_topics').add({
                parentPath: baseSub,
                name: 'Mixed',
                type: 'mcq',
                icon: '⚡',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            await loadCustomTopics();
        }

        if (replaceExisting && pools.MixedDocs.length > 0) {
            for (let i = 0; i < pools.MixedDocs.length; i += 400) {
                const delBatch = db.batch();
                pools.MixedDocs.slice(i, i + 400).forEach(m => delBatch.delete(m.ref));
                await delBatch.commit();
            }
        }

        const nowMs = Date.now();
        for (let i = 0; i < combined.length; i += 400) {
            const addBatch = db.batch();
            combined.slice(i, i + 400).forEach((q, idx) => {
                const newDocRef = db.collection('content').doc();
                addBatch.set(newDocRef, {
                    type: 'mcq',
                    path: mixedPath,
                    level: 'Mixed',
                    sourceDifficulty: q.sourceLevel || q.level || 'Mixed',
                    question: q.question || '',
                    options: q.options || {},
                    correctAnswers: q.correctAnswers || [],
                    explanation: q.explanation || '',
                    imageUrl: q.imageUrl || null,
                    questionImageUrl: q.questionImageUrl || null,
                    diagramUrl: q.diagramUrl || null,
                    diagramCaption: q.diagramCaption || '',
                    explanationImageUrl: q.explanationImageUrl || null,
                    randomKey: Math.random(),
                    timestamp: firebase.firestore.Timestamp.fromMillis(nowMs - (i + idx) * 1000)
                });
            });
            await addBatch.commit();
        }

        showNotification(`✅ Created ${combined.length} randomly shuffled Mixed questions (${pickedEasy.length} Easy, ${pickedMed.length} Medium, ${pickedHard.length} Hard)!`);
        await refreshAutoMixAvailableCounts();
    } catch (err) {
        alert('⚠️ Auto-Mix Error: ' + err.message);
    }
    if (btn) { btn.innerText = '🎲 Auto-Combine & Shuffle into Mixed Level'; btn.disabled = false; }
}

if (!window._origHandleAdminPathChangeWrapped) {
    window._origHandleAdminPathChangeWrapped = handleAdminPathChange;
    handleAdminPathChange = function(event, depth) {
        window._origHandleAdminPathChangeWrapped(event, depth);
        setTimeout(refreshAutoMixAvailableCounts, 80);
    };
}

if (!window._origClearAdminUploadFormWrapped) {
    window._origClearAdminUploadFormWrapped = clearAdminUploadForm;
    clearAdminUploadForm = function(isSmartClear = false) {
        window._origClearAdminUploadFormWrapped(isSmartClear);
        clearUniversalImageSlot('QUESTION');
        clearUniversalImageSlot('DIAGRAM');
        clearUniversalImageSlot('EXPLANATION');
        const tblCb = document.getElementById('admEnableMatchTable');
        if (tblCb) tblCb.checked = false;
        toggleAdminMatchTableBuilder(false);
        updateAdminLiveFormulaPreview();
    };
}

// 🚀 STUDENT QUIZ ENGINE UPGRADES (ALL 60+ QUESTIONS, ANYTIME SUBMIT, RESUME VS START NEW EXCLUDING CORRECT)
// ==========================================
(function upgradeStudentQuizEngineGlobally() {
    if (window._studentQuizEngineUpgradedV62) return;
    window._studentQuizEngineUpgradedV62 = true;

    function getUserProgressStorageKey() {
        const uid = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) ? currentUser.uid : 'guest';
        return `mcqsprep_topic_progress_v2_${uid}`;
    }

    function readAllTopicsProgressMap() {
        try {
            const raw = localStorage.getItem(getUserProgressStorageKey());
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeAllTopicsProgressMap(mapObj) {
        try {
            localStorage.setItem(getUserProgressStorageKey(), JSON.stringify(mapObj));
        } catch (e) {}
    }

    function getTopicProgressRecord(pathStr) {
        if (!pathStr) return { correctIds: [], wrongIds: [], skippedIds: [], inProgress: null };
        const map = readAllTopicsProgressMap();
        return map[pathStr] || { correctIds: [], wrongIds: [], skippedIds: [], inProgress: null };
    }

    function isQuestionAnsweredCorrectly(qObj, selectedVal) {
        if (!qObj || !selectedVal) return false;
        const correctArr = Array.isArray(qObj.correctAnswers) ? qObj.correctAnswers : [qObj.correctAnswer || 'A'];
        const userArr = Array.isArray(selectedVal) ? selectedVal : [selectedVal];
        if (userArr.length === 0) return false;
        return userArr.every(ans => correctArr.includes(ans)) && correctArr.every(ans => userArr.includes(ans));
    }

    // Saves live progress every time a student selects an answer or moves between questions
    window.saveLiveQuizSessionProgress = function() {
        if (typeof currentQuizPath === 'undefined' || !currentQuizPath || currentQuizPath === 'Daily Quiz Challenge') return;
        if (typeof currentQuestions === 'undefined' || !Array.isArray(currentQuestions) || currentQuestions.length === 0) return;

        const map = readAllTopicsProgressMap();
        const rec = map[currentQuizPath] || { correctIds: [], wrongIds: [], skippedIds: [], inProgress: null };
        const answeredCount = (typeof userAnswers !== 'undefined' && userAnswers) ? Object.keys(userAnswers).length : 0;

        if (answeredCount > 0) {
            rec.inProgress = {
                questionIds: currentQuestions.map(q => q.id),
                currentIndex: typeof currentIndex !== 'undefined' ? currentIndex : 0,
                userAnswers: { ...(typeof userAnswers !== 'undefined' ? userAnswers : {}) },
                timeSpent: { ...(typeof timeSpent !== 'undefined' ? timeSpent : {}) },
                updatedAt: Date.now()
            };
            map[currentQuizPath] = rec;
            writeAllTopicsProgressMap(map);
        }
    };

    // Records final Correct, Wrong, and Skipped question IDs when student submits (both per-topic and globally)
    window.recordSubmittedQuizMastery = function() {
        if (typeof currentQuizPath === 'undefined' || !currentQuizPath || currentQuizPath === 'Daily Quiz Challenge') return;
        if (typeof currentQuestions === 'undefined' || !Array.isArray(currentQuestions) || currentQuestions.length === 0) return;

        const map = readAllTopicsProgressMap();
        const rec = map[currentQuizPath] || { correctIds: [], wrongIds: [], skippedIds: [], inProgress: null };
        const correctSet = new Set(rec.correctIds || []);
        const wrongSet = new Set(rec.wrongIds || []);
        const skippedSet = new Set(rec.skippedIds || []);

        currentQuestions.forEach(q => {
            if (!q || !q.id) return;
            const ans = (typeof userAnswers !== 'undefined' && userAnswers) ? userAnswers[q.id] : undefined;
            const hasAns = ans !== undefined && ans !== null && (!Array.isArray(ans) || ans.length > 0);

            if (!hasAns) {
                if (!correctSet.has(q.id) && !wrongSet.has(q.id)) {
                    skippedSet.add(q.id);
                }
            } else if (isQuestionAnsweredCorrectly(q, ans)) {
                correctSet.add(q.id);
                wrongSet.delete(q.id);
                skippedSet.delete(q.id);
            } else {
                wrongSet.add(q.id);
                correctSet.delete(q.id);
                skippedSet.delete(q.id);
            }

            // Also update the question's home topic path if this was a Custom Practice session
            if (q.path && q.path !== currentQuizPath) {
                const subRec = map[q.path] || { correctIds: [], wrongIds: [], skippedIds: [], inProgress: null };
                const sCorr = new Set(subRec.correctIds || []);
                const sWrong = new Set(subRec.wrongIds || []);
                const sSkip = new Set(subRec.skippedIds || []);
                if (!hasAns) {
                    if (!sCorr.has(q.id) && !sWrong.has(q.id)) sSkip.add(q.id);
                } else if (isQuestionAnsweredCorrectly(q, ans)) {
                    sCorr.add(q.id); sWrong.delete(q.id); sSkip.delete(q.id);
                } else {
                    sWrong.add(q.id); sCorr.delete(q.id); sSkip.delete(q.id);
                }
                subRec.correctIds = Array.from(sCorr);
                subRec.wrongIds = Array.from(sWrong);
                subRec.skippedIds = Array.from(sSkip);
                map[q.path] = subRec;
            }
        });

        rec.correctIds = Array.from(correctSet);
        rec.wrongIds = Array.from(wrongSet);
        rec.skippedIds = Array.from(skippedSet);
        rec.inProgress = null;
        map[currentQuizPath] = rec;
        writeAllTopicsProgressMap(map);
    };

    // Anytime Submit handler (works under every question in MCQ Practice & Custom Practice)
    window.triggerAnytimeQuizSubmit = function() {
        const total = (typeof currentQuestions !== 'undefined' && Array.isArray(currentQuestions)) ? currentQuestions.length : 0;
        const attempted = (typeof userAnswers !== 'undefined' && userAnswers) ? Object.keys(userAnswers).length : 0;
        const msg = attempted < total
            ? `You have attempted ${attempted} out of ${total} questions.\n\nDo you want to save and submit your attempted questions now?`
            : `Submit your test (${attempted}/${total} attempted)?`;
        if (confirm(msg)) {
            submitQuiz();
        }
    };

    // Inject the "✅ SUBMIT (Attempted/Total)" button under every question in MCQ Practice & Custom Practice
    if (typeof renderQuizInterface === 'function' && !window._origRenderQuizInterfaceV62) {
        window._origRenderQuizInterfaceV62 = renderQuizInterface;
        renderQuizInterface = function() {
            window._origRenderQuizInterfaceV62();
            window.saveLiveQuizSessionProgress();

            const dyn = document.getElementById('dynamic-content');
            if (!dyn) return;
            const total = (typeof currentQuestions !== 'undefined' && Array.isArray(currentQuestions)) ? currentQuestions.length : 0;
            const attempted = (typeof userAnswers !== 'undefined' && userAnswers) ? Object.keys(userAnswers).length : 0;

            const buttons = Array.from(dyn.querySelectorAll('button'));
            const nextOrFinishBtn = buttons.find(b => /NEXT|FINISH|SUBMIT/i.test(b.innerText || '') && !b.classList.contains('btn-anytime-submit'));
            const alreadyHasAnytimeBtn = dyn.querySelector('.btn-anytime-submit');

            if (nextOrFinishBtn && !alreadyHasAnytimeBtn) {
                const isLastQuestion = (typeof currentIndex !== 'undefined') && (currentIndex === total - 1);
                if (!isLastQuestion) {
                    const submitNowBtn = document.createElement('button');
                    submitNowBtn.type = 'button';
                    submitNowBtn.className = 'btn-exam btn-anytime-submit';
                    submitNowBtn.style.cssText = 'padding: 10px 16px; font-size: 13px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;';
                    submitNowBtn.innerHTML = `✅ SUBMIT (${attempted}/${total})`;
                    submitNowBtn.title = 'Save and submit your attempted questions right now';
                    submitNowBtn.onclick = window.triggerAnytimeQuizSubmit;
                    nextOrFinishBtn.parentNode.insertBefore(submitNowBtn, nextOrFinishBtn.nextSibling);
                }
            }
        };
    }

    if (typeof selectOption === 'function' && !window._origSelectOptionV62) {
        window._origSelectOptionV62 = selectOption;
        selectOption = function(letter) {
            window._origSelectOptionV62(letter);
            window.saveLiveQuizSessionProgress();
        };
    }

    if (typeof submitQuiz === 'function' && !window._origSubmitQuizV62) {
        window._origSubmitQuizV62 = submitQuiz;
        submitQuiz = async function() {
            window.recordSubmittedQuizMastery();
            return await window._origSubmitQuizV62();
        };
    }

    function launchQuizWithQuestionsList(pathString, questionsList, restoredSession = null) {
        currentQuizPath = pathString;
        currentQuestions = questionsList;
        if (typeof currentTimer !== 'undefined' && currentTimer) clearInterval(currentTimer);

        if (restoredSession) {
            currentIndex = Math.min(questionsList.length - 1, Math.max(0, restoredSession.currentIndex || 0));
            userAnswers = { ...(restoredSession.userAnswers || {}) };
            timeSpent = { ...(restoredSession.timeSpent || {}) };
        } else {
            currentIndex = 0;
            userAnswers = {};
            timeSpent = {};
        }

        renderQuizInterface();
        if (typeof startQuestionTimer === 'function') startQuestionTimer();
    }

    // Upgrade _initiateQuizEngine:
    // Properly reads currentPath.join(' > ') when called with no arguments, loads all 60+ MCQs, and shows Resume vs Start New (Exclude Correct)
    if (typeof _initiateQuizEngine === 'function' && !window._origInitiateQuizEngineV62) {
        window._origInitiateQuizEngineV62 = _initiateQuizEngine;
        _initiateQuizEngine = async function(optionalPathString) {
            const isDaily = (Array.isArray(currentPath) && currentPath[0] === 'Daily Quiz Challenge') || optionalPathString === 'Daily Quiz Challenge';
            if (isDaily) {
                return await window._origInitiateQuizEngineV62(optionalPathString);
            }

            const targetPath = (typeof optionalPathString === 'string' && optionalPathString.trim())
                ? optionalPathString.trim()
                : (Array.isArray(currentPath) && currentPath.length > 0 ? currentPath.join(' > ') : '');

            if (!targetPath) {
                return await window._origInitiateQuizEngineV62(optionalPathString);
            }

            const dyn = document.getElementById('dynamic-content');
            if (dyn) {
                dyn.innerHTML = `<div style="text-align:center; padding:70px 20px;"><div class="spinner"></div><p style="margin-top:15px; color:var(--text-muted);">Loading all questions for this topic...</p></div>`;
            }

            try {
                // Use range query on targetPath without any 50-question limit so all 60, 100, or 300+ questions load
                const snap = await db.collection('content')
                    .where('path', '>=', targetPath)
                    .where('path', '<=', targetPath + '\uf8ff')
                    .get();

                let exactDocs = [];
                let childDocs = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    if (!d.type || d.type === 'mcq') {
                        const item = { id: doc.id, ...d };
                        if (d.path === targetPath) exactDocs.push(item);
                        else if (String(d.path || '').startsWith(targetPath + ' > ')) childDocs.push(item);
                    }
                });

                const allDocs = exactDocs.length > 0 ? exactDocs : childDocs;

                if (allDocs.length === 0) {
                    if (dyn) {
                        dyn.innerHTML = `<div class="card" style="text-align:center; padding:45px 20px;"><h3>No MCQs Uploaded Yet</h3><p style="color:var(--text-muted);">Questions for <b>${targetPath}</b> will appear here soon.</p><button class="btn-exam" onclick="window.history.back()" style="margin-top:15px;">&larr; Go Back</button></div>`;
                    }
                    return;
                }

                const rec = getTopicProgressRecord(targetPath);
                const inProg = rec.inProgress;
                const savedCorrectSet = new Set(rec.correctIds || []);
                const savedWrongSet = new Set(rec.wrongIds || []);
                const savedSkippedSet = new Set(rec.skippedIds || []);

                if (inProg && inProg.userAnswers) {
                    allDocs.forEach(q => {
                        const uAns = inProg.userAnswers[q.id];
                        if (uAns !== undefined && uAns !== null) {
                            if (isQuestionAnsweredCorrectly(q, uAns)) {
                                savedCorrectSet.add(q.id);
                                savedWrongSet.delete(q.id);
                            } else {
                                savedWrongSet.add(q.id);
                            }
                        }
                    });
                }

                const hasInProgress = Boolean(inProg && inProg.userAnswers && Object.keys(inProg.userAnswers).length > 0);
                const hasPreviousHistory = savedCorrectSet.size > 0 || savedWrongSet.size > 0;

                if (!hasInProgress && !hasPreviousHistory) {
                    launchQuizWithQuestionsList(targetPath, shuffleArrayNonSerial(allDocs), null);
                    return;
                }

                const wrongAndSkippedAndUnattempted = allDocs.filter(q => !savedCorrectSet.has(q.id));
                const wrongCount = allDocs.filter(q => savedWrongSet.has(q.id) && !savedCorrectSet.has(q.id)).length;
                const skippedCount = allDocs.filter(q => savedSkippedSet.has(q.id) && !savedCorrectSet.has(q.id) && !savedWrongSet.has(q.id)).length;
                const unattemptedCount = Math.max(0, wrongAndSkippedAndUnattempted.length - wrongCount - skippedCount);
                const inProgAnsweredCount = hasInProgress ? Object.keys(inProg.userAnswers).length : 0;

                if (dyn) {
                    dyn.innerHTML = `
                        <div class="admin-panel-card" style="max-width:640px; margin:35px auto; padding:28px 24px; border:1.5px solid rgba(253,184,19,0.4); background:linear-gradient(145deg, #121624, #0d111d); border-radius:16px; box-shadow:0 15px 40px rgba(0,0,0,0.6);">
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                <span style="font-size:26px;">🎯</span>
                                <div>
                                    <h2 style="margin:0; font-size:20px; color:#fff;">Welcome Back to This Topic!</h2>
                                    <div style="font-size:12.5px; color:#94a3b8; margin-top:2px;">${targetPath} • Total Questions: <b style="color:#fdb813;">${allDocs.length}</b></div>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin:18px 0;">
                                <div style="background:#090d16; border:1px solid rgba(16,185,129,0.35); border-radius:10px; padding:10px; text-align:center;">
                                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">✅ CORRECT</div>
                                    <div style="font-size:20px; font-weight:900; color:#10b981; margin-top:2px;">${savedCorrectSet.size}</div>
                                </div>
                                <div style="background:#090d16; border:1px solid rgba(244,63,94,0.35); border-radius:10px; padding:10px; text-align:center;">
                                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">❌ WRONG</div>
                                    <div style="font-size:20px; font-weight:900; color:#f43f5e; margin-top:2px;">${wrongCount}</div>
                                </div>
                                <div style="background:#090d16; border:1px solid rgba(234,179,8,0.35); border-radius:10px; padding:10px; text-align:center;">
                                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">⏭️ SKIPPED</div>
                                    <div style="font-size:20px; font-weight:900; color:#eab308; margin-top:2px;">${skippedCount}</div>
                                </div>
                                <div style="background:#090d16; border:1px solid rgba(56,189,248,0.35); border-radius:10px; padding:10px; text-align:center;">
                                    <div style="font-size:11px; color:#94a3b8; font-weight:700;">🆕 UNATTEMPTED</div>
                                    <div style="font-size:20px; font-weight:900; color:#38bdf8; margin-top:2px;">${unattemptedCount}</div>
                                </div>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
                                <button type="button" id="btnResumeTopicPractice" class="btn-exam btn-yellow-glow" style="padding:14px 18px; font-size:14.5px; font-weight:800; text-align:left; display:flex; justify-content:space-between; align-items:center; border-radius:12px;">
                                    <div>
                                        <div>▶️ Resume Practice</div>
                                        <div style="font-size:11.5px; font-weight:500; opacity:0.85; margin-top:2px;">
                                            ${hasInProgress
                                                ? `Continue where you left off (${inProgAnsweredCount}/${allDocs.length} answered in current session)`
                                                : `Continue practicing with your previous progress preserved`}
                                        </div>
                                    </div>
                                    <span style="font-size:18px;">&rarr;</span>
                                </button>

                                <button type="button" id="btnStartNewSmartPractice" class="btn-exam" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:14px 18px; font-size:14.5px; font-weight:800; text-align:left; display:flex; justify-content:space-between; align-items:center; border-radius:12px; cursor:pointer;">
                                    <div>
                                        <div>🚀 Start New (${wrongAndSkippedAndUnattempted.length} Questions — Exclude Correct)</div>
                                        <div style="font-size:11.5px; font-weight:500; opacity:0.92; margin-top:2px;">
                                            Gives only Wrong (${wrongCount}), Skipped (${skippedCount}) &amp; Not Attempted (${unattemptedCount}) • Skips ${savedCorrectSet.size} Correct MCQs
                                        </div>
                                    </div>
                                    <span style="font-size:18px;">&rarr;</span>
                                </button>

                                <button type="button" id="btnResetAllPracticeFresh" class="btn-exam" style="background:#161d2f; color:#94a3b8; border:1px solid #2b3954; padding:10px 16px; font-size:12.5px; font-weight:700; border-radius:10px; cursor:pointer; text-align:center;">
                                    🔄 Reset Topic History &amp; Practice All ${allDocs.length} Questions from Scratch
                                </button>
                            </div>
                        </div>
                    `;

                    document.getElementById('btnResumeTopicPractice').onclick = () => {
                        if (hasInProgress && Array.isArray(inProg.questionIds) && inProg.questionIds.length > 0) {
                            const docMap = new Map(allDocs.map(d => [d.id, d]));
                            const ordered = inProg.questionIds.map(id => docMap.get(id)).filter(Boolean);
                            const existingSet = new Set(ordered.map(d => d.id));
                            allDocs.forEach(d => { if (!existingSet.has(d.id)) ordered.push(d); });
                            launchQuizWithQuestionsList(targetPath, ordered, inProg);
                        } else {
                            const pool = wrongAndSkippedAndUnattempted.length > 0 ? wrongAndSkippedAndUnattempted : allDocs;
                            launchQuizWithQuestionsList(targetPath, pool, null);
                        }
                    };

                    document.getElementById('btnStartNewSmartPractice').onclick = () => {
                        if (wrongAndSkippedAndUnattempted.length === 0) {
                            alert(`🎉 You have already answered all ${allDocs.length} questions in this topic correctly! Clicking OK will reset history so you can practice all ${allDocs.length} questions again.`);
                            const map = readAllTopicsProgressMap();
                            delete map[targetPath];
                            writeAllTopicsProgressMap(map);
                            launchQuizWithQuestionsList(targetPath, shuffleArrayNonSerial(allDocs), null);
                            return;
                        }
                        const map = readAllTopicsProgressMap();
                        if (map[targetPath]) {
                            map[targetPath].correctIds = Array.from(savedCorrectSet);
                            map[targetPath].wrongIds = Array.from(savedWrongSet);
                            map[targetPath].inProgress = null;
                            writeAllTopicsProgressMap(map);
                        }
                        launchQuizWithQuestionsList(targetPath, shuffleArrayNonSerial(wrongAndSkippedAndUnattempted), null);
                    };

                    document.getElementById('btnResetAllPracticeFresh').onclick = () => {
                        const map = readAllTopicsProgressMap();
                        delete map[targetPath];
                        writeAllTopicsProgressMap(map);
                        launchQuizWithQuestionsList(targetPath, shuffleArrayNonSerial(allDocs), null);
                    };
                }
            } catch (err) {
                console.error('Quiz Engine Error:', err);
                if (dyn) dyn.innerHTML = `<div class="card" style="text-align:center; padding:40px;"><p style="color:#ef4444;">Failed to load questions: ${err.message}</p></div>`;
            }
        };
    }
})();

// Self-Healing Guard: Ensures refreshing #/admin-panel never leaves a blank screen
(function ensureAdminPanelRendersOnRefresh() {
    function checkAndRenderAdmin() {
        if (window.location.hash === '#/admin-panel') {
            const dyn = document.getElementById('dynamic-content');
            if (dyn && !dyn.innerHTML.trim() && typeof _renderAdminPanel === 'function') {
                _renderAdminPanel();
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(checkAndRenderAdmin, 150));
    } else {
        setTimeout(checkAndRenderAdmin, 150);
    }
    window.addEventListener('load', () => setTimeout(checkAndRenderAdmin, 300));
})();

async function processAdminUpload() {
    const type = document.getElementById('admResourceType').value;
    const targetPath = adminSelectedPath.join(' > ');
    const btn = document.getElementById('uploadBtn');
    btn.innerText = 'Uploading... Please wait';
    btn.disabled = true;

    try {
        if (type === 'mcq') {
            let questionTextRaw = document.getElementById('admQuestion').value.trim();

            // Auto-detect Match-the-Column if admin pasted one directly into Question Text without ticking the Match Table box
            if (!adminMatchTableState.enabled && questionTextRaw) {
                const autoMatch = autoExtractUniversalMatchTableFromQuestionStem(questionTextRaw);
                if (autoMatch.matchTable && autoMatch.matchTable.enabled) {
                    questionTextRaw = autoMatch.cleanQuestion;
                    adminMatchTableState.enabled = true;
                    adminMatchTableState.rows = autoMatch.matchTable.rows;
                    adminMatchTableState.cols = autoMatch.matchTable.cols;
                    adminMatchTableState.headers = [...autoMatch.matchTable.headers];
                    adminMatchTableState.cells = autoMatch.matchTable.cells.map(r => [...r]);
                }
            }

            let questionTextFormatted = formatMultilineTextToHtml(questionTextRaw);
            const matchTableHtml = buildMatchTableHtmlForQuestion();
            const options = {
                A: document.getElementById('admOptA').value.trim(),
                B: document.getElementById('admOptB').value.trim(),
                C: document.getElementById('admOptC').value.trim(),
                D: document.getElementById('admOptD').value.trim()
            };
            const correctAnswers = Array.from(document.querySelectorAll('.admCorrectCb:checked')).map(cb => cb.value);
            let explanationTextRaw = document.getElementById('admExplanation').value.trim();
            let explanationTextFormatted = formatMultilineTextToHtml(explanationTextRaw);

            const qTextImgFile = adminImageSlots.QUESTION || document.getElementById('admQTextImageFile')?.files?.[0] || null;
            const diagramFile = adminImageSlots.DIAGRAM || document.getElementById('admQImage')?.files?.[0] || null;
            const expImgFile = adminImageSlots.EXPLANATION || document.getElementById('admExpImageFile')?.files?.[0] || null;

            const diagramCaption = document.getElementById('admDiagramCaption')?.value.trim() || '';
            const diagramBgMode = document.getElementById('admDiagramBgMode')?.value || 'light';

            let level = document.getElementById('admDifficulty').value;
            const leaf = (adminSelectedPath[adminSelectedPath.length - 1] || '').replace(/^\d+\.\s*/, '').trim();
            if (['Easy', 'Medium', 'Hard', 'Mixed'].includes(leaf) && level === 'Mixed') level = leaf;

            if ((!questionTextFormatted && !qTextImgFile && !matchTableHtml) || !options.A || !options.B || !correctAnswers.length) {
                throw new Error('Provide Question Text, Question Screenshot, or Match Table, plus Option A, Option B, and Correct Answer.');
            }

            let questionImageUrl = null;
            if (qTextImgFile) {
                btn.innerText = 'Uploading Question Image...';
                questionImageUrl = await uploadFileToCloudinary(qTextImgFile);
            }

            let diagramUrl = null;
            if (diagramFile) {
                btn.innerText = 'Uploading Diagram...';
                diagramUrl = await uploadFileToCloudinary(diagramFile);
            }

            let explanationImageUrl = null;
            if (expImgFile) {
                btn.innerText = 'Uploading Explanation Image...';
                explanationImageUrl = await uploadFileToCloudinary(expImgFile);
            }

            let finalQuestionHtml = questionTextFormatted;
            if (questionImageUrl) {
                const safeQUrl = questionImageUrl.replace(/'/g, "\\'");
                const qImgBlock = `<div class="mcq-question-text-img-wrap"><img src="${questionImageUrl}" alt="Question" onclick="openStudentDiagramLightbox('${safeQUrl}', 'Question Image')" title="Tap to zoom"></div>`;
                finalQuestionHtml = finalQuestionHtml ? `${finalQuestionHtml}${qImgBlock}` : qImgBlock;
            }
            if (matchTableHtml) {
                finalQuestionHtml = `${finalQuestionHtml}${matchTableHtml}`;
            }
            if (diagramUrl) {
                const safeDUrl = diagramUrl.replace(/'/g, "\\'");
                const safeCap = diagramCaption.replace(/'/g, "\\'");
                const bgClass = diagramBgMode === 'dark' ? 'bg-dark' : 'bg-light';
                const capHtml = diagramCaption
                    ? `<div class="mcq-diagram-caption">📐 ${diagramCaption} <span style="font-size:10.5px; opacity:0.7;">(Tap to zoom)</span></div>`
                    : `<div class="mcq-diagram-caption" style="font-size:11px; opacity:0.7;">🔍 Tap diagram to zoom</div>`;
                const diagBlock = `<div class="mcq-diagram-card ${bgClass}"><img src="${diagramUrl}" alt="Diagram" onclick="openStudentDiagramLightbox('${safeDUrl}', '${safeCap}')">${capHtml}</div>`;
                finalQuestionHtml = `${finalQuestionHtml}${diagBlock}`;
            }

            let finalExplanationHtml = explanationTextFormatted;
            if (explanationImageUrl) {
                const safeEUrl = explanationImageUrl.replace(/'/g, "\\'");
                const expImgBlock = `<div class="mcq-explanation-img-wrap"><img src="${explanationImageUrl}" alt="Explanation Solution" onclick="openStudentDiagramLightbox('${safeEUrl}', 'Solution / Explanation')" title="Tap to zoom"></div>`;
                finalExplanationHtml = finalExplanationHtml ? `${finalExplanationHtml}${expImgBlock}` : expImgBlock;
            }

            await db.collection('content').add({
                type: 'mcq',
                path: targetPath,
                level,
                question: finalQuestionHtml,
                rawQuestionText: questionTextRaw,
                options,
                correctAnswers,
                explanation: finalExplanationHtml,
                imageUrl: null,
                questionImageUrl,
                diagramUrl,
                diagramCaption,
                explanationImageUrl,
                randomKey: Math.random(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            clearAdminUploadForm(true);
            showNotification('✅ MCQ Uploaded Successfully!');
            refreshAutoMixAvailableCounts();
        } else {
            const customTitle = document.getElementById('admPdfTitle').value.trim();
            const files = document.getElementById('admPdfFile').files;
            const directUrl = document.getElementById('admPdfDirectUrl')?.value.trim() || '';

            if ((!files || files.length === 0) && !directUrl) {
                throw new Error('Please select at least one PDF/Image file OR paste a direct link.');
            }

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const f = files[i];
                    btn.innerText = `Uploading file ${i + 1} of ${files.length}...`;
                    const uploadedUrl = await uploadFileToCloudinary(f);
                    const docTitle = (files.length === 1 && customTitle) ? customTitle : f.name.replace(/\.[^/.]+$/, '');
                    await db.collection('content').add({
                        type: 'material',
                        path: targetPath,
                        title: docTitle,
                        fileUrl: uploadedUrl,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } else if (directUrl) {
                const docTitle = customTitle || 'Study Material PDF';
                await db.collection('content').add({
                    type: 'material',
                    path: targetPath,
                    title: docTitle,
                    fileUrl: directUrl,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            if (getMergedChildKeysAtPath(adminSelectedPath).length === 0) {
                topicOverrides.editedPaths = topicOverrides.editedPaths || {};
                topicOverrides.editedPaths[targetPath] = {
                    ...(topicOverrides.editedPaths[targetPath] || {}),
                    displayName: adminSelectedPath[adminSelectedPath.length - 1],
                    type: 'pdf'
                };
                customTopicTypes[targetPath] = { ...(customTopicTypes[targetPath] || {}), type: 'pdf' };
                await db.collection('settings').doc('topic_overrides').set(topicOverrides, { merge: true });
            }

            clearAdminUploadForm(true);
            showNotification('✅ PDF Material Uploaded & Live!');
        }
    } catch (err) {
        alert('⚠️ ERROR: ' + err.message);
    }
    btn.innerText = '☁️ Upload & Save';
    btn.disabled = false;
}

let loadedItemsCache = {};
async function loadContentForManagement(isNextPage = false) {
    if (isFetchingManageContent) return;
    const listEl = document.getElementById('manage-content-list');
    if (!listEl) return;

    if (!isNextPage) {
        listEl.innerHTML = `<p style="color:var(--primary-yellow); padding:20px; text-align:center;">Fetching items...</p>`;
        loadedItemsCache = {};
        lastManageDoc = null;
    }
    isFetchingManageContent = true;

    try {
        let q = db.collection('content');
        if (adminManageSelectedPath.length > 0) {
            const p = adminManageSelectedPath.join(' > ');
            q = q.where('path', '>=', p).where('path', '<=', p + '\uf8ff');
        } else {
            q = q.orderBy('timestamp', 'desc');
        }
        if (isNextPage && lastManageDoc) q = q.startAfter(lastManageDoc);
        const snap = await q.limit(30).get();

        if (snap.empty) {
            if (!isNextPage) listEl.innerHTML = `<p style="color:#888; text-align:center; padding:40px; border:1px dashed #333; border-radius:12px;">No items found in this folder.</p>`;
            isFetchingManageContent = false;
            return;
        }
        lastManageDoc = snap.docs[snap.docs.length - 1];

        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            loadedItemsCache[doc.id] = d;
            const isPdf = d.type === 'material' || d.type === 'pdf' || Boolean(d.fileUrl);
            if (adminManageContentTypeFilter === 'mcq' && isPdf) return;
            if (adminManageContentTypeFilter === 'material' && !isPdf) return;

            if (!isPdf) {
                const ans = (d.correctAnswers || []).join(', ');
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#1c1c24; border:1px solid #2b2b36; border-radius:12px; padding:20px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:10px; flex-wrap:wrap; gap:8px;">
                        <span class="badge-path">${d.path || 'Uncategorized'}</span>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-exam" onclick="openEditModal('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(33,150,243,0.15); color:#38bdf8; border:1px solid rgba(33,150,243,0.3);">✏️ Edit</button>
                            <button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(244,67,54,0.15); color:var(--wrong-red); border:1px solid rgba(244,67,54,0.3);">🗑️ Delete</button>
                        </div>
                    </div>
                    <div style="font-weight:bold; margin-bottom:10px;">${d.question}</div>
                    <div style="font-size:13px; color:var(--correct-green); font-weight:bold;">✅ Correct: ${ans}</div>
                </div>`;
            } else {
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#1c1c24; border:1px solid rgba(253,184,19,0.4); border-left:4px solid #fdb813; border-radius:12px; padding:20px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #333; padding-bottom:10px; flex-wrap:wrap; gap:8px;">
                        <span class="badge-path">${d.path || 'Uncategorized'}</span>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-exam" onclick="promptEditPdfMaterial('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(33,150,243,0.15); color:#38bdf8; border:1px solid rgba(33,150,243,0.3);">✏️ Rename / Edit Link</button>
                            <button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(244,67,54,0.15); color:var(--wrong-red); border:1px solid rgba(244,67,54,0.3);">🗑️ Delete</button>
                        </div>
                    </div>
                    <div style="font-weight:bold; margin-bottom:10px; font-size:16px; color:#fff;">📄 ${d.title || 'Study Material'}</div>
                    <a href="${d.fileUrl}" target="_blank" style="color:var(--primary-yellow); font-size:13.5px; font-weight:bold; text-decoration:none;">📖 Open PDF / File &rarr;</a>
                </div>`;
            }
        });

        listEl.innerHTML = html || `<p style="color:#888; text-align:center; padding:30px;">No matching items in this view.</p>`;
    } catch (e) {
        listEl.innerHTML = `<p style="color:var(--wrong-red); padding:20px;">Error: ${e.message}</p>`;
    }
    isFetchingManageContent = false;
}

async function promptEditPdfMaterial(docId) {
    const d = loadedItemsCache[docId];
    if (!d) return;
    const newTitle = prompt('Edit Document Title:', d.title || '');
    if (newTitle === null) return;
    const newUrl = prompt('Edit Document URL:', d.fileUrl || '');
    if (newUrl === null) return;
    try {
        await db.collection('content').doc(docId).update({
            title: newTitle.trim() || d.title,
            fileUrl: newUrl.trim() || d.fileUrl
        });
        showNotification('✅ PDF Material updated!');
        loadContentForManagement(false);
    } catch (e) {
        showNotification('❌ Failed: ' + e.message);
    }
}

async function runRandomKeyMigration() {
    if (!confirm('Index MCQs with randomKey for fast selection?')) return;
    const btn = document.getElementById('btnMigrateKeys');
    if (btn) { btn.innerText = 'Indexing...'; btn.disabled = true; }
    try {
        const snap = await db.collection('content').limit(400).get();
        const batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            const d = doc.data();
            if ((!d.type || d.type === 'mcq') && d.randomKey === undefined) {
                batch.update(doc.ref, { randomKey: Math.random() });
                count++;
            }
        });
        if (count > 0) await batch.commit();
        showNotification(`✅ Indexed ${count} MCQs!`);
    } catch (e) {
        showNotification('❌ Error: ' + e.message);
    }
    if (btn) { btn.innerText = 'Run Index Migration'; btn.disabled = false; }
}

async function deleteContentItem(docId) {
    if (!confirm('Permanently delete this item?')) return;
    try {
        await db.collection('content').doc(docId).delete();
        document.getElementById('item_' + docId)?.remove();
        showNotification('🗑️ Deleted!');
    } catch (e) {
        showNotification('❌ Error: ' + e.message);
    }
}

function openEditModal(docId) {
    const d = loadedItemsCache[docId];
    if (!d) return;
    document.getElementById('editDocId').value = docId;
    document.getElementById('editQuestion').value = d.question || '';
    document.getElementById('editOptA').value = d.options?.A || '';
    document.getElementById('editOptB').value = d.options?.B || '';
    document.getElementById('editOptC').value = d.options?.C || '';
    document.getElementById('editOptD').value = d.options?.D || '';
    document.getElementById('editExplanation').value = d.explanation || '';
    document.getElementById('editDifficulty').value = d.level || 'Mixed';
    const corr = d.correctAnswers || [];
    document.querySelectorAll('.editCorrectCb').forEach(cb => { cb.checked = corr.includes(cb.value); });
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEditedMCQ() {
    const docId = document.getElementById('editDocId').value;
    const question = document.getElementById('editQuestion').value.trim();
    const options = {
        A: document.getElementById('editOptA').value.trim(),
        B: document.getElementById('editOptB').value.trim(),
        C: document.getElementById('editOptC').value.trim(),
        D: document.getElementById('editOptD').value.trim()
    };
    const correctAnswers = Array.from(document.querySelectorAll('.editCorrectCb:checked')).map(cb => cb.value);
    const explanation = document.getElementById('editExplanation').value.trim();
    const level = document.getElementById('editDifficulty').value;
    if (!question || !options.A || !options.B || !correctAnswers.length) return alert('Fill required fields.');

    await db.collection('content').doc(docId).update({ question, options, correctAnswers, explanation, level });
    closeEditModal();
    showNotification('✅ Saved!');
    if (adminCurrentTab === 'manage') loadContentForManagement(false);
}

async function changeAdminPassword() {
    const p1 = document.getElementById('newAdminPass').value;
    const p2 = document.getElementById('confirmAdminPass').value;
    if (p1.length < 6 || p1 !== p2) return showNotification('⚠️ Check password requirements.');
    await db.collection('settings').doc('admin_auth').set({ password: p1 });
    showNotification('✅ Password updated!');
}

async function loadAdminReports() {
    const box = document.getElementById('reports-list-container');
    if (!box) return;
    box.innerHTML = `<p style="color:var(--primary-yellow); padding:20px;">Loading reports...</p>`;
    try {
        const snap = await db.collection('reported_mistakes').orderBy('timestamp', 'desc').limit(50).get();
        if (snap.empty) { box.innerHTML = `<div class="admin-panel-card"><p style="color:var(--correct-green); text-align:center;">✅ No mistakes reported!</p></div>`; return; }
        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            html += `<div class="admin-panel-card" style="border-left:4px solid var(--wrong-red); padding:20px;">
                <span class="badge-path">${d.path || 'Unknown'}</span>
                <p style="color:var(--wrong-red); font-weight:bold;">Issue: ${d.reason || 'Reported'}</p>
                <p style="color:#ccc; font-size:13.5px;">${d.description || ''}</p>
                <div style="background:#131318; padding:12px; border-radius:8px; margin:10px 0;">${d.questionText || ''}</div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-exam" onclick="openEditModalFromReport('${d.questionId}')" style="background:rgba(33,150,243,0.15); color:#38bdf8; padding:8px 14px;">✏️ Edit MCQ</button>
                    <button class="btn-exam" onclick="resolveReport('${doc.id}')" style="background:rgba(76,175,80,0.15); color:var(--correct-green); padding:8px 14px;" ${d.status === 'resolved' ? 'disabled' : ''}>✅ Resolve</button>
                </div>
            </div>`;
        });
        box.innerHTML = html;
    } catch (e) { box.innerHTML = `<p style="color:red;">${e.message}</p>`; }
}

async function resolveReport(id) {
    await db.collection('reported_mistakes').doc(id).update({ status: 'resolved', seenByStudent: false });
    loadAdminReports();
    showNotification('✅ Resolved!');
}

async function openEditModalFromReport(qId) {
    const doc = await db.collection('content').doc(qId).get();
    if (doc.exists) { loadedItemsCache[qId] = doc.data(); openEditModal(qId); }
    else showNotification('❌ Question not found.');
}

async function loadAdminUsers() {
    const box = document.getElementById('users-table-container');
    if (!box) return;
    const snap = await db.collection('users').orderBy('lastLogin', 'desc').limit(100).get();
    let rows = `<table style="width:100%; text-align:left; border-collapse:collapse;"><tr style="background:#131318; border-bottom:1px solid #2b2b36;"><th style="padding:14px;">Name</th><th style="padding:14px;">Email</th><th style="padding:14px;">Last Login</th></tr>`;
    snap.forEach(doc => {
        const d = doc.data();
        rows += `<tr style="border-bottom:1px solid #2b2b36;"><td style="padding:14px; font-weight:bold;">${d.displayName || 'User'}</td><td style="padding:14px; color:#aaa;">${d.email || '-'}</td><td style="padding:14px; color:#aaa; font-size:12.5px;">${d.lastLogin ? d.lastLogin.toDate().toLocaleString() : '-'}</td></tr>`;
    });
    box.innerHTML = rows + `</table>`;
}

async function loadAdminDoubts() {
    const box = document.getElementById('doubts-list-container');
    if (!box) return;
    const snap = await db.collection('flagged_doubts').orderBy('timestamp', 'desc').limit(50).get();
    if (snap.empty) { box.innerHTML = `<div class="admin-panel-card"><p style="color:var(--correct-green); text-align:center;">✅ No flagged doubts!</p></div>`; return; }
    let html = '';
    snap.forEach(doc => {
        const d = doc.data();
        html += `<div class="admin-panel-card" style="padding:20px;">
            <span class="badge-path">${d.path || 'General'}</span>
            <p style="color:var(--primary-yellow);"><b>Student:</b> ${d.studentName || 'Student'}</p>
            <div style="background:#131318; padding:12px; border-radius:8px; margin:10px 0;">${d.questionText || ''}</div>
            <button class="btn-exam" onclick="resolveDoubt('${doc.id}')" style="background:rgba(76,175,80,0.15); color:var(--correct-green); padding:8px 14px;" ${d.status === 'resolved' ? 'disabled' : ''}>✅ Mark Reviewed</button>
        </div>`;
    });
    box.innerHTML = html;
}

async function resolveDoubt(id) {
    await db.collection('flagged_doubts').doc(id).update({ status: 'resolved', seenByStudent: false });
    loadAdminDoubts();
}

// ==========================================
// AUTOMATIC LIVE PDF DISPLAY PATCH
// ==========================================
if (typeof ensureUploadedPdfsVisible === 'function') {
    window.addEventListener('hashchange', () => {
        if (window.location.hash.startsWith('#/path/') && Array.isArray(currentPath) && currentPath.length > 0) {
            setTimeout(() => ensureUploadedPdfsVisible(currentPath), 120);
        }
    });
}
