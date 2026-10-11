// ==========================================
// 10. SCALED ADMIN PANEL & PAGINATION
// ==========================================
let adminCurrentTab = 'upload'; let adminNewTopicPath = []; let adminSelectedPath = []; let adminManageSelectedPath = []; 
let lastManageDoc = null;
let isFetchingManageContent = false;

const adminStyles = `
<style>
    .admin-nav-pills { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 15px; margin-bottom: 25px; scrollbar-width: none; }
    .admin-nav-pills::-webkit-scrollbar { display: none; }
    .admin-pill { background: #1c1c24; border: 1px solid #2b2b36; color: #9e9ea7; padding: 10px 20px; border-radius: 30px; cursor: pointer; white-space: nowrap; font-size: 14px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; }
    .admin-pill:hover { background: #252530; color: #fff; border-color: #444; }
    .admin-pill.active { background: rgba(253, 184, 19, 0.15); border-color: #fdb813; color: #fdb813; }
    
    .admin-panel-card { background: #17171e; border: 1px solid #2b2b36; border-radius: 16px; padding: 25px; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .admin-section-header { font-size: 18px; color: #fff; margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #2b2b36; padding-bottom: 15px; font-weight: 600; }
    
    .admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .admin-label { display: block; color: #9e9ea7; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    
    .admin-checkbox-group { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .admin-cb-label { flex: 1; min-width: 60px; background: #23232c; border: 1px solid #2b2b36; text-align: center; padding: 12px; border-radius: 10px; cursor: pointer; color: #fff; font-size: 16px; font-weight: bold; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .admin-cb-label:hover { border-color: #555; background: #2a2a35; }
    .admin-cb-label:has(input:checked) { background: rgba(76, 175, 80, 0.15); border-color: #4CAF50; color: #4CAF50; }
    .admin-cb-label input { display: none; }
    
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
        <input type="password" id="adminPassInput" class="input-field" style="margin: 0 auto 20px auto; text-align: center; font-size: 18px; letter-spacing: 2px;" placeholder="••••••••">
        <button id="loginBtn" class="btn-exam" onclick="verifyAdmin()" style="width: 100%; max-width: 300px; background-color: var(--primary-yellow); color: black; border: none; font-size: 16px;">Authenticate</button>
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
    btn.innerText = "Authenticate"; btn.disabled = false;
}

function _renderAdminPanel() {
    if (!sessionStorage.getItem('admin_verified')) { window.location.hash = '#/admin'; return; }
    document.getElementById('breadcrumb-text').innerText = "Admin Workspace";
    
    document.getElementById('dynamic-content').innerHTML = adminStyles + `
        <div class="page-transition">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <h2 style="color: white; margin:0; font-size: 24px;">⚙️ Admin Workspace</h2>
            </div>
            
            <div class="admin-nav-pills">
                <div class="admin-pill ${adminCurrentTab === 'upload' ? 'active' : ''}" onclick="switchAdminTab('upload')">➕ Rapid Upload</div>
                <div class="admin-pill ${adminCurrentTab === 'topics' ? 'active' : ''}" onclick="switchAdminTab('topics')">📁 Manage Folders</div>
                <div class="admin-pill ${adminCurrentTab === 'manage' ? 'active' : ''}" onclick="switchAdminTab('manage')">📋 Edit Content</div>
                <div class="admin-pill ${adminCurrentTab === 'reports' ? 'active' : ''}" onclick="switchAdminTab('reports')">🚨 Reports</div>
                <div class="admin-pill ${adminCurrentTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👥 Users</div>
                <div class="admin-pill ${adminCurrentTab === 'doubts' ? 'active' : ''}" onclick="switchAdminTab('doubts')">🚩 Doubts</div>
                <div class="admin-pill ${adminCurrentTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">🛠️ Settings</div>
            </div>
            
            <!-- UPLOAD TAB -->
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
                            <button id="uploadBtn" class="btn-exam" onclick="processAdminUpload()" style="background-color: var(--correct-green); color: white; border: none; flex: 2; font-size: 16px;">☁️ Upload & Save</button>
                            <button class="btn-exam" onclick="clearAdminUploadForm(false)" style="background-color: transparent; color: var(--wrong-red); border: 1px solid var(--wrong-red); flex: 1;">Clear Fields</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- TOPICS TAB -->
            <div id="admin-topics-view" style="display:${adminCurrentTab === 'topics' ? 'block' : 'none'};">
                <div class="admin-panel-card" style="border-color: rgba(253, 184, 19, 0.4); background: rgba(253, 184, 19, 0.02);">
                    <h3 class="admin-section-header" style="color:var(--primary-yellow); border-color: rgba(253, 184, 19, 0.2);">📁 Create New Topic Folder</h3>
                    <label class="admin-label">1. Select Parent Path (Where should it go?)</label>
                    <div id="dynamic-new-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap;"></div>
                    <div id="new-topic-path-display" style="margin-top:10px; font-size:13px; color:var(--primary-yellow); margin-bottom: 20px;">
                        <b>Path:</b> <span id="new-topic-path-text" style="color:white;">Root (Main Menu)</span>
                    </div>
                    
                    <div class="admin-grid-2">
                        <div>
                            <label class="admin-label">2. Folder Name</label>
                            <input type="text" id="newFolderName" class="input-field" placeholder="e.g. 01. Molecular Genetics">
                            <span style="font-size: 11px; color: #777;">*Tip: Start with a number (01., 02.) to lock the sorting order!</span>
                        </div>
                        <div>
                            <label class="admin-label">3. Expected Content Type</label>
                            <select id="newFolderType" class="input-field">
                                <option value="both">📂 Parent Category (To hold MCQs/PDFs inside)</option>
                                <option value="mcq">📝 MCQs Practice (End Topic)</option>
                                <option value="pdf">📄 PDF / Image Material (End Topic)</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn-exam" onclick="createCustomTopic()" style="background-color:var(--primary-yellow); color:black; border:none; width:100%; max-width:250px; margin-top: 15px;">+ Create Folder</button>
                </div>
                
                <h4 style="color:#fff; margin-top:30px; margin-bottom:15px; font-size: 18px;">Active Custom Folders</h4>
                <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
                    <select id="adminTopicPathFilter" class="input-field" onchange="filterAdminTopics()" style="flex:1; min-width:200px; margin-bottom:0;">
                        <option value="ALL">All Paths</option>
                    </select>
                    <input type="text" id="adminTopicSearch" class="input-field" placeholder="🔍 Search folders by name..." oninput="filterAdminTopics()" style="flex:2; min-width:200px; margin-bottom:0;">
                </div>
                <div id="admin-topic-list-container"></div>
            </div>

            <!-- MANAGE TAB -->
            <div id="admin-manage-view" style="display:${adminCurrentTab === 'manage' ? 'block' : 'none'};">
                <div class="admin-panel-card">
                    <h3 class="admin-section-header">🔍 Filter & Fetch Content</h3>
                    <div id="manage-path-selectors" style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px;"></div>
                    <button class="btn-exam" onclick="loadContentForManagement(false)" style="background:var(--primary-yellow); color:black; border:none; padding:12px 20px; width:100%; max-width:250px; font-size:15px;">Fetch Content</button>
                </div>
                <div id="manage-content-list">
                    <p style="color:var(--text-muted); text-align: center; padding: 40px; border: 1px dashed #333; border-radius: 12px;">Select a folder above and click Fetch to load items.</p>
                </div>
            </div>

            <!-- REPORTS TAB -->
            <div id="admin-reports-view" style="display:${adminCurrentTab === 'reports' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminReports()" style="margin-bottom:20px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Reports</button>
                <div id="reports-list-container"></div>
            </div>

            <!-- USERS TAB -->
            <div id="admin-users-view" style="display:${adminCurrentTab === 'users' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminUsers()" style="margin-bottom:20px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Students List</button>
                <div id="users-table-container" class="admin-panel-card" style="overflow-x:auto; padding: 0;"></div>
            </div>

            <!-- DOUBTS TAB -->
            <div id="admin-doubts-view" style="display:${adminCurrentTab === 'doubts' ? 'block' : 'none'};">
                <button class="btn-exam" onclick="loadAdminDoubts()" style="margin-bottom:20px; background:var(--primary-yellow); color:black; border:none;">🔄 Refresh Flagged Doubts</button>
                <div id="doubts-list-container"></div>
            </div>

            <!-- SETTINGS TAB -->
            <div id="admin-settings-view" style="display:${adminCurrentTab === 'settings' ? 'block' : 'none'};">
                <div class="admin-grid-2">
                    <div class="admin-panel-card" style="margin-bottom: 0;">
                        <h3 class="admin-section-header">🔐 Admin Password</h3>
                        <label class="admin-label">New Password (Min 6 chars)</label>
                        <input type="password" id="newAdminPass" class="input-field">
                        <label class="admin-label">Confirm Password</label>
                        <input type="password" id="confirmAdminPass" class="input-field">
                        <button class="btn-exam" onclick="changeAdminPassword()" style="background:var(--primary-yellow); color:black; border:none; width:100%; margin-top: 10px;">Update Password</button>
                    </div>

                    <div class="admin-panel-card" style="margin-bottom: 0; border-color: rgba(76, 175, 80, 0.4);">
                        <h3 class="admin-section-header" style="color:var(--correct-green); border-color: rgba(76, 175, 80, 0.2);">⚡ Database Scalability</h3>
                        <p style="color:var(--text-muted); font-size:13px; line-height:1.6; margin-bottom:25px;">
                            Batch indexes existing MCQs with <code>randomKey</code> attributes so the custom quiz engine can perform sub-second random selections at massive scale.
                        </p>
                        <button id="btnMigrateKeys" class="btn-exam" onclick="runRandomKeyMigration()" style="background:#4CAF50; color:white; border:none; width:100%;">Run Index Migration</button>
                    </div>
                </div>
            </div>
        </div>`;
        
    if (adminCurrentTab === 'upload') { _buildAdminSelectors(); }
    else if (adminCurrentTab === 'topics') { _buildAdminNewTopicSelectors(); loadAdminTopicsList(); }
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

let globalTopicsData = [];
async function loadAdminTopicsList() {
    const container = document.getElementById('admin-topic-list-container'); 
    container.innerHTML = `<p style="color:#777;">Loading folders...</p>`;
    try {
        const snap = await db.collection("custom_topics").get();
        globalTopicsData = [];
        snap.forEach(doc => globalTopicsData.push({ id: doc.id, ...doc.data() }));
        globalTopicsData.sort((a,b) => (a.parentPath || "").localeCompare(b.parentPath || ""));
        
        let paths = [...new Set(globalTopicsData.map(t => t.parentPath))].sort();
        let filterDropdown = document.getElementById('adminTopicPathFilter');
        if (filterDropdown) {
            filterDropdown.innerHTML = `<option value="ALL">All Paths</option>` + paths.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        
        renderAdminTopicsList(globalTopicsData);
    } catch(e) { container.innerHTML = `<p>Error: ${e.message}</p>`; }
}

function renderAdminTopicsList(topicsArray) {
    const container = document.getElementById('admin-topic-list-container');
    if(topicsArray.length === 0) { container.innerHTML = `<p style="color:#777;">No custom folders found matching criteria.</p>`; return; }
    let html = '';
    topicsArray.forEach(d => {
        let cleanName = d.name.replace(/'/g, "\\'");
        let typeBadgeStr = d.type === 'both' ? 'Parent Category' : d.type;
        let parentStr = d.parentPath || 'Root (Main Menu)';
        
        html += `
        <div style="background:#1c1c24; border:1px solid #2b2b36; border-radius:12px; padding:16px 20px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span style="color:var(--text-muted); font-size:12px; display:block; margin-bottom:4px;">Path: ${parentStr}</span>
                <b style="font-size:16px; color:#fff;">📁 ${d.name}</b> <span style="font-size:11px; background:#333; color:#aaa; padding:3px 8px; border-radius:6px; margin-left:8px; text-transform:uppercase;">${typeBadgeStr}</span>
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="openEditTopicModal('${d.id}', '${cleanName}', '${d.type}')" style="background:rgba(33, 150, 243, 0.15); border:1px solid rgba(33,150,243,0.3); color:#2196F3; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">Edit</button>
                <button onclick="deleteCustomTopic('${d.id}')" style="background:rgba(244, 67, 54, 0.15); border:1px solid rgba(244,67,54,0.3); color:var(--wrong-red); padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">Delete</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function filterAdminTopics() {
    let q = document.getElementById('adminTopicSearch').value.toLowerCase();
    let pathFilter = document.getElementById('adminTopicPathFilter') ? document.getElementById('adminTopicPathFilter').value : 'ALL';
    
    let filtered = globalTopicsData.filter(t => {
        let matchesSearch = t.name.toLowerCase().includes(q) || t.parentPath.toLowerCase().includes(q);
        let matchesPath = pathFilter === 'ALL' || t.parentPath === pathFilter;
        return matchesSearch && matchesPath;
    });
    renderAdminTopicsList(filtered);
}

