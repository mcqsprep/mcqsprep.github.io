// ==========================================
// 10. SCALED ADMIN PANEL, TOPIC FILTERS, SIDEBAR & CUSTOM PRACTICE MANAGERS
// ==========================================
let adminCurrentTab = 'upload';
let adminNewTopicPath = [];
let adminSelectedPath = [];
let adminManageSelectedPath = [];

// State for Edit / Delete Topics Filter System
let adminTopicFilterPath = [];
let adminTopicScopeFilter = 'ALL'; // 'ALL' | 'MAIN' | 'SUB'
let adminTopicTypeFilter = 'ALL';  // 'ALL' | 'both' | 'mcq' | 'pdf'
let unifiedAdminTopics = [];

// State for Manual Quick Links & Essential Practice Manager
let adminSidebarPickPath = [];

// State for Manual Custom Practice (Subjects & Chapters) Manager
let adminCpSelectedExam = '';
let adminCpSubjectPickPath = [];
let adminCpTargetSubjectPath = '';
let adminCpChapterPickPath = [];

let lastManageDoc = null;
let isFetchingManageContent = false;

const adminStyles = `
<style>
    /* Visible, Draggable Glowing Slide Bar Under Admin Navigation Buttons */
    .admin-nav-pills {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 14px;
        margin-bottom: 25px;
        scrollbar-width: thin;
        scrollbar-color: #fdb813 #12121a;
    }
    .admin-nav-pills::-webkit-scrollbar {
        height: 8px;
        display: block;
    }
    .admin-nav-pills::-webkit-scrollbar-track {
        background: #12121a;
        border-radius: 10px;
        border: 1px solid #2b2b36;
    }
    .admin-nav-pills::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #fdb813, #f97316);
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(253, 184, 19, 0.45);
        cursor: pointer;
    }
    .admin-nav-pills::-webkit-scrollbar-thumb:hover {
        background: #fdb813;
    }

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

    /* Clean Filter Bar & Topic Group Headers */
    .admin-scope-bar { display: flex; gap: 8px; flex-wrap: wrap; background: #111117; padding: 6px; border-radius: 12px; border: 1px solid #2b2b36; }
    .admin-scope-btn { flex: 1; min-width: 130px; padding: 10px 14px; border-radius: 8px; border: none; background: transparent; color: #9e9ea7; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; text-align: center; }
    .admin-scope-btn:hover { color: #fff; }
    .admin-scope-btn.active { background: var(--primary-yellow); color: #000; box-shadow: 0 2px 10px rgba(253,184,19,0.3); }

    .admin-topic-group-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(253, 184, 19, 0.08); border: 1px solid rgba(253,184,19,0.25); border-left: 4px solid var(--primary-yellow); border-radius: 10px; margin: 22px 0 14px 0; font-size: 15px; font-weight: 700; color: #fff; }
    .admin-topic-group-count { font-size: 12px; background: rgba(255,255,255,0.08); color: var(--primary-yellow); padding: 4px 12px; border-radius: 20px; font-weight: 700; }

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

// Live Auto-Icon Preview Updater for Create Topic Tab
function updateLiveAutoIconPreview() {
    const nameInput = document.getElementById('newFolderName');
    const typeSelect = document.getElementById('newFolderType');
    const customOverride = document.getElementById('newFolderIcon');
    const previewBox = document.getElementById('autoIconPreviewBadge');
    const previewText = document.getElementById('autoIconPreviewName');
    if (!previewBox) return;

    let rawName = nameInput ? nameInput.value.trim() : "";
    let folderType = typeSelect ? typeSelect.value : "both";
    let manualEmoji = customOverride ? customOverride.value.trim() : "";

    let sampleName = rawName || "New Study Topic";
    let theme = typeof getAutoTopicTheme === 'function'
        ? getAutoTopicTheme(sampleName, manualEmoji || null, 0, null, folderType === 'pdf' ? '📄' : (folderType === 'mcq' ? '📝' : '📘'))
        : { i: manualEmoji || '📘', c: '#fdb813', bg: 'rgba(253,184,19,0.16)', border: 'rgba(253,184,19,0.6)', glow: 'rgba(253,184,19,0.28)' };

    previewBox.style.background = theme.bg;
    previewBox.style.color = theme.c;
    previewBox.style.borderColor = theme.border;
    previewBox.style.boxShadow = `0 0 14px ${theme.glow}`;
    previewBox.innerText = theme.i;

    if (previewText) {
        previewText.innerHTML = rawName
            ? `<b style="color:${theme.c};">${theme.i} ${rawName.replace(/^\d+\.\s*/, '')}</b> <span style="color:#888; font-size:11px;">(Auto-assigned)</span>`
            : `<span style="color:#aaa;">Type a folder name in Step 2 — icon & glow color assign automatically!</span>`;
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
                <div class="admin-pill ${adminCurrentTab === 'sidebar-links' ? 'active' : ''}" onclick="switchAdminTab('sidebar-links')">🔗 Quick Links & Essential</div>
                <div class="admin-pill ${adminCurrentTab === 'custom-practice' ? 'active' : ''}" onclick="switchAdminTab('custom-practice')">🎯 Custom Practice</div>
                <div class="admin-pill ${adminCurrentTab === 'manage' ? 'active' : ''}" onclick="switchAdminTab('manage')">📋 Edit MCQs / PDFs</div>
                <div class="admin-pill ${adminCurrentTab === 'reports' ? 'active' : ''}" onclick="switchAdminTab('reports')">🚨 Reports</div>
                <div class="admin-pill ${adminCurrentTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👥 Users</div>
                <div class="admin-pill ${adminCurrentTab === 'doubts' ? 'active' : ''}" onclick="switchAdminTab('doubts')">🚩 Doubts</div>
                <div class="admin-pill ${adminCurrentTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">🛠️ Settings</div>
            </div>
            
            <div id="admin-upload-view" style="display:${adminCurrentTab === 'upload' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <h3 class="admin-section-header"><span>🎯</span> 1. Select Target Destination</h3>
                    <div id="dynamic-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap;"></div>
                    <div id="upload-path-display" style="margin-top:15px; font-size:14px; background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); padding: 12px; border-radius: 8px; color:var(--correct-green);">
                        <b>Uploading To:</b> <span id="upload-path-text" style="color:white;">None</span>
                    </div>
                </div>
                
                <div id="upload-form-area" style="display:none;">
                    <div class="admin-panel-card">
                        <h3 class="admin-section-header" style="justify-content: space-between;">
                            <div style="display:flex; align-items:center; gap:10px;"><span>📝</span> 2. Draft Content</div>
                            <select id="admResourceType" class="input-field" onchange="toggleAdminFormType()" style="margin: 0; width: auto; min-width: 150px; padding: 6px 12px;">
                                <option value="mcq">MCQ Format</option>
                                <option value="pdf">PDF / Image Link</option>
                            </select>
                        </h3>
                        
                        <div id="admin-mcq-form">
                            <label class="admin-label">Question Text</label>
                            <textarea id="admQuestion" class="input-field" style="min-height: 100px; font-size: 15px;" placeholder="Type or paste the question here..."></textarea>
                            
                            <div class="admin-grid-2" style="margin-bottom: 15px;">
                                <div>
                                    <label class="admin-label">Attach Image (Optional)</label>
                                    <input type="file" id="admQImage" class="input-field" accept="image/*" style="padding: 9px 14px;">
                                </div>
                                <div>
                                    <label class="admin-label">Difficulty Level</label>
                                    <select id="admDifficulty" class="input-field">
                                        <option value="Mixed">Mixed (Default)</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            
                            <label class="admin-label" style="margin-top: 25px;">Multiple Choice Options</label>
                            <div class="admin-grid-2">
                                <input type="text" id="admOptA" class="input-field" placeholder="Option A">
                                <input type="text" id="admOptB" class="input-field" placeholder="Option B">
                                <input type="text" id="admOptC" class="input-field" placeholder="Option C">
                                <input type="text" id="admOptD" class="input-field" placeholder="Option D">
                            </div>
                            
                            <label class="admin-label" style="margin-top: 15px;">Select Correct Answer(s)</label>
                            <div class="admin-checkbox-group">
                                <label class="admin-cb-label"><input type="checkbox" value="A" class="admCorrectCb"> A</label>
                                <label class="admin-cb-label"><input type="checkbox" value="B" class="admCorrectCb"> B</label>
                                <label class="admin-cb-label"><input type="checkbox" value="C" class="admCorrectCb"> C</label>
                                <label class="admin-cb-label"><input type="checkbox" value="D" class="admCorrectCb"> D</label>
                            </div>
                            
                            <label class="admin-label">Explanation (Optional)</label>
                            <textarea id="admExplanation" class="input-field" style="min-height: 80px;" placeholder="Explain why the answer is correct..."></textarea>
                        </div>
                        
                        <div id="admin-pdf-form" style="display:none;">
                            <label class="admin-label">Document Title</label>
                            <input type="text" id="admPdfTitle" class="input-field" placeholder="e.g. Chapter 1 Handwritten Notes">
                            <label class="admin-label" style="margin-top: 15px;">Select File (PDF or Image)</label>
                            <input type="file" id="admPdfFile" class="input-field" accept=".pdf, image/*" style="padding: 9px 14px;">
                        </div>
                        
                        <div style="display: flex; gap: 15px; margin-top: 30px; border-top: 1px solid #2b2b36; padding-top: 20px;">
                            <button id="uploadBtn" class="btn-exam btn-green-glow" onclick="processAdminUpload()" style="flex: 2; font-size: 16px;">☁️ Upload & Save</button>
                            <button class="btn-exam" onclick="clearAdminUploadForm(false)" style="background-color: transparent; color: var(--wrong-red); border: 1px solid var(--wrong-red); flex: 1;">Clear Fields</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="admin-topics-view" style="display:${adminCurrentTab === 'topics' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color: rgba(253, 184, 19, 0.4); background: rgba(253, 184, 19, 0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom: 1px solid rgba(253, 184, 19, 0.2); padding-bottom: 15px; margin-bottom: 20px;">
                        <h3 style="color:var(--primary-yellow); margin:0; font-size:18px; display:flex; align-items:center; gap:10px;">📁 Create New Topic or Subtopic Folder</h3>
                        <button class="btn-exam" onclick="switchAdminTab('edit-topics')" style="background:#1c1c24; border:1px solid var(--primary-yellow); color:var(--primary-yellow); padding:7px 14px; font-size:12px;">🗂️ Manage Existing Topics &rarr;</button>
                    </div>
                    <label class="admin-label">1. Select Parent Path (Leave at Root to create a Main Exam Category)</label>
                    <div id="dynamic-new-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap;"></div>
                    <div id="new-topic-path-display" style="margin-top:10px; font-size:13px; color:var(--primary-yellow); margin-bottom: 20px;">
                        <b>Destination Path:</b> <span id="new-topic-path-text" style="color:white;">Root (Main Menu)</span>
                    </div>
                    
                    <div class="admin-grid-2">
                        <div>
                            <label class="admin-label">2. Folder Name</label>
                            <input type="text" id="newFolderName" class="input-field" placeholder="e.g. 01. Molecular Genetics, Thermodynamics, Polity..." oninput="updateLiveAutoIconPreview()">
                            <span style="font-size: 11px; color: #777;">*Tip: Start with a number (01., 02.) to lock the sorting order!</span>
                        </div>
                        <div>
                            <label class="admin-label">3. Automatic Study Icon & Glow Preview (No Typing Needed!)</label>
                            <div style="display:flex; align-items:center; gap:12px; background:#111522; border:1px solid #2b2b36; padding:10px 14px; border-radius:10px;">
                                <div id="autoIconPreviewBadge" style="width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(253,184,19,0.5); background:rgba(253,184,19,0.15); flex-shrink:0;">📘</div>
                                <div style="flex:1; font-size:13px;" id="autoIconPreviewName">
                                    <span style="color:#aaa;">Type a folder name in Step 2 — icon & glow color assign automatically!</span>
                                </div>
                                <input type="text" id="newFolderIcon" class="input-field" placeholder="Auto" maxlength="2" title="Optional manual emoji override" oninput="updateLiveAutoIconPreview()" style="width:62px; margin:0; padding:8px; text-align:center; font-size:14px;">
                            </div>
                            <span style="font-size: 11px; color: var(--correct-green);">✅ 100% Automatic — recognizes 200+ study subjects, chapters & exams automatically.</span>
                        </div>
                    </div>
                    <div style="margin-top: 14px;">
                        <label class="admin-label">4. Expected Content Type</label>
                        <select id="newFolderType" class="input-field" onchange="updateLiveAutoIconPreview()">
                            <option value="both">📂 Parent Category (To hold sub-folders inside)</option>
                            <option value="mcq">📝 MCQs Practice (End Topic)</option>
                            <option value="pdf">📄 PDF / Image Material (End Topic)</option>
                        </select>
                    </div>
                    <button class="btn-exam btn-yellow-glow" onclick="createCustomTopic()" style="width:100%; max-width:250px; margin-top: 15px;">+ Create Folder</button>
                </div>
            </div>

            <div id="admin-edit-topics-view" style="display:${adminCurrentTab === 'edit-topics' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #2b2b36; padding-bottom:15px; margin-bottom:20px;">
                        <div>
                            <h3 style="margin:0; font-size:18px; color:#fff;">🗂️ Filter & Manage Topics / Subtopics</h3>
                            <span style="font-size:12px; color:var(--text-muted);">View, edit, or delete any Main Topic or Subtopic using the filter controls below.</span>
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

                <div id="admin-topic-list-container"></div>
            </div>

            <div id="admin-sidebar-links-view" style="display:${adminCurrentTab === 'sidebar-links' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color:rgba(168,85,247,0.4);">
                    <h3 class="admin-section-header" style="color:#c084fc;">🔗 Add Existing Topic / Subtopic to Home Sidebar</h3>
                    <p style="color:var(--text-muted); font-size:13px; margin-top:-10px; margin-bottom:20px;">
                        Select any existing topic or subtopic folder below and add it to <b>Quick Links</b> or <b>Essential Practice</b>. (Note: <b>📅 Daily Quiz Challenge</b> is already automatic under Essential Practice for all exams!)
                    </p>

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
                            <p style="font-size:12px; color:var(--text-muted); margin-top:0; margin-bottom:12px;">Pick an existing subject folder under the selected exam to add as a Subject.</p>
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

            <div id="admin-manage-view" style="display:${adminCurrentTab === 'manage' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <h3 class="admin-section-header">🔍 Filter & Fetch MCQs / PDFs</h3>
                    <div id="manage-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;"></div>
                    <button class="btn-exam btn-yellow-glow" onclick="loadContentForManagement(false)" style="padding:12px 20px; width:100%; max-width:250px; font-size:15px;">Fetch Content</button>
                </div>
                <div id="manage-content-list">
                    <p style="color:var(--text-muted); text-align: center; padding: 40px; border: 1px dashed #333; border-radius: 12px;">Select a folder above and click Fetch to load items.</p>
                </div>
            </div>

            <div id="admin-reports-view" style="display:${adminCurrentTab === 'reports' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminReports()" style="margin-bottom:20px;">🔄 Refresh Reports</button>
                <div id="reports-list-container"></div>
            </div>

            <div id="admin-users-view" style="display:${adminCurrentTab === 'users' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminUsers()" style="margin-bottom:20px;">🔄 Refresh Students List</button>
                <div id="users-table-container" class="admin-panel-card" style="overflow-x:auto; padding: 0;"></div>
            </div>

            <div id="admin-doubts-view" style="display:${adminCurrentTab === 'doubts' ? 'block' : 'none'};">
                <button class="btn-exam btn-yellow-glow" onclick="loadAdminDoubts()" style="margin-bottom:20px;">🔄 Refresh Flagged Doubts</button>
                <div id="doubts-list-container"></div>
            </div>

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
    else if (adminCurrentTab === 'sidebar-links') { initAdminSidebarLinksTab(); }
    else if (adminCurrentTab === 'custom-practice') { initAdminCustomPracticeTab(); }
    else if (adminCurrentTab === 'manage') { _buildManageSelectors(); loadContentForManagement(false); }
    else if (adminCurrentTab === 'reports') loadAdminReports();
    else if (adminCurrentTab === 'users') loadAdminUsers();
    else if (adminCurrentTab === 'doubts') loadAdminDoubts();
}

function switchAdminTab(tab) { adminCurrentTab = tab; _renderAdminPanel(); }

function toggleAdminFormType() {
    let val = document.getElementById('admResourceType').value;
    document.getElementById('admin-mcq-form').style.display = val === 'mcq' ? 'block' : 'none';
    document.getElementById('admin-pdf-form').style.display = val === 'pdf' ? 'block' : 'none';
}

function clearAdminUploadForm(isSmartClear = false) {
    if(!isSmartClear && !confirm("Are you sure you want to clear all typed fields?")) return;
    
    document.getElementById('admQuestion').value = ""; 
    document.getElementById('admQImage').value = ""; 
    document.getElementById('admExplanation').value = "";
    document.getElementById('admOptA').value = ""; 
    document.getElementById('admOptB').value = ""; 
    document.getElementById('admOptC').value = ""; 
    document.getElementById('admOptD').value = "";
    document.querySelectorAll('.admCorrectCb').forEach(cb => cb.checked = false); 
    document.getElementById('admPdfTitle').value = ""; 
    document.getElementById('admPdfFile').value = ""; 
    
    if(!isSmartClear) {
        document.getElementById('admDifficulty').value = "Mixed";
        showNotification("🧹 Form cleared!");
    }
}

// Helper to get all child keys under a path from both appData AND customTopicTypes
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

    return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

// ==========================================
// UNIFIED TOPIC & SUBTOPIC FILTER, EDIT & DELETE SYSTEM
// ==========================================
function inferTopicType(fullPath, name, hasChildren) {
    let meta = customTopicTypes[fullPath];
    if (meta && meta.type) return meta.type;
    if (hasChildren) return 'both';
    let lower = (name || '').toLowerCase();
    let pdfKeys = ["ncert", "book", "pyq", "previous", "pdf", "note", "material", "syllabus"];
    if (pdfKeys.some(k => lower.includes(k)) && !lower.includes('mcq') && !lower.includes('practice')) return 'pdf';
    return 'mcq';
}

function _buildAdminTopicFilterSelectors() {
    const container = document.getElementById('admin-topic-filter-selectors');
    if (!container) return;

    let html = '';
    for (let i = 0; i <= adminTopicFilterPath.length; i++) {
        let parentSlice = adminTopicFilterPath.slice(0, i);
        let keys = getMergedChildKeysAtPath(parentSlice);
        if (keys.length === 0) break;

        let placeholder = i === 0
            ? '-- All Exam Categories --'
            : `-- All Subfolders Under ${adminTopicFilterPath[i - 1].replace(/^\d+\.\s*/, '')} --`;

        html += `<select class="input-field" style="flex:1; min-width:180px; margin-bottom:0;" onchange="handleAdminTopicFilterPathChange(event, ${i})">`;
        html += `<option value="" ${!adminTopicFilterPath[i] ? 'selected' : ''}>${placeholder}</option>`;

        keys.forEach(key => {
            let selected = (adminTopicFilterPath[i] === key) ? 'selected' : '';
            html += `<option value="${key.replace(/"/g, '&quot;')}" ${selected}>${key}</option>`;
        });
        html += `</select>`;

        if (!adminTopicFilterPath[i]) break;
    }
    container.innerHTML = html;

    const pathTextEl = document.getElementById('admin-topic-filter-path-text');
    if (pathTextEl) {
        pathTextEl.innerText = adminTopicFilterPath.length > 0
            ? adminTopicFilterPath.join(' > ')
            : 'All Exam Categories';
    }
}

