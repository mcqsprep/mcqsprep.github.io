// ==========================================
// 1. SYSTEM INITIALIZATION & CONFIGURATION
// ==========================================

// PWA Install Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    
    // Safety check: Only show install button if not currently running as an installed standalone app
    if (installBtn && !window.matchMedia('(display-mode: standalone)').matches && window.navigator.standalone !== true) {
        installBtn.style.display = 'flex';
    }
});

function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            document.getElementById('installAppBtn').style.display = 'none';
        }
        deferredPrompt = null;
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Setup Failed:', err));
    });
}

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
    @keyframes fadeSlideUp { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    .page-transition { animation: fadeSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
    
    .ai-fullscreen-modal { background: #0a0a0f !important; overflow: hidden !important; border: none !important; height: 100dvh !important; max-height: 100dvh !important; box-sizing: border-box; }
    .ai-fullscreen-modal * { box-sizing: border-box; }
    .ai-ambient-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(140px); z-index: 1; }
    .ai-glow-1 { top: -10%; left: -10%; width: 50vw; height: 50vh; background: #6228d7; opacity: 0.3; }
    .ai-glow-2 { bottom: -10%; right: -5%; width: 60vw; height: 60vh; background: #fdb813; opacity: 0.15; }
    .ai-glow-3 { top: 40%; left: 30%; width: 40vw; height: 40vh; background: #ff007f; opacity: 0.15; }
    
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
    
    .nav-streak-badge { background: rgba(255, 87, 34, 0.15); color: #FF5722; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 13px; display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255, 87, 34, 0.3); }
`;
document.head.appendChild(styleSheet);

function formatTextWithMath(text) {
    if (!text) return "";
    const mathSnippets = [];
    let processedText = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\))/g, function(match) {
        mathSnippets.push(match);
        return `@@MATH_SPAWN_${mathSnippets.length - 1}@@`;
    });
    
    let html = marked.parse(processedText);
    
    mathSnippets.forEach((snippet, i) => {
        html = html.replace(`@@MATH_SPAWN_${i}@@`, snippet);
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

firebase.initializeApp(firebaseConfig); 

// Enable True Offline-First Persistence for Firestore
const db = firebase.firestore(); 
db.enablePersistence({synchronizeTabs:true}).catch(function(err) {
    console.log("Offline persistence error:", err.code);
});

const auth = firebase.auth(); 
const provider = new firebase.auth.GoogleAuthProvider();

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/h5gdez7a/auto/upload"; 
const CLOUDINARY_PRESET = "mcq_uploads"; 
const AI_WORKER_URL = "https://shy-waterfall-08a4.md-habibullah9957.workers.dev/";

let appData = { 
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

let customTopicTypes = {};
let currentUser = null; 
let currentPath = []; 
let dataLoaded = false; 
let userBookmarks = [];

function showNotification(message) { 
    const notif = document.getElementById('notification'); 
    notif.innerText = message; 
    notif.style.display = 'block'; 
    setTimeout(() => { notif.style.display = 'none'; }, 3000); 
}
