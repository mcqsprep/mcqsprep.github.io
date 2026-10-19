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
                            <div style="background:#111522; border:1px dashed rgba(253,184,19,0.4); border-radius:12px; padding:14px; margin-bottom:18px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                                    <span style="font-size:12px; font-weight:700; color:var(--primary-yellow);">⚡ SMART QUICK-PASTE AUTO-FILLER (OPTIONAL)</span>
                                    <button type="button" class="btn-exam btn-yellow-glow" onclick="parseQuickPasteMCQ()" style="padding:5px 14px; font-size:11.5px;">✨ Auto-Fill Form</button>
                                </div>
                                <textarea id="admSmartPasteInput" class="input-field" style="min-height:58px; margin-bottom:0; font-size:12.5px;" placeholder="Paste full MCQ block here (e.g. Q. Question text... A) Opt1 B) Opt2 C) Opt3 D) Opt4 Ans: B Exp: Explanation...) and click Auto-Fill!"></textarea>
                            </div>

                            <!-- 🧪 1-CLICK CHEMICAL REACTION & MATH FORMULA BAR -->
                            <div style="background:#101626; border:1px solid #2b3954; border-radius:12px; padding:12px 14px; margin-bottom:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                                    <span style="font-size:11.5px; font-weight:800; color:#38bdf8; text-transform:uppercase;">🧪 Complex Chemical Reactions &amp; Math Formula Toolbar (Click any box below, then click symbol to insert)</span>
                                    <button type="button" onclick="formatPlainChemistryToLatex()" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); border-radius:6px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;" title="Automatically converts H2SO4, ->, <=>, ^2+ in active box into clean formulas">🪄 Auto-Format Plain Reaction / Formula</button>
                                </div>
                                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\rightarrow$')">→ Reaction</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\rightleftharpoons$')">⇌ Equilibrium</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow{\\Delta}$')">—Δ→ Heat</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow{\\text{cat.}}$')">—cat→ Catalyst</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\xrightarrow[\\text{temp}]{\\text{reagent}}$')">—[Reagent]→</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$_2$')">X₂ Subscript</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$^{2+}$')">X²⁺ Ion/Power</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\uparrow$')">↑ Gas</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\downarrow$')">↓ Precipitate</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\Delta H^\\circ$')">ΔH°</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('$\\Delta G^\\circ$')">ΔG°</button>
                                    <button type="button" class="admin-preset-chip" onclick="insertAdminFormulaAtCursor('⌬')">⌬ Benzene</button>
                                </div>
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

                            <!-- QUESTION TEXT OR QUESTION IMAGE SECTION -->
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                                <label class="admin-label" style="margin-bottom:0;">Question Text (Optional if you upload/paste Question Image below)</label>
                                <span style="font-size:11px; color:#10b981;">💡 Supports $LaTeX$, chemical reactions &amp; Ctrl+V image paste!</span>
                            </div>
                            <textarea id="admQuestion" class="input-field" style="min-height: 100px; font-size: 15px; margin-bottom:10px;" placeholder="Type question or chemical reaction here... OR leave blank and upload/paste an image of the typed question below!" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()" onpaste="handleAdminQuestionPasteImage(event, 'QUESTION_IMG')"></textarea>

                            <!-- 📸 PLACE IMAGE OF TYPED QUESTION (NO TYPING NEEDED) -->
                            <div style="background:#111522; border:1px solid rgba(56,189,248,0.35); border-left:4px solid #38bdf8; border-radius:10px; padding:12px 14px; margin-bottom:18px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                                    <div>
                                        <div style="font-size:12.5px; font-weight:800; color:#38bdf8;">📸 Don't Want to Type the Question? Place Image of Typed Question Here</div>
                                        <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">Upload a screenshot/photo of the typed question, or click inside Question Text and press <b>Ctrl+V</b> to paste!</div>
                                    </div>
                                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                        <input type="file" id="admQTextImageFile" accept="image/*" style="display:none;" onchange="handleAdminQuestionImgSelect(this)">
                                        <button type="button" class="btn-exam" onclick="document.getElementById('admQTextImageFile').click()" style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:7px 13px; font-size:12px;">📁 Choose Question Image</button>
                                        <button type="button" class="btn-exam" onclick="clearAdminQuestionTextImage()" id="btnClearQTextImg" style="display:none; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); padding:7px 12px; font-size:12px;">✕ Remove</button>
                                    </div>
                                </div>
                                <div id="admQTextImgPreviewWrap" style="display:none; margin-top:12px; background:#fff; padding:10px; border-radius:8px; text-align:center; max-width:100%; overflow:hidden;">
                                    <img id="admQTextImgPreview" src="" style="max-height:170px; max-width:100%; object-fit:contain; display:block; margin:0 auto; border-radius:4px;">
                                </div>
                            </div>

                            <!-- 📐 DEDICATED DIAGRAM SECTION (NEAT & CLEAR FOR STUDENTS) -->
                            <div class="admin-grid-2" style="margin-bottom: 15px;">
                                <div style="background:#111522; border:1px solid rgba(253,184,19,0.4); border-left:4px solid #fdb813; border-radius:10px; padding:12px 14px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                                        <label class="admin-label" style="color:var(--primary-yellow); margin-bottom:0;">📐 Dedicated Diagram / Figure / Circuit (Optional)</label>
                                        <button type="button" onclick="clearAdminDiagramImage()" id="btnClearDiagramImg" style="display:none; background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.4); border-radius:6px; padding:3px 9px; font-size:11px; font-weight:700; cursor:pointer;">✕ Remove Diagram</button>
                                    </div>
                                    <input type="file" id="admQImage" class="input-field" accept="image/*" style="padding: 8px 12px; margin-bottom:8px;" onchange="handleAdminDiagramImgSelect(this)">
                                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                        <input type="text" id="admDiagramCaption" class="input-field" placeholder="Diagram Label/Caption (Optional, e.g. Fig 1: Circuit)" style="flex:2; min-width:140px; margin-bottom:0; padding:8px 10px; font-size:12px;">
                                        <select id="admDiagramBgMode" class="input-field" style="flex:1; min-width:130px; margin-bottom:0; padding:8px 10px; font-size:12px;" onchange="updateAdminDiagramPreviewBg()">
                                            <option value="light">☀️ Crisp White Backing (Best for Black-Line Diagrams)</option>
                                            <option value="dark">🌙 Dark Backing (For Colored Photos)</option>
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
                                <input type="text" id="admOptA" class="input-field" placeholder="Option A" onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()">
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
                            
                            <label class="admin-label">Explanation (Optional — Supports Step-by-Step Reactions &amp; Formulas)</label>
                            <textarea id="admExplanation" class="input-field" style="min-height: 80px;" placeholder="Explain why the answer is correct..." onfocus="setLastFocusedFormulaInput(this)" oninput="updateAdminLiveFormulaPreview()"></textarea>

                            <!-- 👁️ LIVE STUDENT VIEW & FORMULA / REACTION PREVIEW -->
                            <div id="admLiveFormulaPreviewCard" style="display:none; background:#090e1a; border:1px solid rgba(253,184,19,0.35); border-radius:12px; padding:14px 16px; margin-top:14px;">
                                <div style="font-size:11px; font-weight:800; color:var(--primary-yellow); text-transform:uppercase; margin-bottom:8px;">👁️ Live Student Formula &amp; Reaction Preview</div>
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
// FORMULA TOOLBAR, QUESTION IMAGE, DIAGRAM & AUTO-MIXED LEVEL ENGINE
// ==========================================
(function injectStudentDiagramAndQuestionImgStyles() {
    if (document.getElementById('mcqs-diagram-qimg-styles')) return;
    const st = document.createElement('style');
    st.id = 'mcqs-diagram-qimg-styles';
    st.textContent = `
        .mcq-question-text-img-wrap {
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
        .mcq-question-text-img-wrap img {
            max-width: 100%;
            max-height: 240px;
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
    `;
    document.head.appendChild(st);
})();