function handleAdminTopicFilterPathChange(event, depth) {
    const val = event.target.value;
    adminTopicFilterPath = adminTopicFilterPath.slice(0, depth);
    if (val !== "") {
        adminTopicFilterPath.push(val);
    }
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
    _renderAdminPanel();
}

async function loadAdminTopicsList() {
    const container = document.getElementById('admin-topic-list-container'); 
    if (!container) return;
    container.innerHTML = `<p style="color:#777; text-align:center; padding:25px;">Loading all topics and subtopics...</p>`;

    try {
        await loadCustomTopics();
        let mapByFullPath = new Map();
        let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);

        function scanAppData(obj, parentArr = []) {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(key => {
                if (parentArr.length === 0 && key === "Daily Quiz Challenge") return;
                let currentArr = [...parentArr, key];
                let fullPath = currentArr.join(' > ');
                if (deletedSet.has(fullPath)) return;

                let parentPath = parentArr.join(' > ');
                let childObj = obj[key];
                let hasChildren = childObj && typeof childObj === 'object' && Object.keys(childObj).length > 0;
                let meta = customTopicTypes[fullPath] || {};
                let displayName = meta.displayName || key;

                mapByFullPath.set(fullPath, {
                    fullPath: fullPath,
                    parentPath: parentPath,
                    name: displayName,
                    rawKey: key,
                    type: inferTopicType(fullPath, displayName, hasChildren),
                    icon: meta.icon || null,
                    docId: meta.docId || null
                });

                if (hasChildren) {
                    scanAppData(childObj, currentArr);
                }
            });
        }
        scanAppData(appData, []);

        const snap = await db.collection("custom_topics").get();
        snap.forEach(doc => {
            let d = doc.data();
            let pPath = (d.parentPath || "").trim();
            let fullPath = pPath ? `${pPath} > ${d.name}` : d.name;
            if (deletedSet.has(fullPath)) return;

            let existing = mapByFullPath.get(fullPath);
            mapByFullPath.set(fullPath, {
                fullPath: fullPath,
                parentPath: pPath,
                name: (existing && existing.name) || d.name,
                rawKey: d.name,
                type: d.type || (existing ? existing.type : 'both'),
                icon: d.icon || (existing ? existing.icon : null),
                docId: doc.id
            });
        });

        unifiedAdminTopics = Array.from(mapByFullPath.values()).sort((a, b) => {
            let pCmp = (a.parentPath || "").localeCompare(b.parentPath || "");
            if (pCmp !== 0) return pCmp;
            return (a.name || "").localeCompare(b.name || "");
        });

        _buildAdminTopicFilterSelectors();
        filterAdminTopics();
    } catch(e) {
        container.innerHTML = `<p style="color:var(--wrong-red);">Error loading topics: ${e.message}</p>`;
    }
}