function openEditTopicModal(id, name, type) {
    document.getElementById('editTopicId').value = id;
    document.getElementById('editTopicName').value = name;
    document.getElementById('editTopicType').value = type;
    document.getElementById('editTopicModal').style.display = 'flex';
}

function closeEditTopicModal() { document.getElementById('editTopicModal').style.display = 'none'; }

async function saveEditedTopic() {
    let id = document.getElementById('editTopicId').value;
    let name = document.getElementById('editTopicName').value.trim();
    let type = document.getElementById('editTopicType').value;
    if(!name) return alert("Folder name is required.");
    try {
        await db.collection("custom_topics").doc(id).update({ name: name, type: type });
        closeEditTopicModal(); showNotification("✅ Folder updated!");
        loadAdminTopicsList(); await loadCustomTopics();
    } catch(e) { alert("Error: " + e.message); }
}

async function deleteCustomTopic(docId) {
    if(!confirm("Are you sure? This will remove the folder from the app menu (Note: MCQs inside it won't be deleted).")) return;
    try { await db.collection("custom_topics").doc(docId).delete(); showNotification("✅ Folder deleted"); loadAdminTopicsList(); await loadCustomTopics(); } catch(e){}
}

function _buildAdminNewTopicSelectors() {
    const container = document.getElementById('dynamic-new-path-selectors'); 
    if (!container) return;
    
    let html = ''; 
    let currentObj = appData;
    
    for (let i = 0; i <= adminNewTopicPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        
        if (currentObj && typeof currentObj === 'object' && Object.keys(currentObj).length === 0 && i === adminNewTopicPath.length) break;
        
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminNewTopicPathChange(event, ${i})">`;
        html += `<option value="">-- Stop Here / Select Child --</option>`;
        
        for (let key in currentObj) { 
            if (key === "Daily Quiz Challenge") continue; 
            let selected = (adminNewTopicPath[i] === key) ? 'selected' : '';
            html += `<option value="${key}" ${selected}>${key}</option>`; 
        }
        html += `</select>`;
        
        if (adminNewTopicPath[i] && currentObj[adminNewTopicPath[i]]) { 
            currentObj = currentObj[adminNewTopicPath[i]]; 
        } else { 
            break; 
        }
    }
    container.innerHTML = html;
    
    let pathTextSpan = document.getElementById('new-topic-path-text');
    if (pathTextSpan) {
        pathTextSpan.innerText = adminNewTopicPath.length > 0 ? adminNewTopicPath.join(' > ') : 'Root (Main Menu)';
    }
}