let lastFocusedFormulaInput = null;
let pendingAdminQuestionPastedBlob = null;

function setLastFocusedFormulaInput(el) {
    if (el) lastFocusedFormulaInput = el;
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
    updateAdminLiveFormulaPreview();
}

function formatPlainChemistryToLatex() {
    let target = lastFocusedFormulaInput || document.getElementById('admQuestion');
    if (!target || !target.value.trim()) {
        return showNotification('⚠️ Click inside Question, Option, or Explanation with text first.');
    }
    let s = target.value;
    s = s.replace(/<=>|<-->/g, '$\\rightleftharpoons$');
    s = s.replace(/-->|->/g, '$\\rightarrow$');
    s = s.replace(/\b([A-Z][a-z]?)(\d+)\b/g, '$1$_$2$');
    s = s.replace(/\^(\d+[+\-]|[+\-]\d*)/g, '$^{$1}$');
    target.value = s;
    updateAdminLiveFormulaPreview();
    showNotification('✨ Reactions & subscripts formatted!');
}

function updateAdminLiveFormulaPreview() {
    const card = document.getElementById('admLiveFormulaPreviewCard');
    const content = document.getElementById('admLiveFormulaPreviewContent');
    if (!card || !content) return;

    const q = document.getElementById('admQuestion')?.value.trim() || '';
    const a = document.getElementById('admOptA')?.value.trim() || '';
    const b = document.getElementById('admOptB')?.value.trim() || '';
    const c = document.getElementById('admOptC')?.value.trim() || '';
    const d = document.getElementById('admOptD')?.value.trim() || '';
    const exp = document.getElementById('admExplanation')?.value.trim() || '';

    if (!q && !a && !b && !c && !d && !exp) {
        card.style.display = 'none';
        return;
    }
    card.style.display = 'block';
    content.innerHTML = `
        ${q ? `<div style="margin-bottom:8px;"><b>Q:</b> ${q}</div>` : ''}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:13px; color:#cbd5e1;">
            ${a ? `<div><b>A)</b> ${a}</div>` : ''}
            ${b ? `<div><b>B)</b> ${b}</div>` : ''}
            ${c ? `<div><b>C)</b> ${c}</div>` : ''}
            ${d ? `<div><b>D)</b> ${d}</div>` : ''}
        </div>
        ${exp ? `<div style="margin-top:8px; font-size:12.5px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:6px;"><b>Exp:</b> ${exp}</div>` : ''}
    `;

    if (typeof renderMathInElement === 'function') {
        renderMathInElement(content, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '[', right: ']', display: true }
            ],
            throwOnError: false
        });
    }
}