function filterAdminTopics() {
    let prefix = adminTopicFilterPath.join(' > ');

    let filtered = unifiedAdminTopics.filter(t => {
        let isMainTopic = !t.parentPath || t.parentPath === "";

        if (adminTopicScopeFilter === 'MAIN' && !isMainTopic) return false;
        if (adminTopicScopeFilter === 'SUB' && isMainTopic) return false;

        if (adminTopicTypeFilter !== 'ALL' && t.type !== adminTopicTypeFilter) return false;

        if (prefix && adminTopicScopeFilter !== 'MAIN') {
            if (isMainTopic) {
                return t.rawKey === adminTopicFilterPath[0];
            } else {
                return t.parentPath === prefix || t.parentPath.startsWith(prefix + " > ") || t.fullPath === prefix;
            }
        }
        return true;
    });

    renderAdminTopicsList(filtered);
}

function buildAdminTopicCardHtml(d, idx) {
    let identifier = d.docId ? `doc:${d.docId}` : `builtin:${d.fullPath}`;
    let safeId = identifier.replace(/'/g, "\\'");
    let safeFullPath = d.fullPath.replace(/'/g, "\\'");
    let cleanName = (d.name || '').replace(/'/g, "\\'");
    let cleanIcon = d.icon ? d.icon.replace(/'/g, "\\'") : '';
    let typeBadgeStr = d.type === 'both' ? 'PARENT CATEGORY' : (d.type || 'mcq').toUpperCase();
    let parentStr = d.parentPath ? d.parentPath : 'Root (Main Menu)';
    let smartTheme = typeof getAutoTopicTheme === 'function'
        ? getAutoTopicTheme(d.name || '', d.icon, idx)
        : { i: d.icon || '📁', c: '#fdb813' };

    return `
    <div style="background:#1c1c24; border:1px solid #2b2b36; border-left: 4px solid ${smartTheme.c}; border-radius:12px; padding:16px 20px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 15px;">
        <div>
            <span style="color:var(--text-muted); font-size:12px; display:block; margin-bottom:5px;">Path: ${parentStr}</span>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <b style="font-size:16px; color:#fff;">${smartTheme.i} ${d.name}</b>
                <span style="font-size:10.5px; background:#2b2b36; color:#ccc; padding:3px 9px; border-radius:6px; font-weight:700; letter-spacing:0.4px;">${typeBadgeStr}</span>
            </div>
        </div>
        <div style="display:flex; gap:10px;">
            <button onclick="openEditTopicModal('${safeId}', '${cleanName}', '${d.type}', '${cleanIcon}', '${safeFullPath}')" style="background:rgba(33, 150, 243, 0.15); border:1px solid rgba(33,150,243,0.4); color:#38bdf8; padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">Edit</button>
            <button onclick="deleteUnifiedTopic('${safeId}', '${safeFullPath}')" style="background:rgba(244, 67, 54, 0.15); border:1px solid rgba(244,67,54,0.4); color:var(--wrong-red); padding:8px 18px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">Delete</button>
        </div>
    </div>`;
}

function renderAdminTopicsList(topicsArray) {
    const container = document.getElementById('admin-topic-list-container');
    if (!container) return;

    if (topicsArray.length === 0) {
        container.innerHTML = `<div class="admin-panel-card" style="text-align:center; color:#888; padding:35px;">No topics or subtopics match the selected filters.</div>`;
        return;
    }

    let mainTopics = topicsArray.filter(t => !t.parentPath || t.parentPath === "");
    let subTopics = topicsArray.filter(t => t.parentPath && t.parentPath !== "");

    let html = '';

    if (adminTopicScopeFilter !== 'SUB' && mainTopics.length > 0) {
        html += `
        <div class="admin-topic-group-header">
            <span>🌟 Main Topics (Root Exam Categories)</span>
            <span class="admin-topic-group-count">${mainTopics.length} Topic${mainTopics.length > 1 ? 's' : ''}</span>
        </div>`;
        mainTopics.forEach((d, idx) => {
            html += buildAdminTopicCardHtml(d, idx);
        });
    }

    if (adminTopicScopeFilter !== 'MAIN' && subTopics.length > 0) {
        html += `
        <div class="admin-topic-group-header" style="border-left-color:#38bdf8; background:rgba(56, 189, 248, 0.08); border-color:rgba(56,189,248,0.25);">
            <span>📂 Subtopics & Chapters</span>
            <span class="admin-topic-group-count" style="color:#38bdf8;">${subTopics.length} Subtopic${subTopics.length > 1 ? 's' : ''}</span>
        </div>`;
        subTopics.forEach((d, idx) => {
            html += buildAdminTopicCardHtml(d, idx + 4);
        });
    }

    container.innerHTML = html;
}

let activeEditFullPath = "";
function openEditTopicModal(identifier, name, type, icon = null, fullPath = "") {
    activeEditFullPath = fullPath;
    document.getElementById('editTopicId').value = identifier;
    document.getElementById('editTopicName').value = name;
    document.getElementById('editTopicType').value = type || 'both';
    document.getElementById('editTopicIcon').value = icon || '';
    document.getElementById('editTopicModal').style.display = 'flex';
}

function closeEditTopicModal() { document.getElementById('editTopicModal').style.display = 'none'; }

async function saveEditedTopic() {
    let identifier = document.getElementById('editTopicId').value;
    let name = document.getElementById('editTopicName').value.trim();
    let type = document.getElementById('editTopicType').value;
    let icon = document.getElementById('editTopicIcon').value.trim();
    if(!name) return alert("Folder name is required.");

    if (!icon && typeof getAutomaticIconForName === 'function') {
        icon = getAutomaticIconForName(name, type);
    }

    try {
        if (identifier.startsWith('doc:')) {
            let docId = identifier.slice(4);
            await db.collection("custom_topics").doc(docId).update({
                name: name,
                type: type,
                icon: icon || null
            });
        }
        if (activeEditFullPath) {
            topicOverrides.editedPaths = topicOverrides.editedPaths || {};
            topicOverrides.editedPaths[activeEditFullPath] = {
                displayName: name,
                type: type,
                icon: icon || null
            };
            await db.collection("settings").doc("topic_overrides").set(topicOverrides, { merge: true });
        }

        closeEditTopicModal();
        showNotification("✅ Folder updated with smart icon!");
        await loadAdminTopicsList();
    } catch(e) { alert("Error: " + e.message); }
}

async function deleteUnifiedTopic(identifier, fullPath) {
    if(!confirm(`Are you sure you want to delete "${fullPath}" from the menu?`)) return;
    try {
        if (identifier.startsWith('doc:')) {
            let docId = identifier.slice(4);
            await db.collection("custom_topics").doc(docId).delete();
        }

        const snap = await db.collection("custom_topics").get();
        let batch = db.batch();
        let hasBatchDeletes = false;
        snap.forEach(doc => {
            let d = doc.data();
            let p = (d.parentPath || "").trim();
            let f = p ? `${p} > ${d.name}` : d.name;
            if (f === fullPath || p === fullPath || p.startsWith(fullPath + " > ")) {
                batch.delete(doc.ref);
                hasBatchDeletes = true;
            }
        });
        if (hasBatchDeletes) await batch.commit();

        topicOverrides.deletedPaths = Array.from(new Set([...(topicOverrides.deletedPaths || []), fullPath]));
        await db.collection("settings").doc("topic_overrides").set(topicOverrides, { merge: true });

        showNotification("🗑️ Topic deleted!");
        await loadAdminTopicsList();
    } catch(e) {
        showNotification("❌ Delete error: " + e.message);
    }
}

// ==========================================
// MANUAL QUICK LINKS & ESSENTIAL PRACTICE MANAGER
// ==========================================
function initAdminSidebarLinksTab() {
    _buildAdminSidebarPickSelectors();
    renderAdminSidebarConfigLists();
}

function _buildAdminSidebarPickSelectors() {
    const container = document.getElementById('admin-sidebar-pick-selectors');
    if (!container) return;

    let html = '';
    for (let i = 0; i <= adminSidebarPickPath.length; i++) {
        let parentSlice = adminSidebarPickPath.slice(0, i);
        let keys = getMergedChildKeysAtPath(parentSlice);
        if (keys.length === 0) break;

        let placeholder = i === 0 ? '-- Select Main Topic --' : '-- Stop Here / Select Subtopic --';
        html += `<select class="input-field" style="flex:1; min-width:170px; margin-bottom:0;" onchange="handleAdminSidebarPickChange(event, ${i})">`;
        html += `<option value="" ${!adminSidebarPickPath[i] ? 'selected' : ''}>${placeholder}</option>`;

        keys.forEach(key => {
            let selected = (adminSidebarPickPath[i] === key) ? 'selected' : '';
            html += `<option value="${key.replace(/"/g, '&quot;')}" ${selected}>${key}</option>`;
        });
        html += `</select>`;

        if (!adminSidebarPickPath[i]) break;
    }
    container.innerHTML = html;

    const textEl = document.getElementById('admin-sidebar-pick-text');
    if (textEl) {
        textEl.innerText = adminSidebarPickPath.length > 0 ? adminSidebarPickPath.join(' > ') : 'None selected';
    }
}

function handleAdminSidebarPickChange(event, depth) {
    const val = event.target.value;
    adminSidebarPickPath = adminSidebarPickPath.slice(0, depth);
    if (val !== "") adminSidebarPickPath.push(val);
    _buildAdminSidebarPickSelectors();
}

async function addTopicToSidebarSection() {
    if (adminSidebarPickPath.length === 0) {
        showNotification("⚠️ Please select an existing topic or subtopic folder first.");
        return;
    }

    const sectionType = document.getElementById('adminSidebarSectionType').value;
    const customTitleInput = document.getElementById('adminSidebarCustomTitle');
    let fullPath = adminSidebarPickPath.join(' > ');
    let leafName = adminSidebarPickPath[adminSidebarPickPath.length - 1].replace(/^\d+\.\s*/, '');
    let defaultTitle = adminSidebarPickPath.length > 1
        ? `${leafName} (${adminSidebarPickPath[0].replace(/^\d+\.\s*/, '')})`
        : leafName;
    let finalTitle = (customTitleInput && customTitleInput.value.trim()) ? customTitleInput.value.trim() : defaultTitle;

    let list = window.sidebarConfig[sectionType] || [];
    if (list.some(item => item.path === fullPath)) {
        showNotification("⚠️ This folder is already in that section.");
        return;
    }

    list.push({
        id: 'sb_' + Date.now(),
        title: finalTitle,
        path: fullPath
    });
    window.sidebarConfig[sectionType] = list;

    try {
        await db.collection("settings").doc("sidebar_config").set(window.sidebarConfig, { merge: true });
        if (customTitleInput) customTitleInput.value = '';
        showNotification("✅ Added to Home Sidebar!");
        renderAdminSidebarConfigLists();
        if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
    } catch (e) {
        showNotification("❌ Failed to save: " + e.message);
    }
}

async function removeSidebarConfigItem(sectionType, itemId) {
    window.sidebarConfig[sectionType] = (window.sidebarConfig[sectionType] || []).filter(item => item.id !== itemId);
    try {
        await db.collection("settings").doc("sidebar_config").set(window.sidebarConfig, { merge: true });
        showNotification("🗑️ Removed from Sidebar!");
        renderAdminSidebarConfigLists();
        if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
    } catch (e) {
        showNotification("❌ Error: " + e.message);
    }
}

async function clearAllSidebarSection(sectionType) {
    let label = sectionType === 'quickLinks' ? 'Quick Links' : 'Essential Practice (manual links)';
    if (!confirm(`Delete ALL manual items from ${label}?`)) return;
    window.sidebarConfig[sectionType] = [];
    try {
        await db.collection("settings").doc("sidebar_config").set(window.sidebarConfig, { merge: true });
        showNotification(`🗑️ Cleared manual items from ${label}!`);
        renderAdminSidebarConfigLists();
        if (typeof updateSidebarLinks === 'function') updateSidebarLinks();
    } catch (e) {
        showNotification("❌ Error: " + e.message);
    }
}

function renderAdminSidebarConfigLists() {
    const qEl = document.getElementById('admin-quick-links-list');
    const eEl = document.getElementById('admin-essential-practice-list');
    if (!qEl || !eEl) return;

    const renderItems = (items, sectionType, accentColor) => {
        if (!items || items.length === 0) {
            return `<p style="color:#777; font-size:13px; text-align:center; padding:18px; border:1px dashed #2b2b36; border-radius:10px; margin:0;">No manual items added. Use the form above to add existing topics or subtopics.</p>`;
        }
        return items.map((item, idx) => {
            let theme = typeof getAutoTopicTheme === 'function' ? getAutoTopicTheme(item.title, null, idx) : { i: '📂', c: accentColor };
            return `
            <div style="background:#1c1c24; border:1px solid #2b2b36; border-left:4px solid ${theme.c}; border-radius:10px; padding:12px 15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <div>
                    <div style="font-weight:700; color:#fff; font-size:14px;">${theme.i} ${item.title}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">Path: ${item.path}</div>
                </div>
                <button onclick="removeSidebarConfigItem('${sectionType}', '${item.id}')" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:var(--wrong-red); padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">Delete</button>
            </div>`;
        }).join('');
    };

    qEl.innerHTML = renderItems(window.sidebarConfig.quickLinks, 'quickLinks', '#a855f7');
    eEl.innerHTML = renderItems(window.sidebarConfig.essentialPractice, 'essentialPractice', '#38bdf8');
}

// ==========================================
// MANUAL CUSTOM PRACTICE (SUBJECTS & CHAPTERS) MANAGER
// ==========================================

function getAllCandidateSubjectsForExam(examKey) {
    if (!examKey) return [];
    let map = new Map();

    let manualList = window.customPracticeConfig?.exams?.[examKey]?.subjects || [];
    manualList.forEach(s => {
        map.set(s.path, {
            path: s.path,
            label: (s.label || s.path.split(' > ').pop() || '').replace(/^\d+\.\s*/, ''),
            isConfigured: true
        });
    });

    if (typeof buildCwCatalogForExam === 'function') {
        let scanned = buildCwCatalogForExam(examKey, true);
        scanned.forEach(s => {
            if (!map.has(s.fullPath)) {
                map.set(s.fullPath, {
                    path: s.fullPath,
                    label: s.label,
                    isConfigured: false
                });
            }
        });
    }

    let directChildren = typeof getMergedChildKeysAtPath === 'function' ? getMergedChildKeysAtPath([examKey]) : [];
    directChildren.forEach(childKey => {
        if (childKey === "MCQs Practice" || childKey === "Mock Test") {
            let subChildren = getMergedChildKeysAtPath([examKey, childKey]);
            subChildren.forEach(sc => {
                let full = `${examKey} > ${childKey} > ${sc}`;
                if (!map.has(full) && (typeof isExcludedSubjectOrPdfFolder !== 'function' || !isExcludedSubjectOrPdfFolder(full, sc))) {
                    map.set(full, { path: full, label: sc.replace(/^\d+\.\s*/, ''), isConfigured: false });
                }
            });
        } else {
            let full = `${examKey} > ${childKey}`;
            if (!map.has(full) && (typeof isExcludedSubjectOrPdfFolder !== 'function' || !isExcludedSubjectOrPdfFolder(full, childKey))) {
                map.set(full, { path: full, label: childKey.replace(/^\d+\.\s*/, ''), isConfigured: false });
            }
        }
    });

    return Array.from(map.values());
}

function initAdminCustomPracticeTab() {
    const examSelect = document.getElementById('adminCpExamSelect');
    if (!examSelect) return;

    let rootExams = getMergedChildKeysAtPath([]);
    if (!adminCpSelectedExam || !rootExams.includes(adminCpSelectedExam)) {
        adminCpSelectedExam = rootExams[0] || '';
    }

    examSelect.innerHTML = rootExams.map(k => `<option value="${k.replace(/"/g, '&quot;')}" ${k === adminCpSelectedExam ? 'selected' : ''}>${k.replace(/^\d+\.\s*/, '')}</option>`).join('');

    adminCpSubjectPickPath = [];
    adminCpChapterPickPath = [];
    _buildAdminCpSubjectPickSelectors();
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

function handleAdminCpExamChange(examKey) {
    adminCpSelectedExam = examKey;
    adminCpSubjectPickPath = [];
    adminCpTargetSubjectPath = '';
    adminCpChapterPickPath = [];
    _buildAdminCpSubjectPickSelectors();
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

function _buildAdminCpSubjectPickSelectors() {
    const container = document.getElementById('admin-cp-subj-selectors');
    const pathEl = document.getElementById('admin-cp-subj-path-text');
    if (!container || !adminCpSelectedExam) return;

    let html = '';
    for (let i = 0; i <= adminCpSubjectPickPath.length; i++) {
        let parentSlice = [adminCpSelectedExam, ...adminCpSubjectPickPath.slice(0, i)];
        let keys = getMergedChildKeysAtPath(parentSlice);
        if (keys.length === 0) break;

        let placeholder = i === 0 ? `-- Select Folder Under ${adminCpSelectedExam} --` : `-- Stop Here / Select Subfolder --`;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminCpSubjPickChange(event, ${i})">`;
        html += `<option value="" ${!adminCpSubjectPickPath[i] ? 'selected' : ''}>${placeholder}</option>`;

        keys.forEach(key => {
            let selected = (adminCpSubjectPickPath[i] === key) ? 'selected' : '';
            html += `<option value="${key.replace(/"/g, '&quot;')}" ${selected}>${key}</option>`;
        });
        html += `</select>`;

        if (!adminCpSubjectPickPath[i]) break;
    }

    container.innerHTML = html || `<span style="color:#f59e0b; font-size:12px;">No subject folders created under <b>${adminCpSelectedExam}</b> yet. Go to <b>📁 Create Topic</b> to add subjects under ${adminCpSelectedExam} first.</span>`;

    if (pathEl) {
        pathEl.innerText = adminCpSubjectPickPath.length > 0
            ? `${adminCpSelectedExam} > ${adminCpSubjectPickPath.join(' > ')}`
            : 'None';
    }
}

function handleAdminCpSubjPickChange(event, depth) {
    const val = event.target.value;
    adminCpSubjectPickPath = adminCpSubjectPickPath.slice(0, depth);
    if (val !== "") adminCpSubjectPickPath.push(val);
    _buildAdminCpSubjectPickSelectors();
}

function _syncAdminCpTargetSubjectDropdown() {
    const selectEl = document.getElementById('adminCpTargetSubjSelect');
    if (!selectEl) return;

    let candidates = getAllCandidateSubjectsForExam(adminCpSelectedExam);

    if (candidates.length === 0) {
        adminCpTargetSubjectPath = '';
        selectEl.innerHTML = `<option value="">-- No Subjects Created Under ${adminCpSelectedExam} Yet --</option>`;
        return;
    }

    if (!adminCpTargetSubjectPath || !candidates.some(s => s.path === adminCpTargetSubjectPath)) {
        adminCpTargetSubjectPath = candidates[0].path;
    }

    selectEl.innerHTML = candidates.map(s => {
        let iconObj = typeof getSmartIcon === 'function' ? getSmartIcon(s.label) : null;
        let iconChar = iconObj ? iconObj.i : '📘';
        return `<option value="${s.path.replace(/"/g, '&quot;')}" ${s.path === adminCpTargetSubjectPath ? 'selected' : ''}>${iconChar} ${s.label} (${s.path})</option>`;
    }).join('');
}

function handleAdminCpTargetSubjChange(subjPath) {
    adminCpTargetSubjectPath = subjPath;
    adminCpChapterPickPath = [];
    _buildAdminCpChapterPickSelectors();
}

function _buildAdminCpChapterPickSelectors() {
    const container = document.getElementById('admin-cp-chap-selectors');
    const pathEl = document.getElementById('admin-cp-chap-path-text');
    if (!container) return;

    if (!adminCpTargetSubjectPath) {
        container.innerHTML = `<span style="color:#777; font-size:12px;">Create a Subject folder under ${adminCpSelectedExam} first.</span>`;
        if (pathEl) pathEl.innerText = 'None';
        return;
    }

    let baseParts = adminCpTargetSubjectPath.split(' > ').filter(Boolean);

    let html = '';
    for (let i = 0; i <= adminCpChapterPickPath.length; i++) {
        let parentSlice = [...baseParts, ...adminCpChapterPickPath.slice(0, i)];
        let keys = getMergedChildKeysAtPath(parentSlice).filter(k => typeof isCwDifficultyFolder === 'function' ? !isCwDifficultyFolder(k) : true);
        if (keys.length === 0) break;

        let placeholder = i === 0 ? '-- Select Chapter Folder --' : '-- Stop Here / Select Sub-chapter --';
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminCpChapPickChange(event, ${i})">`;
        html += `<option value="" ${!adminCpChapterPickPath[i] ? 'selected' : ''}>${placeholder}</option>`;

        keys.forEach(key => {
            let selected = (adminCpChapterPickPath[i] === key) ? 'selected' : '';
            html += `<option value="${key.replace(/"/g, '&quot;')}" ${selected}>${key}</option>`;
        });
        html += `</select>`;

        if (!adminCpChapterPickPath[i]) break;
    }

    let subjShort = baseParts[baseParts.length - 1] || adminCpTargetSubjectPath;
    container.innerHTML = html || `<span style="color:#f59e0b; font-size:12px;">No chapter subfolders found inside <b>${subjShort}</b> yet.</span>`;
    if (pathEl) {
        pathEl.innerText = adminCpChapterPickPath.length > 0
            ? `${adminCpTargetSubjectPath} > ${adminCpChapterPickPath.join(' > ')}`
            : 'None';
    }
}

function handleAdminCpChapPickChange(event, depth) {
    const val = event.target.value;
    adminCpChapterPickPath = adminCpChapterPickPath.slice(0, depth);
    if (val !== "") adminCpChapterPickPath.push(val);
    _buildAdminCpChapterPickSelectors();
}

async function saveAdminCustomPracticeConfig() {
    await db.collection("settings").doc("custom_practice_config").set(window.customPracticeConfig, { merge: true });
}

function collectDirectChaptersFromAppData(subjFullPath) {
    let baseParts = subjFullPath.split(' > ').filter(Boolean);
    let keys = getMergedChildKeysAtPath(baseParts);
    let chapters = [];
    keys.forEach(k => {
        if (typeof isCwDifficultyFolder === 'function' && isCwDifficultyFolder(k)) return;
        chapters.push({
            path: `${subjFullPath} > ${k}`,
            label: k.replace(/^\d+\.\s*/, '')
        });
    });
    return chapters;
}

async function addSubjectToCustomPractice(includeChapters = false) {
    if (!adminCpSelectedExam || adminCpSubjectPickPath.length === 0) {
        showNotification("⚠️ Please select a Subject folder in 2A first.");
        return;
    }

    let fullSubjPath = `${adminCpSelectedExam} > ${adminCpSubjectPickPath.join(' > ')}`;
    let subjLabel = adminCpSubjectPickPath[adminCpSubjectPickPath.length - 1].replace(/^\d+\.\s*/, '');

    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    if (!window.customPracticeConfig.exams[adminCpSelectedExam]) {
        window.customPracticeConfig.exams[adminCpSelectedExam] = { subjects: [] };
    }

    let subjects = window.customPracticeConfig.exams[adminCpSelectedExam].subjects;
    if (subjects.some(s => s.path === fullSubjPath)) {
        showNotification("⚠️ This Subject is already added for " + adminCpSelectedExam);
        return;
    }

    let initialChapters = includeChapters ? collectDirectChaptersFromAppData(fullSubjPath) : [];
    subjects.push({
        path: fullSubjPath,
        label: subjLabel,
        chapters: initialChapters
    });

    adminCpTargetSubjectPath = fullSubjPath;
    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Subject "${subjLabel}" added to Custom Practice!`);
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

async function addChapterToCustomPractice() {
    if (!adminCpSelectedExam || !adminCpTargetSubjectPath) {
        showNotification("⚠️ Please select a Target Subject first.");
        return;
    }
    if (adminCpChapterPickPath.length === 0) {
        showNotification("⚠️ Please select an existing Chapter folder to add.");
        return;
    }

    let fullChapPath = `${adminCpTargetSubjectPath} > ${adminCpChapterPickPath.join(' > ')}`;
    let chapLabel = adminCpChapterPickPath[adminCpChapterPickPath.length - 1].replace(/^\d+\.\s*/, '');

    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    if (!window.customPracticeConfig.exams[adminCpSelectedExam]) {
        window.customPracticeConfig.exams[adminCpSelectedExam] = { subjects: [] };
    }

    let subjects = window.customPracticeConfig.exams[adminCpSelectedExam].subjects;
    let subjObj = subjects.find(s => s.path === adminCpTargetSubjectPath);

    if (!subjObj) {
        let subjLabel = adminCpTargetSubjectPath.split(' > ').pop().replace(/^\d+\.\s*/, '');
        subjObj = {
            path: adminCpTargetSubjectPath,
            label: subjLabel,
            chapters: []
        };
        subjects.push(subjObj);
    }

    subjObj.chapters = subjObj.chapters || [];
    if (subjObj.chapters.some(c => c.path === fullChapPath)) {
        showNotification("⚠️ This Chapter is already added under " + subjObj.label);
        return;
    }

    subjObj.chapters.push({
        path: fullChapPath,
        label: chapLabel
    });

    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Chapter "${chapLabel}" added under ${subjObj.label}!`);
    renderAdminCpConfiguredList();
}

async function addAllChaptersForConfiguredSubject(subjPath) {
    let subjects = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    let subjObj = subjects.find(s => s.path === subjPath);
    if (!subjObj) return;

    let foundChaps = collectDirectChaptersFromAppData(subjPath);
    let existingPaths = new Set((subjObj.chapters || []).map(c => c.path));
    let added = 0;
    foundChaps.forEach(ch => {
        if (!existingPaths.has(ch.path)) {
            subjObj.chapters.push(ch);
            added++;
        }
    });

    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Added ${added} chapter(s) to ${subjObj.label}!`);
    renderAdminCpConfiguredList();
}

async function removeSubjectFromCustomPractice(subjPath) {
    if (!confirm("Remove this Subject and its chapters from Custom Practice?")) return;
    let subjects = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    window.customPracticeConfig.exams[adminCpSelectedExam].subjects = subjects.filter(s => s.path !== subjPath);
    await saveAdminCustomPracticeConfig();
    showNotification("🗑️ Subject removed from Custom Practice.");
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

async function removeChapterFromCustomPractice(subjPath, chapPath) {
    let subjects = window.customPracticeConfig.exams?.[adminCpSelectedExam]?.subjects || [];
    let subjObj = subjects.find(s => s.path === subjPath);
    if (!subjObj) return;
    subjObj.chapters = (subjObj.chapters || []).filter(c => c.path !== chapPath);
    await saveAdminCustomPracticeConfig();
    showNotification("🗑️ Chapter removed.");
    renderAdminCpConfiguredList();
}

async function autoImportExamToCustomPractice() {
    if (!adminCpSelectedExam) return;
    let savedEntry = window.customPracticeConfig.exams?.[adminCpSelectedExam];
    if (window.customPracticeConfig.exams) delete window.customPracticeConfig.exams[adminCpSelectedExam];
    let scanned = typeof buildCwCatalogForExam === 'function' ? buildCwCatalogForExam(adminCpSelectedExam, true) : [];
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = {
        subjects: scanned.map(s => ({
            path: s.fullPath,
            label: s.label,
            chapters: (s.chapters || []).map(c => ({ path: c.fullPath, label: c.label }))
        }))
    };
    await saveAdminCustomPracticeConfig();
    showNotification(`✅ Imported ${scanned.length} subject(s) for ${adminCpSelectedExam}!`);
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

async function clearExamCustomPracticeConfig() {
    if (!adminCpSelectedExam) return;
    if (!confirm(`Delete ALL configured subjects & chapters for ${adminCpSelectedExam} in Custom Practice?`)) return;
    window.customPracticeConfig.exams = window.customPracticeConfig.exams || {};
    window.customPracticeConfig.exams[adminCpSelectedExam] = { subjects: [] };
    await saveAdminCustomPracticeConfig();
    showNotification(`🗑️ Cleared Custom Practice subjects & chapters for ${adminCpSelectedExam}.`);
    _syncAdminCpTargetSubjectDropdown();
    _buildAdminCpChapterPickSelectors();
    renderAdminCpConfiguredList();
}

function renderAdminCpConfiguredList() {
    const container = document.getElementById('admin-cp-configured-list');
    if (!container) return;

    let examCfg = window.customPracticeConfig.exams?.[adminCpSelectedExam];
    if (!examCfg || !Array.isArray(examCfg.subjects) || examCfg.subjects.length === 0) {
        container.innerHTML = `
        <div class="admin-panel-card" style="text-align:center; color:#888; padding:30px;">
            No manual Subjects configured for <b>${adminCpSelectedExam}</b> yet.<br>
            <span style="font-size:12px;">Use <b>2A</b> or <b>2B</b> above to add existing subjects/chapters manually, or click <b>⚡ Auto-Import Existing Subjects & Chapters</b>.</span>
        </div>`;
        return;
    }

    let usedColors = new Set();
    container.innerHTML = examCfg.subjects.map((subj, idx) => {
        let theme = typeof getAutoTopicTheme === 'function' ? getAutoTopicTheme(subj.label, null, idx, usedColors) : { i: '📘', c: '#fdb813' };
        let safeSubjPath = subj.path.replace(/'/g, "\\'");
        let chapters = subj.chapters || [];

        let chipsHtml = chapters.length > 0
            ? chapters.map(ch => {
                let safeChapPath = ch.path.replace(/'/g, "\\'");
                let chapIcon = typeof getAutomaticIconForName === 'function' ? getAutomaticIconForName(ch.label) : '📘';
                return `
                <div class="admin-chap-chip">
                    <span>${chapIcon} ${ch.label}</span>
                    <button title="Remove Chapter" onclick="removeChapterFromCustomPractice('${safeSubjPath}', '${safeChapPath}')">✕</button>
                </div>`;
            }).join('')
            : `<span style="color:#777; font-size:12px;">No specific chapters added yet (uses all questions under ${subj.label}).</span>`;

        return `
        <div class="admin-panel-card" style="border-left:4px solid ${theme.c}; padding:20px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #2b2b36; padding-bottom:12px;">
                <div>
                    <b style="font-size:17px; color:#fff;">${theme.i} ${subj.label}</b>
                    <span style="font-size:11px; color:var(--text-muted); margin-left:10px;">(${chapters.length} Chapter${chapters.length === 1 ? '' : 's'})</span>
                    <div style="font-size:11px; color:#777; margin-top:3px;">Path: ${subj.path}</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-exam" onclick="addAllChaptersForConfiguredSubject('${safeSubjPath}')" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.35); padding:6px 12px; font-size:11.5px;">+ Import All Sub-Chapters</button>
                    <button class="btn-exam" onclick="removeSubjectFromCustomPractice('${safeSubjPath}')" style="background:rgba(239,68,68,0.15); color:var(--wrong-red); border:1px solid rgba(239,68,68,0.35); padding:6px 12px; font-size:11.5px;">🗑️ Delete Subject</button>
                </div>
            </div>
            <div class="admin-chip-list">${chipsHtml}</div>
        </div>`;
    }).join('');
}

// ==========================================
// MANAGE CONTENT TAB
// ==========================================
function _buildManageSelectors() {
    const container = document.getElementById('manage-path-selectors'); if(!container) return;
    let html = '';
    for (let i = 0; i <= adminManageSelectedPath.length; i++) {
        let parentSlice = adminManageSelectedPath.slice(0, i);
        let keys = getMergedChildKeysAtPath(parentSlice);
        if (keys.length === 0) break;

        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleManagePathChange(event, ${i})"><option value="" ${!adminManageSelectedPath[i] ? 'selected' : ''}>-- All Folders --</option>`;
        keys.forEach(key => {
            html += `<option value="${key.replace(/"/g, '&quot;')}" ${adminManageSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`;
        });
        html += `</select>`;
        if (!adminManageSelectedPath[i]) break;
    }
    container.innerHTML = html;
}

function handleManagePathChange(event, depth) {
    if(event.target.value === "") adminManageSelectedPath = adminManageSelectedPath.slice(0, depth);
    else { adminManageSelectedPath = adminManageSelectedPath.slice(0, depth); adminManageSelectedPath.push(event.target.value); }
    _buildManageSelectors();
}

async function uploadFileToCloudinary(file) {
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_PRESET);
    const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'File upload failed');
    return data.secure_url;
}

async function processAdminUpload() {
    const type = document.getElementById('admResourceType').value; 
    const targetPathString = adminSelectedPath.join(' > '); 
    const btn = document.getElementById('uploadBtn'); 
    btn.innerText = "Uploading... Please wait"; btn.disabled = true;

    try {
        if (type === 'mcq') {
            const question = document.getElementById('admQuestion').value.trim();
            const options = { A: document.getElementById('admOptA').value.trim(), B: document.getElementById('admOptB').value.trim(), C: document.getElementById('admOptC').value.trim(), D: document.getElementById('admOptD').value.trim() };
            const correctCbs = document.querySelectorAll('.admCorrectCb:checked'); let correctAnswers = Array.from(correctCbs).map(cb => cb.value);
            const explanation = document.getElementById('admExplanation').value.trim(); const imageFile = document.getElementById('admQImage').files[0];
            const level = document.getElementById('admDifficulty').value;
            if (!question || !options.A || !options.B || correctAnswers.length === 0) throw new Error("Question, Option A, Option B, and Correct Answer are required.");
            let imageUrl = null; if (imageFile) imageUrl = await uploadFileToCloudinary(imageFile); 
            
            let randomKey = Math.random();

            await db.collection("content").add({ 
                type: 'mcq', 
                path: targetPathString, 
                level: level, 
                question: question, 
                options: options, 
                correctAnswers: correctAnswers, 
                explanation: explanation, 
                imageUrl: imageUrl, 
                randomKey: randomKey,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            });
            clearAdminUploadForm(true);
        } else if (type === 'pdf') {
            const title = document.getElementById('admPdfTitle').value.trim(); const file = document.getElementById('admPdfFile').files[0];
            if (!title || !file) throw new Error("Title and File are required for Study Materials.");
            const fileUrl = await uploadFileToCloudinary(file);
            await db.collection("content").add({ type: 'material', path: targetPathString, title: title, fileUrl: fileUrl, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            document.getElementById('admPdfTitle').value = ""; document.getElementById('admPdfFile').value = "";
        }
        showNotification("✅ Upload Successful!");
    } catch(error) { alert("⚠️ ERROR: " + error.message); }
    btn.innerText = "☁️ Upload & Save"; btn.disabled = false;
}

let loadedItemsCache = {};
async function loadContentForManagement(isNextPage = false) {
    if (isFetchingManageContent) return;
    const listEl = document.getElementById('manage-content-list'); 
    if (!listEl) return;

    if (!isNextPage) {
        listEl.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px; text-align: center;">Fetching items from database...</p>`;
        loadedItemsCache = {};
        lastManageDoc = null;
    } else {
        const loadMoreBtn = document.getElementById('btn-load-more-manage');
        if (loadMoreBtn) { loadMoreBtn.innerText = "Loading more..."; loadMoreBtn.disabled = true; }
    }
    isFetchingManageContent = true;

    try {
        let query = db.collection("content");
        if (adminManageSelectedPath.length > 0) { 
            const prefixPath = adminManageSelectedPath.join(' > '); 
            query = query.where("path", ">=", prefixPath).where("path", "<=", prefixPath + "\uf8ff"); 
        } else { 
            query = query.orderBy("timestamp", "desc"); 
        }

        if (isNextPage && lastManageDoc) {
            query = query.startAfter(lastManageDoc);
        }

        query = query.limit(20);
        const snapshot = await query.get();

        if (snapshot.empty) {
            if (!isNextPage) {
                listEl.innerHTML = `<p style="color:var(--text-muted); text-align: center; padding: 40px; border: 1px dashed #333; border-radius: 12px;">No items found in this folder.</p>`;
            } else {
                const loadMoreBtn = document.getElementById('btn-load-more-manage');
                if (loadMoreBtn) { loadMoreBtn.innerText = "No more items to load"; loadMoreBtn.disabled = true; }
            }
            isFetchingManageContent = false;
            return;
        }

        lastManageDoc = snapshot.docs[snapshot.docs.length - 1];

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data(); 
            loadedItemsCache[doc.id] = data;
            if (data.type === 'mcq' || !data.type) {
                let answersStr = (data.correctAnswers || []).join(', ');
                let lvlBadge = data.level ? `<span style="margin-left:10px; background:#444; color:white; padding:3px 8px; border-radius:6px; font-size:11px; text-transform:uppercase;">${data.level}</span>` : '';
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#1c1c24; border:1px solid #2b2b36; border-radius:12px; padding:20px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom: 1px solid #333; padding-bottom: 12px; flex-wrap:wrap; gap:8px;"><div><span class="badge-path">${data.path || 'Uncategorized'}</span>${lvlBadge}</div><div style="display:flex; gap:10px;"><button class="btn-exam" onclick="openEditModal('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(33, 150, 243, 0.15); color:#2196F3; border:1px solid rgba(33,150,243,0.3);">✏️ Edit</button><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(244, 67, 54, 0.15); color:var(--wrong-red); border:1px solid rgba(244,67,54,0.3);">🗑️ Delete</button></div></div><div style="font-weight:bold; margin-bottom:12px; font-size: 15px;">${data.question}</div>${data.imageUrl ? `<img src="${data.imageUrl}" style="max-height:100px; border-radius:6px; margin-bottom:12px; display:block;">` : ''}<div style="font-size:13px; color:var(--text-muted); line-height:1.6; background: #131318; padding: 12px; border-radius: 8px;"><b>A:</b> ${data.options?.A || '-'}<br><b>B:</b> ${data.options?.B || '-'}<br><b>C:</b> ${data.options?.C || '-'}<br><b>D:</b> ${data.options?.D || '-'}</div><div style="margin-top:12px; font-size:14px; color:var(--correct-green); font-weight: bold;">✅ Correct: ${answersStr}</div></div>`;
            } else {
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#1c1c24; border:1px solid #2b2b36; border-radius:12px; padding:20px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom: 1px solid #333; padding-bottom: 12px;"><span class="badge-path">${data.path || 'Uncategorized'}</span><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(244, 67, 54, 0.15); color:var(--wrong-red); border:1px solid rgba(244,67,54,0.3);">🗑️ Delete</button></div><div style="font-weight:bold; margin-bottom:10px; font-size: 16px;">📄 ${data.title}</div><a href="${data.fileUrl}" target="_blank" style="color:var(--primary-yellow); font-size:14px; text-decoration: none; font-weight: bold;">View Document &rarr;</a></div>`;
            }
        });

        const oldLoadBtn = document.getElementById('load-more-manage-container');
        if (oldLoadBtn) oldLoadBtn.remove();

        const loadMoreHtml = snapshot.docs.length >= 20 ? `
            <div id="load-more-manage-container" style="text-align:center; margin-top:25px; margin-bottom:15px;">
                <button id="btn-load-more-manage" class="btn-exam" onclick="loadContentForManagement(true)" style="background:#2a2a35; border:1px solid #444; padding: 12px 30px; font-size:15px;">📄 Load More Items</button>
            </div>` : '';

        if (!isNextPage) {
            let titleMsg = adminManageSelectedPath.length > 0 ? `<p style="color:white; font-size:14px; margin-bottom:15px; padding-left: 5px;">Showing results for: <b>${adminManageSelectedPath.join(' > ')}</b></p>` : `<p style="color:white; font-size:14px; margin-bottom:15px; padding-left: 5px;">Showing recent uploads:</p>`;
            listEl.innerHTML = titleMsg + `<div id="manage-items-list-body">${html}</div>` + loadMoreHtml;
        } else {
            document.getElementById('manage-items-list-body').insertAdjacentHTML('beforeend', html);
            listEl.insertAdjacentHTML('beforeend', loadMoreHtml);
        }
    } catch(e) { listEl.innerHTML = `<p style="color:var(--wrong-red); padding: 20px;">Error loading items: ${e.message}</p>`; }
    isFetchingManageContent = false;
}

async function runRandomKeyMigration() {
    if(!confirm("This will scan un-indexed MCQs in the database and assign a randomKey so the quiz engine can perform random selections at scale. Proceed?")) return;
    const btn = document.getElementById('btnMigrateKeys');
    if (btn) { btn.innerText = "Indexing in progress..."; btn.disabled = true; }
    try {
        let snap = await db.collection("content").limit(400).get();
        let batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            let d = doc.data();
            if ((!d.type || d.type === "mcq") && d.randomKey === undefined) {
                batch.update(doc.ref, { randomKey: Math.random() });
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
            showNotification(`✅ Successfully indexed ${count} MCQs with random keys!`);
        } else {
            showNotification("✅ All scanned MCQs are already indexed!");
        }
    } catch(e) {
        showNotification("❌ Migration error: " + e.message);
    }
    if (btn) { btn.innerText = "Run Index Migration"; btn.disabled = false; }
}

async function deleteContentItem(docId) {
    if(!confirm("Are you sure you want to permanently delete this item?")) return;
    try {
        await db.collection("content").doc(docId).delete();
        const el = document.getElementById("item_" + docId);
        if (el) el.remove();
        showNotification("🗑️ Item deleted successfully!");
    } catch(e) { showNotification("❌ Delete failed: " + e.message); }
}

function openEditModal(docId) {
    const data = loadedItemsCache[docId]; if(!data) return;
    document.getElementById('editDocId').value = docId; document.getElementById('editQuestion').value = data.question || '';
    document.getElementById('editOptA').value = data.options?.A || ''; document.getElementById('editOptB').value = data.options?.B || '';
    document.getElementById('editOptC').value = data.options?.C || ''; document.getElementById('editOptD').value = data.options?.D || '';
    document.getElementById('editExplanation').value = data.explanation || '';
    if(data.level) document.getElementById('editDifficulty').value = data.level; else document.getElementById('editDifficulty').value = 'Mixed';
    const correct = data.correctAnswers || [];
    document.querySelectorAll('.editCorrectCb').forEach(cb => { cb.checked = correct.includes(cb.value); });
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

async function saveEditedMCQ() {
    const docId = document.getElementById('editDocId').value;
    const question = document.getElementById('editQuestion').value.trim();
    const options = { A: document.getElementById('editOptA').value.trim(), B: document.getElementById('editOptB').value.trim(), C: document.getElementById('editOptC').value.trim(), D: document.getElementById('editOptD').value.trim() };
    const correctAnswers = Array.from(document.querySelectorAll('.editCorrectCb:checked')).map(cb => cb.value);
    const explanation = document.getElementById('editExplanation').value.trim();
    const level = document.getElementById('editDifficulty').value;

    if(!question || !options.A || !options.B || correctAnswers.length === 0) { alert("Question, Options A/B, and Correct Answer required."); return; }
    try {
        let updatePayload = { question: question, options: options, correctAnswers: correctAnswers, explanation: explanation, level: level };
        if (loadedItemsCache[docId] && loadedItemsCache[docId].randomKey === undefined) {
            updatePayload.randomKey = Math.random();
        }
        await db.collection("content").doc(docId).update(updatePayload);
        closeEditModal(); showNotification("✅ Changes saved!");
        if (adminCurrentTab === 'manage') loadContentForManagement(false);
    } catch(e) { showNotification("❌ Update failed: " + e.message); }
}

async function changeAdminPassword() {
    const p1 = document.getElementById('newAdminPass').value; const p2 = document.getElementById('confirmAdminPass').value;
    if(p1.length < 6) { showNotification("⚠️ Password must be at least 6 characters."); return; }
    if(p1 !== p2) { showNotification("❌ Passwords do not match!"); return; }
    try { await db.collection("settings").doc("admin_auth").set({ password: p1 }); document.getElementById('newAdminPass').value = ""; document.getElementById('confirmAdminPass').value = ""; showNotification("✅ Password changed successfully!"); } 
    catch(e) { showNotification("❌ Error updating password: " + e.message); }
}

async function loadAdminReports() {
    const container = document.getElementById('reports-list-container');
    if (!container) return;
    container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching reported mistakes...</p>`;
    try {
        const snapshot = await db.collection("reported_mistakes").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<div class='admin-panel-card'><p style='color:var(--correct-green); text-align:center; font-size: 16px;'>✅ No mistakes reported! Everything is clean.</p></div>"; return; }
        
        let html = '';
        items.forEach(data => {
            let stat = data.status === 'resolved' ? `<span style="background:rgba(76, 175, 80, 0.15); color:#4CAF50; border: 1px solid rgba(76,175,80,0.3); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">✅ Resolved</span>` : `<span style="background:rgba(255, 255, 255, 0.1); color:white; border: 1px solid rgba(255,255,255,0.2); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">⏳ Pending</span>`;
            html += `<div class="admin-panel-card" style="border-left: 4px solid var(--wrong-red); padding: 20px;"><div class="content-item-header" style="border-bottom: 1px solid #2b2b36; padding-bottom: 12px; margin-bottom: 15px;"><span class="badge-path">${data.path || 'Unknown Path'}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="margin: 10px 0; padding: 15px; background: rgba(244, 67, 54, 0.05); border: 1px solid rgba(244,67,54,0.2); border-radius: 8px; display:flex; justify-content:space-between; align-items: flex-start;"><div><p style="color:var(--wrong-red); margin:0 0 8px 0; font-size: 15px;"><b>Issue:</b> ${data.reason || 'Reported Issue'}</p><p style="margin:0; font-size:14px; color: #ccc;"><b>Details:</b> ${data.description || 'No description provided.'}</p></div><div>${stat}</div></div><p style="margin:12px 0; font-size:13px; color:var(--primary-yellow);"><b>Reported by:</b> ${data.studentName || 'Student'}</p><div style="background:#131318; padding:15px; border-radius:8px; font-size:14px; margin:15px 0; border: 1px solid #2b2b36;"><b>Question Content:</b><br><br>${data.questionText || ''}</div><div style="display:flex; gap:12px; flex-wrap:wrap; margin-top: 20px;"><button onclick="openEditModalFromReport('${data.questionId}')" style="padding:10px 16px; background:rgba(33, 150, 243, 0.15); border:1px solid rgba(33,150,243,0.3); border-radius:8px; color:#2196F3; cursor:pointer; font-weight:bold;">✏️ Edit MCQ in Database</button><button onclick="resolveReport('${data.id}')" style="padding:10px 16px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76,175,80,0.3); border-radius:8px; color:var(--correct-green); cursor:pointer; font-weight:bold;" ${data.status==='resolved'?'disabled style="opacity:0.5; cursor:not-allowed;"':''}>✅ Mark Resolved (Notifies User)</button></div></div>`;
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = `<p style="color:red; padding: 20px;">Error: ${e.message}</p>`; }
}

async function resolveReport(reportDocId) {
    if(confirm("Mark this report as resolved? The student will be notified.")) { 
        await db.collection("reported_mistakes").doc(reportDocId).update({status: 'resolved', seenByStudent: false}); 
        loadAdminReports(); showNotification("✅ Report marked as resolved."); 
    }
}

async function openEditModalFromReport(questionId) {
    try {
        let doc = await db.collection("content").doc(questionId).get();
        if (doc.exists) { loadedItemsCache[questionId] = doc.data(); openEditModal(questionId); } 
        else { showNotification("❌ This question no longer exists in the database."); }
    } catch (e) { showNotification("❌ Error fetching question: " + e.message); }
}

async function loadAdminUsers() {
    const container = document.getElementById('users-table-container'); 
    if (!container) return;
    container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching students and feedback...</p>`;
    try {
        let feedbacks = {};
        try {
            const feedbackSnap = await db.collection("platform_feedback").limit(100).get();
            feedbackSnap.forEach(doc => {
                let d = doc.data();
                let uid = d.studentId || d.userId || doc.id;
                if (uid) feedbacks[uid] = { rating: d.rating, feedback: d.feedback || d.text || '-' };
            });
        } catch (fbErr) {}

        const snapshot = await db.collection("users").orderBy("lastLogin", "desc").limit(100).get();
        let html = `<table style="width:100%; text-align:left; border-collapse: collapse;">
            <tr style="background: #131318; border-bottom: 1px solid #2b2b36;">
                <th style="padding: 15px;">Name</th>
                <th style="padding: 15px;">Email</th>
                <th style="padding: 15px;">Last Login</th>
                <th style="padding: 15px;">Rating</th>
                <th style="padding: 15px;">Feedback</th>
            </tr>`;
            
        snapshot.forEach(doc => { 
            let d = doc.data();
            let uid = doc.id;
            let ratingVal = d.rating || feedbacks[uid]?.rating || '-';
            let feedbackVal = d.feedback || feedbacks[uid]?.feedback || '-';
            let stars = ratingVal !== '-' ? '⭐'.repeat(Number(ratingVal) || 0) : '-';
            html += `<tr style="border-bottom: 1px solid #2b2b36;">
                <td style="padding: 15px; font-weight:bold;">${d.displayName || 'Unknown'}</td>
                <td style="padding: 15px; color:#aaa;">${d.email || '-'}</td>
                <td style="padding: 15px; color:#aaa; font-size: 13px;">${d.lastLogin ? d.lastLogin.toDate().toLocaleString() : "Unknown"}</td>
                <td style="padding: 15px; color:var(--primary-yellow);">${stars}</td>
                <td style="padding: 15px; max-width:250px; font-size:13px; color:var(--text-muted); line-height:1.4;">${feedbackVal}</td>
            </tr>`; 
        });
        container.innerHTML = html + `</table>`;
    } catch(e) { container.innerHTML = `<p style="color:red; padding: 20px;">Error: ${e.message}</p>`; }
}

async function loadAdminDoubts() {
    const container = document.getElementById('doubts-list-container');
    if (!container) return;
    container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching doubts...</p>`;
    try {
        const snapshot = await db.collection("flagged_doubts").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<div class='admin-panel-card'><p style='color:var(--correct-green); text-align:center;'>✅ No flagged questions found!</p></div>"; return; }
        
        let html = '';
        items.forEach(data => { 
            let stat = data.status === 'resolved' ? `<span style="background:rgba(76, 175, 80, 0.15); color:#4CAF50; border: 1px solid rgba(76,175,80,0.3); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">✅ Reviewed</span>` : `<span style="background:rgba(255, 255, 255, 0.1); color:white; border: 1px solid rgba(255,255,255,0.2); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">⏳ Pending</span>`;
            html += `<div class="admin-panel-card" style="padding: 20px;"><div class="content-item-header" style="border-bottom: 1px solid #2b2b36; padding-bottom: 12px; margin-bottom: 15px;"><span class="badge-path">${data.path || 'General'}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="display:flex; justify-content:space-between; margin-top:10px;"><p style="color:var(--primary-yellow); margin:5px 0; font-size: 15px;"><b>Flagged by:</b> ${data.studentName || 'Student'}</p>${stat}</div><div style="background:#131318; border: 1px solid #2b2b36; padding:15px; border-radius:8px; font-size:14px; margin:15px 0; line-height: 1.5;">${data.questionText || ''}</div><div style="display:flex; gap:12px; flex-wrap:wrap;"><button onclick="openEditModalFromReport('${data.questionId}')" style="margin-top:10px; padding:10px 16px; background:rgba(33, 150, 243, 0.15); border:1px solid rgba(33,150,243,0.3); border-radius:8px; color:#2196F3; cursor:pointer; font-weight:bold;">✏️ Edit Question</button><button onclick="resolveDoubt('${data.id}')" style="margin-top:10px; padding:10px 16px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76,175,80,0.3); border-radius:8px; color:var(--correct-green); cursor:pointer; font-weight: bold;" ${data.status==='resolved'?'disabled style="opacity:0.5; cursor:not-allowed;"':''}>✅ Mark Reviewed</button></div></div>`; 
        });
        container.innerHTML = html;
    } catch(e) { container.innerHTML = `<p style="color:red; padding: 20px;">Error: ${e.message}</p>`; }
}

async function resolveDoubt(docId) { 
    if(confirm("Mark this doubt as reviewed? Student will be notified.")) { 
        await db.collection("flagged_doubts").doc(docId).update({status: 'resolved', seenByStudent: false}); 
        loadAdminDoubts(); 
    } 
}