function handleAdminNewTopicPathChange(event, depth) {
    const val = event.target.value;
    if (val === "") {
        adminNewTopicPath = adminNewTopicPath.slice(0, depth);
    } else {
        adminNewTopicPath = adminNewTopicPath.slice(0, depth);
        adminNewTopicPath.push(val);
    }
    _buildAdminNewTopicSelectors(); 
}
        
async function createCustomTopic() {
    const folderNameInput = document.getElementById('newFolderName');
    const folderName = folderNameInput.value.trim();
    if (!folderName) {
        showNotification("⚠️ Folder name is required.");
        return;
    }
    const folderType = document.getElementById('newFolderType').value;
    
    try {
        // FIX: Allows creation of Root level topics (empty parentPath)
        const fullPath = adminNewTopicPath.length > 0 ? adminNewTopicPath.join(' > ') : "";
        
        await db.collection("custom_topics").add({ 
            parentPath: fullPath, 
            name: folderName, 
            type: folderType, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        showNotification("✅ Folder Created Successfully!"); 
        folderNameInput.value = ""; 
        await loadCustomTopics(); 
        _buildAdminNewTopicSelectors(); 
        loadAdminTopicsList();
    } catch(error) { 
        alert("⚠️ ERROR: " + error.message); 
    }
}

function _buildAdminSelectors() {
    const container = document.getElementById('dynamic-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminSelectedPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        if (currentObj && typeof currentObj === 'object' && Object.keys(currentObj).length === 0 && i === adminSelectedPath.length) break;
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleAdminPathChange(event, ${i})"><option value="" ${!adminSelectedPath[i] ? 'selected' : ''}>-- Upload Here / Select Child --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminSelectedPath[i] && currentObj[adminSelectedPath[i]]) { currentObj = currentObj[adminSelectedPath[i]]; } else { break; }
    }
    container.innerHTML = html;
    const formArea = document.getElementById('upload-form-area'); if(formArea) formArea.style.display = (adminSelectedPath.length > 0) ? 'block' : 'none';
    
    let uploadTextSpan = document.getElementById('upload-path-text');
    if (uploadTextSpan) {
        uploadTextSpan.innerText = adminSelectedPath.length > 0 ? adminSelectedPath.join(' > ') : 'Please select a destination above';
    }
}

function handleAdminPathChange(event, depth) { 
    if (event.target.value === "") adminSelectedPath = adminSelectedPath.slice(0, depth);
    else { adminSelectedPath = adminSelectedPath.slice(0, depth); adminSelectedPath.push(event.target.value); }
    _buildAdminSelectors(); 
}

function _buildManageSelectors() {
    const container = document.getElementById('manage-path-selectors'); if(!container) return;
    let html = ''; let currentObj = appData;
    for (let i = 0; i <= adminManageSelectedPath.length; i++) {
        if (typeof currentObj === 'string' || Array.isArray(currentObj)) break; 
        html += `<select class="input-field" style="flex:1; min-width:160px; margin-bottom:0;" onchange="handleManagePathChange(event, ${i})"><option value="" ${!adminManageSelectedPath[i] ? 'selected' : ''}>-- All Folders --</option>`;
        for (let key in currentObj) { if (key === "Daily Quiz Challenge") continue; html += `<option value="${key}" ${adminManageSelectedPath[i] === key ? 'selected' : ''}>${key}</option>`; }
        html += `</select>`;
        if (adminManageSelectedPath[i] && currentObj[adminManageSelectedPath[i]]) { currentObj = currentObj[adminManageSelectedPath[i]]; } else { break; }
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
            clearAdminUploadForm(true); // SMART CLEAR: Preserves Path & Difficulty for fast upload
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
            if (data.type === 'mcq') {
                let answersStr = (data.correctAnswers || []).join(', ');
                let lvlBadge = data.level ? `<span style="margin-left:10px; background:#444; color:white; padding:3px 8px; border-radius:6px; font-size:11px; text-transform:uppercase;">${data.level}</span>` : '';
                html += `<div class="content-item-card" id="item_${doc.id}" style="background:#1c1c24; border:1px solid #2b2b36; border-radius:12px; padding:20px; margin-bottom:15px;"><div class="content-item-header" style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom: 1px solid #333; padding-bottom: 12px;"><span class="badge-path">${data.path || 'Uncategorized'}</span>${lvlBadge}<div style="display:flex; gap:10px;"><button class="btn-exam" onclick="openEditModal('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(33, 150, 243, 0.15); color:#2196F3; border:1px solid rgba(33,150,243,0.3);">✏️ Edit</button><button class="btn-exam" onclick="deleteContentItem('${doc.id}')" style="padding:6px 12px; font-size:13px; background:rgba(244, 67, 54, 0.15); color:var(--wrong-red); border:1px solid rgba(244,67,54,0.3);">🗑️ Delete</button></div></div><div style="font-weight:bold; margin-bottom:12px; font-size: 15px;">${data.question}</div>${data.imageUrl ? `<img src="${data.imageUrl}" style="max-height:100px; border-radius:6px; margin-bottom:12px; display:block;">` : ''}<div style="font-size:13px; color:var(--text-muted); line-height:1.6; background: #131318; padding: 12px; border-radius: 8px;"><b>A:</b> ${data.options?.A || '-'}<br><b>B:</b> ${data.options?.B || '-'}<br><b>C:</b> ${data.options?.C || '-'}<br><b>D:</b> ${data.options?.D || '-'}</div><div style="margin-top:12px; font-size:14px; color:var(--correct-green); font-weight: bold;">✅ Correct: ${answersStr}</div></div>`;
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
        let snap = await db.collection("content").where("type", "==", "mcq").limit(400).get();
        let batch = db.batch();
        let count = 0;
        snap.forEach(doc => {
            if (doc.data().randomKey === undefined) {
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
    try { await db.collection("content").doc(docId).delete(); document.getElementById("item_" + docId).remove(); showNotification("🗑️ Item deleted successfully!"); } 
    catch(e) { showNotification("❌ Delete failed: " + e.message); }
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
        closeEditModal(); showNotification("✅ Changes saved!"); loadContentForManagement(false);
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
    const container = document.getElementById('reports-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching reported mistakes...</p>`;
    try {
        const snapshot = await db.collection("reported_mistakes").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<div class='admin-panel-card'><p style='color:var(--correct-green); text-align:center; font-size: 16px;'>✅ No mistakes reported! Everything is clean.</p></div>"; return; }
        
        let html = '';
        items.forEach(data => {
            let stat = data.status === 'resolved' ? `<span style="background:rgba(76, 175, 80, 0.15); color:#4CAF50; border: 1px solid rgba(76,175,80,0.3); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">✅ Resolved</span>` : `<span style="background:rgba(255, 255, 255, 0.1); color:white; border: 1px solid rgba(255,255,255,0.2); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">⏳ Pending</span>`;
            html += `<div class="admin-panel-card" style="border-left: 4px solid var(--wrong-red); padding: 20px;"><div class="content-item-header" style="border-bottom: 1px solid #2b2b36; padding-bottom: 12px; margin-bottom: 15px;"><span class="badge-path">${data.path || 'Unknown Path'}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="margin: 10px 0; padding: 15px; background: rgba(244, 67, 54, 0.05); border: 1px solid rgba(244,67,54,0.2); border-radius: 8px; display:flex; justify-content:space-between; align-items: flex-start;"><div><p style="color:var(--wrong-red); margin:0 0 8px 0; font-size: 15px;"><b>Issue:</b> ${data.reason}</p><p style="margin:0; font-size:14px; color: #ccc;"><b>Details:</b> ${data.description || 'No description provided.'}</p></div><div>${stat}</div></div><p style="margin:12px 0; font-size:13px; color:var(--primary-yellow);"><b>Reported by:</b> ${data.studentName}</p><div style="background:#131318; padding:15px; border-radius:8px; font-size:14px; margin:15px 0; border: 1px solid #2b2b36;"><b>Question Content:</b><br><br>${data.questionText}</div><div style="display:flex; gap:12px; flex-wrap:wrap; margin-top: 20px;"><button onclick="openEditModalFromReport('${data.questionId}')" style="padding:10px 16px; background:rgba(33, 150, 243, 0.15); border:1px solid rgba(33,150,243,0.3); border-radius:8px; color:#2196F3; cursor:pointer; font-weight:bold;">✏️ Edit MCQ in Database</button><button onclick="resolveReport('${data.id}')" style="padding:10px 16px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76,175,80,0.3); border-radius:8px; color:var(--correct-green); cursor:pointer; font-weight:bold;" ${data.status==='resolved'?'disabled style="opacity:0.5; cursor:not-allowed;"':''}>✅ Mark Resolved (Notifies User)</button></div></div>`;
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
    container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching students and feedback...</p>`;
    try {
        const feedbackSnap = await db.collection("platform_feedback").limit(100).get();
        let feedbacks = {};
        feedbackSnap.forEach(doc => {
            let d = doc.data();
            feedbacks[d.studentId] = { rating: d.rating, feedback: d.feedback };
        });

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
            let fb = feedbacks[uid] || { rating: '-', feedback: '-' };
            let stars = fb.rating !== '-' ? '⭐'.repeat(fb.rating) : '-';
            html += `<tr style="border-bottom: 1px solid #2b2b36;">
                <td style="padding: 15px; font-weight:bold;">${d.displayName || 'Unknown'}</td>
                <td style="padding: 15px; color:#aaa;">${d.email || '-'}</td>
                <td style="padding: 15px; color:#aaa; font-size: 13px;">${d.lastLogin ? d.lastLogin.toDate().toLocaleString() : "Unknown"}</td>
                <td style="padding: 15px; color:var(--primary-yellow);">${stars}</td>
                <td style="padding: 15px; max-width:250px; font-size:13px; color:var(--text-muted); line-height:1.4;">${fb.feedback}</td>
            </tr>`; 
        });
        container.innerHTML = html + `</table>`;
    } catch(e) { container.innerHTML = `<p style="color:red; padding: 20px;">Error: ${e.message}</p>`; }
}

async function loadAdminDoubts() {
    const container = document.getElementById('doubts-list-container'); container.innerHTML = `<p style="color:var(--primary-yellow); padding: 20px;">Fetching doubts...</p>`;
    try {
        const snapshot = await db.collection("flagged_doubts").orderBy("timestamp", "desc").limit(50).get();
        let items = [];
        snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

        if(items.length === 0) { container.innerHTML = "<div class='admin-panel-card'><p style='color:var(--correct-green); text-align:center;'>✅ No flagged questions found!</p></div>"; return; }
        
        let html = '';
        items.forEach(data => { 
            let stat = data.status === 'resolved' ? `<span style="background:rgba(76, 175, 80, 0.15); color:#4CAF50; border: 1px solid rgba(76,175,80,0.3); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">✅ Reviewed</span>` : `<span style="background:rgba(255, 255, 255, 0.1); color:white; border: 1px solid rgba(255,255,255,0.2); padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">⏳ Pending</span>`;
            html += `<div class="admin-panel-card" style="padding: 20px;"><div class="content-item-header" style="border-bottom: 1px solid #2b2b36; padding-bottom: 12px; margin-bottom: 15px;"><span class="badge-path">${data.path}</span><span style="font-size:12px; color:var(--text-muted); float:right;">${data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString() : ""}</span></div><div style="display:flex; justify-content:space-between; margin-top:10px;"><p style="color:var(--primary-yellow); margin:5px 0; font-size: 15px;"><b>Flagged by:</b> ${data.studentName}</p>${stat}</div><div style="background:#131318; border: 1px solid #2b2b36; padding:15px; border-radius:8px; font-size:14px; margin:15px 0; line-height: 1.5;">${data.questionText}</div><button onclick="resolveDoubt('${data.id}')" style="margin-top:10px; padding:10px 16px; background:rgba(76, 175, 80, 0.15); border:1px solid rgba(76,175,80,0.3); border-radius:8px; color:var(--correct-green); cursor:pointer; font-weight: bold;" ${data.status==='resolved'?'disabled style="opacity:0.5; cursor:not-allowed;"':''}>✅ Mark Reviewed (Notifies User)</button></div>`; 
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