function handleAdminQuestionImgSelect(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    pendingAdminQuestionPastedBlob = null;
    const file = inputEl.files[0];
    const url = URL.createObjectURL(file);
    const wrap = document.getElementById('admQTextImgPreviewWrap');
    const img = document.getElementById('admQTextImgPreview');
    const clr = document.getElementById('btnClearQTextImg');
    if (img) img.src = url;
    if (wrap) wrap.style.display = 'block';
    if (clr) clr.style.display = 'inline-block';
}

function handleAdminQuestionPasteImage(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            event.preventDefault();
            const blob = item.getAsFile();
            pendingAdminQuestionPastedBlob = blob;
            const url = URL.createObjectURL(blob);
            const wrap = document.getElementById('admQTextImgPreviewWrap');
            const img = document.getElementById('admQTextImgPreview');
            const clr = document.getElementById('btnClearQTextImg');
            if (img) img.src = url;
            if (wrap) wrap.style.display = 'block';
            if (clr) clr.style.display = 'inline-block';
            showNotification('📸 Question image pasted from clipboard!');
            break;
        }
    }
}

function clearAdminQuestionTextImage() {
    pendingAdminQuestionPastedBlob = null;
    const f = document.getElementById('admQTextImageFile');
    const wrap = document.getElementById('admQTextImgPreviewWrap');
    const img = document.getElementById('admQTextImgPreview');
    const clr = document.getElementById('btnClearQTextImg');
    if (f) f.value = '';
    if (img) img.src = '';
    if (wrap) wrap.style.display = 'none';
    if (clr) clr.style.display = 'none';
}

function handleAdminDiagramImgSelect(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    const url = URL.createObjectURL(inputEl.files[0]);
    const wrap = document.getElementById('admDiagramPreviewWrap');
    const img = document.getElementById('admDiagramPreviewImg');
    const clr = document.getElementById('btnClearDiagramImg');
    if (img) img.src = url;
    if (wrap) wrap.style.display = 'block';
    if (clr) clr.style.display = 'inline-block';
    updateAdminDiagramPreviewBg();
}

