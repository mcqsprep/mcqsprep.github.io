// 1. The Complete Menu Database (No questions yet, just structure)
const appData = {
    "NEET": {
        "NCERT Book": {
            "Class 11": {
                "Zoology": [],
                "Botany": [],
                "Physics": [],
                "Chemistry": []
            },
            "Class 12": {
                "Zoology": [],
                "Botany": [],
                "Physics": [],
                "Chemistry": []
            }
        },
        "PYQs": {
            "2026": [], "2025": [], "2024": [], "2023": [], 
            "2022": [], "2021": [], "2020": [], "2019": [], 
            "2018": [], "2017": [], "2016": [], "2015": [], 
            "2014": [], "2013": [], "2012": [], "2011": []
        },
        "Practice Paper": {
            "Easy": [],
            "Medium": [],
            "Hard": [],
            "Mixed": []
        },
        "MCQs Practice": {
            "Botany": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] },
            "Zoology": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] },
            "Physics": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] },
            "Organic Chemistry": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] },
            "Physical Chemistry": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] },
            "Inorganic Chemistry": { "Easy": [], "Medium": [], "Hard": [], "Mixed": [] }
        },
        "Mock Test": "COMING SOON"
    },
    "General Knowledge": {
        "Current Affairs": [],
        "History": [],
        "Geography": []
    }
};

// 2. Navigation State
let currentPath = []; 

// 3. Core Rendering Engine (Draws the menus based on where you are)
function renderView() {
    const mainContent = document.querySelector('.main-content');
    const breadcrumb = document.querySelector('.breadcrumb');

    // Update Breadcrumb Text
    if (currentPath.length === 0) {
        breadcrumb.innerText = "Home / Select Exam";
    } else {
        breadcrumb.innerText = "Home / " + currentPath.join(" / ");
    }

    // Figure out which part of the database we are currently looking at
    let currentLevel = appData;
    for (let node of currentPath) {
        currentLevel = currentLevel[node];
    }

    // SCENARIO A: We hit a dead-end (Leaf Node) where questions will go
    if (Array.isArray(currentLevel)) {
        mainContent.innerHTML = `
            <div class="card">
                <h2>${currentPath[currentPath.length - 1]}</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">
                    This section is structured and ready. You can add your MCQs here later!
                </p>
                <button class="btn-exam" onclick="goBack()" style="width: 200px; background-color: #333;">&larr; Go Back</button>
            </div>
        `;
        return;
    }

    // SCENARIO B: We hit the "Mock Test" or any "COMING SOON" string
    if (typeof currentLevel === 'string') {
        mainContent.innerHTML = `
            <div class="card">
                <h2>${currentPath[currentPath.length - 1]}</h2>
                <h3 style="color: var(--primary-yellow); font-size: 24px; padding: 20px 0;">${currentLevel}</h3>
                <button class="btn-exam" onclick="goBack()" style="width: 200px; background-color: #333;">&larr; Go Back</button>
            </div>
        `;
        return;
    }

    // SCENARIO C: We are in a menu, so draw the buttons
    let title = currentPath.length === 0 ? "Select Exam:" : currentPath[currentPath.length - 1];
    
    let html = `
        <div class="card">
            <h2>${title}</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
    `;

    // Create a button for every option in the current level
    for (let key in currentLevel) {
        html += `<button class="btn-exam" onclick="navigateTo('${key}')">${key}</button>`;
    }

    // Add a "Go Back" button if we aren't on the home screen
    if (currentPath.length > 0) {
        html += `<button class="btn-exam" onclick="goBack()" style="grid-column: 1 / -1; background-color: #222; border-color: #444; color: #a0a0a0;">&larr; Go Back</button>`;
    }

    html += `</div></div>`;
    mainContent.innerHTML = html;
}

// 4. Navigation Actions
function navigateTo(key) {
    currentPath.push(key);
    renderView();
}

function goBack() {
    currentPath.pop();
    renderView();
}

function goHome() {
    currentPath = [];
    renderView();
}

// 5. Sidebar/Quick Link Jump Function
// This allows your sidebar links to jump directly deep into the menus
function jumpToSection(pathArray) {
    currentPath = pathArray;
    renderView();
    showNotification("Navigated to " + pathArray[pathArray.length - 1]);
}

// 6. Notifications & Search (Kept from previous version)
function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.innerText = message;
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 3000);
}

function executeSearch() {
    const query = document.getElementById('searchInput').value;
    if(query.trim() === "") {
        showNotification("Please enter a topic or subtopic to search.");
    } else {
        showNotification(`Searching database for: "${query}"...`);
    }
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        executeSearch();
    }
}

// Start the application
renderView();
