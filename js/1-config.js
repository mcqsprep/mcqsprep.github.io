// ==========================================
// 1. SYSTEM INITIALIZATION & CONFIGURATION
// ==========================================

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const btn1 = document.getElementById('installAppBtn');
    const btn2 = document.getElementById('installAppBtnMobile');
    
    if (!window.matchMedia('(display-mode: standalone)').matches && window.navigator.standalone !== true) {
        if (btn1) btn1.style.display = 'flex';
        if (btn2) btn2.style.display = 'flex';
    }
});

function installPWA() {
    if (!deferredPrompt) {
        showNotification("To install: Tap your browser menu (or Share icon on iOS) and select 'Add to Home Screen'.");
        return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            const btn1 = document.getElementById('installAppBtn');
            const btn2 = document.getElementById('installAppBtnMobile');
            if (btn1) btn1.style.display = 'none';
            if (btn2) btn2.style.display = 'none';
        }
        deferredPrompt = null;
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Setup Failed:', err));
    });
}

// Upper Back Button Visibility & Smart Action Logic
function handlePCBackButton() {
    const backBtn = document.querySelector('.pc-back-btn');
    if (!backBtn) return;

    backBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof goBack === 'function') goBack();
        else window.history.back();
    };

    const hash = window.location.hash || '';
    if (hash === '' || hash === '#/' || hash === '#/home') {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'flex';
    }
}
window.addEventListener('hashchange', handlePCBackButton);
window.addEventListener('DOMContentLoaded', handlePCBackButton);

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
    @keyframes fadeSlideUp { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    .page-transition { animation: fadeSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
    
    /* Permanently hide duplicate bottom back button container */
    #dynamic-back-container { display: none !important; }

    /* Hide Ask AI Floating Button on Custom Practice & Active Quiz screens */
    body.hide-ai-btn #ai-floating-btn { display: none !important; }

    /* Keep upper back button accessible on both desktop and mobile when inside pages */
    .pc-back-btn.hide-on-mobile { display: flex; }
    
    #gemini-chat-history::-webkit-scrollbar { width: 6px; }
    #gemini-chat-history::-webkit-scrollbar-track { background: transparent; }
    #gemini-chat-history::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
    #gemini-chat-history::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
    
    .ai-chat-bubble { overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; max-width: 100%; box-sizing: border-box; }
    .ai-chat-bubble p { margin-top: 0; max-width: 100%; overflow-wrap: break-word; }
    .katex-display { max-width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 8px; margin: 10px 0; }
    .katex-display::-webkit-scrollbar { height: 4px; }
    .katex-display::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
    
    #ai-floating-btn { -webkit-user-select: none; -ms-user-select: none; user-select: none; touch-action: none; }
    .bookmarked { background: rgba(253, 184, 19, 0.2) !important; color: var(--primary-yellow) !important; border-color: var(--primary-yellow) !important; }
    
    .badge-path { background: rgba(253, 184, 19, 0.12); color: var(--primary-yellow); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1px solid rgba(253, 184, 19, 0.25); display: inline-block; }

    /* Custom Practice Wide Desktop & Responsive Mobile Layout */
    .cw-wide-card { max-width: 1180px; width: 100%; margin: 0 auto; padding: 32px 36px; box-sizing: border-box; }
    .cw-exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .cw-multi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: 280px; overflow-y: auto; padding: 14px; background: #080d17; border: 1px solid var(--border-color); border-radius: 12px; }
    .cw-check-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #0d1527; border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: #d1d5db; transition: 0.2s; user-select: none; box-sizing: border-box; }
    .cw-check-card:hover { border-color: rgba(253, 184, 19, 0.5); color: #fff; background: #111d35; }
    .cw-check-card.selected { background: rgba(253, 184, 19, 0.14); border-color: var(--primary-yellow); color: #fff; }
    .cw-check-card input[type="checkbox"] { accent-color: var(--primary-yellow); width: 17px; height: 17px; margin: 0; cursor: pointer; flex-shrink: 0; }

    /* Live Chapter Search Bar & Suggestions Dropdown */
    .cw-chapter-search-wrap { position: relative; margin-bottom: 12px; }
    .cw-chapter-search-input { width: 100%; padding: 12px 38px 12px 14px !important; margin-bottom: 0 !important; border-radius: 10px !important; background: #080d17 !important; border: 1px solid var(--border-color) !important; color: #fff !important; font-size: 13.5px !important; box-sizing: border-box; }
    .cw-chapter-search-input:focus { border-color: var(--primary-yellow) !important; }
    .cw-chapter-suggestions { display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #0d1527; border: 1px solid var(--primary-yellow); border-radius: 10px; max-height: 230px; overflow-y: auto; z-index: 2500; box-shadow: 0 12px 30px rgba(0,0,0,0.85); }
    .cw-chapter-sug-item { padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #fff; transition: 0.15s; }
    .cw-chapter-sug-item:hover { background: rgba(253, 184, 19, 0.12); }

    @media (max-width: 768px) {
        .cw-wide-card { padding: 18px 14px !important; }
        .cw-exam-grid { grid-template-columns: 1fr; gap: 10px; }
        .cw-multi-grid { grid-template-columns: 1fr; max-height: 230px; padding: 10px; gap: 8px; }
        .cw-check-card { padding: 11px 12px; font-size: 13px; }
    }

    #notification {
        position: fixed !important;
        top: 20px !important;
        bottom: auto !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: #1a1a24 !important;
        color: #fdb813 !important;
        padding: 12px 24px !important;
        border-radius: 8px !important;
        border: 1px solid rgba(253, 184, 19, 0.3) !important;
        font-weight: 500 !important;
        font-size: 14px !important;
        z-index: 99999 !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
        text-align: center !important;
        width: max-content !important;
        max-width: 90vw !important;
        pointer-events: none !important;
    }
`;
document.head.appendChild(styleSheet);

function formatTextWithMath(text) {
    if (!text) return "";
    text = text.replace(/\\\n/g, '\n');
    text = text.replace(/\\text\{([^{}]+)_([^{}]+)\}/g, '\\text{$1}_$2');
    text = text.replace(/\\text\{([^{}]+)\^([^{}]+)\}/g, '\\text{$1}^$2');

    const mathSnippets = [];
    let processedText = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g, function(match) {
        if (match.startsWith('$') && !match.startsWith('$$')) {
            match = match.replace(/\n/g, ' ');
        } else if (match.startsWith('\\(')) {
            match = match.replace(/\n/g, ' ');
        }
        mathSnippets.push(match);
        return `@@MATH_SPAWN_${mathSnippets.length - 1}@@`;
    });
    
    let html = (typeof marked !== 'undefined' && marked.parse) ? marked.parse(processedText) : processedText.replace(/\n/g, '<br>');
    
    mathSnippets.forEach((snippet, i) => {
        html = html.replace(`@@MATH_SPAWN_${i}@@`, () => snippet);
    });
    return html;
}

const firebaseConfig = { 
    apiKey: "AIzaSyDuletjxV1THjWvWLvO0XqB_z5xBBXLwL8", 
    authDomain: "mcqsprep.firebaseapp.com", 
    projectId: "mcqsprep", 
    storageBucket: "mcqsprep.firebasestorage.app", 
    messagingSenderId: "920181103186", 
    appId: "1:920181103186:web:14c2ba261d4a6163db5d8b" 
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore(); 
db.enablePersistence({synchronizeTabs:true}).catch(function(err) {
    console.log("Offline persistence error:", err.code);
});

const auth = firebase.auth(); 
const provider = new firebase.auth.GoogleAuthProvider();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; 
const CLOUDINARY_PRESET = "mcq_uploads"; 
const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

const DEFAULT_APP_DATA = { 
    "Daily Quiz Challenge": { "NEET": {}, "General Knowledge": {} }, 
    "NEET": { 
        "NCERT Book": {}, 
        "PYQs": {}, 
        "Practice Paper": {}, 
        "MCQs Practice": { 
            "Botany": {}, "Zoology": {}, "Physics": {}, 
            "Organic Chemistry": {}, "Physical Chemistry": {}, "Inorganic Chemistry": {} 
        }, 
        "Mock Test": {} 
    }, 
    "General Knowledge": { "Current Affairs": {}, "History": {}, "Geography": {} } 
};

let appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
let customTopicTypes = {};
let currentUser = null; 
window.currentUser = null;
let currentPath = []; 
let dataLoaded = false; 
let userBookmarks = [];

let notifTimer = null;
function showNotification(message) { 
    const notif = document.getElementById('notification'); 
    if (!notif) return;
    notif.innerText = message; 
    notif.style.display = 'block'; 
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = setTimeout(() => { notif.style.display = 'none'; }, 4000); 
}