function updateAdminDiagramPreviewBg() {
    const mode = document.getElementById('admDiagramBgMode')?.value || 'light';
    const wrap = document.getElementById('admDiagramPreviewWrap');
    if (wrap) wrap.style.background = mode === 'dark' ? '#0d1527' : '#ffffff';
}

function clearAdminDiagramImage() {
    const f = document.getElementById('admQImage');
    const cap = document.getElementById('admDiagramCaption');
    const wrap = document.getElementById('admDiagramPreviewWrap');
    const img = document.getElementById('admDiagramPreviewImg');
    const clr = document.getElementById('btnClearDiagramImg');
    if (f) f.value = '';
    if (cap) cap.value = '';
    if (img) img.src = '';
    if (wrap) wrap.style.display = 'none';
    if (clr) clr.style.display = 'none';
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

// Automatically refresh Mixed counts when admin changes upload folder path
const _origHandleAdminPathChange = handleAdminPathChange;
handleAdminPathChange = function(event, depth) {
    _origHandleAdminPathChange(event, depth);
    setTimeout(refreshAutoMixAvailableCounts, 80);
};

// Automatically clear new Question Image, Diagram & Formula Preview when clearing form
const _origClearAdminUploadForm = clearAdminUploadForm;
clearAdminUploadForm = function(isSmartClear = false) {
    _origClearAdminUploadForm(isSmartClear);
    clearAdminQuestionTextImage();
    clearAdminDiagramImage();
    updateAdminLiveFormulaPreview();
};

async function processAdminUpload() {
    const type = document.getElementById('admResourceType').value;
    const targetPath = adminSelectedPath.join(' > ');
    const btn = document.getElementById('uploadBtn');
    btn.innerText = 'Uploading... Please wait';
    btn.disabled = true;

    try {
        if (type === 'mcq') {
            let questionText = document.getElementById('admQuestion').value.trim();
            const options = {
                A: document.getElementById('admOptA').value.trim(),
                B: document.getElementById('admOptB').value.trim(),
                C: document.getElementById('admOptC').value.trim(),
                D: document.getElementById('admOptD').value.trim()
            };
            const correctAnswers = Array.from(document.querySelectorAll('.admCorrectCb:checked')).map(cb => cb.value);
            const explanation = document.getElementById('admExplanation').value.trim();

            const qTextImgFile = pendingAdminQuestionPastedBlob || document.getElementById('admQTextImageFile')?.files?.[0] || null;
            const diagramFile = document.getElementById('admQImage')?.files?.[0] || null;
            const diagramCaption = document.getElementById('admDiagramCaption')?.value.trim() || '';
            const diagramBgMode = document.getElementById('admDiagramBgMode')?.value || 'light';

            let level = document.getElementById('admDifficulty').value;
            const leaf = (adminSelectedPath[adminSelectedPath.length - 1] || '').replace(/^\d+\.\s*/, '').trim();
            if (['Easy', 'Medium', 'Hard', 'Mixed'].includes(leaf) && level === 'Mixed') level = leaf;

            if ((!questionText && !qTextImgFile) || !options.A || !options.B || !correctAnswers.length) {
                throw new Error('Provide either Question Text OR a Question Image, plus Option A, Option B, and Correct Answer.');
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

            // Build clean, self-contained HTML for Question Image and Diagram so it displays neatly everywhere without disturbing Options or Explanation
            let finalQuestionHtml = questionText;
            if (questionImageUrl) {
                const safeQUrl = questionImageUrl.replace(/'/g, "\\'");
                const qImgBlock = `<div class="mcq-question-text-img-wrap"><img src="${questionImageUrl}" alt="Question" onclick="openStudentDiagramLightbox('${safeQUrl}', 'Question Image')" title="Click to zoom"></div>`;
                finalQuestionHtml = finalQuestionHtml ? `${finalQuestionHtml}${qImgBlock}` : qImgBlock;
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

            await db.collection('content').add({
                type: 'mcq',
                path: targetPath,
                level,
                question: finalQuestionHtml,
                rawQuestionText: questionText,
                options,
                correctAnswers,
                explanation,
                imageUrl: null,
                questionImageUrl,
                diagramUrl,
                diagramCaption,
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
