// ==========================================
// 4. MAIN VIEW RENDERER, SECONDARY SUBTOPIC SEARCH & UNLIMITED ICON ENGINE
// ==========================================

(function injectEmojiVisibilityAndSubSearchStyles() {
    if (document.getElementById('mcqs-emoji-glow-style')) return;
    const st = document.createElement('style');
    st.id = 'mcqs-emoji-glow-style';
    st.textContent = `
        .logo-container, .cat-icon, .link-icon {
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.24));
        }
        .subtopic-search-container {
            position: relative;
            margin: 0 0 22px 0;
            max-width: 100%;
        }
        .subtopic-search-box {
            display: flex;
            align-items: center;
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(9, 14, 26, 0.98));
            border: 1.5px solid rgba(253, 184, 19, 0.45);
            border-radius: 14px;
            padding: 10px 16px;
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45), 0 0 15px rgba(253, 184, 19, 0.12);
            transition: all 0.2s ease;
        }
        .subtopic-search-box:focus-within {
            border-color: #fdb813;
            box-shadow: 0 8px 26px rgba(0, 0, 0, 0.6), 0 0 20px rgba(253, 184, 19, 0.28);
        }
        .subtopic-search-icon {
            font-size: 18px;
            margin-right: 12px;
            color: #fdb813;
            flex-shrink: 0;
        }
        .subtopic-search-input {
            width: 100%;
            background: transparent;
            border: none;
            color: #ffffff;
            font-size: 14.5px;
            font-weight: 500;
            outline: none;
            font-family: inherit;
        }
        .subtopic-search-input::placeholder {
            color: #94a3b8;
        }
        .subtopic-search-clear {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.35);
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
            flex-shrink: 0;
        }
        .subtopic-search-dropdown {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            background: #0d1527;
            border: 1px solid rgba(253, 184, 19, 0.4);
            border-radius: 14px;
            max-height: 320px;
            overflow-y: auto;
            z-index: 950;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
        }
        .subtopic-sug-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            cursor: pointer;
            transition: background 0.15s ease;
        }
        .subtopic-sug-item:last-child {
            border-bottom: none;
        }
        .subtopic-sug-item:hover {
            background: rgba(253, 184, 19, 0.12);
        }
    `;
    document.head.appendChild(st);
})();

// Global store for admin-configured secondary search bars
window.subtopicSearchConfig = window.subtopicSearchConfig || {
    enabledPaths: {},
    autoThreshold: 8 // Also shows automatically if a folder has 8+ items unless disabled
};

(async function initSubtopicSearchConfigCache() {
    try {
        const cached = localStorage.getItem('mcqs_subtopic_search_cfg_v1');
        if (cached) {
            window.subtopicSearchConfig = JSON.parse(cached);
        }
    } catch (e) {}
    setTimeout(async () => {
        try {
            if (typeof db !== 'undefined') {
                const doc = await db.collection("settings").doc("subtopic_search_config").get();
                if (doc.exists && doc.data()) {
                    window.subtopicSearchConfig = {
                        enabledPaths: doc.data().enabledPaths || {},
                        autoThreshold: doc.data().autoThreshold !== undefined ? Number(doc.data().autoThreshold) : 8
                    };
                    localStorage.setItem('mcqs_subtopic_search_cfg_v1', JSON.stringify(window.subtopicSearchConfig));
                    if (window.location.hash.startsWith('#/path/') && typeof _renderView === 'function') {
                        _renderView();
                    }
                }
            }
        } catch (e) {}
    }, 600);
})();

function forceStartQuiz() {
    document.body.classList.add('hide-ai-btn');
    document.body.classList.add('hide-bottom-bar');
    window.location.hash = '#/quiz';
    setTimeout(() => { if (typeof _initiateQuizEngine === 'function') _initiateQuizEngine(); }, 50);
}

function forceCwStep1(e) {
    if (e) e.stopPropagation();
    document.body.classList.add('hide-ai-btn');
    document.body.classList.add('hide-bottom-bar');
    window.location.hash = '#/custom-setup';
}

function makeTopicTheme(icon, hexColor) {
    let hex = (hexColor || "#fdb813").replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16) || 253;
    let g = parseInt(hex.substring(2, 4), 16) || 184;
    let b = parseInt(hex.substring(4, 6), 16) || 19;
    return {
        i: icon || "📘",
        c: hexColor,
        bg: `rgba(${r}, ${g}, ${b}, 0.16)`,
        border: `rgba(${r}, ${g}, ${b}, 0.65)`,
        glow: `rgba(${r}, ${g}, ${b}, 0.28)`
    };
}

const TOPIC_COLOR_PALETTE = [
    "#f43f5e", "#38bdf8", "#10b981", "#a855f7",
    "#f97316", "#06b6d4", "#ec4899", "#eab308",
    "#6366f1", "#14b8a6", "#84cc16", "#ef4444",
    "#3b82f6", "#d946ef", "#f59e0b", "#2dd4bf",
    "#fb7185", "#0ea5e9", "#22c55e", "#c084fc",
    "#fb923c", "#34d399", "#f472b6", "#facc15"
];

// Master Universal Fallback Pool (120+ distinct educational & thematic emojis)
const FALLBACK_TOPIC_ICONS = [
    "📘", "🧬", "⚛️", "🧪", "🌿", "📐", "🧠", "⚡",
    "🔬", "📖", "🎯", "💡", "📗", "📙", "📕", "🔭",
    "📊", "🚀", "🌡️", "🧲", "🔋", "🌱", "🫀", "🪐",
    "🧮", "📝", "🏅", "🎓", "🧭", "⚙️", "💎", "🌊",
    "🏺", "⚔️", "📜", "🏰", "👑", "🛡️", "🗺️", "🏔️",
    "🌋", "🏝️", "🌾", "🌲", "⚖️", "🗳️", "🏦", "💰",
    "💹", "🪙", "💻", "🖥️", "🤖", "📡", "🛰️", "🔦",
    "🧬", "🦠", "🧫", "🦋", "🦁", "🐾", "🦌", "🐼",
    "🌸", "🌺", "🌻", "🍀", "🪴", "🍎", "🫁", "🦴",
    "👁️", "💉", "💊", "🏥", "🧪", "⚗️", "🔥", "🧊",
    "💧", "🫧", "⛏️", "🧱", "🧶", "⛽", "🍷", "🍋",
    "🥖", "📏", "📈", "📉", "🎲", "🧩", "🎭", "🎨",
    "🎬", "🎵", "🎻", "🏆", "🥇", "🎖️", "📰", "🌐",
    "🏛️", "🕌", "🕍", "⛩️", "🗽", "🗼", "🎡", "🎢"
];

// Expanded Subject-Aware Pools for Unlimited Subtopics
const UNLIMITED_SUBJECT_ICON_POOLS = {
    physics:   ["⚛️", "⚡", "🧲", "🔭", "🔋", "💡", "🌊", "📡", "🚀", "⚙️", "🌡️", "🔦", "🛰️", "🧭", "🔌", "🌀", "🌈", "☢️", "🏎️", "🏹", "🎡", "🪐", "⏱️", "🔊", "⚖️", "📏", "🧱", "💨", "☀️", "💻", "📶", "🔬"],
    chemistry: ["🧪", "⚗️", "🧫", "🔥", "💎", "🫧", "🌡️", "⚛️", "🧊", "💧", "🔬", "💊", "⚖️", "🔗", "💨", "🔋", "⛏️", "🪙", "🍷", "🍋", "🧶", "⛽", "🥖", "🗓️", "🔄", "🌱", "🕸️", "⌬", "🍶", "🧴", "🧯", "💠"],
    botany:    ["🌿", "🌱", "🍃", "🌻", "🌲", "🌾", "🍀", "🌺", "🌴", "🪴", "🍄", "🌳", "🌸", "☀️", "💧", "🍎", "🦠", "🔬", "🧬", "🚜", "🌵", "🌷", "🌼", "🍁", "🍂", "🎍", "🌰", "🍍", "🥭", "🍓"],
    zoology:   ["🧬", "🫀", "🧠", "🦴", "🩸", "🦠", "🔬", "🦋", "🐾", "👁️", "🫁", "🩺", "🦁", "🐸", "👶", "🏥", "🛡️", "🦕", "🦌", "🐼", "🦅", "🦉", "🐝", "🐞", "🐢", "🐍", "🐬", "🐋", "🦈", "🐅", "🐘", "🦘"],
    math:      ["📐", "📏", "📊", "📈", "🧮", "♾️", "🔺", "💠", "📉", "🔢", "🎯", "🧩", "🔗", "🔀", "⭕", "🧊", "↗️", "⛰️", "🎛️", "🎲", "➕", "➖", "✖️", "➗", "🟰", "💯", "🔶", "🔷", "🔘", "🔳"],
    history:   ["🏺", "⚔️", "📜", "🏰", "👑", "🗿", "🕰️", "🛡️", "🎖️", "🏹", "🪙", "🏛️", "🗽", "🕌", "🕍", "⛩️", "🗡️", "⚱️", "🧭", "🚩", "📯", "🛞", "🪔", "🪪"],
    geography: ["🌍", "🗺️", "🏔️", "🌋", "🌊", "🧭", "🌦️", "🪐", "🏝️", "🌾", "🌲", "🌏", "🌎", "⛰️", "🏕️", "🏜️", "🏞️", "🌅", "🌄", "🌠", "🌪️", "🌈", "☀️", "🌙", "🪨", "🪵"],
    polity:    ["⚖️", "🏛️", "📜", "🗳️", "🇮🇳", "🔨", "🤝", "🛡️", "🌐", "📋", "👑", "🎖️", "🏢", "📢", "🔔", "🪪", "📑", "🖋️", "🕊️", "🗽"],
    economics: ["📈", "💰", "🏦", "📊", "💹", "🪙", "💳", "🌐", "🏭", "🧮", "💵", "💎", "⚖️", "🛒", "📦", "🚜", "🏗️", "🚢", "✈️", "⛽"],
    english:   ["📖", "✍️", "🔤", "🗣️", "📚", "📝", "💬", "🎭", "🖋️", "📓", "📕", "📗", "📘", "📙", "📜", "🎙️", "📰", "💌", "🏷️", "🔖"],
    computer:  ["💻", "🖥️", "🤖", "🌐", "🔐", "📡", "💾", "⚙️", "📱", "📶", "⌨️", "🖱️", "🖨️", "🕹️", "💿", "🔋", "🔌", "🛰️", "🧮", "📊"],
    boards:    ["🎓", "🏛️", "📘", "📗", "📙", "📕", "📚", "🏅", "🎖️", "🏫", "✍️", "📝", "🌟", "🧭", "🏆", "📖", "🔖", "📋", "🇮🇳", "🌐", "🏔️", "🌿", "🦏", "🐅", "🦚", "🪷", "🕌", "🕍", "🏰", "🌊", "🌴", "🌾", "🎭", "💎", "☀️", "🦁"],
    pdf:       ["📘", "📗", "📙", "📕", "📚", "📖", "📑", "📄", "📓", "🗂️", "📒", "📋", "📜", "🗞️", "🔖"],
    mcq:       ["📝", "🎯", "📋", "⚡", "🏆", "✍️", "🧠", "🏅", "✅", "🔥", "⏱️", "💡", "🚀", "🌟", "🥇"]
};

function getPaletteColorForText(text, offset = 0) {
    let str = String(text || "topic");
    let hash = 0;
    for (let idx = 0; idx < str.length; idx++) {
        hash = str.charCodeAt(idx) + ((hash << 5) - hash);
    }
    let index = (Math.abs(hash) + offset) % TOPIC_COLOR_PALETTE.length;
    return TOPIC_COLOR_PALETTE[index];
}

function isValidCustomEmojiIcon(customIcon, displayKey = "") {
    if (!customIcon || typeof customIcon !== "string") return false;
    let trimmed = customIcon.trim();
    if (!trimmed) return false;
    if (trimmed.toUpperCase() === "NONE") return true; // Explicit "No Icon" marker
    // Reject only legacy single-letter/number auto-initials like "B", "9", "10", "11", "12"
    if (/^[a-zA-Z0-9]{1,3}$/.test(trimmed)) return false;
    return true;
}

function formatCleanTopicTitle(rawText) {
    let str = String(rawText || "").replace(/^\d+\.\s*/, '').trim();
    return str.replace(/\bCLass\b/g, "Class").replace(/\bcLass\b/g, "Class");
}

// Complete Granular Icon Dictionary (Every subtopic, state, board & chapter has its own distinct icon)
const STUDY_ICON_RULES = [
    // 1. Difficulty Levels
    { keys: ["easy"], i: "🟢", c: "#10b981" },
    { keys: ["medium"], i: "🟡", c: "#eab308" },
    { keys: ["hard", "tough", "advanced level"], i: "🔴", c: "#f43f5e" },
    { keys: ["mixed", "all levels"], i: "⚡", c: "#a855f7" },

    // 2. Classes / Standards / Grades (Class 6 to Class 12)
    { keys: ["class 12", "12th class", "class xii", "grade 12", "hs 2nd year"], i: "📕", c: "#f43f5e" },
    { keys: ["class 11", "11th class", "class xi", "grade 11", "hs 1st year"], i: "📙", c: "#f97316" },
    { keys: ["class 10", "10th class", "class x", "grade 10", "hslc", "matric", "secondary"], i: "📘", c: "#38bdf8" },
    { keys: ["class 9", "9th class", "class ix", "grade 9"], i: "📗", c: "#10b981" },
    { keys: ["class 8", "8th class", "class viii", "grade 8"], i: "📓", c: "#a855f7" },
    { keys: ["class 7", "7th class", "class vii", "grade 7"], i: "📔", c: "#eab308" },
    { keys: ["class 6", "6th class", "class vi", "grade 6"], i: "🎒", c: "#06b6d4" },

    // 3. National & State Boards + All 28 Indian States & 8 UTs (Distinct icons for Board > Class -> State/Board)
    { keys: ["cbse", "central board"], i: "🏛️", c: "#38bdf8" },
    { keys: ["icse", "isc", "cisce"], i: "🎓", c: "#a855f7" },
    { keys: ["nios", "open school"], i: "🌐", c: "#06b6d4" },
    { keys: ["assam", "ahsec", "seba", "assam board", "assam gk", "assam history", "assam geography", "ahom", "brahmaputra", "kaziranga"], i: "🦏", c: "#10b981" },
    { keys: ["bihar", "bseb", "bihar board"], i: "🏺", c: "#f97316" },
    { keys: ["uttar pradesh", "up board", "upmsp"], i: "🕌", c: "#eab308" },
    { keys: ["maharashtra", "msbshse", "maharashtra board", "ssc board", "hsc board"], i: "🏰", c: "#f43f5e" },
    { keys: ["west bengal", "wbbse", "wbchse", "bengal board"], i: "🐅", c: "#38bdf8" },
    { keys: ["rajasthan", "rbse", "bser", "rajasthan board"], i: "🐪", c: "#f59e0b" },
    { keys: ["madhya pradesh", "mpbse", "mp board"], i: "🦌", c: "#22c55e" },
    { keys: ["tamil nadu", "tn board", "dge tn", "samacheer"], i: "🛕", c: "#ec4899" },
    { keys: ["kerala", "kerala board", "dhse", "kbpe"], i: "🌴", c: "#10b981" },
    { keys: ["karnataka", "kseab", "kseeb", "puc", "karnataka board"], i: "🐘", c: "#a855f7" },
    { keys: ["andhra pradesh", "ap board", "bseap", "bieap"], i: "💎", c: "#06b6d4" },
    { keys: ["telangana", "tsbie", "bset", "telangana board"], i: "🏛️", c: "#f97316" },
    { keys: ["gujarat", "gseb", "gshseb", "gujarat board"], i: "🦁", c: "#eab308" },
    { keys: ["punjab", "pseb", "punjab board"], i: "🌾", c: "#84cc16" },
    { keys: ["haryana", "hbse", "bseh", "haryana board"], i: "🏅", c: "#3b82f6" },
    { keys: ["odisha", "bse odisha", "chse odisha", "odisha board"], i: "🛞", c: "#f43f5e" },
    { keys: ["jharkhand", "jac", "jharkhand board"], i: "🌲", c: "#14b8a6" },
    { keys: ["chhattisgarh", "cgbse", "chhattisgarh board"], i: "🌿", c: "#22c55e" },
    { keys: ["himachal pradesh", "hpbose", "hp board"], i: "🏔️", c: "#38bdf8" },
    { keys: ["uttarakhand", "ubse", "uk board"], i: "⛰️", c: "#06b6d4" },
    { keys: ["jammu and kashmir", "jkbose", "jk board", "kashmir", "ladakh"], i: "❄️", c: "#6366f1" },
    { keys: ["goa", "gbshse", "goa board"], i: "🏖️", c: "#ec4899" },
    { keys: ["meghalaya", "mbose", "meghalaya board"], i: "🌧️", c: "#38bdf8" },
    { keys: ["manipur", "bsem", "cohsem", "manipur board"], i: "🪷", c: "#f43f5e" },
    { keys: ["tripura", "tbse", "tripura board"], i: "🎋", c: "#10b981" },
    { keys: ["nagaland", "nbse", "nagaland board"], i: "🦅", c: "#f97316" },
    { keys: ["mizoram", "mbse", "mizoram board"], i: "🏞️", c: "#14b8a6" },
    { keys: ["arunachal pradesh", "arunachal"], i: "🌅", c: "#eab308" },
    { keys: ["sikkim", "sikkim board"], i: "🌺", c: "#ec4899" },
    { keys: ["delhi", "dbse", "nct delhi"], i: "🇮🇳", c: "#f43f5e" },

    // 4. Study Materials, Books, Papers & Tests
    { keys: ["ncert book", "ncert", "textbook", "reference book", "ebook", "book"], i: "📚", c: "#a855f7" },
    { keys: ["pyqs", "pyq", "previous year", "past paper", "solved paper", "archive", "exam wise pyqs"], i: "📜", c: "#ec4899" },
    { keys: ["practice paper", "sample paper", "model paper", "question paper", "guess paper", "test paper"], i: "📋", c: "#38bdf8" },
    { keys: ["mock test", "mock", "grand test", "full test", "test series", "speed test", "part test"], i: "⏱️", c: "#f97316" },
    { keys: ["daily quiz challenge", "daily quiz", "daily challenge", "challenge"], i: "📅", c: "#fdb813" },
    { keys: ["formula sheet", "formulae", "formula", "cheat sheet", "handbook", "short trick"], i: "🧮", c: "#14b8a6" },
    { keys: ["mind map", "flowchart", "diagram", "infographic"], i: "🗺️", c: "#ec4899" },
    { keys: ["short notes", "revision notes", "handwritten notes", "lecture notes", "notes", "summary", "flashcard"], i: "📒", c: "#eab308" },
    { keys: ["syllabus", "blueprint", "curriculum", "weightage"], i: "📌", c: "#38bdf8" },
    { keys: ["mcqs practice", "mcq practice", "mcqs", "mcq", "practice", "quiz", "objective", "question bank", "dpp", "worksheet", "assignment"], i: "📝", c: "#06b6d4" },
    { keys: ["assertion", "reason", "statement based", "case study", "match the column"], i: "🔍", c: "#8b5cf6" },

    // 5. Root Exam Categories
    { keys: ["board", "boards", "board exam", "state board", "higher secondary"], i: "🎓", c: "#a855f7" },
    { keys: ["general knowledge", "general awareness", "general studies", "gk"], i: "🌍", c: "#10b981" },
    { keys: ["static gk", "evergreen facts", "superlatives", "first in india", "first in world", "important days"], i: "🌟", c: "#eab308" },
    { keys: ["regional gk", "state gk", "north east gk"], i: "🗺️", c: "#14b8a6" },
    { keys: ["neet ug", "neet pg", "neet", "aiims", "jipmer", "ssuhs", "paramedical", "medical entrance", "medical"], i: "🩺", c: "#f43f5e" },
    { keys: ["jee main", "jee advanced", "iit jee", "jee", "bitsat", "wbjee", "mht cet", "kcet", "cee", "vit", "engineering"], i: "🚀", c: "#38bdf8" },
    { keys: ["upsc", "civil services", "ias", "ips", "apsc", "state pcs", "psc", "adre"], i: "🏛️", c: "#eab308" },
    { keys: ["ssc cgl", "ssc chsl", "ssc mts", "ssc gd", "ssc", "staff selection"], i: "📋", c: "#06b6d4" },
    { keys: ["banking", "ibps", "sbi po", "sbi clerk", "rbi", "nabard"], i: "🏦", c: "#22c55e" },
    { keys: ["railway", "rrb ntpc", "rrb group d", "rrb"], i: "🚂", c: "#f59e0b" },
    { keys: ["defense", "defence", "nda", "cds", "afcat", "agniveer", "army", "navy", "air force"], i: "🛡️", c: "#f97316" },
    { keys: ["clat", "ailet", "judiciary", "llb", "legal studies"], i: "⚖️", c: "#a855f7" },
    { keys: ["gate", "csir net", "ugc net", "iit jam", "cuet", "cat", "mba", "ctet", "tet", "olympiad", "ntse", "kvpy", "bsc", "msc"], i: "🎖️", c: "#6366f1" },

    // 6. GRANULAR HISTORY SUBTOPICS (Fixes Ancient, Medieval, Modern India having the same icon!)
    { keys: ["ancient india", "ancient history", "indus valley", "harappa", "mohenjo daro", "vedic age", "rigveda", "mahajanapadas", "magadha", "maurya", "ashoka", "chandragupta", "gupta", "sangam age", "harshavardhana", "paleolithic", "neolithic", "chalcolithic", "stone age", "chola", "pallava", "chalukya", "rashtrakuta", "buddhism", "jainism"], i: "🏺", c: "#f59e0b" },
    { keys: ["medieval india", "medieval history", "delhi sultanate", "slave dynasty", "khilji", "tughlaq", "sayyid", "lodi", "mughal", "babur", "humayun", "akbar", "jahangir", "shah jahan", "aurangzeb", "vijayanagara", "bahmani", "maratha", "shivaji", "bhakti movement", "sufi", "rajput", "chauhans"], i: "⚔️", c: "#38bdf8" },
    { keys: ["modern india", "modern history", "freedom struggle", "indian national movement", "revolt of 1857", "1857", "gandhian era", "mahatma gandhi", "indian national congress", "british rule", "east india company", "governor general", "viceroy", "swadeshi", "non cooperation", "civil disobedience", "quit india", "subhas chandra bose", "ina", "bhagat singh", "revolutionary", "social reforms", "brahmo samaj", "arya samaj", "partition of india"], i: "📜", c: "#10b981" },
    { keys: ["world history", "french revolution", "russian revolution", "industrial revolution", "world war", "renaissance", "cold war", "american revolution", "unification"], i: "🌐", c: "#a855f7" },
    { keys: ["art", "culture", "heritage", "art and culture", "art culture", "classical dance", "folk dance", "music", "festivals", "temples", "unesco", "paintings", "architecture", "theatre", "martial arts", "handicrafts"], i: "🎭", c: "#ec4899" },
    { keys: ["books and authors", "autobiographies", "biographies", "famous books", "literature"], i: "📖", c: "#38bdf8" },
    { keys: ["history"], i: "🏛️", c: "#f97316" },

    // 7. GRANULAR GEOGRAPHY, POLITY, ECONOMY & GK SUBTOPICS
    { keys: ["physical geography", "geomorphology", "lithosphere", "landforms", "volcano", "earthquake", "rocks", "continents", "plate tectonics"], i: "🏔️", c: "#f97316" },
    { keys: ["climatology", "atmosphere", "climate", "monsoon", "winds", "cyclone", "humidity", "precipitation", "weather"], i: "🌦️", c: "#38bdf8" },
    { keys: ["oceanography", "oceans", "ocean currents", "tides", "coral reefs", "salinity", "hydrosphere", "straits"], i: "🌊", c: "#06b6d4" },
    { keys: ["rivers", "drainage system", "lakes", "waterfalls", "dams", "multipurpose projects"], i: "💧", c: "#3b82f6" },
    { keys: ["indian geography", "physiography of india", "himalayas", "northern plains", "peninsular plateau", "coastal plains", "islands", "passes"], i: "🗺️", c: "#10b981" },
    { keys: ["world geography", "solar system", "universe", "astronomy", "planets", "earth", "latitudes", "longitudes", "time zones", "eclipse"], i: "🪐", c: "#a855f7" },
    { keys: ["soils", "agriculture", "crops", "minerals", "industries", "transport", "census", "demographics", "tribes", "human geography"], i: "🌾", c: "#eab308" },
    { keys: ["geography", "environment", "atlas"], i: "🌍", c: "#10b981" },

    { keys: ["constitutional framework", "making of constitution", "constituent assembly", "preamble", "salient features", "schedules", "parts of constitution", "sources of constitution"], i: "📜", c: "#eab308" },
    { keys: ["fundamental rights", "directive principles", "dpsp", "fundamental duties", "citizenship", "writs", "amendments", "basic structure"], i: "🛡️", c: "#f43f5e" },
    { keys: ["parliament", "lok sabha", "rajya sabha", "president", "vice president", "prime minister", "council of ministers", "cabinet", "union executive", "legislature"], i: "🏛️", c: "#38bdf8" },
    { keys: ["supreme court", "high court", "judiciary", "judicial review", "pil", "tribunals", "attorney general", "advocate general"], i: "⚖️", c: "#a855f7" },
    { keys: ["state government", "governor", "chief minister", "state legislature", "vidhan sabha", "vidhan parishad", "centre state relations", "federalism", "emergency provisions"], i: "🏢", c: "#f97316" },
    { keys: ["panchayati raj", "municipalities", "local government", "73rd amendment", "74th amendment", "gram sabha"], i: "🤝", c: "#10b981" },
    { keys: ["constitutional bodies", "non constitutional bodies", "election commission", "upsc", "cag", "finance commission", "niti aayog", "nhrc", "cvc", "lokpal", "rti"], i: "🗳️", c: "#06b6d4" },
    { keys: ["polity", "indian polity", "constitution", "governance", "civics"], i: "⚖️", c: "#a855f7" },

    { keys: ["national income", "gdp", "gnp", "nnp", "economic growth", "economic development", "sectors of economy"], i: "📈", c: "#10b981" },
    { keys: ["money and banking", "rbi", "monetary policy", "repo rate", "commercial banks", "npas", "financial market", "stock market", "sebi", "inflation"], i: "🏦", c: "#38bdf8" },
    { keys: ["budget", "fiscal policy", "taxation", "gst", "direct tax", "indirect tax", "finance", "deficit", "public debt"], i: "💰", c: "#eab308" },
    { keys: ["economic planning", "five year plans", "poverty", "unemployment", "inclusive growth", "government schemes", "welfare schemes"], i: "📊", c: "#a855f7" },
    { keys: ["balance of payments", "foreign trade", "fdi", "exchange rate", "wto", "imf", "world bank", "international organizations"], i: "💹", c: "#06b6d4" },
    { keys: ["economics", "indian economy", "economy", "macroeconomics", "microeconomics", "commerce", "accountancy"], i: "🪙", c: "#22c55e" },

    { keys: ["current affairs", "daily news", "national affairs", "international affairs", "summits", "appointments", "obituaries"], i: "📰", c: "#38bdf8" },
    { keys: ["awards and honours", "awards", "nobel prize", "bharat ratna", "padma awards", "gallantry", "oscar", "grammy", "dadasaheb"], i: "🏆", c: "#fdb813" },
    { keys: ["sports", "cricket", "olympics", "commonwealth", "asian games", "football", "tennis", "trophies", "cups", "stadiums"], i: "🏅", c: "#10b981" },
    { keys: ["defence", "military exercises", "missiles", "drdo", "isro", "space technology", "satellites", "nuclear programme"], i: "🛰️", c: "#f43f5e" },
    { keys: ["general science", "everyday science", "inventions", "discoveries", "scientific instruments"], i: "🔬", c: "#84cc16" },

    // 8. NEET & NCERT Biology Chapters (Botany & Zoology - Class 11 & 12)
    { keys: ["the living world", "living world", "taxonomy", "systematics", "binomial nomenclature", "taxonomic", "herbarium"], i: "🌿", c: "#10b981" },
    { keys: ["biological classification", "monera", "protista", "fungi", "virus", "viroids", "prions", "lichens", "five kingdom", "archaebacteria", "eubacteria", "cyanobacteria", "mycoplasma", "protozoans"], i: "🦠", c: "#84cc16" },
    { keys: ["plant kingdom", "algae", "bryophytes", "bryophyta", "pteridophytes", "pteridophyta", "gymnosperms", "angiosperms", "chlorophyceae", "phaeophyceae", "rhodophyceae", "liverworts", "mosses"], i: "🌱", c: "#22c55e" },
    { keys: ["animal kingdom", "basis of classification", "porifera", "coelenterata", "cnidaria", "ctenophora", "platyhelminthes", "aschelminthes", "annelida", "arthropoda", "mollusca", "echinodermata", "hemichordata", "chordata", "vertebrata", "non chordates", "chordates", "amphibia", "reptilia", "aves", "mammalia"], i: "🦁", c: "#f59e0b" },
    { keys: ["morphology of flowering plants", "morphology", "inflorescence", "placentation", "aestivation", "fabaceae", "solanaceae", "liliaceae", "brassicaceae", "root system", "shoot system", "venation", "phyllotaxy", "floral formula"], i: "🌸", c: "#ec4899" },
    { keys: ["anatomy of flowering plants", "meristematic", "permanent tissue", "vascular bundle", "dicot", "monocot", "secondary growth", "plant anatomy", "parenchyma", "collenchyma", "sclerenchyma", "xylem", "phloem", "stomata", "cambium"], i: "🍃", c: "#10b981" },
    { keys: ["structural organisation in animals", "animal tissues", "epithelial", "connective tissue", "muscular tissue", "cockroach", "periplaneta", "frog", "rana tigrina", "earthworm", "pheretima", "adipose", "tendon", "ligament", "cartilage"], i: "🐸", c: "#84cc16" },
    { keys: ["cell the unit of life", "cell structure", "prokaryotic cell", "eukaryotic cell", "endomembrane", "mitochondria", "plastids", "ribosomes", "cytoskeleton", "cilia", "flagella", "centrosome", "vacuole", "cell organelle", "cell biology", "cytology", "plasma membrane", "cell wall", "golgi", "lysosomes", "nucleus"], i: "🔬", c: "#06b6d4" },
    { keys: ["cell cycle and cell division", "cell cycle", "cell division", "mitosis", "meiosis", "interphase", "cytokinesis", "karyokinesis", "prophase", "metaphase", "anaphase", "telophase", "crossing over", "chiasmata"], i: "🔄", c: "#ec4899" },
    { keys: ["transport in plants", "water potential", "osmosis", "plasmolysis", "imbibition", "transpiration", "guttation", "phloem transport", "mass flow", "apoplast", "symplast", "root pressure"], i: "💧", c: "#38bdf8" },
    { keys: ["mineral nutrition", "macronutrients", "micronutrients", "nitrogen cycle", "nitrogen fixation", "nodule", "hydroponics", "chlorosis", "necrosis", "nitrification", "denitrification"], i: "🌾", c: "#eab308" },
    { keys: ["photosynthesis in higher plants", "photosynthesis", "chloroplast", "light reaction", "photophosphorylation", "calvin cycle", "c3 pathway", "c4 pathway", "hatch and slack", "photorespiration", "cam plants", "chlorophyll", "photosystem", "rubisco", "kranz anatomy"], i: "☀️", c: "#22c55e" },
    { keys: ["respiration in plants", "cellular respiration", "glycolysis", "emp pathway", "fermentation", "krebs cycle", "tca cycle", "electron transport system", "oxidative phosphorylation", "amphibolic", "respiratory quotient"], i: "🍃", c: "#14b8a6" },
    { keys: ["plant growth and development", "plant growth", "phytohormones", "plant hormones", "auxin", "gibberellin", "cytokinin", "ethylene", "abscisic acid", "photoperiodism", "vernalisation", "seed dormancy", "apical dominance"], i: "🌻", c: "#f59e0b" },
    { keys: ["digestion and absorption", "digestive system", "alimentary canal", "digestive glands", "peristalsis", "malnutrition", "vitamins", "dentition", "gastric", "bile", "villi"], i: "🍎", c: "#f97316" },
    { keys: ["breathing and exchange of gases", "respiratory system", "human respiration", "lungs", "alveoli", "spirometry", "lung volumes", "oxygen dissociation", "bohr effect", "haldane effect", "tidal volume", "vital capacity", "trachea", "diaphragm", "asthma"], i: "🫁", c: "#38bdf8" },
    { keys: ["body fluids and circulation", "blood groups", "rh factor", "coagulation", "lymph", "circulatory pathways", "human heart", "cardiac cycle", "cardiac output", "electrocardiograph", "ecg", "double circulation", "erythrocytes", "leucocytes", "platelets", "pacemaker"], i: "🫀", c: "#ef4444" },
    { keys: ["excretory products and their elimination", "excretory system", "ammonotelism", "ureotelism", "uricotelism", "human kidney", "nephron", "urine formation", "counter current", "raas", "hemodialysis", "micturition", "glomerular", "gfr", "bowman", "henle"], i: "🫘", c: "#f43f5e" },
    { keys: ["locomotion and movement", "types of movement", "skeletal muscle", "contractile proteins", "actin", "myosin", "sliding filament", "skeletal system", "axial skeleton", "appendicular skeleton", "joints", "muscular disorders", "sarcomere", "cranium", "vertebrae", "ribs", "synovial"], i: "🦴", c: "#eab308" },
    { keys: ["neural control and coordination", "nervous system", "neuron", "nerve impulse", "synapse", "central nervous system", "human brain", "forebrain", "midbrain", "hindbrain", "spinal cord", "reflex action", "human eye", "human ear", "cerebrum", "thalamus", "cerebellum", "medulla", "retina", "cochlea"], i: "🧠", c: "#a855f7" },
    { keys: ["chemical coordination and integration", "endocrine system", "endocrine glands", "pituitary", "pineal", "thyroid", "parathyroid", "thymus", "adrenal", "pancreas", "insulin", "glucagon", "testis", "ovary", "hormone action", "oxytocin", "vasopressin", "melatonin", "thyroxine", "adrenaline", "cortisol"], i: "💉", c: "#d946ef" },
    { keys: ["reproduction in organisms", "asexual reproduction", "vegetative propagation", "sexual reproduction", "life span", "binary fission", "budding"], i: "🌱", c: "#10b981" },
    { keys: ["sexual reproduction in flowering plants", "microsporogenesis", "pollen grain", "megasporogenesis", "embryo sac", "pollination", "outbreeding", "pollen pistil", "double fertilisation", "endosperm", "embryogeny", "apomixis", "polyembryony", "tapetum", "sporopollenin"], i: "🌺", c: "#ec4899" },
    { keys: ["human reproduction", "male reproductive", "female reproductive", "gametogenesis", "spermatogenesis", "oogenesis", "menstrual cycle", "fertilisation", "implantation", "placenta", "pregnancy", "embryonic development", "parturition", "lactation", "sertoli", "leydig", "acrosome", "graafian", "corpus luteum", "blastocyst"], i: "👶", c: "#f43f5e" },
    { keys: ["reproductive health", "birth control", "contraception", "iud", "medical termination", "mtp", "sexually transmitted", "std", "infertility", "assisted reproductive technology", "ivf", "zift", "gift", "amniocentesis", "vasectomy", "tubectomy"], i: "🏥", c: "#06b6d4" },
    { keys: ["principles of inheritance and variation", "mendel", "monohybrid", "dihybrid", "incomplete dominance", "codominance", "multiple alleles", "pleiotropy", "polygenic", "chromosomal theory", "linkage", "recombination", "sex determination", "mutation", "pedigree", "mendelian disorders", "hemophilia", "sickle cell", "thalassemia", "down syndrome", "klinefelter", "turner syndrome", "genetics", "inheritance", "genes", "gene"], i: "🧬", c: "#f43f5e" },
    { keys: ["molecular basis of inheritance", "dna structure", "polynucleotide", "packaging of dna", "nucleosome", "transforming principle", "hershey and chase", "rna world", "dna replication", "meselson and stahl", "transcription", "genetic code", "trna", "translation", "gene expression", "lac operon", "human genome project", "dna fingerprinting", "dna", "rna", "codon", "operon"], i: "🧬", c: "#a855f7" },
    { keys: ["evolution", "origin of life", "miller experiment", "darwin", "natural selection", "homologous", "analogous", "adaptive radiation", "hardy weinberg", "genetic drift", "founder effect", "human evolution"], i: "🦕", c: "#f59e0b" },
    { keys: ["human health and disease", "common diseases", "typhoid", "pneumonia", "common cold", "malaria", "plasmodium", "amoebiasis", "ascariasis", "filariasis", "ringworm", "immunity", "innate immunity", "acquired immunity", "antibodies", "vaccination", "allergies", "auto immunity", "lymphoid organs", "aids", "hiv", "cancer", "oncogenes", "drug abuse", "adolescence"], i: "🛡️", c: "#ef4444" },
    { keys: ["strategies for enhancement in food production", "animal husbandry", "dairy", "poultry", "inbreeding", "outbreeding", "moet", "apiculture", "fisheries", "plant breeding", "green revolution", "biofortification", "single cell protein", "tissue culture", "somatic hybridisation"], i: "🚜", c: "#84cc16" },
    { keys: ["microbes in human welfare", "microbes in household", "lactic acid", "fermented", "antibiotics", "penicillin", "organic acids", "cyclosporin", "statins", "sewage treatment", "bod", "biogas", "methanogens", "biocontrol", "biofertilisers", "mycorrhiza"], i: "🧫", c: "#14b8a6" },
    { keys: ["biotechnology principles and processes", "genetic engineering", "restriction enzymes", "endonuclease", "gel electrophoresis", "cloning vectors", "plasmid", "pbr322", "competent host", "pcr", "polymerase chain reaction", "bioreactor", "downstream processing", "recombinant dna"], i: "🧪", c: "#06b6d4" },
    { keys: ["biotechnology and its applications", "bt cotton", "cry genes", "pest resistant", "rna interference", "genetically engineered insulin", "humulin", "gene therapy", "ada deficiency", "molecular diagnosis", "elisa", "transgenic animals", "ethical issues", "geac", "biopiracy", "biotechnology"], i: "🔬", c: "#38bdf8" },
    { keys: ["organisms and populations", "abiotic factors", "homeostasis", "conformers", "regulators", "migration", "hibernation", "adaptations", "population attributes", "age pyramid", "exponential growth", "logistic growth", "population interactions", "predation", "competition", "parasitism", "commensalism", "mutualism", "amensalism"], i: "🦌", c: "#f97316" },
    { keys: ["ecosystem", "stratification", "productivity", "gpp", "npp", "decomposition", "detritus", "energy flow", "food chain", "food web", "trophic level", "ecological pyramids", "ecological succession", "hydrarch", "xerarch", "nutrient cycling", "carbon cycle", "phosphorus cycle", "ecosystem services"], i: "🌲", c: "#10b981" },
    { keys: ["biodiversity and conservation", "genetic diversity", "species diversity", "ecological diversity", "latitudinal gradients", "species area relationship", "rivet popper", "loss of biodiversity", "evil quartet", "in situ conservation", "biosphere reserve", "national park", "sacred groves", "hotspots", "ex situ conservation", "cryopreservation", "red data book"], i: "🐼", c: "#22c55e" },
    { keys: ["environmental issues", "air pollution", "electrostatic precipitator", "scrubber", "catalytic converter", "cng", "water pollution", "algal bloom", "eutrophication", "biomagnification", "solid wastes", "radioactive waste", "greenhouse effect", "global warming", "ozone depletion", "deforestation", "chipko", "jfm"], i: "🌏", c: "#0ea5e9" },
    { keys: ["botany", "plant physiology", "plant science"], i: "🌿", c: "#22c55e" },
    { keys: ["zoology", "human physiology", "animal science"], i: "🦁", c: "#f59e0b" },
    { keys: ["biology", "life sciences", "bioscience"], i: "🧬", c: "#f43f5e" },

    // 9. NEET & JEE Physics Chapters (Class 11 & 12)
    { keys: ["physical world", "units and measurements", "units and dimensions", "dimensional analysis", "significant figures", "errors in measurement", "vernier callipers", "screw gauge", "measurement"], i: "📏", c: "#38bdf8" },
    { keys: ["motion in a straight line", "rectilinear motion", "kinematics", "distance and displacement", "relative velocity", "graphs of motion"], i: "🏎️", c: "#06b6d4" },
    { keys: ["motion in a plane", "projectile motion", "uniform circular motion", "vectors", "vector addition", "relative motion in 2d"], i: "🏹", c: "#10b981" },
    { keys: ["laws of motion", "newton laws", "inertia", "impulse", "conservation of momentum", "friction", "static friction", "kinetic friction", "banking of roads", "free body diagram", "pulley", "pseudo force"], i: "⚙️", c: "#f43f5e" },
    { keys: ["work energy and power", "work energy theorem", "conservative force", "potential energy", "vertical circular motion", "collisions", "elastic collision", "inelastic collision", "coefficient of restitution"], i: "⚡", c: "#eab308" },
    { keys: ["system of particles and rotational motion", "rotational motion", "centre of mass", "center of mass", "torque", "angular momentum", "moment of inertia", "parallel axis", "perpendicular axis", "radius of gyration", "rolling motion", "rigid body"], i: "🎡", c: "#a855f7" },
    { keys: ["gravitation", "kepler laws", "universal law of gravitation", "acceleration due to gravity", "gravitational potential", "escape velocity", "orbital velocity", "satellites", "geostationary", "weightlessness"], i: "🪐", c: "#6366f1" },
    { keys: ["mechanical properties of solids", "elasticity", "stress and strain", "hooke law", "young modulus", "bulk modulus", "shear modulus", "poisson ratio", "elastic potential energy"], i: "🧱", c: "#f97316" },
    { keys: ["mechanical properties of fluids", "fluid mechanics", "pascal law", "buoyancy", "archimedes", "streamline", "equation of continuity", "bernoulli theorem", "torricelli", "viscosity", "stokes law", "terminal velocity", "reynolds number", "surface tension", "capillarity", "excess pressure"], i: "🌊", c: "#0ea5e9" },
    { keys: ["thermal properties of matter", "thermometry", "thermal expansion", "calorimetry", "specific heat", "latent heat", "heat transfer", "thermal conduction", "convection", "radiation", "stefan law", "wien displacement", "newton law of cooling"], i: "🌡️", c: "#ef4444" },
    { keys: ["thermodynamics", "zeroth law", "first law of thermodynamics", "isothermal", "adiabatic", "isobaric", "isochoric", "heat engine", "refrigerator", "carnot engine", "second law of thermodynamics", "entropy"], i: "🔥", c: "#f97316" },
    { keys: ["kinetic theory", "kinetic theory of gases", "ideal gas", "rms speed", "degrees of freedom", "law of equipartition", "mean free path"], i: "💨", c: "#14b8a6" },
    { keys: ["oscillations", "simple harmonic motion", "shm", "simple pendulum", "spring mass", "damped oscillations", "forced oscillations"], i: "⏱️", c: "#ec4899" },
    { keys: ["waves", "wave motion", "transverse wave", "longitudinal wave", "speed of sound", "laplace correction", "superposition", "standing waves", "organ pipe", "sonometer", "beats", "doppler effect", "acoustics"], i: "🔊", c: "#06b6d4" },
    { keys: ["electric charges and fields", "electrostatics", "coulomb law", "electric field", "electric dipole", "electric flux", "gauss law"], i: "⚡", c: "#eab308" },
    { keys: ["electrostatic potential and capacitance", "electric potential", "equipotential", "dielectrics", "capacitors", "parallel plate capacitor", "van de graaff", "capacitance"], i: "🔋", c: "#10b981" },
    { keys: ["current electricity", "drift velocity", "mobility", "ohm law", "resistivity", "colour code", "combination of resistors", "emf", "internal resistance", "kirchhoff laws", "wheatstone bridge", "meter bridge", "potentiometer"], i: "🔌", c: "#f59e0b" },
    { keys: ["moving charges and magnetism", "magnetic effect of current", "biot savart law", "ampere circuital law", "solenoid", "toroid", "lorentz force", "cyclotron", "moving coil galvanometer", "ammeter", "voltmeter"], i: "🧲", c: "#ef4444" },
    { keys: ["magnetism and matter", "bar magnet", "earth magnetism", "magnetic declination", "angle of dip", "diamagnetic", "paramagnetic", "ferromagnetic", "hysteresis", "curie law"], i: "🧭", c: "#f43f5e" },
    { keys: ["electromagnetic induction", "magnetic flux", "faraday law", "lenz law", "motional emf", "eddy currents", "self induction", "mutual induction", "inductance"], i: "🌀", c: "#8b5cf6" },
    { keys: ["alternating current", "rms current", "phasor", "lcr circuit", "resonance", "power factor", "wattless current", "lc oscillations", "transformer", "ac generator"], i: "〰️", c: "#38bdf8" },
    { keys: ["electromagnetic waves", "displacement current", "maxwell equations", "electromagnetic spectrum", "em waves"], i: "📡", c: "#ec4899" },
    { keys: ["ray optics and optical instruments", "ray optics", "geometrical optics", "reflection", "spherical mirror", "refraction", "total internal reflection", "optical fibre", "lens maker formula", "prism", "dispersion", "microscope", "telescope", "optical instruments"], i: "🔭", c: "#06b6d4" },
    { keys: ["wave optics", "huygens principle", "coherent sources", "interference", "young double slit", "ydse", "diffraction", "resolving power", "polarization", "brewster law", "malus law"], i: "🌈", c: "#a855f7" },
    { keys: ["dual nature of radiation and matter", "dual nature", "photoelectric effect", "einstein photoelectric", "matter waves", "de broglie", "davisson and germer"], i: "💡", c: "#eab308" },
    { keys: ["atoms", "alpha particle scattering", "rutherford model", "bohr model", "hydrogen spectrum", "lyman", "balmer", "moseley law"], i: "⚛️", c: "#38bdf8" },
    { keys: ["nuclei", "nuclear physics", "mass defect", "binding energy", "nuclear force", "radioactivity", "half life", "mean life", "alpha decay", "beta decay", "gamma decay", "nuclear fission", "nuclear fusion"], i: "☢️", c: "#84cc16" },
    { keys: ["semiconductor electronics", "semiconductors", "energy bands", "intrinsic", "extrinsic", "pn junction", "semiconductor diode", "rectifier", "zener diode", "photodiode", "led", "solar cell", "transistor", "logic gates", "boolean algebra", "digital electronics"], i: "💻", c: "#10b981" },
    { keys: ["communication systems", "modulation", "amplitude modulation", "propagation of electromagnetic waves", "bandwidth"], i: "📶", c: "#6366f1" },
    { keys: ["experimental skills", "practical physics"], i: "🔬", c: "#14b8a6" },
    { keys: ["physics", "mechanics", "electrodynamics", "modern physics", "optics"], i: "⚛️", c: "#a855f7" },

    // 10. NEET & JEE Chemistry Chapters (Physical, Organic & Inorganic - Class 11 & 12)
    { keys: ["some basic concepts of chemistry", "mole concept", "stoichiometry", "limiting reagent", "empirical formula", "molarity", "molality", "normality", "equivalent weight"], i: "⚖️", c: "#06b6d4" },
    { keys: ["structure of atom", "atomic structure", "subatomic particles", "planck quantum", "bohr theory", "heisenberg uncertainty", "schrodinger", "quantum numbers", "aufbau", "pauli exclusion", "hund rule", "electronic configuration"], i: "⚛️", c: "#a855f7" },
    { keys: ["classification of elements and periodicity", "periodic table", "periodic properties", "atomic radius", "ionization enthalpy", "electron gain enthalpy", "electronegativity"], i: "🗓️", c: "#ec4899" },
    { keys: ["chemical bonding and molecular structure", "chemical bonding", "kossel lewis", "ionic bond", "lattice enthalpy", "fajan rule", "vsepr theory", "valence bond theory", "hybridisation", "molecular orbital theory", "bond order", "hydrogen bonding", "dipole moment"], i: "🔗", c: "#38bdf8" },
    { keys: ["states of matter", "gaseous state", "boyle law", "charles law", "avogadro law", "dalton law", "graham law", "van der waals", "compressibility factor", "liquefaction"], i: "💨", c: "#14b8a6" },
    { keys: ["chemical thermodynamics", "internal energy", "enthalpy", "hess law", "bond dissociation", "born haber", "spontaneity", "gibbs energy", "thermochemistry"], i: "🔥", c: "#f97316" },
    { keys: ["equilibrium", "chemical equilibrium", "law of mass action", "le chatelier", "ionic equilibrium", "arrhenius", "bronsted lowry", "lewis acid", "ph scale", "common ion effect", "buffer solutions", "salt hydrolysis", "solubility product"], i: "⚖️", c: "#eab308" },
    { keys: ["redox reactions", "oxidation number", "oxidising agent", "reducing agent", "balancing redox", "disproportionation"], i: "🔄", c: "#10b981" },
    { keys: ["hydrogen", "isotopes of hydrogen", "hydrides", "hard and soft water", "heavy water", "hydrogen peroxide"], i: "💧", c: "#38bdf8" },
    { keys: ["s block elements", "alkali metals", "alkaline earth metals", "diagonal relationship", "sodium carbonate", "sodium hydroxide", "plaster of paris", "cement"], i: "🧱", c: "#f43f5e" },
    { keys: ["p block elements", "boron family", "borax", "diborane", "carbon family", "allotropes of carbon", "silicones", "zeolites", "nitrogen family", "ammonia", "nitric acid", "phosphorus", "oxygen family", "ozone", "sulphuric acid", "halogens", "interhalogen", "noble gases", "xenon compounds"], i: "💎", c: "#a855f7" },
    { keys: ["organic chemistry some basic principles", "general organic chemistry", "goc", "iupac nomenclature", "isomerism", "structural isomerism", "stereoisomerism", "geometrical isomerism", "optical isomerism", "chirality", "inductive effect", "electromeric", "resonance", "mesomeric", "hyperconjugation", "carbocation", "carbanion", "free radical", "electrophile", "nucleophile", "purification of organic", "lassaigne", "dumas", "kjeldahl", "carius", "reaction mechanism"], i: "⌬", c: "#10b981" },
    { keys: ["hydrocarbons", "alkanes", "conformations", "newman", "wurtz", "alkenes", "markovnikov", "ozonolysis", "alkynes", "aromatic hydrocarbons", "benzene", "huckel rule", "electrophilic substitution", "friedel crafts"], i: "⛽", c: "#f59e0b" },
    { keys: ["environmental chemistry", "tropospheric", "stratospheric", "acid rain", "photochemical smog", "green chemistry"], i: "🌱", c: "#22c55e" },
    { keys: ["solid state", "crystalline", "amorphous", "unit cell", "bravais", "packing efficiency", "voids", "radius ratio", "schottky defect", "frenkel defect"], i: "🧊", c: "#38bdf8" },
    { keys: ["solutions", "henry law", "raoult law", "ideal and non ideal", "azeotropes", "colligative properties", "relative lowering", "elevation of boiling", "depression of freezing", "osmotic pressure", "van t hoff factor"], i: "🧪", c: "#06b6d4" },
    { keys: ["electrochemistry", "galvanic cell", "daniell cell", "standard electrode potential", "nernst equation", "molar conductivity", "kohlrausch law", "electrolysis", "faraday laws", "batteries", "fuel cell", "corrosion"], i: "🔋", c: "#eab308" },
    { keys: ["chemical kinetics", "rate of a reaction", "order and molecularity", "integrated rate equations", "zero order", "first order", "half life", "pseudo first order", "arrhenius equation", "activation energy", "collision theory"], i: "⏱️", c: "#f43f5e" },
    { keys: ["surface chemistry", "adsorption", "physisorption", "chemisorption", "freundlich", "catalysis", "colloids", "tyndall effect", "brownian movement", "zeta potential", "coagulation", "hardy schulze", "gold number", "emulsions", "micelles"], i: "🫧", c: "#14b8a6" },
    { keys: ["isolation of elements", "metallurgy", "concentration of ores", "froth floatation", "leaching", "calcination", "roasting", "ellingham diagram", "blast furnace", "electrolytic refining", "zone refining", "mond process", "van arkel"], i: "⛏️", c: "#f97316" },
    { keys: ["d and f block elements", "transition elements", "interstitial compounds", "potassium dichromate", "potassium permanganate", "lanthanoids", "lanthanoid contraction", "actinoids"], i: "🪙", c: "#eab308" },
    { keys: ["coordination compounds", "werner theory", "ligands", "chelation", "coordination number", "iupac of coordination", "crystal field theory", "cft", "spectrochemical series", "metal carbonyls"], i: "🕸️", c: "#8b5cf6" },
    { keys: ["haloalkanes and haloarenes", "alkyl halides", "aryl halides", "sn1", "sn2", "walden inversion", "saytzeff", "grignard reagent", "finkelstein", "swarts", "sandmeyer", "ddt", "freons", "chloroform"], i: "🧪", c: "#10b981" },
    { keys: ["alcohols phenols and ethers", "alcohols", "phenols", "ethers", "lucas test", "kolbe reaction", "reimer tiemann", "williamson synthesis"], i: "🍷", c: "#ec4899" },
    { keys: ["aldehydes ketones and carboxylic acids", "aldehydes", "ketones", "carboxylic acids", "carbonyl compounds", "rosenmund", "stephen", "etard", "gatterman koch", "clemmensen", "wolff kishner", "tollens", "fehling", "haloform", "aldol condensation", "cannizzaro", "hvz reaction"], i: "🍋", c: "#f59e0b" },
    { keys: ["amines", "diazonium salts", "gabriel phthalimide", "hoffmann bromamide", "carbylamine", "hinsberg", "coupling reaction", "nitrogen containing organic"], i: "🧬", c: "#06b6d4" },
    { keys: ["biomolecules", "carbohydrates", "monosaccharides", "glucose", "fructose", "disaccharides", "polysaccharides", "amino acids", "peptide bond", "structure of proteins", "denaturation", "enzymes", "nucleic acids"], i: "🥖", c: "#14b8a6" },
    { keys: ["polymers", "addition polymer", "condensation polymer", "polythene", "teflon", "pan", "nylon", "terylene", "dacron", "bakelite", "melamine", "vulcanisation", "neoprene", "buna", "biodegradable polymers", "phbv"], i: "🧶", c: "#a855f7" },
    { keys: ["chemistry in everyday life", "drugs and medicines", "antacids", "antihistamines", "tranquilizers", "analgesics", "antibiotics", "antiseptics", "disinfectants", "antifertility", "artificial sweeteners", "soaps and detergents"], i: "💊", c: "#f43f5e" },
    { keys: ["practical chemistry", "salt analysis", "qualitative analysis", "volumetric analysis", "titration", "functional group test"], i: "🔬", c: "#38bdf8" },
    { keys: ["organic chemistry"], i: "⌬", c: "#10b981" },
    { keys: ["inorganic chemistry"], i: "💎", c: "#ec4899" },
    { keys: ["physical chemistry", "chemistry"], i: "🧪", c: "#06b6d4" },

    // 11. JEE & Board Mathematics Chapters (Class 9 to 12)
    { keys: ["sets relations and functions", "sets", "relations and functions", "venn diagrams", "domain and range", "equivalence relation", "bijective", "composition of functions"], i: "🔗", c: "#38bdf8" },
    { keys: ["trigonometric functions", "inverse trigonometric functions", "trigonometry", "trigonometric equations", "heights and distances", "properties of triangles", "sine rule", "cosine rule"], i: "📐", c: "#06b6d4" },
    { keys: ["complex numbers and quadratic equations", "complex numbers", "argand plane", "modulus and argument", "de moivre", "cube roots of unity", "quadratic equations", "nature of roots"], i: "🔢", c: "#a855f7" },
    { keys: ["linear inequalities", "linear programming", "lpp", "feasible region"], i: "📊", c: "#14b8a6" },
    { keys: ["permutations and combinations", "permutation", "combination", "fundamental principle of counting", "circular permutation", "derangement"], i: "🔀", c: "#f97316" },
    { keys: ["binomial theorem", "mathematical induction", "general and middle term", "multinomial"], i: "🧮", c: "#eab308" },
    { keys: ["sequences and series", "arithmetic progression", "geometric progression", "harmonic progression", "agp", "am gm"], i: "📈", c: "#10b981" },
    { keys: ["straight lines", "pair of straight lines", "slope of a line", "angle between two lines", "distance of a point", "concurrency", "locus", "coordinate geometry"], i: "📏", c: "#3b82f6" },
    { keys: ["conic sections", "circles", "circle", "parabola", "ellipse", "hyperbola", "eccentricity", "latus rectum", "chord of contact", "director circle"], i: "⭕", c: "#ec4899" },
    { keys: ["three dimensional geometry", "3d geometry", "direction cosines", "direction ratios", "equation of a line in space", "equation of a plane", "shortest distance", "skew lines", "coplanarity"], i: "🧊", c: "#6366f1" },
    { keys: ["vector algebra", "scalar product", "dot product", "vector product", "cross product", "scalar triple product", "vector triple product"], i: "↗️", c: "#22c55e" },
    { keys: ["limits and derivatives", "continuity and differentiability", "limits", "continuity", "differentiability", "l hospital", "rolle theorem", "mean value theorem", "chain rule", "logarithmic differentiation", "parametric differentiation"], i: "📉", c: "#f43f5e" },
    { keys: ["applications of derivatives", "rate of change", "increasing and decreasing", "monotonicity", "tangents and normals", "approximations", "maxima and minima"], i: "⛰️", c: "#f59e0b" },
    { keys: ["integrals", "indefinite integrals", "definite integrals", "integration by substitution", "integration by parts", "partial fractions", "properties of definite integrals", "leibniz rule", "calculus"], i: "∫", c: "#6366f1" },
    { keys: ["applications of integrals", "area under curves", "area bounded by curves", "quadrature"], i: "📐", c: "#10b981" },
    { keys: ["differential equations", "order and degree", "variable separable", "homogeneous differential", "linear differential equation", "integrating factor"], i: "〰️", c: "#a855f7" },
    { keys: ["matrices", "determinants", "matrix", "determinant", "transpose", "symmetric", "skew symmetric", "adjoint", "inverse of a matrix", "cramer rule", "cayley hamilton"], i: "🎛️", c: "#38bdf8" },
    { keys: ["probability", "conditional probability", "multiplication theorem", "independent events", "bayes theorem", "random variable", "probability distribution", "bernoulli trials", "binomial distribution"], i: "🎲", c: "#ec4899" },
    { keys: ["statistics", "measures of dispersion", "range", "mean deviation", "variance", "standard deviation"], i: "📊", c: "#eab308" },
    { keys: ["mathematical reasoning", "tautology", "fallacy", "contrapositive", "quantifiers"], i: "🧠", c: "#14b8a6" },
    { keys: ["real numbers", "polynomials", "linear equations in two variables", "triangles", "quadrilaterals", "heron formula", "surface areas and volumes", "constructions", "euclid geometry", "number systems"], i: "📏", c: "#06b6d4" },
    { keys: ["mathematics", "maths", "algebra", "geometry", "mensuration"], i: "📐", c: "#3b82f6" },

    // 12. Computer, Reasoning, Aptitude & Languages
    { keys: ["tech and computers", "computer awareness", "computer science", "computers", "software", "hardware", "internet", "networking", "cyber security", "programming", "python", "java", "c++", "dbms", "operating system", "data structures", "artificial intelligence"], i: "💻", c: "#38bdf8" },
    { keys: ["reasoning", "logical reasoning", "analytical reasoning", "verbal reasoning", "non verbal reasoning", "puzzles", "syllogism", "blood relations", "coding decoding", "seating arrangement", "analogy", "number series", "direction sense", "clocks", "calendars", "dice"], i: "🧩", c: "#f97316" },
    { keys: ["quantitative aptitude", "aptitude", "arithmetic", "percentage", "profit and loss", "simple interest", "compound interest", "ratio and proportion", "time and work", "pipes and cisterns", "time speed and distance", "boats and streams", "mixture and alligation", "averages", "simplification", "hcf and lcm", "data interpretation"], i: "📈", c: "#14b8a6" },
    { keys: ["english", "english grammar", "vocabulary", "synonyms", "antonyms", "idioms and phrases", "one word substitution", "reading comprehension", "tenses", "active and passive", "direct and indirect", "prepositions", "spotting errors", "cloze test", "para jumbles"], i: "📖", c: "#ec4899" },
    { keys: ["hindi", "vyakaran", "sanskrit", "assamese", "bengali", "urdu", "nepali", "bodo", "manipuri"], i: "🔤", c: "#f97316" },
    { keys: ["psychology", "child development", "pedagogy", "teaching aptitude", "sociology", "philosophy", "ethics"], i: "🎓", c: "#8b5cf6" },
    { keys: ["nursing", "ayurveda", "bams", "bhms", "homeopathy", "pharmacy", "pharmacology", "pathology", "microbiology", "biochemistry", "forensic", "community medicine", "first aid", "clinical"], i: "🏥", c: "#f43f5e" }
];

function matchesStudyKeyword(normalizedPaddedText, rawKeyword) {
    let cleanKey = (rawKeyword || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!cleanKey) return false;
    if (normalizedPaddedText.includes(" " + cleanKey + " ")) return true;
    if (normalizedPaddedText.includes(" " + cleanKey + "s ") || normalizedPaddedText.includes(" " + cleanKey + "es ")) return true;
    if (!cleanKey.includes(" ") && cleanKey.length >= 5) {
        return normalizedPaddedText.includes(" " + cleanKey);
    }
    return false;
}

function normalizeStudyTextForMatch(rawText) {
    let stripped = formatCleanTopicTitle(rawText).toLowerCase();
    let wordsOnly = stripped.replace(/[^a-z0-9]+/g, " ").trim();
    return " " + wordsOnly + " ";
}

function getContextPoolForPath(name, folderType = null, contextPathStr = "") {
    let ctx = (`${contextPathStr} ${name} ${(Array.isArray(currentPath) ? currentPath.join(" ") : "")}`).toLowerCase();
    if (folderType === 'pdf' || /ncert book|pdf|study material|ebook|notes/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.pdf;
    if (/board|class \d|grade \d|cbse|icse|ahsec|seba/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.boards;
    if (/physics|mechanics|optics|electrodynamics|thermodynamics/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.physics;
    if (/botany|plant/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.botany;
    if (/zoology|animal|medical|nursing|paramedical|ssuhs|aiims/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.zoology;
    if (/biology|life science/.test(ctx)) return [...UNLIMITED_SUBJECT_ICON_POOLS.botany, ...UNLIMITED_SUBJECT_ICON_POOLS.zoology];
    if (/chemistry|organic|inorganic/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.chemistry;
    if (/math|calculus|algebra|geometry|trigonometry|aptitude/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.math;
    if (/history|ancient|medieval|modern india|freedom struggle/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.history;
    if (/geography|atlas|earth|environment/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.geography;
    if (/polity|constitution|civics|law/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.polity;
    if (/econom|commerce|account|banking/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.economics;
    if (/english|grammar|vocab|hindi|assamese|bengali/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.english;
    if (/computer|coding|programming|tech/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.computer;
    if (folderType === 'mcq' || /mock test|pyq|practice paper|daily quiz/.test(ctx)) return UNLIMITED_SUBJECT_ICON_POOLS.mcq;
    return FALLBACK_TOPIC_ICONS;
}

function getAutomaticIconForName(name, folderType = null, contextPathStr = "") {
    let padded = normalizeStudyTextForMatch(name);
    for (let rule of STUDY_ICON_RULES) {
        if (rule.keys.some(k => matchesStudyKeyword(padded, k))) {
            return rule.i;
        }
    }
    let pool = getContextPoolForPath(name, folderType, contextPathStr);
    let t = padded.trim() || "topic";
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
    return pool[Math.abs(hash) % pool.length];
}

function getSmartIcon(text, customIcon = null) {
    let cleanText = formatCleanTopicTitle(text);
    let validCustom = isValidCustomEmojiIcon(customIcon, cleanText) ? String(customIcon).trim() : null;

    // If user explicitly deleted the icon ("NONE"), return "NONE"
    if (validCustom && validCustom.toUpperCase() === "NONE") {
        return makeTopicTheme("NONE", getPaletteColorForText(cleanText));
    }

    let primaryPart = cleanText.split('(')[0].trim();
    let paddedPrimary = normalizeStudyTextForMatch(primaryPart);
    let paddedFull = normalizeStudyTextForMatch(cleanText);

    let matchedRule = null;
    for (let rule of STUDY_ICON_RULES) {
        if (rule.keys.some(k => matchesStudyKeyword(paddedPrimary, k))) {
            matchedRule = rule;
            break;
        }
    }
    if (!matchedRule) {
        for (let rule of STUDY_ICON_RULES) {
            if (rule.keys.some(k => matchesStudyKeyword(paddedFull, k))) {
                matchedRule = rule;
                break;
            }
        }
    }

    // Manual customIcon ALWAYS overrides automatic STUDY_ICON_RULES!
    let finalIcon = validCustom ? validCustom : (matchedRule ? matchedRule.i : null);
    let finalColor = matchedRule ? matchedRule.c : getPaletteColorForText(cleanText);

    if (finalIcon) {
        return makeTopicTheme(finalIcon, finalColor);
    }
    return null;
}

function getAutoTopicTheme(displayKey, customIcon = null, index = 0, usedColorsSet = null, fallbackIcon = null, usedIconsSet = null, contextPathStr = "") {
    let cleanTitle = formatCleanTopicTitle(displayKey);
    let validCustom = isValidCustomEmojiIcon(customIcon, cleanTitle) ? String(customIcon).trim() : null;

    if (validCustom && validCustom.toUpperCase() === "NONE") {
        let noIconColor = getPaletteColorForText(cleanTitle, index);
        if (usedColorsSet && usedColorsSet.has(noIconColor) && usedColorsSet.size < TOPIC_COLOR_PALETTE.length) {
            for (let step = 0; step < TOPIC_COLOR_PALETTE.length; step++) {
                let candidate = TOPIC_COLOR_PALETTE[(index + step) % TOPIC_COLOR_PALETTE.length];
                if (!usedColorsSet.has(candidate)) { noIconColor = candidate; break; }
            }
        }
        if (usedColorsSet) usedColorsSet.add(noIconColor);
        return makeTopicTheme("NONE", noIconColor);
    }

    let baseTheme = getSmartIcon(cleanTitle, validCustom);
    let chosenIcon = validCustom
        ? validCustom
        : (baseTheme ? baseTheme.i : getAutomaticIconForName(cleanTitle, null, contextPathStr));

    // Sibling deduplication only for auto-assigned icons (never overrides a manual customIcon!)
    if (!validCustom && usedIconsSet && usedIconsSet instanceof Set) {
        if (usedIconsSet.has(chosenIcon)) {
            let subjectPool = getContextPoolForPath(cleanTitle, null, contextPathStr);
            let combinedPool = [...subjectPool, ...FALLBACK_TOPIC_ICONS];
            let hash = 0;
            for (let i = 0; i < cleanTitle.length; i++) hash = cleanTitle.charCodeAt(i) + ((hash << 5) - hash);
            for (let step = 0; step < combinedPool.length; step++) {
                let candidateIcon = combinedPool[(Math.abs(hash) + index + step) % combinedPool.length];
                if (!usedIconsSet.has(candidateIcon)) {
                    chosenIcon = candidateIcon;
                    break;
                }
            }
        }
        usedIconsSet.add(chosenIcon);
    } else if (validCustom && usedIconsSet && usedIconsSet instanceof Set) {
        usedIconsSet.add(chosenIcon);
    }

    let chosenColor = baseTheme ? baseTheme.c : getPaletteColorForText(cleanTitle, index);

    if (usedColorsSet && usedColorsSet.has(chosenColor) && usedColorsSet.size < TOPIC_COLOR_PALETTE.length) {
        for (let step = 0; step < TOPIC_COLOR_PALETTE.length; step++) {
            let candidate = TOPIC_COLOR_PALETTE[(index + step) % TOPIC_COLOR_PALETTE.length];
            if (!usedColorsSet.has(candidate)) {
                chosenColor = candidate;
                break;
            }
        }
    }
    if (usedColorsSet) usedColorsSet.add(chosenColor);

    return makeTopicTheme(chosenIcon, chosenColor);
}
// ==========================================
// SECONDARY SUBTOPIC SEARCH BAR ENGINE (SCOPED TO ACTIVE SUBTOPIC)
// ==========================================
function isSubtopicSearchEnabledForPath(checkPath, childCount = 0) {
    if (!checkPath) return false;
    const cfg = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
    const map = cfg.enabledPaths || {};

    // 1. Direct explicit setting from Admin Panel
    if (map[checkPath] !== undefined) {
        if (typeof map[checkPath] === 'object') {
            return map[checkPath].enabled !== false;
        }
        return Boolean(map[checkPath]);
    }

    // 2. Check if a parent folder enabled "Apply to all subtopics inside"
    const parts = checkPath.split(' > ').filter(Boolean);
    for (let i = parts.length - 1; i >= 1; i--) {
        const parentKey = parts.slice(0, i).join(' > ');
        const parentCfg = map[parentKey];
        if (parentCfg && typeof parentCfg === 'object' && parentCfg.enabled && parentCfg.includeChildren) {
            return true;
        }
    }

    // 3. Smart Auto-Enable for Board > Class 9/10/11/12 or folders exceeding threshold
    const lowerPath = checkPath.toLowerCase();
    if (lowerPath.startsWith('board > class') || lowerPath.includes('state') || lowerPath.includes('board')) {
        if (childCount >= 4) return true;
    }

    const threshold = cfg.autoThreshold !== undefined ? Number(cfg.autoThreshold) : 8;
    if (threshold > 0 && childCount >= threshold) {
        return true;
    }

    return false;
}

function getSubtopicSearchPlaceholder(checkPath, folderTitle) {
    const cfg = window.subtopicSearchConfig || { enabledPaths: {} };
    const entry = (cfg.enabledPaths || {})[checkPath];
    if (entry && typeof entry === 'object' && entry.placeholder) {
        return entry.placeholder;
    }
    const lower = checkPath.toLowerCase();
    if (lower.startsWith('board > class')) {
        return `Search State, Board or Subject in ${folderTitle} (e.g. Assam, AHSEC, SEBA, CBSE)...`;
    }
    return `Search topics & subtopics inside ${folderTitle}...`;
}

// Collects ONLY topics and nested subtopics inside the currently open folder (checkPath)
function collectScopedSubtopicsUnderPath(basePathArr) {
    if (!Array.isArray(basePathArr) || basePathArr.length === 0) return [];
    const basePrefix = basePathArr.join(' > ');
    const deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
    const scopedMap = new Map();

    // Traverse appData subtree starting at basePathArr
    let startNode = appData;
    for (let seg of basePathArr) {
        if (startNode && typeof startNode === 'object' && startNode[seg] !== undefined) {
            startNode = startNode[seg];
        } else {
            startNode = null;
            break;
        }
    }

    function walkSubtree(node, trail) {
        if (!node || typeof node !== 'object' || Array.isArray(node)) return;
        Object.keys(node).forEach(k => {
            const nextTrail = [...trail, k];
            const fullStr = nextTrail.join(' > ');
            if (deletedSet.has(fullStr)) return;

            const meta = customTopicTypes[fullStr] || {};
            const cleanName = formatCleanTopicTitle(meta.displayName || k);
            const relParts = nextTrail.slice(basePathArr.length).map(s => formatCleanTopicTitle(s));

            scopedMap.set(fullStr, {
                fullPath: fullStr,
                pathArr: nextTrail,
                rawKey: k,
                label: cleanName,
                relativeBreadcrumb: relParts.join(' › '),
                isDirectChild: nextTrail.length === basePathArr.length + 1,
                icon: meta.icon || null
            });

            if (node[k] && typeof node[k] === 'object') {
                walkSubtree(node[k], nextTrail);
            }
        });
    }
    if (startNode) walkSubtree(startNode, basePathArr);

    // Also include any custom_topics in Firestore under basePrefix + " > "
    const prefixWithArrow = basePrefix + ' > ';
    Object.keys(customTopicTypes).forEach(dbKey => {
        if (deletedSet.has(dbKey) || !dbKey.startsWith(prefixWithArrow)) return;
        const allParts = dbKey.split(' > ').filter(Boolean);
        // Register every intermediate and leaf level under basePathArr
        for (let len = basePathArr.length + 1; len <= allParts.length; len++) {
            const subArr = allParts.slice(0, len);
            const subFull = subArr.join(' > ');
            if (deletedSet.has(subFull) || scopedMap.has(subFull)) continue;
            const rawLeaf = subArr[subArr.length - 1];
            const meta = customTopicTypes[subFull] || {};
            const cleanName = formatCleanTopicTitle(meta.displayName || rawLeaf);
            const relParts = subArr.slice(basePathArr.length).map(s => formatCleanTopicTitle(s));

            scopedMap.set(subFull, {
                fullPath: subFull,
                pathArr: subArr,
                rawKey: rawLeaf,
                label: cleanName,
                relativeBreadcrumb: relParts.join(' › '),
                isDirectChild: subArr.length === basePathArr.length + 1,
                icon: meta.icon || null
            });
        }
    });

    return Array.from(scopedMap.values()).sort((a, b) => {
        if (a.isDirectChild !== b.isDirectChild) return a.isDirectChild ? -1 : 1;
        return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function handleSubtopicLiveSearch() {
    const input = document.getElementById('subtopicSearchInput');
    const clearBtn = document.getElementById('subtopicSearchClearBtn');
    const dropdown = document.getElementById('subtopicSearchDropdown');
    const grid = document.getElementById('activeSubtopicCategoryGrid');
    if (!input) return;

    const query = input.value.trim();
    const qLower = query.toLowerCase();

    if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
    }

    // 1. Live filter the visible tiles in the current grid
    if (grid) {
        const tiles = grid.querySelectorAll('.category-tile');
        let visibleCount = 0;
        tiles.forEach(tile => {
            const titleText = (tile.getAttribute('data-tile-title') || tile.innerText || '').toLowerCase();
            if (!qLower || titleText.includes(qLower)) {
                tile.style.display = '';
                visibleCount++;
            } else {
                tile.style.display = 'none';
            }
        });

        let emptyNotice = document.getElementById('subtopicGridNoMatchNotice');
        if (visibleCount === 0 && qLower) {
            if (!emptyNotice) {
                emptyNotice = document.createElement('div');
                emptyNotice.id = 'subtopicGridNoMatchNotice';
                emptyNotice.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 26px 16px; color: var(--text-muted); font-size: 13.5px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 12px;';
                grid.appendChild(emptyNotice);
            }
            emptyNotice.innerHTML = `No direct folders matching <b style="color:#fff;">"${query}"</b> on this level. Check the live suggestions above for nested subtopics!`;
            emptyNotice.style.display = 'block';
        } else if (emptyNotice) {
            emptyNotice.style.display = 'none';
        }
    }

    // 2. Populate scoped live suggestion dropdown (only items inside currentPath)
    if (!dropdown) return;
    if (!qLower) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
    }

    const scopedItems = collectScopedSubtopicsUnderPath(currentPath);
    const matches = scopedItems.filter(item =>
        item.label.toLowerCase().includes(qLower) ||
        item.relativeBreadcrumb.toLowerCase().includes(qLower)
    ).slice(0, 12);

    const currentFolderClean = formatCleanTopicTitle(currentPath[currentPath.length - 1] || 'this section');

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 15px 18px; color: var(--text-muted); font-size: 13px; text-align: center;">
                No matching state, board, or subtopic found inside <b style="color:var(--primary-yellow);">${currentFolderClean}</b>.
            </div>`;
        dropdown.style.display = 'block';
        return;
    }

    let usedColors = new Set();
    let usedIcons = new Set();
    dropdown.innerHTML = matches.map((m, idx) => {
        const theme = getAutoTopicTheme(m.label, m.icon, idx, usedColors, "📘", usedIcons, m.fullPath);
        const encodedFull = encodeURIComponent(m.fullPath);
        const levelBadge = m.isDirectChild ? 'Direct Folder' : 'Nested Subtopic';
        return `
        <div class="subtopic-sug-item" onmousedown="selectSubtopicSearchResult('${encodedFull}')">
            <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                <span style="width:34px; height:34px; border-radius:9px; background:${theme.bg}; border:1px solid${theme.border}; color:${theme.c}; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">${theme.i}</span>
                <div style="min-width:0; flex:1;">
                    <div style="color:#fff; font-weight:700; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.label}</div>
                    <div style="color:#94a3b8; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${currentFolderClean} ›${m.relativeBreadcrumb}</div>
                </div>
            </div>
            <span style="font-size:10.5px; font-weight:700; color:${theme.c}; background:${theme.bg}; border:1px solid ${theme.border}; padding:3px 9px; border-radius:20px; white-space:nowrap;">${levelBadge} &rarr;</span>
        </div>`;
    }).join('');
    dropdown.style.display = 'block';
}

function clearSubtopicLiveSearch() {
    const input = document.getElementById('subtopicSearchInput');
    if (input) {
        input.value = '';
        handleSubtopicLiveSearch();
        input.focus();
    }
}

function selectSubtopicSearchResult(encodedFullPath) {
    const fullStr = decodeURIComponent(encodedFullPath);
    const parts = fullStr.split(' > ').filter(Boolean);
    const dropdown = document.getElementById('subtopicSearchDropdown');
    if (dropdown) dropdown.style.display = 'none';
    if (parts.length > 0) {
        jumpToSection(parts);
    }
}

// ==========================================
// PDF RESOURCES & MAIN VIEW RENDERER
// ==========================================
async function _renderPdfResources(checkPath, niceTitle) {
    const mc = document.getElementById('dynamic-content');
    if (!mc) return;
    mc.innerHTML = `
    <div class="card page-transition">
        <h2 class="section-title">📄 ${niceTitle} Resources</h2>
        <p style="color:var(--text-muted);">Loading study materials...</p>
    </div>`;

    try {
        const snap = await db.collection("content")
            .where("path", "==", checkPath)
            .get();

        let items = [];
        snap.forEach(doc => {
            let d = doc.data();
            if (d.type === "material" || d.type === "pdf" || d.fileUrl) {
                items.push({ id: doc.id, ...d });
            }
        });

        if (items.length === 0) {
            mc.innerHTML = `
            <div class="card page-transition">
                <h2 class="section-title">📄 ${niceTitle} Resources</h2>
                <p style="color:var(--text-muted);">No study materials uploaded to <b>${checkPath}</b> yet. Materials or subtopics will appear here once added via the Admin Panel.</p>
            </div>`;
            return;
        }

        items.sort((a, b) => ((b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));

        let usedColors = new Set();
        let usedIcons = new Set();
        let listHtml = items.map((item, idx) => {
            let theme = getAutoTopicTheme(item.title || niceTitle, "📄", idx, usedColors, "📄", usedIcons, checkPath);
            let encodedUrl = encodeURIComponent(item.fileUrl || '');
            let encodedTitle = encodeURIComponent(item.title || niceTitle || 'Study Material');
            let readBtnHtml = typeof openInAppMaterialViewer === 'function'
                ? `<button type="button" class="btn-exam" onclick="openInAppMaterialViewer('${encodedUrl}', '${encodedTitle}')" style="background:${theme.c} !important; color:#000 !important; border:none !important; font-weight:800;">📖 Read PDF</button>`
                : '';

            return `
            <div style="background:linear-gradient(135deg, ${theme.bg} 0%, #090e1a 85%); border:1.5px solid ${theme.border}; box-shadow:0 4px 15px${theme.glow}; border-radius:12px; padding:16px 20px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="cat-icon" style="background:${theme.bg}; color:${theme.c}; border:1px solid ${theme.border};">${theme.i}</div>
                    <div>
                        <div style="font-weight:700; font-size:15px; color:#fff;">${item.title || 'Study Material'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${niceTitle}</div>
                    </div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    ${readBtnHtml}
                    <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-exam" style="background:rgba(255,255,255,0.08) !important; color:#fff !important; border:1px solid ${theme.border} !important; text-decoration:none; font-weight:800;">Open / Download ↗</a>
                </div>
            </div>`;
        }).join('');

        mc.innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">📄 ${niceTitle} Resources</h2>
            <div style="margin-top:15px;">${listHtml}</div>
        </div>`;
    } catch (e) {
        mc.innerHTML = `<div class="card"><h2 class="section-title">📄 ${niceTitle}</h2><p style="color:var(--wrong-red);">Error loading materials: ${e.message}</p></div>`;
    }
}

function _renderView() {
    try {
        const mc = document.getElementById('dynamic-content'); 
        if(!mc) return;
        const bc = document.getElementById('breadcrumb-text');
        if(bc) bc.innerText = currentPath.length === 0 ? "Home" : "Home / " + currentPath.map(s => formatCleanTopicTitle(s)).join(" / "); 
        
        let currentLevel = appData;
        for (let node of currentPath) { 
            if(currentLevel[node] !== undefined) {
                currentLevel = currentLevel[node]; 
            } else {
                currentLevel = {}; 
            }
        }

        let checkPath = currentPath.join(" > ");
        let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
        let hasDbChildren = Object.keys(customTopicTypes).some(k => k.startsWith(checkPath + " > ") && !deletedSet.has(k));
        
        let isEndpoint = false;
        if (typeof currentLevel === 'string' || Array.isArray(currentLevel) || (typeof currentLevel === 'object' && Object.keys(currentLevel).length === 0 && !hasDbChildren)) {
            isEndpoint = true;
        }

        if (currentPath.length === 0) {
            isEndpoint = false;
        }

        if (isEndpoint) {
            let topicNameRaw = currentPath[currentPath.length - 1]; 
            let niceTitle = formatCleanTopicTitle(topicNameRaw);
            let topicNameLower = niceTitle.toLowerCase(); 
            
            let isPdfOnly = false;
            let isContainer = false;

            const topicType = customTopicTypes[checkPath];
            const typeValue = topicType ? (typeof topicType === 'object' ? topicType.type : topicType) : null;

            if (currentPath.length === 1 && (!typeValue || typeValue === 'both')) {
                isContainer = true;
            } else if (typeValue === 'pdf') {
                isPdfOnly = true;
            } else if (typeValue === 'both') {
                let pdfPathTriggers = ["ncert", "book", "pyq", "previous", "pdf", "notes", "material", "syllabus"];
                let fullLower = checkPath.toLowerCase();
                if (pdfPathTriggers.some(t => fullLower.includes(t))) {
                    isPdfOnly = true;
                } else {
                    isContainer = true;
                }
            } else if (!typeValue || typeValue === 'mcq') {
                let pdfTriggers = ["ncert", "book", "pyq", "previous", "pdf", "notes", "material", "syllabus"];
                let isPdf = pdfTriggers.some(t => topicNameLower.includes(t) || checkPath.toLowerCase().includes(t));
                let mcqTriggers = ["mcq", "mock", "quiz", "test", "practice", "challenge", "paper"];
                let isMcq = mcqTriggers.some(t => topicNameLower.includes(t));

                if (isPdf && !isMcq && currentPath[0] !== "Daily Quiz Challenge") isPdfOnly = true;
            }
            
            let studentName = (currentUser && currentUser.displayName) ? currentUser.displayName.split(" ")[0] : "Student";
            
            if (isContainer) {
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">📂 ${niceTitle}</h2>
                    <p style="color:var(--text-muted);">This category has no subtopics yet. Subtopics will appear here once added via the Admin Panel.</p>
                </div>`;
            } else if (isPdfOnly) {
                _renderPdfResources(checkPath, niceTitle);
            } else {
                let isDaily = currentPath[0] === "Daily Quiz Challenge";
                let headerTitle = isDaily ? `📅 ${niceTitle} — Daily Quiz Challenge` : `📝 ${niceTitle} Practice`;
                let signPrompt = !currentUser ? "Sign in to track your scores on the leaderboard!" : `Ready for practice, <span style="color:var(--primary-yellow);">${studentName}</span>?`;
                mc.innerHTML = `
                <div class="card page-transition">
                    <h2 class="section-title">${headerTitle}</h2>
                    <p style="color:var(--text-muted); margin-bottom:25px;">${signPrompt}</p>
                    <button class="btn-exam btn-yellow-glow" onclick="forceStartQuiz()" style="background:var(--primary-yellow) !important; color:black !important; width:100%; max-width:250px; font-size:16px; font-weight:bold; border:none !important; box-shadow:0 4px 15px rgba(253,184,19,0.3) !important;">Start Quiz &rarr;</button>
                </div>`;
            }
            return;
        }

        let titleRaw = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1];
        let title = formatCleanTopicTitle(titleRaw);
        let h = ``;

        if (currentPath.length === 0) {
            h += `
            <div class="card setup-hero-card" onclick="forceCwStep1(event)">
                <div class="hero-badge">CUSTOM PRACTICE</div>
                <h2 class="hero-title">Practice smart with tailored mock tests.</h2>
                <p class="hero-desc">Mix multiple subjects & chapters, filter by difficulty, and build your ultimate personalized mock test (20–250 MCQs).</p>
                <button class="btn-exam hero-btn" onclick="forceCwStep1(event)">Launch Setup 🚀</button>
            </div>`;
        }

        let keys = new Set(Object.keys(currentLevel));
        Object.keys(customTopicTypes).forEach(dbKey => {
            if (deletedSet.has(dbKey)) return;
            let parts = dbKey.split(' > ');
            if (currentPath.length === 0) {
                if (!deletedSet.has(parts[0])) keys.add(parts[0]);
            } else if (dbKey.startsWith(checkPath + " > ")) {
                let nextLevel = dbKey.replace(checkPath + " > ", "").split(' > ')[0];
                let nextFull = checkPath + " > " + nextLevel;
                if (!deletedSet.has(nextFull)) keys.add(nextLevel);
            }
        });
        
        let keysArr = Array.from(keys).filter(k => !(currentPath.length === 0 && k === "Daily Quiz Challenge"));
        const difficultyOrder = ["Easy", "Medium", "Hard", "Mixed"];
        
        keysArr.sort((a, b) => {
            let cleanA = formatCleanTopicTitle(a);
            let cleanB = formatCleanTopicTitle(b);
            let idxA = difficultyOrder.indexOf(cleanA);
            let idxB = difficultyOrder.indexOf(cleanB);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });

        // Secondary Subtopic Search Bar (Renders when enabled in Admin Panel or when folder has many items)
        let subSearchHtml = '';
        if (currentPath.length > 0 && isSubtopicSearchEnabledForPath(checkPath, keysArr.length)) {
            let placeholderText = getSubtopicSearchPlaceholder(checkPath, title).replace(/"/g, '&quot;');
            subSearchHtml = `
            <div class="subtopic-search-container">
                <div class="subtopic-search-box">
                    <span class="subtopic-search-icon">🔍</span>
                    <input type="text" id="subtopicSearchInput" class="subtopic-search-input" placeholder="${placeholderText}" oninput="handleSubtopicLiveSearch()" onfocus="handleSubtopicLiveSearch()" onblur="setTimeout(() => { const d = document.getElementById('subtopicSearchDropdown'); if(d) d.style.display='none'; }, 220)">
                    <button type="button" id="subtopicSearchClearBtn" class="subtopic-search-clear" onclick="clearSubtopicLiveSearch()" title="Clear search">✕</button>
                </div>
                <div id="subtopicSearchDropdown" class="subtopic-search-dropdown"></div>
            </div>`;
        }

        h += `<div class="card category-section"><h3 class="section-title">${title}</h3>${subSearchHtml}<div class="category-grid" id="activeSubtopicCategoryGrid">`;

        let colorIdx = 0;
        let usedColors = new Set();
        let usedIcons = new Set();

        for (let key of keysArr) { 
            let fullCheckPath = currentPath.join(" > ") + (currentPath.length > 0 ? " > " : "") + key;
            if (deletedSet.has(fullCheckPath)) continue;
            
            let typeLabel = "";
            const topicType = customTopicTypes[fullCheckPath];
            const typeValue = topicType ? (typeof topicType === 'object' ? topicType.type : topicType) : null;
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;

            if (typeValue === 'mcq') typeLabel = "📝";
            else if (typeValue === 'pdf') typeLabel = "📄";
            else if (typeValue === 'both') typeLabel = "📂";

            let safeKey = key.replace(/'/g, "\\'");
            let rawDisplay = (topicType && topicType.displayName) ? topicType.displayName : key;
            let displayKey = formatCleanTopicTitle(rawDisplay);
            let safeAttrTitle = displayKey.replace(/"/g, '&quot;');
            let fallbackIcon = typeLabel === '📄' ? "📄" : (typeLabel === '📝' ? "📝" : null);

            // Always pass customIcon so manual icons and "NONE" (no icon) are respected!
            let iconData = getAutoTopicTheme(displayKey, customIcon, colorIdx, usedColors, fallbackIcon, usedIcons, fullCheckPath);
            colorIdx++;

            let iconBoxHtml = (iconData.i === "NONE")
                ? ``
                : `<div class="cat-icon">${iconData.i}</div>`;

            h += `<button class="category-tile colored-tile" data-tile-title="${safeAttrTitle}" style="--topic-color:${iconData.c}; --topic-bg:${iconData.bg}; --topic-border:${iconData.border}; --topic-glow:${iconData.glow};" onclick="navigateTo('${safeKey}')">
                    ${iconBoxHtml}
                    <div class="cat-text">${displayKey}</div>
                  </button>`; 
        }
        
        h += `</div></div>`; 
        mc.innerHTML = `<div class="page-transition">${h}</div>`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(err) { console.error("Render View Error:", err); }
}

// ==========================================
// 6. SCALED TRACK PROGRESS & LEADERBOARDS
// ==========================================
async function getAttemptedIdsForPath(safePath) {
    let docKey = encodeURIComponent(safePath);
    let ids = [];
    if (currentUser) {
        try {
            const subDoc = await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).get();
            if (subDoc.exists && Array.isArray(subDoc.data().attemptedIds)) return subDoc.data().attemptedIds;
        } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        ids = localProg[safePath] || [];
    }
    return ids;
}

async function saveAttemptedIdsForPath(safePath, newAttemptedIds) {
    if (!newAttemptedIds || newAttemptedIds.length === 0) return;
    let docKey = encodeURIComponent(safePath);
    if (currentUser) {
        try {
            await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).set({
                path: safePath,
                attemptedIds: firebase.firestore.FieldValue.arrayUnion(...newAttemptedIds),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        localProg[safePath] = Array.from(new Set([...(localProg[safePath] || []), ...newAttemptedIds]));
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
}

async function resetProgress(safePath) {
    if(!confirm("Are you sure you want to reset your progress for this section?")) return;
    let docKey = encodeURIComponent(safePath);
    if (currentUser) {
        try { await db.collection("users").doc(currentUser.uid).collection("progress").doc(docKey).delete(); } catch(e) {}
    } else {
        let localProg = JSON.parse(localStorage.getItem('mcq_progress') || '{}');
        delete localProg[safePath];
        localStorage.setItem('mcq_progress', JSON.stringify(localProg));
    }
    showNotification("🔄 Progress reset for this section!");
    if(typeof _initiateQuizEngine === 'function') _initiateQuizEngine();
}

function _renderProgressSelection() {
    if (!currentUser) {
        document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><p style="color:var(--text-muted); margin-bottom:20px;">Please sign in to view your personalized exam analytics.</p><button class="btn-exam btn-yellow-glow" onclick="showAuthModal()" style="background:var(--primary-yellow) !important; color:#000 !important; border:none;">Sign In</button></div>`;
        return;
    }
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    let usedColors = new Set();
    let usedIcons = new Set();
    
    rootKeys.forEach((k, idx) => {
        let cleanKey = formatCleanTopicTitle(k);
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let iconData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "📊", usedIcons, k);
        optionsHtml += `
        <button class="category-tile colored-tile" style="--topic-color:${iconData.c}; --topic-bg:${iconData.bg}; --topic-border:${iconData.border}; --topic-glow:${iconData.glow};" onclick="window.location.hash='#/progress/${encodeURIComponent(k)}'">
            <div class="cat-icon">${iconData.i}</div>
            <div class="cat-text">${cleanKey} Analytics</div>
        </button>`;
    });

    document.getElementById('dynamic-content').innerHTML = `
        <div class="card page-transition" style="padding: 30px 20px;">
            <h2 class="section-title" style="justify-content:center;">📊 Select Analytics Dashboard</h2>
            <p style="color:var(--text-muted); margin-bottom:25px; font-size:14px; text-align:center;">Choose an exam category to view your detailed performance metrics and weak spots.</p>
            <div class="category-grid">
                ${optionsHtml}
            </div>
        </div>
    `;
}

async function _renderProgressDashboard(category) {
    if (!currentUser) { _renderProgressSelection(); return; }
    
    let displayCategory = formatCleanTopicTitle(category);
    document.getElementById('breadcrumb-text').innerText = `Home / Profile / Progress / ${displayCategory}`;
    const mc = document.getElementById('dynamic-content'); 
    mc.innerHTML = `<div class="card page-transition"><h2>📊 Compiling Diagnostics...</h2></div>`;
    
    try {
        const snap = await db.collection("leaderboards").where("userId", "==", currentUser.uid).get();
        let validDocs = [];
        let tempDocs = [];
        
        snap.forEach(doc => { tempDocs.push(doc.data()); });

        tempDocs.sort((a, b) => {
            let tA = a.timestamp ? a.timestamp.toMillis() : 0;
            let tB = b.timestamp ? b.timestamp.toMillis() : 0;
            return tA - tB;
        });

        tempDocs.forEach(d => {
            if (d.examCategory === category || (d.quizPath && (d.quizPath.startsWith(category) || d.quizPath.startsWith("Daily Quiz Challenge > " + category)))) {
                validDocs.push(d);
            }
        });

        if (validDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>No Data Available</h2><p style="color:var(--text-muted); font-size:14px;">You haven't completed any quizzes in the ${displayCategory} category yet.</p></div>`;
            return;
        }

        let totalScore = 0; let totalQuestions = 0; let correctCount = 0; let wrongCount = 0;
        let aggregatedSubs = {}; let accuracyTrend = [];
        let totalAvgTimeC = 0; let countC = 0;
        let totalAvgTimeW = 0; let countW = 0;

        validDocs.forEach(d => {
            totalScore += (d.score || 0); 
            let qAttempted = d.attemptedQuestions !== undefined ? d.attemptedQuestions : ((d.correctCount || 0) + (d.wrongCount || 0));
            totalQuestions += qAttempted;
            
            let c = d.correctCount !== undefined ? d.correctCount : Math.round(((d.accuracy||0)/100) * qAttempted);
            let w = d.wrongCount !== undefined ? d.wrongCount : (qAttempted - c);
            
            correctCount += c;
            wrongCount += w;
            accuracyTrend.push(d.accuracy || 0);
            
            if (d.avgTimeCorrect) { totalAvgTimeC += d.avgTimeCorrect; countC++; }
            if (d.avgTimeWrong) { totalAvgTimeW += d.avgTimeWrong; countW++; }
            
            if (d.subjectBreakdown) {
                for(let s in d.subjectBreakdown) {
                    let cleanS = formatCleanTopicTitle(s);
                    if(!aggregatedSubs[cleanS]) aggregatedSubs[cleanS] = { attempts: 0, correct: 0 };
                    aggregatedSubs[cleanS].attempts += d.subjectBreakdown[s].attempts;
                    aggregatedSubs[cleanS].correct += d.subjectBreakdown[s].correct;
                }
            }
        });

        let overallAccuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
        let recentTrend = accuracyTrend.slice(-10);
        let finalAvgTimeC = countC > 0 ? Math.round(totalAvgTimeC / countC) : 0;
        let finalAvgTimeW = countW > 0 ? Math.round(totalAvgTimeW / countW) : 0;

        let subjectHtml = '';
        let weakSubjects = [];
        let validSubjectsCount = 0;

        Object.keys(aggregatedSubs).sort().forEach(subj => {
            let sData = aggregatedSubs[subj];
            if(sData.attempts > 0) {
                validSubjectsCount++;
                let acc = Math.round((sData.correct / sData.attempts) * 100);
                let color = acc >= 70 ? 'var(--correct-green)' : (acc >= 50 ? 'var(--primary-yellow)' : 'var(--wrong-red)');
                
                if (acc < 50) weakSubjects.push(`${subj} (${acc}%)`);

                subjectHtml += `
                    <div style="margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; font-weight:bold;">
                            <span style="color:var(--text-light);">${subj}</span>
                            <span style="color:${color};">${acc}% <span style="color:#666; font-size:10px; font-weight:normal;">(${sData.correct}/${sData.attempts})</span></span>
                        </div>
                        <div style="width:100%; background:#333; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="width:${acc}%; background:${color}; height:100%; border-radius:4px;"></div>
                        </div>
                    </div>
                `;
            }
        });

        if (validSubjectsCount === 0) subjectHtml = `<p style="color:var(--text-muted); font-size:13px;">Detailed subject analytics generate for new quizzes.</p>`;
        
        let weakSpotsText = weakSubjects.length > 0 ? weakSubjects.join(' • ') : "<span style='color:var(--correct-green);'>✅ Excellent! All subjects are >50% accuracy. Keep it up!</span>";

        mc.innerHTML = `
        <div class="card page-transition" style="padding: 20px 15px;">
            <h2 class="section-title" style="margin-top:0; margin-bottom:15px; font-size:22px;">${displayCategory} Performance</h2>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 15px;">
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 24px; color: white; font-weight: bold;">${totalQuestions}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Attempted</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--correct-green);">
                    <div style="font-size: 24px; color: var(--correct-green); font-weight: bold;">${correctCount}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Right</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--wrong-red);">
                    <div style="font-size: 24px; color: var(--wrong-red); font-weight: bold;">${wrongCount}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Wrong</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--primary-yellow);">
                    <div style="font-size: 24px; color: var(--primary-yellow); font-weight: bold;">${totalScore}</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Overall Mark</div>
                </div>
                <div style="flex:1; min-width: 100px; max-width: 150px; background:#0d1527; padding: 15px 10px; border-radius: 8px; text-align:center; border:1px solid var(--border-color);">
                    <div style="font-size: 24px; color: white; font-weight: bold;">${overallAccuracy}%</div>
                    <div style="color: var(--text-muted); font-size: 11px; text-transform:uppercase; margin-top:4px;">Accuracy</div>
                </div>
            </div>

            <div style="background:rgba(239, 68, 68, 0.05); border-left:3px solid var(--wrong-red); padding:12px; border-radius:4px; margin-bottom:20px;">
                <div style="color:var(--wrong-red); font-size:11px; font-weight:bold; margin-bottom:5px; text-transform:uppercase;">Needs Improvement</div>
                <div style="font-size:13px; color:#d1d5db; line-height:1.4;">${weakSpotsText}</div>
            </div>
            
            <div style="background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px; margin-bottom: 20px;">
                <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">⏱️ Time to Accuracy Insights</h3>
                <div style="display:flex; gap:15px; flex-wrap:wrap;">
                    <div style="flex:1; background:rgba(16, 185, 129, 0.1); border:1px solid var(--correct-green); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--correct-green); font-weight:bold;">${finalAvgTimeC}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Correct Answers</div>
                    </div>
                    <div style="flex:1; background:rgba(239, 68, 68, 0.1); border:1px solid var(--wrong-red); padding:15px; border-radius:6px; text-align:center;">
                        <div style="font-size:24px; color:var(--wrong-red); font-weight:bold;">${finalAvgTimeW}s</div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:5px;">Avg Time on Wrong Answers</div>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <div style="flex:1; min-width:280px; background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Subject-Wise Mastery</h3>
                    ${subjectHtml}
                </div>

                <div style="flex:1; min-width:280px; background:#090e1a; border:1px solid var(--border-color); padding:15px; border-radius:6px;">
                    <h3 style="margin-top:0; color:white; border-bottom:1px solid #1a2744; padding-bottom:8px; margin-bottom:15px; font-size:15px;">Accuracy Trajectory</h3>
                    <canvas id="accuracyChart" style="width:100%; height:160px;"></canvas>
                </div>
            </div>
        </div>`;

        setTimeout(() => drawAccuracyChart(recentTrend), 50);

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

function drawAccuracyChart(dataPoints) {
    const canvas = document.getElementById('accuracyChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = 160;
    
    ctx.clearRect(0,0,w,h);
    if(dataPoints.length === 0) return;
    
    const padding = 20; const maxVal = 100;
    const stepX = (w - padding*2) / Math.max(1, dataPoints.length - 1);
    
    ctx.strokeStyle = '#1a2744'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(val => {
        let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(w-padding, y); ctx.stroke();
        ctx.fillStyle = '#8492a6'; ctx.font = '10px sans-serif'; ctx.fillText(val+'%', 0, y+3);
    });
    
    if(dataPoints.length > 1) {
        ctx.strokeStyle = '#fdb813'; ctx.lineWidth = 2; ctx.beginPath();
        dataPoints.forEach((val, i) => {
            let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
            if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    
    ctx.fillStyle = '#10b981';
    dataPoints.forEach((val, i) => {
        let x = padding + i*stepX; let y = h - padding - (val/maxVal)*(h - padding*2);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    });
}

function _renderLeaderboardOptions() { 
    document.getElementById('breadcrumb-text').innerText = "Home / Leaderboard"; 
    const mc = document.getElementById('dynamic-content');

    if (!currentUser) {
        mc.innerHTML = `
        <div class="card page-transition" style="text-align:center; padding: 45px 20px; max-width: 520px; margin: 0 auto;">
            <div style="font-size: 42px; margin-bottom: 12px;">🔒</div>
            <h2 class="section-title" style="justify-content:center;">Sign In Required</h2>
            <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-bottom: 25px;">
                Only signed-in students with at least <b>100 MCQs attempted</b> in their respective exam category can view official Leaderboard rankings.
            </p>
            <button class="btn-exam btn-yellow-glow" onclick="showAuthModal()" style="background:var(--primary-yellow) !important; color:#000 !important; border:none; padding:12px 24px; font-size:14px;">Sign In with Google</button>
        </div>`;
        return;
    }
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    let usedColors = new Set();
    let usedIcons = new Set();
    
    rootKeys.forEach((k, idx) => {
        let cleanKey = formatCleanTopicTitle(k);
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let smartData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "🥇", usedIcons, k);

        optionsHtml += `<button class="category-tile colored-tile" style="--topic-color:${smartData.c}; --topic-bg:${smartData.bg}; --topic-border:${smartData.border}; --topic-glow:${smartData.glow};" onclick="window.location.hash='#/board/${encodeURIComponent(k)}'">
            <div class="cat-icon">${smartData.i}</div>
            <div class="cat-text">${cleanKey} Leaderboard</div>
        </button>`;
    });
    
    mc.innerHTML = `
        <div class="card page-transition">
            <h2 class="section-title">🏆 Global Leaderboards</h2>
            <p style="color:var(--text-muted); margin-bottom: 20px;">Select a category to view top performers.</p>
            <div style="background: rgba(253, 184, 19, 0.08); border-left: 4px solid var(--primary-yellow); padding: 12px 15px; margin-bottom: 25px; border-radius: 4px;">
                <span style="color: var(--primary-yellow); font-weight: bold;">🎯 ELIGIBILITY RULE:</span>
                <span style="color: #d1d5db; font-size: 13px;"> You must be signed in and complete a minimum of <b>100 MCQs</b> in a category to unlock your rank on that Leaderboard.</span>
            </div>
            <div class="category-grid">
                ${optionsHtml}
            </div>
        </div>`; 
}

async function fetchLiveLeaderboard(category) {
    const mc = document.getElementById('dynamic-content');
    let cleanCategory = formatCleanTopicTitle(category);
    document.getElementById('breadcrumb-text').innerText = `Home / Leaderboard / ${cleanCategory}`;

    if (!currentUser) {
        _renderLeaderboardOptions();
        return;
    }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding:40px;"><h2 class="section-title" style="justify-content:center;">🏆 Verifying Eligibility & Loading ${cleanCategory} Ranks...</h2></div>`;

    try {
        const snap = await db.collection("leaderboards").limit(500).get();
        let statsByUser = {};

        snap.forEach(doc => {
            let d = doc.data();
            let matchesCategory = (d.examCategory === category) ||
                (d.quizPath && (d.quizPath.startsWith(category) || d.quizPath.startsWith("Daily Quiz Challenge > " + category)));
            if (!matchesCategory) return;

            let uid = d.userId;
            if (!uid) return;

            let attemptedInQuiz = d.attemptedQuestions !== undefined
                ? Number(d.attemptedQuestions)
                : ((Number(d.correctCount) || 0) + (Number(d.wrongCount) || 0));

            if (!statsByUser[uid]) {
                statsByUser[uid] = {
                    userId: uid,
                    userName: d.userName || "Student",
                    totalScore: 0,
                    bestScore: d.score || 0,
                    totalAttempted: 0,
                    totalCorrect: 0,
                    quizzesPlayed: 0
                };
            }
            statsByUser[uid].totalScore += (Number(d.score) || 0);
            statsByUser[uid].totalAttempted += attemptedInQuiz;
            statsByUser[uid].totalCorrect += (Number(d.correctCount) || 0);
            statsByUser[uid].quizzesPlayed += 1;
            if ((Number(d.score) || 0) > statsByUser[uid].bestScore) {
                statsByUser[uid].bestScore = Number(d.score) || 0;
            }
        });

        let myStats = statsByUser[currentUser.uid] || { totalAttempted: 0, totalScore: 0 };
        let myAttempted = myStats.totalAttempted || 0;

        if (myAttempted < 100) {
            let remaining = Math.max(0, 100 - myAttempted);
            let pct = Math.min(100, Math.round((myAttempted / 100) * 100));
            let safeCat = category.replace(/'/g, "\\'");

            mc.innerHTML = `
            <div class="card page-transition" style="text-align:center; padding: 40px 24px; max-width: 560px; margin: 0 auto;">
                <div style="font-size: 44px; margin-bottom: 10px;">🔒</div>
                <h2 class="section-title" style="justify-content:center;">${cleanCategory} Leaderboard Locked</h2>
                <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-bottom: 22px;">
                    To view your rank on the <b>${cleanCategory}</b> Leaderboard, you must attempt at least <b>100 MCQs</b> in this category.
                </p>
                <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:12px; padding:18px; margin-bottom:24px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:8px;">
                        <span style="color:#fff;">Your Progress (${cleanCategory})</span>
                        <span style="color:var(--primary-yellow);">${myAttempted} / 100 MCQs</span>
                    </div>
                    <div style="width:100%; background:#1c1c24; height:10px; border-radius:5px; overflow:hidden;">
                        <div style="width:${pct}%; background:linear-gradient(90deg, var(--primary-yellow), var(--correct-green)); height:100%; transition:width 0.3s;"></div>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:8px;">
                        Attempt <b>${remaining} more MCQ${remaining === 1 ? '' : 's'}</b> in ${cleanCategory} to unlock your official rank!
                    </div>
                </div>
                <button class="btn-exam btn-yellow-glow" onclick="jumpToSection(['${safeCat}'])" style="background:var(--primary-yellow) !important; color:#000 !important; border:none; padding:12px 24px; font-size:14px;">Practice ${cleanCategory} Now 🚀</button>
            </div>`;
            return;
        }

        let qualifiedRankings = Object.values(statsByUser)
            .filter(u => u.totalAttempted >= 100)
            .map(u => ({
                ...u,
                overallAccuracy: u.totalAttempted > 0 ? Math.round((u.totalCorrect / u.totalAttempted) * 100) : 0
            }))
            .sort((a, b) => b.totalScore - a.totalScore || b.overallAccuracy - a.overallAccuracy);

        let myRankIndex = qualifiedRankings.findIndex(u => u.userId === currentUser.uid);
        let topRankings = qualifiedRankings.slice(0, 20);

        let rowsHtml = topRankings.map((r, idx) => {
            let rankBadge = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : `#${idx + 1}`));
            let isMe = r.userId === currentUser.uid;
            let rowBg = isMe ? "rgba(253, 184, 19, 0.12)" : "#090e1a";
            let rowBorder = isMe ? "var(--primary-yellow)" : "var(--border-color)";

            return `
            <div style="display:flex; align-items:center; justify-content:space-between; background:${rowBg}; border:1px solid ${rowBorder}; padding:14px 18px; border-radius:10px; margin-bottom:10px; gap:10px;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <span style="font-size:18px; font-weight:800; min-width:32px; text-align:center; color:var(--primary-yellow);">${rankBadge}</span>
                    <div>
                        <div style="font-weight:700; color:#fff; font-size:15px;">${r.userName} ${isMe ? '<span style="font-size:11px; color:var(--primary-yellow);">(You)</span>' : ''}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${r.totalAttempted} MCQs • ${r.quizzesPlayed} Quiz${r.quizzesPlayed > 1 ? 'zes' : ''} • Accuracy: ${r.overallAccuracy}%</div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:18px; font-weight:800; color:var(--correct-green);">${r.totalScore} pts</div>
                    <div style="font-size:11px; color:var(--text-muted);">Best: ${r.bestScore}</div>
                </div>
            </div>`;
        }).join('');

        mc.innerHTML = `
        <div class="card page-transition">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                <h2 class="section-title" style="margin:0;">🏆 ${cleanCategory} Top Performers</h2>
                <span class="badge-path">Your Rank: #${myRankIndex + 1} (${myAttempted} MCQs Attempted)</span>
            </div>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Ranked by cumulative score among students with 100+ attempted MCQs in ${cleanCategory}.</p>
            <div>${rowsHtml}</div>
        </div>`;
    } catch (e) {
        mc.innerHTML = `<div class="card"><h2 class="section-title">Error</h2><p style="color:var(--wrong-red);">${e.message}</p></div>`;
    }
}
// ==========================================
// CUSTOM PRACTICE ENGINE
// ==========================================
let cwPath = "";
let cwSelectedSubjects = [];
let cwSelectedChapters = [];
let cwSubjectCatalog = [];
let cwAvailableChaptersCache = [];
let cwDiff = "Mixed";
let cwLimit = 25;

const CW_DIFFICULTY_FOLDERS = new Set(["easy", "medium", "hard", "mixed"]);
function isCwDifficultyFolder(name) {
    let clean = formatCleanTopicTitle(name).toLowerCase();
    return CW_DIFFICULTY_FOLDERS.has(clean);
}

function isExcludedSubjectOrPdfFolder(fullKey, name) {
    let tObj = customTopicTypes[fullKey];
    let tVal = tObj ? (typeof tObj === 'object' ? tObj.type : tObj) : null;
    if (tVal === 'pdf') return true;

    let lower = formatCleanTopicTitle(name).toLowerCase();
    const nonSubjectKeywords = [
        "practice paper", "sample paper", "model paper", "question paper", "paper",
        "ncert", "book", "pyq", "previous", "mock", "pdf", "note", "material", "syllabus"
    ];
    return nonSubjectKeywords.some(k => lower.includes(k));
}

function cwStep1() {
    document.body.classList.add('hide-ai-btn');
    document.body.classList.add('hide-bottom-bar');

    const mc = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Custom Practice";
    let excludedSet = new Set((window.customPracticeConfig && Array.isArray(window.customPracticeConfig.excludedExams)) ? window.customPracticeConfig.excludedExams : []);
    let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge" && !excludedSet.has(k) && !deletedSet.has(k));
    let usedColors = new Set();
    let usedIcons = new Set();
    
    let html = `
    <div class="card page-transition cw-wide-card">
        <h2 class="section-title" style="margin-bottom: 12px; color:var(--primary-yellow); justify-content:center; font-size:20px;">⚙️ Custom Practice Setup</h2>
        <p style="color:var(--text-muted); margin-bottom: 28px; text-align:center; font-size:14px;">Step 1: Select your target examination category</p>
        
        <div class="cw-exam-grid">`;
        
        rootKeys.forEach((k, idx) => {
            let cleanKey = formatCleanTopicTitle(k);
            let safeKey = k.replace(/'/g, "\\'");
            const topicType = customTopicTypes[k];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            let smartData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "📁", usedIcons, k);
            let iconHtml = smartData.i === "NONE" ? '' : `<div class="cat-icon">${smartData.i}</div>`;

            html += `
            <button class="category-tile colored-tile" style="width:100%; --topic-color:${smartData.c}; --topic-bg:${smartData.bg}; --topic-border:${smartData.border}; --topic-glow:${smartData.glow};" onclick="cwSetPath('${safeKey}')">
                ${iconHtml}
                <div class="cat-text">${cleanKey}</div>
            </button>`;
        });
        
    html += `</div></div>`;
    mc.innerHTML = html;
}

function cwSetPath(path) {
    cwPath = path;
    cwSelectedSubjects = [];
    cwSelectedChapters = [];
    cwStep2();
}

function buildCwCatalogForExam(examKey, ignoreManualOverride = false) {
    if (!ignoreManualOverride && window.customPracticeConfig && window.customPracticeConfig.exams && window.customPracticeConfig.exams[examKey] && Array.isArray(window.customPracticeConfig.exams[examKey].subjects)) {
        let manualSubjects = window.customPracticeConfig.exams[examKey].subjects;
        return manualSubjects.map(s => ({
            label: formatCleanTopicTitle(s.label || s.path.split(' > ').pop() || ''),
            fullPath: s.path,
            chapters: Array.isArray(s.chapters)
                ? s.chapters.map(c => ({
                    label: formatCleanTopicTitle(c.label || c.path.split(' > ').pop() || ''),
                    fullPath: c.path
                }))
                : []
        }));
    }

    let subjectsMap = new Map();
    let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);

    function registerSubject(fullPath, label, nodeObj) {
        if (deletedSet.has(fullPath)) return;
        if (isExcludedSubjectOrPdfFolder(fullPath, label)) return;
        if (isCwDifficultyFolder(label)) return;
        if (!subjectsMap.has(fullPath)) {
            subjectsMap.set(fullPath, {
                label: formatCleanTopicTitle(label),
                fullPath: fullPath,
                nodeObj: nodeObj || {},
                chaptersMap: new Map()
            });
        }
    }

    let examObj = appData[examKey] || {};
    let mcqPracticeObj = examObj["MCQs Practice"] || {};

    if (typeof mcqPracticeObj === 'object' && Object.keys(mcqPracticeObj).length > 0) {
        Object.keys(mcqPracticeObj).forEach(subjKey => {
            let subjFull = `${examKey} > MCQs Practice > ${subjKey}`;
            registerSubject(subjFull, subjKey, mcqPracticeObj[subjKey]);
        });
    }

    Object.keys(examObj).forEach(topKey => {
        if (topKey === "MCQs Practice" || topKey === "Mock Test") return;
        let fullTop = `${examKey} > ${topKey}`;
        registerSubject(fullTop, topKey, examObj[topKey]);
    });

    let examPrefix = examKey + " > ";
    Object.keys(customTopicTypes).forEach(dbKey => {
        if (deletedSet.has(dbKey) || !dbKey.startsWith(examPrefix)) return;
        let rel = dbKey.slice(examPrefix.length);
        let parts = rel.split(' > ').filter(Boolean);
        if (parts.length === 0) return;

        if (parts[0] === "MCQs Practice") {
            if (parts.length >= 2) {
                let sFull = `${examKey} > MCQs Practice > ${parts[1]}`;
                let nodeRef = (examObj["MCQs Practice"] && examObj["MCQs Practice"][parts[1]]) || {};
                registerSubject(sFull, parts[1], nodeRef);
            }
        } else if (parts[0] !== "Mock Test") {
            let sFull = `${examKey} > ${parts[0]}`;
            registerSubject(sFull, parts[0], examObj[parts[0]] || {});
        }
    });

    subjectsMap.forEach((subj) => {
        function collectChapters(obj, currentFullPath, prefixLabel = "") {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(k => {
                if (isCwDifficultyFolder(k)) return;
                let childFull = `${currentFullPath} > ${k}`;
                if (deletedSet.has(childFull) || isExcludedSubjectOrPdfFolder(childFull, k)) return;

                let cleanK = formatCleanTopicTitle(k);
                let disp = prefixLabel ? `${prefixLabel} / ${cleanK}` : cleanK;
                subj.chaptersMap.set(childFull, { label: disp, fullPath: childFull });

                if (obj[k] && typeof obj[k] === 'object' && Object.keys(obj[k]).length > 0) {
                    collectChapters(obj[k], childFull, disp);
                }
            });
        }
        collectChapters(subj.nodeObj, subj.fullPath);

        let sPref = subj.fullPath + " > ";
        Object.keys(customTopicTypes).forEach(dbKey => {
            if (deletedSet.has(dbKey) || !dbKey.startsWith(sPref)) return;
            let relParts = dbKey.slice(sPref.length).split(' > ').filter(Boolean);
            let validSegments = [];
            for (let seg of relParts) {
                if (isCwDifficultyFolder(seg)) break;
                validSegments.push(seg);
            }
            if (validSegments.length === 0) return;

            let chapFullPath = subj.fullPath + " > " + validSegments.join(" > ");
            let leafName = validSegments[validSegments.length - 1];
            if (!deletedSet.has(chapFullPath) && !isExcludedSubjectOrPdfFolder(chapFullPath, leafName) && !subj.chaptersMap.has(chapFullPath)) {
                let relLabel = validSegments.map(s => formatCleanTopicTitle(s)).join(' / ');
                subj.chaptersMap.set(chapFullPath, { label: relLabel, fullPath: chapFullPath });
            }
        });
    });

    return Array.from(subjectsMap.values()).map(s => ({
        label: s.label,
        fullPath: s.fullPath,
        chapters: Array.from(s.chaptersMap.values())
    }));
}

function cwStep2() {
    document.body.classList.add('hide-ai-btn');
    document.body.classList.add('hide-bottom-bar');

    const mc = document.getElementById('dynamic-content');

    if (!appData[cwPath]) {
        mc.innerHTML = `<div class="card page-transition cw-wide-card" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p style="color:var(--text-muted);">Selected exam category not found.</p><button class="btn-exam" onclick="cwStep1()" style="margin-top:20px;">&larr; Back</button></div>`;
        return;
    }

    cwSubjectCatalog = buildCwCatalogForExam(cwPath);
    if (cwSelectedSubjects.length === 0 && cwSubjectCatalog.length > 0) {
        cwSelectedSubjects = [cwSubjectCatalog[0].fullPath];
    }

    let usedSubjColors = new Set();
    let usedSubjIcons = new Set();
    let subjectsGridHtml = cwSubjectCatalog.map((s, idx) => {
        let isChecked = cwSelectedSubjects.includes(s.fullPath);
        let iconObj = getAutoTopicTheme(s.label, null, idx, usedSubjColors, "📘", usedSubjIcons, s.fullPath);
        return `
        <label class="cw-check-card ${isChecked ? 'selected' : ''}" id="cwSubjCard_${idx}" style="--topic-color:${iconObj.c}; --topic-bg:${iconObj.bg}; --topic-border:${iconObj.border}; --topic-glow:${iconObj.glow}; border-left: 4px solid ${iconObj.c};">
            <input type="checkbox" value="${s.fullPath.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''} onchange="cwToggleSubject(this, ${idx})">
            <span>${iconObj.i} ${s.label}</span>
        </label>`;
    }).join('');

    mc.innerHTML = `
    <div class="card page-transition cw-wide-card">
        <h2 class="section-title" style="margin-bottom: 24px; color:var(--primary-yellow); justify-content:center; font-size:20px;">🎯 Customize Your ${formatCleanTopicTitle(cwPath)} Test</h2>
        
        <div style="margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                <label style="color:var(--text-muted); font-size:12px; font-weight:bold; text-transform:uppercase;">1. Select Subject(s) (Multiple Allowed)</label>
                <div style="display:flex; gap:8px;">
                    <button type="button" onclick="cwSelectAllSubjects(true)" style="background:rgba(253,184,19,0.12); color:var(--primary-yellow); border:1px solid rgba(253,184,19,0.3); border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer;">Select All</button>
                    <button type="button" onclick="cwSelectAllSubjects(false)" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border-color); border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer;">Clear</button>
                </div>
            </div>
            <div class="cw-multi-grid" id="cwSubjectsContainer">
                ${subjectsGridHtml || '<p style="color:var(--text-muted); font-size:13px; margin:4px;">No subjects configured for this exam yet. Add subjects in Admin Panel &rarr; Custom Practice.</p>'}
            </div>
        </div>

        <div style="margin-bottom: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                <label style="color:var(--text-muted); font-size:12px; font-weight:bold; text-transform:uppercase;">
                    2. Select Chapters Under Selected Subject(s) <span id="cwSelectedChapCount" style="color:var(--primary-yellow); margin-left:6px;"></span>
                </label>
                <div style="display:flex; gap:8px;">
                    <button type="button" onclick="cwSelectAllChapters(true)" style="background:rgba(253,184,19,0.12); color:var(--primary-yellow); border:1px solid rgba(253,184,19,0.3); border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer;">Select All Chapters</button>
                    <button type="button" onclick="cwSelectAllChapters(false)" style="background:rgba(255,255,255,0.05); color:var(--text-muted); border:1px solid var(--border-color); border-radius:6px; padding:4px 12px; font-size:11px; font-weight:700; cursor:pointer;">Clear</button>
                </div>
            </div>

            <div class="cw-chapter-search-wrap">
                <input type="text" id="cwChapterSearchInput" class="cw-chapter-search-input" placeholder="🔍 Search & select specific chapters (e.g. Biological Classification, Laws of Motion)..." oninput="cwFilterChaptersLive()" onfocus="cwFilterChaptersLive()" onblur="setTimeout(() => { const s = document.getElementById('cwChapterSuggestions'); if(s) s.style.display='none'; }, 200)">
                <div id="cwChapterSuggestions" class="cw-chapter-suggestions"></div>
            </div>

            <div class="cw-multi-grid" id="cwChaptersContainer"></div>
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 28px; align-items: start;">
            <div>
                <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:12px; font-weight:bold; text-transform:uppercase;">3. Difficulty Level</label>
                <select id="cwDiffSelect" class="input-field" style="font-size:14px; padding:13px; margin-bottom:0;">
                    <option value="Mixed">Mixed (Real Exam Balance)</option>
                    <option value="Easy">Easy (Warmup)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Hard">Hard (Challenge)</option>
                </select>
            </div>
            <div>
                <label style="display:block; color:var(--text-muted); margin-bottom:8px; font-size:12px; font-weight:bold; text-transform:uppercase;">4. Number of Questions (Min 20 • Max 250)</label>
                <input type="number" id="cwNum" class="input-field" style="font-size:14px; padding:13px; margin-bottom:0;" value="25" min="20" max="250" oninput="cwValidateLimit()">
                <div id="cwNumCaution" style="display:none; color:var(--wrong-red); background:rgba(239,68,68,0.1); border-left:3px solid var(--wrong-red); padding:8px 10px; border-radius:4px; font-size:12px; font-weight:600; margin-top:8px;">
                    ⚠️ Caution: Number of questions must be between 20 and 250.
                </div>
            </div>
        </div>

        <div style="display:flex; gap:15px; flex-wrap:wrap;">
            <button class="btn-exam" onclick="cwStep1()" style="flex:1; min-width:140px; background:#0d1527;">&larr; Change Exam</button>
            <button id="cwLaunchBtn" class="btn-exam btn-yellow-glow" onclick="cwLaunch()" style="flex:2; min-width:200px; background:var(--primary-yellow) !important; color:black !important; border:none; box-shadow: 0 4px 15px rgba(253,184,19,0.3); font-size:15px;">Launch Practice 🚀</button>
        </div>
    </div>`;

    cwBuildAvailableChapters();
    cwRenderChaptersList();
    cwValidateLimit();
}

function cwValidateLimit() {
    const inputEl = document.getElementById('cwNum');
    const cautionEl = document.getElementById('cwNumCaution');
    const launchBtn = document.getElementById('cwLaunchBtn');
    if (!inputEl || !cautionEl || !launchBtn) return true;

    let raw = inputEl.value.trim();
    let val = Number(raw);

    if (raw === "" || isNaN(val) || !Number.isInteger(val) || val < 20 || val > 250) {
        let msg = "⚠️ Caution: Please enter a valid number between 20 and 250.";
        if (raw !== "" && !isNaN(val)) {
            if (val < 20) msg = `⚠️ Caution: Minimum 20 questions required (you entered ${val}).`;
            else if (val > 250) msg = `⚠️ Caution: Maximum 250 questions allowed (you entered ${val}).`;
        }
        cautionEl.innerText = msg;
        cautionEl.style.display = 'block';
        inputEl.style.setProperty('border-color', 'var(--wrong-red)', 'important');
        launchBtn.disabled = true;
        return false;
    } else {
        cautionEl.style.display = 'none';
        inputEl.style.removeProperty('border-color');
        launchBtn.disabled = false;
        return true;
    }
}

function cwUpdateSelectedChapCounter() {
    const countEl = document.getElementById('cwSelectedChapCount');
    if (countEl) {
        countEl.innerText = `(${cwSelectedChapters.length} Selected)`;
    }
}

function cwToggleSubject(cbEl, idx) {
    let val = cbEl.value;
    let card = document.getElementById('cwSubjCard_' + idx);
    if (cbEl.checked) {
        if (!cwSelectedSubjects.includes(val)) cwSelectedSubjects.push(val);
        if (card) card.classList.add('selected');
        let subjObj = cwSubjectCatalog.find(s => s.fullPath === val);
        if (subjObj) {
            if (subjObj.chapters && subjObj.chapters.length > 0) {
                subjObj.chapters.forEach(c => {
                    if (!cwSelectedChapters.includes(c.fullPath)) cwSelectedChapters.push(c.fullPath);
                });
            } else if (!cwSelectedChapters.includes(subjObj.fullPath)) {
                cwSelectedChapters.push(subjObj.fullPath);
            }
        }
    } else {
        cwSelectedSubjects = cwSelectedSubjects.filter(p => p !== val);
        if (card) card.classList.remove('selected');
        cwSelectedChapters = cwSelectedChapters.filter(ch => !ch.startsWith(val + " > ") && ch !== val);
    }
    cwBuildAvailableChapters();
    cwRenderChaptersList();
}

function cwSelectAllSubjects(selectAll) {
    if (selectAll) {
        cwSelectedSubjects = cwSubjectCatalog.map(s => s.fullPath);
    } else {
        cwSelectedSubjects = [];
        cwSelectedChapters = [];
    }
    const container = document.getElementById('cwSubjectsContainer');
    if (container) {
        container.querySelectorAll('input[type="checkbox"]').forEach((cb, idx) => {
            cb.checked = selectAll;
            const card = document.getElementById('cwSubjCard_' + idx);
            if (card) card.classList.toggle('selected', selectAll);
        });
    }
    cwBuildAvailableChapters();
    if (selectAll) {
        cwSelectedChapters = cwAvailableChaptersCache.map(c => c.fullPath);
    }
    cwRenderChaptersList();
}

function cwBuildAvailableChapters() {
    cwAvailableChaptersCache = [];
    cwSubjectCatalog.forEach(subj => {
        if (!cwSelectedSubjects.includes(subj.fullPath)) return;
        if (subj.chapters && subj.chapters.length > 0) {
            subj.chapters.forEach(ch => {
                cwAvailableChaptersCache.push({
                    subjLabel: subj.label,
                    label: ch.label,
                    fullPath: ch.fullPath
                });
            });
        } else {
            cwAvailableChaptersCache.push({
                subjLabel: subj.label,
                label: `All ${subj.label} Questions`,
                fullPath: subj.fullPath
            });
        }
    });

    let validPaths = new Set(cwAvailableChaptersCache.map(c => c.fullPath));
    cwSelectedChapters = cwSelectedChapters.filter(p => validPaths.has(p));
    if (cwSelectedChapters.length === 0 && cwAvailableChaptersCache.length > 0) {
        cwSelectedChapters = cwAvailableChaptersCache.map(c => c.fullPath);
    }
}

function cwRenderChaptersList(searchQuery = "") {
    const chContainer = document.getElementById('cwChaptersContainer');
    if (!chContainer) return;

    if (cwSelectedSubjects.length === 0) {
        chContainer.innerHTML = `<div style="grid-column: 1 / -1; color:var(--text-muted); font-size:13px; padding:12px; text-align:center;">Please select at least one subject above to load its chapters.</div>`;
        cwUpdateSelectedChapCounter();
        return;
    }

    let q = (searchQuery || "").trim().toLowerCase();
    let listToRender = q
        ? cwAvailableChaptersCache.filter(ch => ch.label.toLowerCase().includes(q) || ch.subjLabel.toLowerCase().includes(q))
        : cwAvailableChaptersCache;

    if (listToRender.length === 0) {
        chContainer.innerHTML = `<div style="grid-column: 1 / -1; color:var(--text-muted); font-size:13px; padding:12px; text-align:center;">No chapters matching "${searchQuery}".</div>`;
        cwUpdateSelectedChapCounter();
        return;
    }

    let usedChapColors = new Set();
    let usedChapIcons = new Set();
    chContainer.innerHTML = listToRender.map((ch, idx) => {
        let isChecked = cwSelectedChapters.includes(ch.fullPath);
        let chapTheme = getAutoTopicTheme(ch.label, null, idx, usedChapColors, "📘", usedChapIcons, ch.fullPath);
        return `
        <label class="cw-check-card ${isChecked ? 'selected' : ''}" id="cwChapCard_${idx}" style="--topic-color:${chapTheme.c}; --topic-bg:${chapTheme.bg}; --topic-border:${chapTheme.border}; --topic-glow:${chapTheme.glow}; border-left: 4px solid ${chapTheme.c};">
            <input type="checkbox" value="${ch.fullPath.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''} onchange="cwToggleChapter(this, ${idx})">
            <div style="overflow:hidden; text-overflow:ellipsis;">
                <div style="font-size:10px; color:${chapTheme.c}; font-weight:800; text-transform:uppercase; letter-spacing:0.4px;">${ch.subjLabel}</div>
                <div style="font-size:12.5px;">${chapTheme.i} ${ch.label}</div>
            </div>
        </label>`;
    }).join('');

    cwUpdateSelectedChapCounter();
}

function cwFilterChaptersLive() {
    const input = document.getElementById('cwChapterSearchInput');
    const sugBox = document.getElementById('cwChapterSuggestions');
    if (!input) return;

    let raw = input.value.trim();
    let q = raw.toLowerCase();

    cwRenderChaptersList(raw);

    if (!sugBox) return;
    if (q.length < 1 || cwAvailableChaptersCache.length === 0) {
        sugBox.style.display = 'none';
        return;
    }

    let matches = cwAvailableChaptersCache.filter(ch =>
        ch.label.toLowerCase().includes(q) || ch.subjLabel.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
        sugBox.innerHTML = `<div style="padding:10px 14px; color:var(--text-muted); font-size:12px;">No matching chapter found in selected subject(s).</div>`;
    } else {
        sugBox.innerHTML = matches.map(m => {
            let isSel = cwSelectedChapters.includes(m.fullPath);
            let safePath = m.fullPath.replace(/'/g, "\\'");
            return `
            <div class="cw-chapter-sug-item" onmousedown="cwSelectChapterFromSuggestion('${safePath}')">
                <div>
                    <span style="font-size:10px; color:var(--primary-yellow); font-weight:700; text-transform:uppercase; margin-right:6px;">[${m.subjLabel}]</span>
                    <span>${m.label}</span>
                </div>
                <span style="font-size:11px; font-weight:700; color:${isSel ? 'var(--correct-green)' : 'var(--primary-yellow)'};">
                    ${isSel ? '✓ Selected (Tap to remove)' : '+ Select Only / Add'}
                </span>
            </div>`;
        }).join('');
    }
    sugBox.style.display = 'block';
}

function cwSelectChapterFromSuggestion(fullPath) {
    if (cwSelectedChapters.includes(fullPath)) {
        cwSelectedChapters = cwSelectedChapters.filter(p => p !== fullPath);
    } else {
        if (cwSelectedChapters.length === cwAvailableChaptersCache.length && cwAvailableChaptersCache.length > 1) {
            cwSelectedChapters = [fullPath];
        } else {
            cwSelectedChapters.push(fullPath);
        }
    }
    const input = document.getElementById('cwChapterSearchInput');
    if (input) input.value = '';
    const sugBox = document.getElementById('cwChapterSuggestions');
    if (sugBox) sugBox.style.display = 'none';
    cwRenderChaptersList('');
}

function cwToggleChapter(cbEl, idx) {
    let val = cbEl.value;
    let card = document.getElementById('cwChapCard_' + idx);
    if (cbEl.checked) {
        if (!cwSelectedChapters.includes(val)) cwSelectedChapters.push(val);
        if (card) card.classList.add('selected');
    } else {
        cwSelectedChapters = cwSelectedChapters.filter(p => p !== val);
        if (card) card.classList.remove('selected');
    }
    cwUpdateSelectedChapCounter();
}

function cwSelectAllChapters(selectAll) {
    const input = document.getElementById('cwChapterSearchInput');
    if (input) input.value = '';
    if (selectAll) {
        cwSelectedChapters = cwAvailableChaptersCache.map(c => c.fullPath);
    } else {
        cwSelectedChapters = [];
    }
    cwRenderChaptersList('');
}

async function cwLaunch() {
    if (!cwValidateLimit()) {
        return;
    }

    if (cwSelectedSubjects.length === 0) {
        showNotification("⚠️ Please select at least one Subject.");
        return;
    }

    if (cwSelectedChapters.length === 0) {
        showNotification("⚠️ Please select at least one Chapter.");
        return;
    }

    let targetPaths = [...cwSelectedChapters];

    const cwDiffEl = document.getElementById('cwDiffSelect');
    const cwNumEl = document.getElementById('cwNum');
    cwDiff = cwDiffEl ? cwDiffEl.value : "Mixed";
    cwLimit = parseInt(cwNumEl.value, 10);

    document.body.classList.add('hide-ai-btn');
    document.body.classList.add('hide-bottom-bar');

    const mc = document.getElementById('dynamic-content');
    mc.innerHTML = `<div class="card page-transition cw-wide-card" style="text-align:center; padding: 50px 20px;"><h2 class="section-title" style="justify-content:center;">🔍 Compiling Custom Practice...</h2><p style="color:var(--text-muted);">Fetching ${cwLimit} questions across ${targetPaths.length} selected chapter(s)...</p></div>`;

    try {
        let docsMap = new Map();
        let targetDiffLower = cwDiff.toLowerCase();

        await Promise.all(targetPaths.map(async (p) => {
            const snap = await db.collection("content")
                .where("path", ">=", p)
                .where("path", "<=", p + "\uf8ff")
                .limit(250)
                .get();

            snap.forEach(doc => {
                let d = doc.data();
                if (d.type && d.type !== "mcq") return;

                let docLevelLower = (d.level || "").trim().toLowerCase();
                let pathLeafLower = (d.path || "").split(' > ').pop().trim().toLowerCase();
                let matchesDiff = (cwDiff === "Mixed") || (docLevelLower === targetDiffLower) || (pathLeafLower === targetDiffLower);

                if (matchesDiff) {
                    docsMap.set(doc.id, { id: doc.id, ...d });
                }
            });
        }));

        let allDocs = Array.from(docsMap.values());

        if (allDocs.length === 0) {
            mc.innerHTML = `<div class="card page-transition cw-wide-card" style="text-align:center; padding: 40px 20px;"><h2 class="section-title" style="justify-content:center;">No Questions Found</h2><p style="color:var(--text-muted);">No MCQs found matching your selected chapters and difficulty (${cwDiff}).</p><button class="btn-exam" onclick="cwStep2()" style="margin-top:20px; background:#0d1527; border-color:var(--border-color);">&larr; Adjust Filters</button></div>`;
            return;
        }

        for (let i = allDocs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allDocs[i], allDocs[j]] = [allDocs[j], allDocs[i]];
        }
        allDocs = allDocs.slice(0, cwLimit);
        
        currentQuestions = allDocs; 
        currentQuizPath = `${cwPath} > Custom Practice`;
        currentIndex = 0;
        userAnswers = {};
        timeSpent = {};

        if(typeof renderQuizInterface === 'function') renderQuizInterface();
        if(typeof startQuestionTimer === 'function') startQuestionTimer();
    } catch(err) {
        mc.innerHTML = `<div class="card cw-wide-card"><h2 class="section-title" style="color:var(--wrong-red);">Error</h2><p>${err.message}</p><button class="btn-exam" onclick="cwStep2()">&larr; Back</button></div>`;
    }
}

// ==========================================
// BOOKMARK MANAGER
// ==========================================
async function loadUserBookmarks() {
    if(!currentUser) return;
    try {
        const doc = await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").get();
        if(doc.exists && Array.isArray(doc.data().list)) { userBookmarks = doc.data().list; }
    } catch(e){}
}

async function bookmarkQuestion(qId) {
    if(!currentUser) { showAuthModal(); return; }
    let savedBookmarks = userBookmarks || [];
    if(savedBookmarks.includes(qId)) { showNotification("⚠️ Already bookmarked!"); return; }
    
    savedBookmarks.push(qId);
    userBookmarks = savedBookmarks;
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({
            list: savedBookmarks, lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
        showNotification("🔖 Question saved to Bookmarks!");
        if (typeof renderQuizInterface === 'function' && window.location.hash === '#/quiz') renderQuizInterface();
    } catch(e) { showNotification("❌ Failed to bookmark"); }
}

async function removeBookmark(qId) {
    if(!currentUser) return;
    let savedBookmarks = userBookmarks || [];
    savedBookmarks = savedBookmarks.filter(id => id !== qId);
    userBookmarks = savedBookmarks;
    try {
        await db.collection("users").doc(currentUser.uid).collection("data").doc("bookmarks").set({ list: savedBookmarks }, {merge:true});
        let card = document.getElementById('bmCard_'+qId);
        if(card) card.remove();
        showNotification("🗑 Bookmark removed");
    } catch(e){}
}

async function _initiateBookmarkQuiz() {
    const mc = document.getElementById('dynamic-content');
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / My Bookmarks";
    
    if(!currentUser) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2></div>`; return; }
    let savedBookmarks = userBookmarks || [];
    if(savedBookmarks.length === 0) { mc.innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>🔖 No Bookmarks Yet</h2><p style="color:var(--text-muted);">Questions you bookmark during practice will appear here.</p></div>`; return; }

    mc.innerHTML = `<div class="card page-transition" style="text-align:center; padding:50px;"><h2 class="section-title" style="justify-content:center;">🔖 Loading Bookmarks...</h2></div>`;

    try {
        let allDocs = [];
        for(let i=0; i<savedBookmarks.length; i+=10) {
            let chunk = savedBookmarks.slice(i, i+10);
            let snap = await db.collection("content").where(firebase.firestore.FieldPath.documentId(), "in", chunk).get();
            snap.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
        }

        if(allDocs.length === 0) { mc.innerHTML = `<div class="card"><p>Bookmarks not found in database.</p></div>`; return; }

        let html = `<div class="card page-transition"><h2 class="section-title">🔖 My Bookmarked Questions</h2><div style="background: rgba(33, 150, 243, 0.1); border-left: 3px solid #2196F3; padding: 10px; margin-bottom: 20px; font-size: 13px; border-radius: 4px;"><span style="color: #2196F3;"><b>Tip:</b></span> Use the 'Ask AI' button to instantly resolve any lingering doubts about these saved questions.</div>`;
        
        allDocs.forEach((q) => {
            html += `
            <div class="review-item" id="bmCard_${q.id}">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:var(--text-muted); font-size:12px; font-weight:bold;">${formatCleanTopicTitle((q.path || '').split(' > ').pop())}</span>
                    <button onclick="removeBookmark('${q.id}')" style="background:none; border:none; color:var(--wrong-red); cursor:pointer; font-size:18px;" title="Remove">✕</button>
                </div>
                <div style="font-weight:500; font-size:15px; margin-bottom:15px; color:#fff;" id="bmQ_${q.id}">${q.question}</div>
                ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-height:150px; border-radius:6px; margin-bottom:15px; display:block; border: 1px solid #333;">` : ''}
                
                <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:15px;">
                    ${['A','B','C','D'].map(opt => {
                        let text = q.options ? q.options[opt] : ''; if(!text) return '';
                        let isTrueCorrect = (q.correctAnswers || []).includes(opt);
                        let bg = isTrueCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)";
                        let border = isTrueCorrect ? "var(--correct-green)" : "#1a2744";
                        let color = isTrueCorrect ? "#fff" : "#aaa";
                        return `<div style="background:${bg}; border:1px solid ${border}; color:${color}; padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:center; gap:10px;" id="bmOpt_${q.id}_${opt}">
                            <span style="font-weight:bold; font-size:12px; opacity:0.8;">${opt}</span>${text}
                        </div>`;
                    }).join('')}
                </div>
                
                <button onclick="toggleViewAnswer('bmSol_${q.id}')" style="background:#090e1a; color:white; border:1px solid var(--border-color); padding:8px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">👁 View Explanation</button>
                
                <div id="bmSol_${q.id}" class="quiz-explanation">
                    <strong style="color:var(--primary-yellow); display:block; margin-bottom:8px;">Explanation:</strong>
                    <span id="bmExp_${q.id}">${q.explanation || "No detailed explanation provided by the author."}</span>
                </div>
            </div>`;
        });
        
        html += `</div>`;
        mc.innerHTML = html;

        const mathDelims = [ {left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\(', right: '\\)', display: false}, {left: '[', right: ']', display: true} ];
        allDocs.forEach(q => {
            let elQ = document.getElementById('bmQ_'+q.id); if(elQ && typeof renderMathInElement === 'function') renderMathInElement(elQ, { delimiters: mathDelims, throwOnError: false });
            ['A','B','C','D'].forEach(opt => {
                let elO = document.getElementById(`bmOpt_${q.id}_${opt}`); if(elO && typeof renderMathInElement === 'function') renderMathInElement(elO, { delimiters: mathDelims, throwOnError: false });
            });
            let elE = document.getElementById('bmExp_'+q.id); if(elE && typeof renderMathInElement === 'function') renderMathInElement(elE, { delimiters: mathDelims, throwOnError: false });
        });

    } catch(e) { mc.innerHTML = `<div class="card"><p>Error: ${e.message}</p></div>`; }
}

// ==========================================
// MODAL, REPORTS, RATING & SEARCH FUNCTIONS
// ==========================================
let currentRating = 0;
let savedUserRating = 0;
let savedUserFeedback = "";

function syncUserRatingUI(rating, feedbackText = "") {
    let r = Number(rating);
    if (!r || r < 1 || r > 5) return;
    savedUserRating = r;
    savedUserFeedback = feedbackText || "";
    localStorage.setItem('mcqs_user_rating', String(r));
    if (feedbackText) localStorage.setItem('mcqs_user_feedback', feedbackText);

    updateStarUI(r);

    const rateBtn = document.querySelector('.nav-rating-badge button');
    if (rateBtn) {
        rateBtn.innerText = `Rated ${r}★`;
    }
}

async function loadGlobalRating() {
    const localR = Number(localStorage.getItem('mcqs_user_rating') || 0);
    const localFb = localStorage.getItem('mcqs_user_feedback') || '';
    if (localR >= 1 && localR <= 5) {
        syncUserRatingUI(localR, localFb);
    }

    try {
        let ratingsMap = new Map();

        try {
            const pfSnap = await db.collection("platform_feedback").limit(200).get();
            pfSnap.forEach(doc => {
                let d = doc.data();
                let uid = d.studentId || d.userId || doc.id;
                let r = Number(d.rating);
                if (r >= 1 && r <= 5) {
                    ratingsMap.set(uid, r);
                    if (currentUser && uid === currentUser.uid) {
                        syncUserRatingUI(r, d.feedback || d.text || '');
                    }
                }
            });
        } catch (e) {}

        try {
            const usersSnap = await db.collection("users").limit(200).get();
            usersSnap.forEach(doc => {
                let d = doc.data();
                let r = Number(d.rating);
                if (r >= 1 && r <= 5) {
                    ratingsMap.set(doc.id, r);
                    if (currentUser && doc.id === currentUser.uid) {
                        syncUserRatingUI(r, d.feedback || '');
                    }
                }
            });
        } catch (e) {}

        let sum = 0;
        ratingsMap.forEach(val => { sum += val; });
        let count = ratingsMap.size;

        if (count > 0) {
            const el = document.getElementById('global-rating-display');
            if (el) el.innerText = (sum / count).toFixed(1);
        }
    } catch (e) {}
}

function openFeedbackModal() {
    if (savedUserRating > 0) {
        updateStarUI(savedUserRating);
        const fbInput = document.getElementById('platformFeedbackText');
        if (fbInput && !fbInput.value && savedUserFeedback) {
            fbInput.value = savedUserFeedback;
        }
        const submitBtn = document.getElementById('submitFeedbackBtn');
        if (submitBtn) submitBtn.innerText = "Update Rating & Feedback";
    }
    document.getElementById('feedbackModal').style.display = 'flex';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

function updateStarUI(rating) {
    currentRating = rating;
    for(let i=1; i<=5; i++) {
        const btn = document.getElementById('star-'+i);
        if(btn) {
            btn.classList.toggle('active', i <= rating);
            btn.style.color = i <= rating ? '#fdb813' : '#3b4961';
            btn.style.fontSize = i <= rating ? '34px' : '30px';
        }
    }
}

async function submitPlatformFeedback() {
    const text = document.getElementById('platformFeedbackText').value.trim();
    if(currentRating === 0) { showNotification("⚠️ Please select a star rating (1 to 5)"); return; }
    if(!text) { showNotification("⚠️ Please enter a short feedback message"); return; }

    const btn = document.getElementById('submitFeedbackBtn');
    if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

    try {
        let activeUser = currentUser || window.currentUser;
        let uid = activeUser ? activeUser.uid : ('guest_' + Date.now());

        await db.collection("platform_feedback").doc(uid).set({
            rating: currentRating,
            feedback: text,
            text: text,
            studentId: uid,
            userId: uid,
            studentName: activeUser ? (activeUser.displayName || activeUser.email) : 'Guest Student',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        if (activeUser && activeUser.uid) {
            await db.collection("users").doc(activeUser.uid).set({
                rating: currentRating,
                feedback: text,
                feedbackUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        syncUserRatingUI(currentRating, text);
        await loadGlobalRating();

        showNotification("✅ Thank you! Your rating & feedback have been saved.");
        closeFeedbackModal();
    } catch(e) {
        showNotification("❌ Failed to submit feedback: " + e.message);
    }
    if (btn) { btn.innerText = savedUserRating > 0 ? "Update Rating & Feedback" : "Submit"; btn.disabled = false; }
}

let activeReportPayload = { questionId: '', questionText: '', path: '' };

function openReportModal(questionId, questionText = '', path = '') {
    if ((!questionText || !path) && typeof currentQuestions !== 'undefined') {
        let found = currentQuestions.find(q => q.id === questionId);
        if (found) {
            questionText = found.question || '';
            path = found.path || '';
        }
    }
    activeReportPayload = { questionId, questionText, path };
    const descEl = document.getElementById('reportDescription');
    if (descEl) descEl.value = '';
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'flex';
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
}

async function submitReport() {
    if (!activeReportPayload.questionId) { closeReportModal(); return; }
    const reason = document.getElementById('reportReason').value;
    const description = document.getElementById('reportDescription').value.trim();

    try {
        await db.collection("reported_mistakes").add({
            questionId: activeReportPayload.questionId,
            questionText: activeReportPayload.questionText,
            path: activeReportPayload.path,
            reason: reason,
            description: description,
            studentId: currentUser ? currentUser.uid : 'anonymous',
            studentName: currentUser ? (currentUser.displayName || currentUser.email) : 'Guest Student',
            status: 'pending',
            seenByStudent: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("🚨 Report submitted! Admin will review this question.");
        closeReportModal();
    } catch (e) {
        showNotification("❌ Failed to submit report: " + e.message);
    }
}

async function openUserReportsModal() {
    const modal = document.getElementById('userReportsModal');
    const listEl = document.getElementById('user-reports-list');
    if (!modal || !listEl) return;
    modal.style.display = 'flex';

    if (!currentUser) {
        listEl.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Please sign in to track your submitted reports.</p>`;
        return;
    }

    listEl.innerHTML = `<p style="color:var(--primary-yellow); text-align:center; padding:20px;">Loading your reports...</p>`;
    try {
        const snap = await db.collection("reported_mistakes")
            .where("studentId", "==", currentUser.uid)
            .get();

        if (snap.empty) {
            listEl.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">You haven't reported any questions yet.</p>`;
            return;
        }

        let items = [];
        let unseenBatch = db.batch();
        let hasUnseen = false;

        snap.forEach(doc => {
            let d = doc.data();
            items.push({ id: doc.id, ...d });
            if (d.seenByStudent === false) {
                unseenBatch.update(doc.ref, { seenByStudent: true });
                hasUnseen = true;
            }
        });

        items.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        listEl.innerHTML = items.map(r => {
            let isResolved = r.status === 'resolved';
            let statusBadge = isResolved
                ? `<span style="background:rgba(16,185,129,0.15); color:var(--correct-green); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">✅ Resolved by Admin</span>`
                : `<span style="background:rgba(253,184,19,0.15); color:var(--primary-yellow); padding:3px 8px; border-radius:6px; font-size:11px; font-weight:bold;">⏳ Under Review</span>`;
            return `
            <div style="background:#090e1a; border:1px solid var(--border-color); border-radius:8px; padding:14px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:11px; color:var(--text-muted);">${r.path || 'General'}</span>
                    ${statusBadge}
                </div>
                <div style="font-size:13px; color:#fff; font-weight:600; margin-bottom:6px;">${r.questionText || 'Reported Question'}</div>
                <div style="font-size:12px; color:var(--wrong-red);">Issue: ${r.reason} ${r.description ? `— ${r.description}` : ''}</div>
            </div>`;
        }).join('');

        if (hasUnseen) {
            await unseenBatch.commit();
            const profileDot = document.getElementById('profileNotifDot');
            const reportDot = document.getElementById('reportMenuDot');
            if (profileDot) profileDot.style.display = 'none';
            if (reportDot) reportDot.style.display = 'none';
        }
    } catch (e) {
        listEl.innerHTML = `<p style="color:var(--wrong-red); text-align:center;">Error loading reports: ${e.message}</p>`;
    }
}

function closeUserReportsModal() {
    const modal = document.getElementById('userReportsModal');
    if (modal) modal.style.display = 'none';
}

function openStreakModal() {
    const streakDisplay = document.getElementById('nav-streak-display');
    const modalCount = document.getElementById('modalStreakCount');
    if(streakDisplay && modalCount) modalCount.innerText = streakDisplay.innerText;
    document.getElementById('streakModal').style.display = 'flex';
}
function closeStreakModal() {
    document.getElementById('streakModal').style.display = 'none';
}

function openSearch() {
    const wrapper = document.getElementById('searchWrapper');
    if(wrapper) {
        wrapper.classList.add('active');
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }
}
function closeSearch() {
    const wrapper = document.getElementById('searchWrapper');
    const suggestions = document.getElementById('searchSuggestions');
    if(wrapper) wrapper.classList.remove('active');
    if(suggestions) suggestions.style.display = 'none';
}
let searchTimeout;
function delayCloseSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const wrapper = document.getElementById('searchWrapper');
        if(wrapper && !wrapper.contains(document.activeElement)) {
            closeSearch();
        }
    }, 250);
}
async function handleLiveSearch() {
    const rawQuery = document.getElementById('searchInput').value.trim();
    const suggestions = document.getElementById('searchSuggestions');
    if(!suggestions) return;

    if(rawQuery.length < 2) {
        suggestions.style.display = 'none';
        return;
    }

    const qLower = rawQuery.toLowerCase();
    let html = '';

    let topicMatchesMap = new Map();
    let deletedSet = new Set((topicOverrides && topicOverrides.deletedPaths) || []);

    function scanTopics(obj, pathArr = []) {
        for (let k in obj) {
            if (k === "Daily Quiz Challenge") continue;
            let nextPath = [...pathArr, k];
            let fullStr = nextPath.join(' > ');
            if (deletedSet.has(fullStr)) continue;
            if (k.toLowerCase().includes(qLower)) {
                topicMatchesMap.set(fullStr, nextPath);
            }
            if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
                scanTopics(obj[k], nextPath);
            }
        }
    }
    scanTopics(appData);

    Object.keys(customTopicTypes).forEach(fullStr => {
        if (deletedSet.has(fullStr) || fullStr.startsWith("Daily Quiz Challenge")) return;
        let parts = fullStr.split(' > ').filter(Boolean);
        let leaf = parts[parts.length - 1] || '';
        if (leaf.toLowerCase().includes(qLower) && !topicMatchesMap.has(fullStr)) {
            topicMatchesMap.set(fullStr, parts);
        }
    });

    Array.from(topicMatchesMap.values()).slice(0, 6).forEach((pathArr) => {
        let fullStr = pathArr.join(' > ');
        let leaf = formatCleanTopicTitle(pathArr[pathArr.length - 1]);
        let smartIcon = getAutomaticIconForName(leaf, null, fullStr);
        let encodedPath = pathArr.map(encodeURIComponent).join('/');
        html += `<div class="search-result-item" onmousedown="window.location.hash='#/path/${encodedPath}'; closeSearch();">
            <div style="font-size:13px; color:var(--primary-yellow); font-weight:700; margin-bottom:2px;">${smartIcon} ${leaf}</div>
            <div style="font-size:11px; color:var(--text-muted);">${pathArr.map(s => formatCleanTopicTitle(s)).join(' > ')}</div>
        </div>`;
    });

    try {
        const snap = await db.collection("content")
            .where("question", ">=", rawQuery)
            .where("question", "<=", rawQuery + "\uf8ff")
            .limit(8)
            .get();

        snap.forEach(doc => {
            const data = doc.data();
            if (!data.path || !data.question) return;
            const cleanPath = formatCleanTopicTitle(data.path.split(' > ').pop());
            const encodedPath = data.path.split(' > ').map(encodeURIComponent).join('/');
            html += `<div class="search-result-item" onmousedown="window.location.hash='#/path/${encodedPath}'; closeSearch();">
                <div style="font-size:13px; color:#fff; margin-bottom:4px;">📝 ${data.question.substring(0, 65)}${data.question.length > 65 ? '...' : ''}</div>
                <div style="font-size:11px; color:var(--text-muted);">${cleanPath}</div>
            </div>`;
        });
    } catch(e) {
        console.error("Search error:", e);
    }

    if (!html) {
        html = `<div style="padding:14px 18px; color:var(--text-muted); font-size:13px;">No matching chapters or questions found.</div>`;
    }

    suggestions.innerHTML = html;
    suggestions.style.display = 'block';
}

// ==========================================
// 7. COMPLETE ARCHITECTURAL UI SUITE (QUIZ BACK-BAR, MODERNIZED ANALYTICS & LEADERBOARDS,
//    FLOATING CENTER PILL NAV, ANTI-CHEAT AI HIDER, COLOR-CODED DIAGNOSTICS & STREAK ENGINE)
// ==========================================
(function initMCQsPrepCompleteModernSuiteV10() {
    if (window._mcqsCompleteModernSuiteLoadedV10) return;
    window._mcqsCompleteModernSuiteLoadedV10 = true;

    function injectCompleteModernSuiteStyles() {
        if (document.getElementById('mcqs-complete-modern-styles-v10')) return;
        const st = document.createElement('style');
        st.id = 'mcqs-complete-modern-styles-v10';
        st.textContent = `
            /* ==========================================
               1. GLOBAL OVERFLOW GUARD & VIEWPORT FIXED RESET
               ========================================== */
            html, body {
                max-width: 100vw !important;
                overflow-x: hidden !important;
                box-sizing: border-box !important;
                transform: none !important;
                perspective: none !important;
                filter: none !important;
                backdrop-filter: none !important;
            }
            *, *::before, *::after {
                box-sizing: border-box;
            }

            /* ==========================================
               2. QUESTION PRACTICE PAGE: HIDE MAIN NAVBAR & ASK AI, SHOW QUIZ BACK BAR (FIXES IMAGE 1)
               ========================================== */
            body.mcqs-quiz-screen-active .navbar,
            body.mcqs-quiz-screen-active #mcqsWebCenterNavPills,
            body.mcqs-quiz-screen-active #breadcrumb-text,
            body.mcqs-quiz-screen-active .mobile-web-subnav,
            body.mcqs-quiz-screen-active #dynamic-back-container,
            body.mcqs-quiz-screen-active #ai-floating-btn,
            body.mcqs-quiz-screen-active #mobileAppDock {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            body.mcqs-quiz-screen-active .container {
                padding-top: 14px !important;
            }

            /* Dedicated Quiz Top Navigation & Back Bar */
            .mcqs-quiz-top-backbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
                background: linear-gradient(145deg, #0f1629, #090d18);
                border: 1.5px solid rgba(253, 184, 19, 0.38);
                border-radius: 14px;
                padding: 10px 16px;
                margin-bottom: 14px;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
            }
            .mcqs-quiz-exit-btn {
                background: rgba(253, 184, 19, 0.16);
                color: #fdb813;
                border: 1.5px solid rgba(253, 184, 19, 0.55);
                padding: 7px 14px;
                border-radius: 999px;
                font-size: 12.5px;
                font-weight: 900;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.18s ease;
                font-family: inherit;
            }
            .mcqs-quiz-exit-btn:hover {
                background: #fdb813;
                color: #000000;
                transform: translateX(-2px);
            }

            /* Hide Ask AI button in any Practice Paper / Mock Test folder */
            body.hide-ai-btn #ai-floating-btn,
            body.mcqs-anti-cheat-active #ai-floating-btn,
            html.is-standalone-pwa body.hide-ai-btn #ai-floating-btn,
            html.is-standalone-pwa body.mcqs-anti-cheat-active #ai-floating-btn {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            body.mcqs-anti-cheat-active .ai-tab-inner {
                opacity: 0.25 !important;
                pointer-events: none !important;
            }

            /* ==========================================
               3. NORMAL SCROLLING TOP BAR + BODY-LEVEL FLOATING CENTER PILL BAR
               ========================================== */
            @media (min-width: 861px) {
                body {
                    padding-top: 0 !important;
                }
                .navbar {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    z-index: 4000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    gap: 12px !important;
                    height: 62px !important;
                    padding: 0 22px !important;
                    width: 100% !important;
                    background: rgba(7, 10, 19, 0.92) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.07) !important;
                }
                .nav-left, .nav-right {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    flex-shrink: 0 !important;
                }
                .nav-badges-group {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    flex-shrink: 0 !important;
                }
                .nav-right > .nav-link-item {
                    display: none !important;
                }
                html.is-standalone-pwa .navbar .hide-in-app-mode:not(.nav-link-item):not(#installAppBtn),
                html.is-standalone-pwa body:not(.hide-ai-btn):not(.mcqs-anti-cheat-active):not(.mcqs-quiz-screen-active) #ai-floating-btn {
                    display: inline-flex !important;
                }

                /* Mounted directly on document.body so it floats 100% of the time on scroll */
                #mcqsWebCenterNavPills {
                    position: fixed !important;
                    top: 11px !important;
                    left: 50%;
                    transform: translateX(-50%);
                    transform-origin: center center;
                    z-index: 99990 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 2px !important;
                    background: rgba(13, 18, 30, 0.95) !important;
                    backdrop-filter: blur(18px) !important;
                    -webkit-backdrop-filter: blur(18px) !important;
                    border: 1.5px solid rgba(253, 184, 19, 0.42) !important;
                    border-radius: 999px !important;
                    padding: 4px 6px !important;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(253, 184, 19, 0.16) !important;
                    white-space: nowrap !important;
                    transition: left 0.12s ease, transform 0.12s ease, opacity 0.18s ease !important;
                }
                body.admin-mode #mcqsWebCenterNavPills {
                    display: none !important;
                }
                @media (max-width: 1320px) {
                    body.mcqs-search-open #mcqsWebCenterNavPills {
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }
                }
            }

            /* Mobile Navbar Safety */
            @media (max-width: 860px) {
                body {
                    padding-top: 0 !important;
                }
                .navbar {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 4000 !important;
                    width: 100% !important;
                    max-width: 100vw !important;
                    height: 56px !important;
                    padding: 0 12px !important;
                    gap: 6px !important;
                    background: rgba(6, 9, 17, 0.95) !important;
                    backdrop-filter: blur(14px) !important;
                }
                .nav-left {
                    min-width: 0 !important;
                    flex-shrink: 1 !important;
                    gap: 6px !important;
                }
                .nav-right {
                    flex-shrink: 0 !important;
                    gap: 6px !important;
                }
                #mcqsWebCenterNavPills {
                    display: none !important;
                }
            }

            .web-nav-pill-btn {
                background: transparent;
                border: none;
                color: #cbd5e1;
                font-size: 12px;
                font-weight: 700;
                padding: 5px 10px;
                border-radius: 999px;
                cursor: pointer;
                transition: all 0.18s ease;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-family: inherit;
                white-space: nowrap;
            }
            .web-nav-pill-btn:hover {
                color: #ffffff;
                background: rgba(255, 255, 255, 0.08);
            }
            .web-nav-pill-cta {
                background: linear-gradient(135deg, #fdb813, #f59e0b) !important;
                color: #000000 !important;
                font-weight: 800 !important;
                padding: 5px 12px !important;
                box-shadow: 0 0 14px rgba(253, 184, 19, 0.35);
            }
            .web-courses-dropdown-wrap {
                position: relative;
            }
            .web-courses-dropdown-menu {
                display: none;
                position: absolute;
                top: calc(100% + 10px);
                left: 0;
                min-width: 250px;
                background: #0d1322;
                border: 1px solid rgba(253, 184, 19, 0.45);
                border-radius: 14px;
                padding: 8px;
                box-shadow: 0 20px 45px rgba(0, 0, 0, 0.92);
                z-index: 99999;
            }
            .web-courses-dropdown-wrap:hover .web-courses-dropdown-menu,
            .web-courses-dropdown-wrap.open .web-courses-dropdown-menu {
                display: block;
            }
            .web-course-drop-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                padding: 10px 12px;
                border-radius: 10px;
                color: #f1f5f9;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                transition: background 0.15s ease;
            }
            .web-course-drop-item:hover {
                background: rgba(253, 184, 19, 0.15);
                color: #fdb813;
            }

            /* ==========================================
               4. COMPACT, SINGLE-BORDER SEARCH BAR
               ========================================== */
            #searchWrapper {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 0 0 auto !important;
                box-shadow: none !important;
                width: auto !important;
                flex-shrink: 0 !important;
            }
            #searchWrapper.active .search-icon-btn {
                display: none !important;
            }
            #searchWrapper:not(.active) .search-input-container {
                display: none !important;
            }
            #searchWrapper.active .search-input-container {
                position: relative !important;
                top: auto !important;
                right: auto !important;
                left: auto !important;
                bottom: auto !important;
                transform: none !important;
                display: inline-flex !important;
                align-items: center !important;
                width: 210px !important;
                height: 34px !important;
                background: #0d1322 !important;
                border: 1.5px solid #fdb813 !important;
                border-radius: 999px !important;
                padding: 0 6px 0 12px !important;
                margin: 0 !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.55) !important;
                box-sizing: border-box !important;
            }
            #searchWrapper.active #searchInput {
                flex: 1 1 auto !important;
                width: 100% !important;
                min-width: 0 !important;
                height: 100% !important;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
                color: #ffffff !important;
                font-size: 12.5px !important;
                font-weight: 500 !important;
                padding: 0 6px 0 0 !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            #searchWrapper.active .search-close-btn {
                position: static !important;
                transform: none !important;
                background: rgba(239, 68, 68, 0.18) !important;
                color: #ef4444 !important;
                border: 1px solid rgba(239, 68, 68, 0.38) !important;
                width: 21px !important;
                height: 21px !important;
                border-radius: 50% !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                flex-shrink: 0 !important;
                font-size: 10.5px !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            #searchWrapper.active #searchSuggestions {
                position: absolute !important;
                top: calc(100% + 8px) !important;
                right: 0 !important;
                left: auto !important;
                width: 330px !important;
                max-width: 92vw !important;
                background: #0d1527 !important;
                border: 1px solid rgba(253, 184, 19, 0.45) !important;
                border-radius: 12px !important;
                box-shadow: 0 18px 45px rgba(0, 0, 0, 0.92) !important;
                max-height: 350px !important;
                overflow-y: auto !important;
                z-index: 9999 !important;
            }
            @media (max-width: 860px) {
                #searchWrapper.active {
                    position: fixed !important;
                    top: 9px !important;
                    left: 12px !important;
                    right: 12px !important;
                    width: calc(100vw - 24px) !important;
                    z-index: 99999 !important;
                }
                #searchWrapper.active .search-input-container {
                    width: 100% !important;
                    height: 38px !important;
                }
                #searchWrapper.active #searchSuggestions {
                    left: 0 !important;
                    right: 0 !important;
                    width: 100% !important;
                }
            }

            #loginNavBtn {
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                padding: 7px 14px !important;
                border-radius: 999px !important;
                font-weight: 800 !important;
                font-size: 12.5px !important;
                background: #fdb813 !important;
                color: #000000 !important;
                border: none !important;
                box-shadow: 0 4px 14px rgba(253, 184, 19, 0.35) !important;
                align-items: center !important;
                gap: 6px !important;
                cursor: pointer !important;
            }
            #loginNavBtn img {
                width: 15px !important;
                height: 15px !important;
                background: #fff;
                border-radius: 50%;
                padding: 2px;
            }

            /* ==========================================
               5. CONTAINER & HOME / INNER WORKSPACE LAYOUT
               ========================================== */
            .container {
                width: 100% !important;
                max-width: 1400px !important;
                margin: 0 auto !important;
                padding: 0 24px 100px 24px !important;
                box-sizing: border-box !important;
                display: block !important;
            }
            .main-content, #dynamic-content {
                width: 100% !important;
                max-width: 100% !important;
                min-width: 0 !important;
                box-sizing: border-box !important;
            }
            #main-sidebar {
                display: none !important;
            }
            @media (max-width: 768px) {
                .container {
                    padding: 0 12px 105px 12px !important;
                }
            }

            .mcqs-home-master-stack {
                display: flex;
                flex-direction: column;
                gap: 22px;
                width: 100%;
                max-width: 100%;
            }
            .mcqs-tier-hero { order: 1; min-width: 0; width: 100%; }
            .mcqs-tier-workspaces { order: 2; min-width: 0; width: 100%; }
            .mcqs-tier-studios { order: 3; min-width: 0; width: 100%; }

            .mcqs-arch-surface {
                position: relative;
                width: 100%;
                max-width: 100%;
                min-width: 0;
                background-color: #080b12;
                background-image:
                    radial-gradient(circle at 78% 20%, rgba(253, 184, 19, 0.13) 0%, transparent 52%),
                    radial-gradient(circle at 16% 82%, rgba(56, 189, 248, 0.09) 0%, transparent 48%),
                    linear-gradient(to right, rgba(255, 255, 255, 0.026) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.026) 1px, transparent 1px);
                background-size: 100% 100%, 100% 100%, 46px 46px, 46px 46px;
                border: 1px solid rgba(253, 184, 19, 0.28);
                border-radius: 20px;
                padding: 26px 28px;
                box-shadow: 0 18px 50px rgba(0, 0, 0, 0.65);
                box-sizing: border-box;
            }
            .mcqs-hero-grid {
                display: grid;
                grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
                gap: 26px;
                align-items: stretch;
                width: 100%;
            }
            .mcqs-hero-left-col {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-width: 0;
            }
            .mcqs-status-pill {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(253, 184, 19, 0.42);
                border-radius: 999px;
                padding: 5px 13px;
                font-size: 11.5px;
                font-weight: 800;
                color: #e2e8f0;
                margin-bottom: 12px;
                max-width: 100%;
                flex-wrap: wrap;
            }
            .mcqs-pulse-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #fdb813;
                box-shadow: 0 0 10px #fdb813;
                flex-shrink: 0;
                animation: mcqsPulseAnim 1.5s infinite alternate;
            }
            .mcqs-hero-title {
                font-size: clamp(24px, 3.1vw, 42px);
                font-weight: 900;
                line-height: 1.1;
                letter-spacing: -0.6px;
                color: #ffffff;
                margin: 0 0 12px 0;
            }
            .mcqs-gold-word {
                color: #fdb813;
                text-shadow: 0 0 24px rgba(253, 184, 19, 0.35);
                display: inline-block;
                transition: opacity 0.24s ease, transform 0.24s ease;
            }
            .mcqs-hero-desc {
                color: #94a3b8;
                font-size: 13.8px;
                line-height: 1.6;
                margin: 0 0 18px 0;
            }
            .mcqs-cta-row {
                display: flex;
                flex-wrap: nowrap;
                gap: 8px;
                margin-bottom: 18px;
            }
            .mcqs-btn-gold {
                background: linear-gradient(135deg, #fdb813 0%, #f59e0b 100%);
                color: #000000;
                border: none;
                padding: 10px 15px;
                border-radius: 11px;
                font-size: 12.5px;
                font-weight: 900;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                white-space: nowrap;
                box-shadow: 0 8px 22px rgba(253, 184, 19, 0.3);
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }
            .mcqs-btn-gold:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(253, 184, 19, 0.45);
            }
            .mcqs-btn-glass {
                background: rgba(255, 255, 255, 0.05);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.16);
                padding: 10px 14px;
                border-radius: 11px;
                font-size: 12.5px;
                font-weight: 800;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                white-space: nowrap;
                transition: all 0.18s ease;
            }
            .mcqs-btn-glass:hover {
                border-color: #38bdf8;
                background: rgba(56, 189, 248, 0.12);
                color: #38bdf8;
            }
            .mcqs-kpi-strip {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 8px;
                padding-top: 14px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
            }
            .mcqs-kpi-box {
                background: rgba(15, 23, 42, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 8px 10px;
                min-width: 0;
            }
            .mcqs-kpi-val {
                font-size: 14.5px;
                font-weight: 900;
                color: #ffffff;
            }
            .mcqs-kpi-lbl {
                font-size: 10px;
                color: #94a3b8;
                margin-top: 2px;
                font-weight: 600;
            }

            /* Diagnostic Window */
            .mcqs-diag-window {
                position: relative;
                background: #0f131d;
                border: 1.5px solid rgba(253, 184, 19, 0.38);
                border-radius: 16px;
                padding: 20px 16px 16px 16px;
                box-shadow: 0 18px 45px rgba(0, 0, 0, 0.78);
                height: 100%;
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .mcqs-diag-floating-badge {
                position: absolute;
                top: -12px;
                left: 16px;
                background: #171c2b;
                border: 1.5px solid #fdb813;
                border-radius: 999px;
                padding: 3px 12px;
                font-size: 11px;
                font-weight: 800;
                color: #f8fafc;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.8);
                z-index: 5;
                max-width: calc(100% - 32px);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .mcqs-exam-tab-row {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                padding-bottom: 8px;
                margin: 6px 0 10px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .mcqs-exam-tab-pill {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #94a3b8;
                padding: 5px 11px;
                border-radius: 7px;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
                transition: 0.18s;
            }
            .mcqs-exam-tab-pill.active {
                background: rgba(253, 184, 19, 0.18);
                border-color: #fdb813;
                color: #fdb813;
            }
            .mcqs-diag-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
                gap: 10px;
                width: 100%;
            }
            .mcqs-diag-subcard {
                background: #151a28;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 12px;
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            /* Home Exam Workspaces + Quick Links */
            .mcqs-home-workspace-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.42fr) minmax(0, 0.58fr);
                gap: 20px;
                align-items: stretch;
                width: 100%;
            }
            .mcqs-exam-cards-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
                width: 100%;
            }
            .mcqs-modern-exam-card {
                background: linear-gradient(155deg, rgba(21, 28, 46, 0.96), rgba(11, 15, 26, 0.98));
                border: 1.5px solid var(--exam-border, rgba(255, 255, 255, 0.12));
                border-left: 5px solid var(--exam-color, #fdb813);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.42);
                transition: transform 0.18s ease, box-shadow 0.18s ease;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                cursor: pointer;
                min-width: 0;
                max-width: 100%;
                overflow: hidden;
            }
            .mcqs-modern-exam-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px var(--exam-glow, rgba(253, 184, 19, 0.22));
            }
            .mcqs-subfolder-chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                width: 100%;
            }
            .mcqs-subfolder-chip {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.14);
                color: #f1f5f9;
                padding: 5px 10px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s ease;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                max-width: 100%;
            }
            .mcqs-subfolder-chip:hover {
                background: var(--exam-bg, rgba(253, 184, 19, 0.18));
                border-color: var(--exam-color, #fdb813);
                color: #ffffff;
            }

            .mcqs-links-list-grid {
                display: flex;
                flex-direction: column;
                gap: 9px;
                width: 100%;
            }
            .mcqs-modern-link-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                background: linear-gradient(145deg, var(--link-bg, rgba(56,189,248,0.12)), rgba(13, 19, 34, 0.96));
                border: 1px solid var(--link-border, rgba(56,189,248,0.4));
                border-left: 4px solid var(--link-color, #38bdf8);
                border-radius: 12px;
                padding: 11px 14px;
                cursor: pointer;
                min-width: 0;
                width: 100%;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .mcqs-modern-link-item:hover {
                transform: translateX(3px);
                box-shadow: 0 6px 16px var(--link-glow, rgba(56,189,248,0.22));
            }

            /* Custom Mock Studio & Smart Mistake Clinic Split Grid */
            .mcqs-studios-split-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 20px;
                align-items: stretch;
                width: 100%;
                margin-bottom: 20px;
            }
            .mcqs-studio-box, .mcqs-clinic-box {
                background: linear-gradient(150deg, rgba(19, 25, 42, 0.98), rgba(10, 14, 24, 0.99));
                border: 1.5px solid rgba(253, 184, 19, 0.4);
                border-radius: 18px;
                padding: 20px;
                box-shadow: 0 14px 34px rgba(0, 0, 0, 0.52);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-width: 0;
                max-width: 100%;
            }
            .mcqs-clinic-box {
                border-color: rgba(56, 189, 248, 0.42);
            }
            .mcqs-clinic-modes-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 14px;
            }
            .mcqs-studio-pill-group {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                margin-top: 6px;
            }
            .mcqs-studio-opt-pill {
                background: #0b101d;
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #cbd5e1;
                padding: 6px 11px;
                border-radius: 8px;
                font-size: 11.5px;
                font-weight: 800;
                cursor: pointer;
                transition: 0.15s;
            }
            .mcqs-studio-opt-pill.active {
                background: #fdb813;
                color: #000000;
                border-color: #fdb813;
            }

            /* ==========================================
               6. INNER FOLDER COMMAND HEADER & SUBTOPIC CARDS
               ========================================== */
            .mcqs-inner-command-header {
                background-color: #080b12;
                background-image:
                    radial-gradient(circle at 85% 20%, rgba(253, 184, 19, 0.14) 0%, transparent 50%),
                    linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
                background-size: 100% 100%, 44px 44px, 44px 44px;
                border: 1px solid rgba(253, 184, 19, 0.32);
                border-radius: 18px;
                padding: 20px 24px;
                margin-bottom: 18px;
                box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
            }
            .mcqs-crumb-bar {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 12px;
            }
            .mcqs-crumb-pill {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.11);
                color: #cbd5e1;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 11.5px;
                font-weight: 700;
                cursor: pointer;
                transition: 0.15s;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            .mcqs-crumb-pill:hover {
                border-color: #fdb813;
                color: #fdb813;
                background: rgba(253, 184, 19, 0.12);
            }
            .mcqs-crumb-pill.active {
                background: rgba(253, 184, 19, 0.16);
                border-color: rgba(253, 184, 19, 0.55);
                color: #fdb813;
                font-weight: 800;
            }

            .mcqs-inner-subtopics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
                gap: 15px;
                width: 100%;
            }
            .mcqs-modern-subtopic-card {
                background: linear-gradient(155deg, rgba(20, 27, 45, 0.96) 0%, rgba(10, 14, 24, 0.99) 100%) !important;
                border: 1.5px solid var(--topic-border, rgba(255, 255, 255, 0.12)) !important;
                border-left: 5px solid var(--topic-color, #fdb813) !important;
                border-radius: 16px !important;
                padding: 16px 18px !important;
                box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45) !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                align-items: stretch !important;
                text-align: left !important;
                cursor: pointer !important;
                min-width: 0 !important;
                width: 100% !important;
                height: auto !important;
                transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease !important;
            }
            .mcqs-modern-subtopic-card:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 14px 32px var(--topic-glow, rgba(253, 184, 19, 0.25)) !important;
            }

            /* ==========================================
               7. MODERNIZED MCQ PRACTICE QUESTION PRESENTATION (#/quiz)
               ========================================== */
            .quiz-header {
                background: #0b0f1a !important;
                border: 1px solid rgba(253, 184, 19, 0.28) !important;
                border-radius: 14px !important;
                padding: 12px 16px !important;
                margin-bottom: 14px !important;
            }
            .question-text, #question-text {
                background: linear-gradient(155deg, #111728 0%, #0b0f1a 100%);
                border: 1px solid rgba(255, 255, 255, 0.09);
                border-left: 4px solid #fdb813;
                border-radius: 14px;
                padding: 18px 20px !important;
                font-size: 16px !important;
                line-height: 1.7 !important;
                color: #f8fafc !important;
                margin-bottom: 16px !important;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            }
            .option-btn, .quiz-option {
                background: linear-gradient(145deg, #131a2c, #0d1220) !important;
                border: 1.5px solid rgba(255, 255, 255, 0.11) !important;
                border-radius: 13px !important;
                padding: 14px 16px !important;
                margin-bottom: 10px !important;
                font-size: 14.5px !important;
                line-height: 1.55 !important;
                color: #e2e8f0 !important;
                transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
            }
            .option-btn:hover:not(:disabled), .quiz-option:hover:not(:disabled) {
                transform: translateX(4px) !important;
                border-color: rgba(253, 184, 19, 0.65) !important;
                box-shadow: 0 6px 20px rgba(253, 184, 19, 0.15) !important;
            }
            .quiz-explanation {
                background: linear-gradient(155deg, rgba(16, 185, 129, 0.08), rgba(11, 15, 26, 0.98)) !important;
                border: 1.5px solid rgba(16, 185, 129, 0.4) !important;
                border-left: 5px solid #10b981 !important;
                border-radius: 14px !important;
                padding: 16px 18px !important;
                margin-top: 16px !important;
                color: #e2e8f0 !important;
                line-height: 1.65 !important;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45) !important;
            }

            @keyframes mcqsPulseAnim {
                0% { transform: scale(0.9); opacity: 0.65; }
                100% { transform: scale(1.25); opacity: 1; }
            }

            @media (max-width: 860px) {
                body.mcqs-on-root-home #breadcrumb-text,
                body.mcqs-on-inner-path #breadcrumb-text {
                    display: none !important;
                }
                .mcqs-home-master-stack {
                    gap: 16px;
                }
                .mcqs-tier-workspaces { order: 1; }
                .mcqs-tier-studios { order: 2; }
                .mcqs-tier-hero { order: 3; }

                .mcqs-hero-left-col {
                    display: none !important;
                }
                .mcqs-arch-surface {
                    padding: 14px !important;
                    border-radius: 16px !important;
                    background: #0b0f1a !important;
                }
                .mcqs-hero-grid,
                .mcqs-home-workspace-grid,
                .mcqs-exam-cards-grid,
                .mcqs-studios-split-grid,
                .mcqs-clinic-modes-grid,
                .mcqs-diag-grid,
                .mcqs-inner-subtopics-grid {
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                }
                .mcqs-modern-exam-card {
                    padding: 15px !important;
                    border-radius: 14px !important;
                }
                .mcqs-studio-box, .mcqs-clinic-box {
                    padding: 16px !important;
                    border-radius: 16px !important;
                }
                .mcqs-inner-command-header {
                    padding: 15px 14px !important;
                    border-radius: 15px !important;
                }
            }
        `;
        document.head.appendChild(st);
    }

    // ==========================================
    // COLLISION-PROOF FLOATING CENTER PILL BAR ALIGNMENT
    // ==========================================
    function isStrictHomepageView() {
        const rawHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).trim();
        const isRootRoute = (!rawHash || rawHash === 'home');
        const isRootPath = (!Array.isArray(currentPath) || currentPath.length === 0);
        return isRootRoute && isRootPath;
    }

    function alignFloatingCenterPillBar() {
        const pillBar = document.getElementById('mcqsWebCenterNavPills');
        if (!pillBar) return;

        // Strictly hide the floating center pill bar on ALL inner topics, buttons, quizzes, analytics, and leaderboards!
        const showOnHomeOnly = isStrictHomepageView() &&
            window.innerWidth > 860 &&
            !document.body.classList.contains('mcqs-quiz-screen-active') &&
            !document.body.classList.contains('admin-mode');

        if (!showOnHomeOnly) {
            pillBar.style.setProperty('display', 'none', 'important');
            return;
        }

        pillBar.style.setProperty('display', 'inline-flex', 'important');

        const navbar = document.querySelector('.navbar');
        const navLeft = document.querySelector('.nav-left');
        const searchWrap = document.getElementById('searchWrapper');
        const navRight = document.querySelector('.nav-right');

        if (!navbar || !navLeft || !navRight) return;

        const navRect = navbar.getBoundingClientRect();
        // When user scrolls down past .navbar on the Homepage, center the floating pill bar at 50% of the screen
        if (navRect.bottom <= 14) {
            pillBar.style.left = '50%';
            pillBar.style.transform = 'translateX(-50%) scale(1)';
            return;
        }

        // When at the top of the Homepage, center the pill bar in the exact gap between .nav-left and Search/.nav-right
        const leftEdge = navLeft.getBoundingClientRect().right + 14;
        const rightAnchor = (searchWrap && searchWrap.offsetWidth > 0) ? searchWrap : navRight;
        const rightEdge = rightAnchor.getBoundingClientRect().left - 14;
        const availableGap = rightEdge - leftEdge;
        const naturalWidth = pillBar.offsetWidth || 500;

        if (availableGap > 200) {
            const midpointPx = Math.round((leftEdge + rightEdge) / 2);
            pillBar.style.left = midpointPx + 'px';
            if (naturalWidth > availableGap) {
                const scaleFactor = Math.max(0.78, (availableGap - 8) / naturalWidth);
                pillBar.style.transform = `translateX(-50%) scale(${scaleFactor.toFixed(3)})`;
            } else {
                pillBar.style.transform = 'translateX(-50%) scale(1)';
            }
        } else {
            pillBar.style.left = '50%';
            pillBar.style.transform = 'translateX(-50%) scale(1)';
        }
    }

    window.addEventListener('scroll', alignFloatingCenterPillBar, { passive: true, capture: true });
    window.addEventListener('resize', alignFloatingCenterPillBar, { passive: true });

    // ==========================================
    // SMART QUIZ EXIT FUNCTION & GUARANTEED QUIZ TOP BACK-BAR INJECTOR
    // ==========================================
    window.exitActiveQuizPractice = function() {
        if (typeof currentTimer !== 'undefined' && currentTimer) clearInterval(currentTimer);
        if (typeof window.saveLiveQuizSessionProgress === 'function') {
            try { window.saveLiveQuizSessionProgress(); } catch (e) {}
        }
        document.body.classList.remove('mcqs-quiz-screen-active');
        document.body.classList.remove('mcqs-anti-cheat-active');
        document.body.classList.remove('hide-ai-btn');
        document.body.classList.remove('hide-bottom-bar');

        if (Array.isArray(currentPath) && currentPath.length > 0) {
            if (currentPath.length > 1) {
                const parentTrail = currentPath.slice(0, -1);
                jumpToSection(parentTrail);
                return;
            }
        }
        goHome();
    };

    function ensureQuizTopBackBarInjected() {
        const dyn = document.getElementById('dynamic-content');
        if (!dyn) return false;

        const hasActiveQuizOptions = Boolean(
            dyn.querySelector('.option-btn') ||
            dyn.querySelector('.quiz-option') ||
            dyn.querySelector('.quiz-header')
        );
        const hasWelcomeResumeCard = Boolean(dyn.querySelector('#btnResumeTopicPractice'));

        if (!hasActiveQuizOptions && !hasWelcomeResumeCard) {
            return false;
        }

        if (hasWelcomeResumeCard && !dyn.querySelector('#mcqsWelcomeBackExitBtn')) {
            const resumeCard = dyn.querySelector('#btnResumeTopicPractice')?.closest('.admin-panel-card');
            if (resumeCard) {
                resumeCard.insertAdjacentHTML('afterbegin', `
                    <div style="margin-bottom:14px;">
                        <button type="button" id="mcqsWelcomeBackExitBtn" class="mcqs-quiz-exit-btn" onclick="exitActiveQuizPractice()">
                            ❮ Back to Chapter
                        </button>
                    </div>
                `);
            }
        }

        if (hasActiveQuizOptions && !document.getElementById('mcqsGuaranteedQuizBackBar')) {
            const rawQuizTitle = (typeof currentQuizPath !== 'undefined' && currentQuizPath)
                ? currentQuizPath
                : (Array.isArray(currentPath) && currentPath.length ? currentPath.join(' > ') : 'Practice Session');
            const cleanTrail = rawQuizTitle.split(' > ').map(s => formatCleanTopicTitle(s)).join(' › ');

            const backBarHtml = `
                <div id="mcqsGuaranteedQuizBackBar" class="mcqs-quiz-top-backbar">
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; min-width:0;">
                        <button type="button" class="mcqs-quiz-exit-btn" onclick="exitActiveQuizPractice()" title="Save &amp; Exit to Chapter">
                            ❮ Back to Chapter
                        </button>
                        <div style="min-width:0;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Active Practice Session</div>
                            <div style="font-size:13px; font-weight:800; color:#f8fafc; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:55vw;">${cleanTrail}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="background:rgba(16,185,129,0.14); color:#10b981; border:1px solid rgba(16,185,129,0.38); padding:4px 9px; border-radius:999px; font-size:11px; font-weight:800;">✔ +4 Correct</span>
                        <span style="background:rgba(239,68,68,0.14); color:#ef4444; border:1px solid rgba(239,68,68,0.38); padding:4px 9px; border-radius:999px; font-size:11px; font-weight:800;">✖ −1 Negative</span>
                        <span style="background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.12); padding:4px 9px; border-radius:999px; font-size:11px; font-weight:700;">🔒 Anti-Cheat</span>
                    </div>
                </div>
            `;
            dyn.insertAdjacentHTML('afterbegin', backBarHtml);
        }

        return true;
    }

    function syncQuizScreenAndAntiCheatState() {
        const rawHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).toLowerCase();
        const isQuizDomMounted = ensureQuizTopBackBarInjected();
        const isQuizRoute = (rawHash === 'quiz') || isQuizDomMounted;

        if (isQuizRoute) {
            document.body.classList.add('mcqs-quiz-screen-active');
        } else {
            document.body.classList.remove('mcqs-quiz-screen-active');
        }

        const onRootHome = isStrictHomepageView() && !isQuizRoute;
        document.body.classList.toggle('mcqs-on-root-home', onRootHome);

        const pathStr = (Array.isArray(currentPath) ? currentPath.join(' > ') : '').toLowerCase();
        const combined = `${rawHash} ${pathStr}`;
        const shouldHideAi = isQuizRoute ||
            rawHash === 'custom-setup' ||
            rawHash === 'admin' ||
            rawHash === 'admin-panel' ||
            /mcq|practice paper|mock test|test series|sample paper|model paper|daily quiz|custom practice/.test(combined);

        const aiBtn = document.getElementById('ai-floating-btn');
        if (shouldHideAi) {
            document.body.classList.add('mcqs-anti-cheat-active');
            document.body.classList.add('hide-ai-btn');
            if (aiBtn) aiBtn.style.setProperty('display', 'none', 'important');
        } else {
            document.body.classList.remove('mcqs-anti-cheat-active');
            document.body.classList.remove('hide-ai-btn');
            if (aiBtn) aiBtn.style.removeProperty('display');
        }

        alignFloatingCenterPillBar();
        setTimeout(alignFloatingCenterPillBar, 25);
    }

    // Observe #dynamic-content so whenever js/4-quiz-engine.js or js/6-admin.js renders a question, the Back Bar mounts immediately!
    function attachDynamicContentObserver() {
        const dyn = document.getElementById('dynamic-content');
        if (!dyn || window._mcqsDynObserverAttachedV10) return;
        window._mcqsDynObserverAttachedV10 = true;

        const obs = new MutationObserver(() => {
            syncQuizScreenAndAntiCheatState();
        });
        obs.observe(dyn, { childList: true });
    }

    // Search bar open/close hooks
    if (typeof openSearch === 'function' && !window._origOpenSearchWrappedV10) {
        window._origOpenSearchWrappedV10 = openSearch;
        openSearch = function() {
            document.body.classList.add('mcqs-search-open');
            window._origOpenSearchWrappedV10();
            setTimeout(alignFloatingCenterPillBar, 20);
            const inp = document.getElementById('searchInput');
            if (inp) setTimeout(() => inp.focus(), 30);
        };
    }
    if (typeof closeSearch === 'function' && !window._origCloseSearchWrappedV10) {
        window._origCloseSearchWrappedV10 = closeSearch;
        closeSearch = function() {
            document.body.classList.remove('mcqs-search-open');
            window._origCloseSearchWrappedV10();
            setTimeout(alignFloatingCenterPillBar, 20);
        };
    }

    // ==========================================
    // STRICT SUBTOPIC SEARCH BAR CHECKER (RESPECTS ADMIN DISABLES 100%)
    // ==========================================
    isSubtopicSearchEnabledForPath = function(checkPath, childCount = 0) {
        if (!checkPath) return false;
        const cfg = window.subtopicSearchConfig || { enabledPaths: {}, autoThreshold: 8 };
        const map = cfg.enabledPaths || {};

        if (map[checkPath] !== undefined) {
            if (typeof map[checkPath] === 'object') {
                return map[checkPath].enabled === true;
            }
            return Boolean(map[checkPath]);
        }

        const parts = checkPath.split(' > ').filter(Boolean);
        for (let i = parts.length - 1; i >= 1; i--) {
            const parentKey = parts.slice(0, i).join(' > ');
            const parentCfg = map[parentKey];
            if (parentCfg !== undefined) {
                if (typeof parentCfg === 'object') {
                    if (parentCfg.enabled === false) return false;
                    if (parentCfg.enabled === true && parentCfg.includeChildren) return true;
                } else if (parentCfg === false) {
                    return false;
                }
            }
        }

        if (parts.length <= 1) return false;

        const threshold = cfg.autoThreshold !== undefined ? Number(cfg.autoThreshold) : 0;
        if (threshold > 0 && childCount >= threshold) {
            return true;
        }

        return false;
    };

    // ==========================================
    // TRUE DAILY STREAK VALIDATOR & AUTO-RESET ENGINE
    // ==========================================
    var verifiedStreakData = {
        trueStreak: 0,
        practicedToday: false,
        practicedYesterday: false,
        activeDateSet: new Set(),
        lastCheckedUid: undefined
    };

    function toLocalYMD(dateInput) {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getPastLocalYMD(daysAgo) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - daysAgo);
        return toLocalYMD(d);
    }

    async function verifyAndSyncAccurateDailyStreak(firestoreLeaderboardDocs = null) {
        const uid = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) ? currentUser.uid : null;
        const todayYMD = getPastLocalYMD(0);
        const yesterdayYMD = getPastLocalYMD(1);
        const dateSet = new Set();

        try {
            const localSavedDates = JSON.parse(localStorage.getItem(`mcqs_practice_dates_${uid || 'guest'}`) || '[]');
            if (Array.isArray(localSavedDates)) {
                localSavedDates.forEach(ymd => { if (ymd) dateSet.add(ymd); });
            }
        } catch (e) {}

        try {
            const localMap = JSON.parse(localStorage.getItem(`mcqsprep_topic_progress_v2_${uid || 'guest'}`) || '{}');
            Object.values(localMap).forEach(rec => {
                if (rec && rec.inProgress && rec.inProgress.updatedAt) {
                    const ymd = toLocalYMD(rec.inProgress.updatedAt);
                    if (ymd) dateSet.add(ymd);
                }
            });
        } catch (e) {}

        let lbDocs = firestoreLeaderboardDocs;
        if (!lbDocs && uid && typeof db !== 'undefined') {
            try {
                const snap = await db.collection('leaderboards').where('userId', '==', uid).get();
                lbDocs = [];
                snap.forEach(doc => lbDocs.push(doc.data()));
            } catch (e) {
                lbDocs = [];
            }
        }
        (lbDocs || []).forEach(d => {
            if (d && d.timestamp && typeof d.timestamp.toDate === 'function') {
                const ymd = toLocalYMD(d.timestamp.toDate());
                if (ymd) dateSet.add(ymd);
            }
        });

        let userDocData = null;
        if (uid && typeof db !== 'undefined') {
            try {
                const uDoc = await db.collection('users').doc(uid).get();
                if (uDoc.exists) {
                    userDocData = uDoc.data() || {};
                    ['lastQuizDate', 'lastStreakDate', 'lastPracticeDate', 'streakUpdatedAt'].forEach(field => {
                        const val = userDocData[field];
                        if (!val) return;
                        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
                            dateSet.add(val.slice(0, 10));
                        } else if (typeof val.toDate === 'function') {
                            const ymd = toLocalYMD(val.toDate());
                            if (ymd) dateSet.add(ymd);
                        }
                    });
                }
            } catch (e) {}
        }

        const practicedToday = dateSet.has(todayYMD);
        const practicedYesterday = dateSet.has(yesterdayYMD);
        let trueStreak = 0;

        if (practicedToday || practicedYesterday) {
            let startOffset = practicedToday ? 0 : 1;
            for (let offset = startOffset; offset < 365; offset++) {
                const checkYMD = getPastLocalYMD(offset);
                if (dateSet.has(checkYMD)) {
                    trueStreak++;
                } else {
                    break;
                }
            }
        } else {
            trueStreak = 0;
        }

        verifiedStreakData = {
            trueStreak,
            practicedToday,
            practicedYesterday,
            activeDateSet: dateSet,
            lastCheckedUid: uid
        };

        const navStreakEl = document.getElementById('nav-streak-display');
        if (navStreakEl) navStreakEl.innerText = String(trueStreak);

        const modalStreakEl = document.getElementById('modalStreakCount');
        if (modalStreakEl) modalStreakEl.innerText = String(trueStreak);

        const homeStreakBadge = document.getElementById('mcqsHomeDailyStreakNum');
        if (homeStreakBadge) homeStreakBadge.innerText = String(trueStreak);

        if (uid) {
            localStorage.setItem('mcqs_user_streak_' + uid, String(trueStreak));
            try {
                localStorage.setItem(`mcqs_practice_dates_${uid}`, JSON.stringify(Array.from(dateSet).slice(-60)));
            } catch (e) {}

            if (userDocData && Number(userDocData.currentStreak) !== trueStreak) {
                db.collection('users').doc(uid).set({
                    currentStreak: trueStreak,
                    lastValidatedStreakDate: todayYMD
                }, { merge: true }).catch(() => {});
            }
        }
    }

    if (typeof openStreakModal === 'function' && !window._origOpenStreakModalHookV10) {
        window._origOpenStreakModalHookV10 = openStreakModal;
        openStreakModal = function() {
            window._origOpenStreakModalHookV10();
            const modalCount = document.getElementById('modalStreakCount');
            if (modalCount) modalCount.innerText = String(verifiedStreakData.trueStreak);

            const modal = document.getElementById('streakModal');
            if (!modal) return;
            const contentBox = modal.querySelector('.modal-content');
            if (!contentBox) return;

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Html = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setHours(12, 0, 0, 0);
                d.setDate(d.getDate() - i);
                const ymd = toLocalYMD(d);
                const done = verifiedStreakData.activeDateSet.has(ymd);
                const lbl = i === 0 ? 'Today' : dayNames[d.getDay()];
                last7Html.push(`
                    <div style="flex:1; background:${done ? 'rgba(255,87,34,0.18)' : '#090d16'}; border:1px solid ${done ? '#FF5722' : '#1e293b'}; border-radius:8px; padding:6px 2px; text-align:center;">
                        <div style="font-size:14px;">${done ? '🔥' : '⚪'}</div>
                        <div style="font-size:9.5px; font-weight:800; color:${done ? '#FF5722' : '#64748b'}; margin-top:2px;">${lbl}</div>
                    </div>
                `);
            }

            let statusMsg = '';
            if (verifiedStreakData.trueStreak === 0) {
                statusMsg = `<span style="color:#ef4444; font-weight:800;">⚠️ Streak Reset to 0:</span> You missed a day of practice. Complete 1 quiz today to start a fresh Day 1 streak!`;
            } else if (!verifiedStreakData.practicedToday && verifiedStreakData.practicedYesterday) {
                statusMsg = `<span style="color:#fdb813; font-weight:800;">⏳ Due Today:</span> You practiced yesterday! Complete 1 quiz before midnight to extend your ${verifiedStreakData.trueStreak}-day streak.`;
            } else {
                statusMsg = `<span style="color:#10b981; font-weight:800;">✅ Locked In for Today!</span> You've completed today's practice. Come back tomorrow!`;
            }

            let trackerEl = document.getElementById('mcqsStreak7DayTracker');
            if (!trackerEl) {
                trackerEl = document.createElement('div');
                trackerEl.id = 'mcqsStreak7DayTracker';
                const btn = contentBox.querySelector('button.btn-exam');
                if (btn) contentBox.insertBefore(trackerEl, btn);
                else contentBox.appendChild(trackerEl);
            }
            trackerEl.innerHTML = `
                <div style="margin-bottom:16px; text-align:left;">
                    <div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">Last 7 Days Activity:</div>
                    <div style="display:flex; gap:5px; margin-bottom:10px;">${last7Html.join('')}</div>
                    <div style="background:#090d16; border:1px solid #1e293b; border-radius:8px; padding:9px 11px; font-size:12px; color:#cbd5e1; line-height:1.45;">
                        ${statusMsg}
                    </div>
                </div>
            `;
        };
    }

    // ==========================================
    // PLATFORM INVENTORY & REAL STUDENT DIAGNOSTICS ENGINE
    // ==========================================
    function getLiveActiveExamCategories() {
        const deletedSet = new Set((typeof topicOverrides !== 'undefined' && topicOverrides && topicOverrides.deletedPaths) || []);
        const keys = new Set(Object.keys(typeof appData !== 'undefined' ? appData : {}));
        if (typeof customTopicTypes !== 'undefined') {
            Object.keys(customTopicTypes).forEach(dbKey => {
                if (deletedSet.has(dbKey)) return;
                const root = dbKey.split(' > ')[0];
                if (root && !deletedSet.has(root)) keys.add(root);
            });
        }
        return Array.from(keys).filter(k => k && k !== 'Daily Quiz Challenge' && !deletedSet.has(k));
    }

    function getDirectChildrenOfPath(pathArr) {
        const deletedSet = new Set((typeof topicOverrides !== 'undefined' && topicOverrides && topicOverrides.deletedPaths) || []);
        const fullPrefix = pathArr.join(' > ');
        let currNode = typeof appData !== 'undefined' ? appData : {};
        for (let seg of pathArr) {
            if (currNode && typeof currNode === 'object' && currNode[seg] !== undefined) {
                currNode = currNode[seg];
            } else {
                currNode = null;
                break;
            }
        }
        const childSet = new Set();
        if (currNode && typeof currNode === 'object' && !Array.isArray(currNode)) {
            Object.keys(currNode).forEach(k => {
                const candidateFull = fullPrefix ? `${fullPrefix} > ${k}` : k;
                if (!deletedSet.has(candidateFull)) childSet.add(k);
            });
        }
        if (typeof customTopicTypes !== 'undefined') {
            const prefixWithArrow = fullPrefix ? (fullPrefix + ' > ') : '';
            Object.keys(customTopicTypes).forEach(dbKey => {
                if (deletedSet.has(dbKey)) return;
                if (!fullPrefix) {
                    const rootSeg = dbKey.split(' > ')[0];
                    if (rootSeg && !deletedSet.has(rootSeg)) childSet.add(rootSeg);
                } else if (dbKey.startsWith(prefixWithArrow)) {
                    const nextSeg = dbKey.slice(prefixWithArrow.length).split(' > ')[0];
                    const nextFull = `${fullPrefix} > ${nextSeg}`;
                    if (nextSeg && !deletedSet.has(nextFull)) childSet.add(nextSeg);
                }
            });
        }
        const difficultyOrder = ['Easy', 'Medium', 'Hard', 'Mixed'];
        return Array.from(childSet).sort((a, b) => {
            const cA = formatCleanTopicTitle(a);
            const cB = formatCleanTopicTitle(b);
            const iA = difficultyOrder.indexOf(cA);
            const iB = difficultyOrder.indexOf(cB);
            if (iA !== -1 && iB !== -1) return iA - iB;
            if (iA !== -1) return -1;
            if (iB !== -1) return 1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
    }

    function getLivePlatformInventory() {
        const exams = getLiveActiveExamCategories();
        const deletedSet = new Set((typeof topicOverrides !== 'undefined' && topicOverrides && topicOverrides.deletedPaths) || []);
        let totalSubfolders = 0;
        const subjectsByExam = {};
        const directChildrenByExam = {};

        exams.forEach(ex => {
            subjectsByExam[ex] = [];
            directChildrenByExam[ex] = getDirectChildrenOfPath([ex]);

            const catalog = typeof buildCwCatalogForExam === 'function' ? buildCwCatalogForExam(ex, true) : [];
            catalog.forEach(subjObj => {
                subjectsByExam[ex].push({
                    label: subjObj.label,
                    fullPath: subjObj.fullPath,
                    chapterCount: Array.isArray(subjObj.chapters) ? subjObj.chapters.length : 0,
                    chapters: subjObj.chapters || []
                });
            });
        });

        function countNodes(node, trail) {
            if (!node || typeof node !== 'object' || Array.isArray(node)) return;
            Object.keys(node).forEach(k => {
                const nextTrail = [...trail, k];
                if (deletedSet.has(nextTrail.join(' > '))) return;
                totalSubfolders++;
                countNodes(node[k], nextTrail);
            });
        }
        exams.forEach(ex => { if (appData && appData[ex]) countNodes(appData[ex], [ex]); });

        return {
            exams,
            examCount: Math.max(1, exams.length),
            totalSubfolders: Math.max(30, totalSubfolders),
            subjectsByExam,
            directChildrenByExam
        };
    }

    var realStudentDiagnosticsCache = {
        loadedUid: undefined,
        loading: false,
        byExam: {},
        allWrongIds: [],
        allSkippedIds: [],
        rawFirestoreDocs: []
    };

    function readLocalTopicProgressForCurrentUser() {
        try {
            const uid = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) ? currentUser.uid : 'guest';
            const rawV2 = localStorage.getItem(`mcqsprep_topic_progress_v2_${uid}`);
            return rawV2 ? JSON.parse(rawV2) : {};
        } catch (e) {
            return {};
        }
    }

    function getRealStatsForPathPrefix(pathPrefix) {
        if (!pathPrefix) return { solved: 0, correct: 0, wrong: 0, skipped: 0, acc: 0 };
        const localMap = readLocalTopicProgressForCurrentUser();
        const corrSet = new Set();
        const wrongSet = new Set();
        const skipSet = new Set();

        Object.keys(localMap).forEach(pKey => {
            if (pKey === pathPrefix || pKey.startsWith(pathPrefix + ' > ')) {
                const rec = localMap[pKey] || {};
                (rec.correctIds || []).forEach(id => corrSet.add(id));
                (rec.wrongIds || []).forEach(id => { if (!corrSet.has(id)) wrongSet.add(id); });
                (rec.skippedIds || []).forEach(id => { if (!corrSet.has(id) && !wrongSet.has(id)) skipSet.add(id); });
            }
        });

        let solved = corrSet.size + wrongSet.size;
        let correct = corrSet.size;
        let wrong = wrongSet.size;

        if (solved === 0 && Array.isArray(realStudentDiagnosticsCache.rawFirestoreDocs)) {
            realStudentDiagnosticsCache.rawFirestoreDocs.forEach(d => {
                const qp = d.quizPath || d.examCategory || '';
                if (qp === pathPrefix || qp.startsWith(pathPrefix + ' > ')) {
                    const c = Number(d.correctCount) || 0;
                    const w = Number(d.wrongCount) || 0;
                    correct += c;
                    wrong += w;
                    solved += (c + w);
                }
            });
        }

        const acc = solved > 0 ? Math.round((correct / solved) * 100) : 0;
        return { solved, correct, wrong, skipped: skipSet.size, acc };
    }

    function computeExamStatsFromRealSources(examKey, firestoreDocs) {
        const localMap = readLocalTopicProgressForCurrentUser();
        let totalScore = 0;
        let totalAttempted = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        let quizzesPlayed = 0;
        let accuracyTrend = [];
        let totalAvgTimeC = 0, countC = 0;
        let totalAvgTimeW = 0, countW = 0;
        let subjectMap = {};
        const wrongIdSet = new Set();
        const skippedIdSet = new Set();

        (firestoreDocs || []).forEach(d => {
            const matchesExam = (d.examCategory === examKey) ||
                (d.quizPath && (d.quizPath.startsWith(examKey) || d.quizPath.startsWith('Daily Quiz Challenge > ' + examKey)));
            if (!matchesExam) return;

            quizzesPlayed++;
            totalScore += Number(d.score) || 0;
            const qAtt = d.attemptedQuestions !== undefined
                ? Number(d.attemptedQuestions)
                : ((Number(d.correctCount) || 0) + (Number(d.wrongCount) || 0));
            totalAttempted += qAtt;

            const c = d.correctCount !== undefined ? Number(d.correctCount) : Math.round(((Number(d.accuracy) || 0) / 100) * qAtt);
            const w = d.wrongCount !== undefined ? Number(d.wrongCount) : Math.max(0, qAtt - c);
            correctCount += c;
            wrongCount += w;
            accuracyTrend.push(Number(d.accuracy) || 0);

            if (d.avgTimeCorrect) { totalAvgTimeC += Number(d.avgTimeCorrect); countC++; }
            if (d.avgTimeWrong) { totalAvgTimeW += Number(d.avgTimeWrong); countW++; }

            if (d.subjectBreakdown && typeof d.subjectBreakdown === 'object') {
                Object.keys(d.subjectBreakdown).forEach(sKey => {
                    const cleanS = formatCleanTopicTitle(sKey);
                    if (!subjectMap[cleanS]) subjectMap[cleanS] = { attempts: 0, correct: 0 };
                    subjectMap[cleanS].attempts += Number(d.subjectBreakdown[sKey].attempts) || 0;
                    subjectMap[cleanS].correct += Number(d.subjectBreakdown[sKey].correct) || 0;
                });
            }
        });

        Object.keys(localMap).forEach(pathKey => {
            if (!pathKey.startsWith(examKey)) return;
            const rec = localMap[pathKey] || {};
            const cArr = Array.isArray(rec.correctIds) ? rec.correctIds : [];
            const wArr = Array.isArray(rec.wrongIds) ? rec.wrongIds : [];
            const sArr = Array.isArray(rec.skippedIds) ? rec.skippedIds : [];

            wArr.forEach(id => { if (!cArr.includes(id)) wrongIdSet.add(id); });
            sArr.forEach(id => { if (!cArr.includes(id) && !wArr.includes(id)) skippedIdSet.add(id); });

            if (quizzesPlayed === 0 && (cArr.length + wArr.length) > 0) {
                correctCount += cArr.length;
                wrongCount += wArr.length;
                totalAttempted += (cArr.length + wArr.length);
                totalScore += (cArr.length * 4) - wArr.length;

                const parts = pathKey.split(' > ').filter(Boolean);
                const subjGuess = formatCleanTopicTitle(parts[2] || parts[1] || examKey);
                if (!subjectMap[subjGuess]) subjectMap[subjGuess] = { attempts: 0, correct: 0 };
                subjectMap[subjGuess].attempts += (cArr.length + wArr.length);
                subjectMap[subjGuess].correct += cArr.length;
            }
        });

        skippedCount = skippedIdSet.size;
        const hasRealData = (totalAttempted > 0) || (quizzesPlayed > 0);
        const overallAccuracy = (correctCount + wrongCount) > 0
            ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
            : 0;

        const subjectList = Object.keys(subjectMap)
            .filter(k => subjectMap[k].attempts > 0)
            .map(k => {
                const s = subjectMap[k];
                const pct = Math.round((s.correct / s.attempts) * 100);
                return {
                    name: k,
                    attempts: s.attempts,
                    correct: s.correct,
                    pct,
                    isWeak: pct < 50
                };
            })
            .sort((a, b) => b.pct - a.pct);

        return {
            hasRealData,
            quizzesPlayed,
            totalScore,
            totalAttempted,
            correctCount,
            wrongCount,
            skippedCount,
            wrongIds: Array.from(wrongIdSet),
            skippedIds: Array.from(skippedIdSet),
            overallAccuracy,
            recentTrend: accuracyTrend.slice(-8),
            avgTimeCorrect: countC > 0 ? Math.round(totalAvgTimeC / countC) : 0,
            avgTimeWrong: countW > 0 ? Math.round(totalAvgTimeW / countW) : 0,
            subjectList
        };
    }

    async function syncRealStudentDiagnostics(forceRefresh = false) {
        const uid = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) ? currentUser.uid : null;
        if (!forceRefresh && realStudentDiagnosticsCache.loadedUid === uid && Object.keys(realStudentDiagnosticsCache.byExam).length > 0) {
            return;
        }
        if (realStudentDiagnosticsCache.loading) return;
        realStudentDiagnosticsCache.loading = true;

        let firestoreDocs = [];
        if (uid && typeof db !== 'undefined') {
            try {
                const snap = await db.collection('leaderboards').where('userId', '==', uid).get();
                snap.forEach(doc => firestoreDocs.push(doc.data()));
                firestoreDocs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            } catch (e) {}
        }

        realStudentDiagnosticsCache.rawFirestoreDocs = firestoreDocs;
        await verifyAndSyncAccurateDailyStreak(firestoreDocs);

        const exams = getLiveActiveExamCategories();
        const map = {};
        const globalWrong = new Set();
        const globalSkipped = new Set();

        exams.forEach(ex => {
            const st = computeExamStatsFromRealSources(ex, firestoreDocs);
            map[ex] = st;
            st.wrongIds.forEach(id => globalWrong.add(id));
            st.skippedIds.forEach(id => globalSkipped.add(id));
        });

        realStudentDiagnosticsCache.loadedUid = uid;
        realStudentDiagnosticsCache.byExam = map;
        realStudentDiagnosticsCache.allWrongIds = Array.from(globalWrong);
        realStudentDiagnosticsCache.allSkippedIds = Array.from(globalSkipped);
        realStudentDiagnosticsCache.loading = false;

        renderSim1DiagnosticDashboard();
        renderExamWorkspaceCardsGrid();
        renderSmartMistakeClinicCard();
    }

    // ==========================================
    // SIMULATION #1: REAL STUDENT DIAGNOSTIC WITH VIBRANT COLOR-CODED SYMBOLS
    // ==========================================
    var sim1ActiveExamIdx = 0;
    var sim1BlueprintTargetAcc = 85;

    window.selectSim1ExamTab = function(idx) {
        sim1ActiveExamIdx = idx;
        renderSim1DiagnosticDashboard();
        renderSmartMistakeClinicCard();
    };

    window.setSim1BlueprintTargetAcc = function(accVal) {
        sim1BlueprintTargetAcc = accVal;
        renderSim1DiagnosticDashboard();
    };

    function renderSim1DiagnosticDashboard() {
        const mount = document.getElementById('mcqsSim1DiagnosticMount');
        if (!mount) return;

        const inv = getLivePlatformInventory();
        const exams = inv.exams.length ? inv.exams : ['NEET', 'JEE', 'Board', 'General Knowledge'];
        const safeIdx = sim1ActiveExamIdx % exams.length;
        const activeExam = exams[safeIdx];
        const cleanExam = formatCleanTopicTitle(activeExam);
        const safeExamJs = activeExam.replace(/'/g, "\\'");

        const stats = (realStudentDiagnosticsCache.byExam && realStudentDiagnosticsCache.byExam[activeExam])
            || computeExamStatsFromRealSources(activeExam, []);

        const tabsHtml = exams.map((ex, i) => {
            const st = realStudentDiagnosticsCache.byExam?.[ex];
            const dot = (st && st.hasRealData) ? '<span style="color:#10b981;">●</span> ' : '';
            return `
                <button type="button" class="mcqs-exam-tab-pill ${i === safeIdx ? 'active' : ''}" onclick="selectSim1ExamTab(${i})">
                    ${dot}${formatCleanTopicTitle(ex)}
                </button>
            `;
        }).join('');

        if (stats.hasRealData) {
            const topSubj = stats.subjectList[0]
                ? `${stats.subjectList[0].name} · ${stats.subjectList[0].pct}%`
                : `${cleanExam} · ${stats.overallAccuracy}% Accuracy`;

            const pts = stats.recentTrend.length >= 2
                ? stats.recentTrend
                : [Math.max(0, stats.overallAccuracy - 10), stats.overallAccuracy];
            const svgW = 230, svgH = 54;
            const coords = pts.map((val, i) => {
                const x = 10 + (i / Math.max(1, pts.length - 1)) * (svgW - 20);
                const y = svgH - 7 - (Math.min(100, Math.max(0, val)) / 100) * (svgH - 16);
                return { x: Math.round(x), y: Math.round(y), val };
            });
            const polyPoints = coords.map(c => `${c.x},${c.y}`).join(' ');
            const areaPoints = `10,${svgH - 3} ${polyPoints} ${coords[coords.length - 1].x},${svgH - 3}`;

            const subjectBarsHtml = stats.subjectList.length > 0
                ? stats.subjectList.slice(0, 3).map(s => {
                    const col = s.pct >= 70 ? '#10b981' : (s.pct >= 50 ? '#fdb813' : '#ef4444');
                    const sIcon = getAutomaticIconForName(s.name, null, `${activeExam} > ${s.name}`);
                    return `
                        <div style="margin-bottom:7px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; font-weight:800; margin-bottom:3px;">
                                <span style="color:#f8fafc; display:inline-flex; align-items:center; gap:5px;">
                                    <span>${sIcon}</span>
                                    <span>${s.name}</span>
                                    ${s.isWeak ? '<span style="color:#ef4444; font-size:10px;">(&lt;50% Weak)</span>' : ''}
                                </span>
                                <span style="display:inline-flex; align-items:center; gap:6px;">
                                    <span style="color:${col}; font-weight:900;">${s.pct}%</span>
                                    <span style="background:rgba(16,185,129,0.14); color:#cbd5e1; border:1px solid rgba(16,185,129,0.35); padding:1px 6px; border-radius:6px; font-size:9.5px; font-weight:800;">
                                        <span style="color:#10b981;">✔</span> ${s.correct}/${s.attempts}
                                    </span>
                                </span>
                            </div>
                            <div style="width:100%; height:6px; background:#090d16; border-radius:3px; overflow:hidden;">
                                <div style="width:${s.pct}%; height:100%; background:${col}; border-radius:3px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')
                : `<div style="font-size:11px; color:#94a3b8;">Practice more chapters in ${cleanExam} to unlock subject bars.</div>`;

            let speedDiagnosisHtml = '';
            if (stats.avgTimeCorrect > 0 && stats.avgTimeWrong > 0) {
                if (stats.avgTimeWrong < stats.avgTimeCorrect) {
                    speedDiagnosisHtml = `<div style="margin-top:6px; background:rgba(245,158,11,0.12); border-left:3px solid #f59e0b; padding:5px 8px; border-radius:4px; font-size:10px; color:#fde68a; line-height:1.35;">⚡ <b>Impulse Trap:</b> You spent <b>${stats.avgTimeWrong}s</b> on Wrong vs <b>${stats.avgTimeCorrect}s</b> on Correct. Pause +5s before locking unsure options!</div>`;
                } else {
                    speedDiagnosisHtml = `<div style="margin-top:6px; background:rgba(56,189,248,0.12); border-left:3px solid #38bdf8; padding:5px 8px; border-radius:4px; font-size:10px; color:#bae6fd; line-height:1.35;">🧠 <b>Pacing Insight:</b> You spend <b>${stats.avgTimeWrong}s</b> on Wrong answers. Skip &amp; revisit tough MCQs on 2nd pass!</div>`;
                }
            }

            const grossMarks = stats.correctCount * 4;
            const negLost = stats.wrongCount;

            mount.innerHTML = `
                <div class="mcqs-diag-window">
                    <div class="mcqs-diag-floating-badge" onclick="window.location.hash='#/progress/${encodeURIComponent(activeExam)}'" style="cursor:pointer;">
                        <span style="color:#10b981; font-weight:900;">✔</span>
                        <span>Live Data: <b style="color:#fdb813;">${topSubj}</b></span>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                        <span style="font-size:10.5px; font-weight:800; color:#10b981;">🟢 LIVE STUDENT DIAGNOSTICS</span>
                        <div style="display:inline-flex; align-items:center; gap:6px; font-size:10.5px; font-weight:800;">
                            <span style="background:rgba(253,184,19,0.14); color:#fdb813; border:1px solid rgba(253,184,19,0.35); padding:2px 8px; border-radius:999px;">📋 ${stats.quizzesPlayed} Quiz${stats.quizzesPlayed === 1 ? '' : 'zes'}</span>
                            <span style="background:rgba(56,189,248,0.14); color:#38bdf8; border:1px solid rgba(56,189,248,0.35); padding:2px 8px; border-radius:999px;">📝 ${stats.totalAttempted} MCQs</span>
                        </div>
                    </div>

                    <div class="mcqs-exam-tab-row">${tabsHtml}</div>

                    <div class="mcqs-diag-grid">
                        <div class="mcqs-diag-subcard" onclick="window.location.hash='#/progress/${encodeURIComponent(activeExam)}'" style="cursor:pointer;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                                    <span style="font-size:10.5px; color:#38bdf8; font-weight:900; text-transform:uppercase;">📈 ${cleanExam} Score &amp; Trajectory</span>
                                    <span style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:900;">🎯 ${stats.overallAccuracy}% Acc</span>
                                </div>

                                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:6px; flex-wrap:wrap;">
                                    <div style="display:flex; align-items:baseline; gap:4px;">
                                        <span style="font-size:30px; font-weight:900; color:#fdb813; text-shadow:0 0 16px rgba(253,184,19,0.28);">${stats.totalScore}</span>
                                        <span style="font-size:11.5px; color:#e2e8f0; font-weight:800;">pts</span>
                                    </div>
                                    <span style="background:rgba(244,63,94,0.14); color:#f43f5e; border:1px solid rgba(244,63,94,0.38); padding:2px 8px; border-radius:7px; font-size:10px; font-weight:900;">🛡️ −${negLost} Neg Marks</span>
                                </div>

                                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px;">
                                    <span style="background:rgba(16,185,129,0.16); border:1px solid rgba(16,185,129,0.45); color:#10b981; padding:3px 9px; border-radius:7px; font-size:11px; font-weight:900; display:inline-flex; align-items:center; gap:4px;">
                                        <span style="color:#10b981; font-size:12px;">✔</span> ${stats.correctCount} Correct (+${grossMarks})
                                    </span>
                                    <span style="background:rgba(239,68,68,0.16); border:1px solid rgba(239,68,68,0.45); color:#ef4444; padding:3px 9px; border-radius:7px; font-size:11px; font-weight:900; display:inline-flex; align-items:center; gap:4px;">
                                        <span style="color:#ef4444; font-size:12px;">✖</span> ${stats.wrongCount} Wrong (−${negLost})
                                    </span>
                                </div>
                            </div>

                            <div style="margin:8px 0 6px 0;">
                                <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:50px; overflow:visible;">
                                    <polygon points="${areaPoints}" fill="rgba(16, 185, 129, 0.16)"/>
                                    <polyline points="${polyPoints}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    ${coords.map((c, idxC) => `<circle cx="${c.x}" cy="${c.y}" r="3.5" fill="${idxC === coords.length - 1 ? '#10b981' : '#fdb813'}" stroke="#000" stroke-width="1"/>`).join('')}
                                </svg>
                                <div style="display:flex; justify-content:space-between; font-size:9.5px; font-weight:800; margin-top:2px;">
                                    <span style="color:#fdb813;">● Start: ${coords[0].val}%</span>
                                    <span style="color:#10b981;">● Latest: ${stats.overallAccuracy}% Acc</span>
                                </div>
                            </div>

                            <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:7px;">
                                <div style="font-size:10px; font-weight:800; color:#cbd5e1; text-transform:uppercase; margin-bottom:5px;">📚 Your Subject Mastery:</div>
                                ${subjectBarsHtml}
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div class="mcqs-diag-subcard" style="padding:10px;">
                                <div style="font-size:10px; color:#fdb813; font-weight:800; text-transform:uppercase; margin-bottom:5px;">⏱️ Speed-vs-Accuracy Autopsy</div>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                                    <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.4); border-radius:7px; padding:6px; text-align:center;">
                                        <div style="font-size:15px; font-weight:900; color:#10b981;">✔ ${stats.avgTimeCorrect ? stats.avgTimeCorrect + 's' : '--'}</div>
                                        <div style="font-size:9.5px; color:#e2e8f0; font-weight:700;">Avg on Correct</div>
                                    </div>
                                    <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-radius:7px; padding:6px; text-align:center;">
                                        <div style="font-size:15px; font-weight:900; color:#ef4444;">✖ ${stats.avgTimeWrong ? stats.avgTimeWrong + 's' : '--'}</div>
                                        <div style="font-size:9.5px; color:#e2e8f0; font-weight:700;">Avg on Wrong</div>
                                    </div>
                                </div>
                                ${speedDiagnosisHtml}
                            </div>

                            <div class="mcqs-diag-subcard" style="padding:10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:10px; color:#38bdf8; font-weight:800; text-transform:uppercase;">🛡️ Negative-Mark Shield</span>
                                    <span style="font-size:10.5px; color:#10b981; font-weight:900;">+${grossMarks} Gross</span>
                                </div>
                                <div style="font-size:11px; color:#cbd5e1; margin-top:3px; line-height:1.35;">
                                    Fixing your <b style="color:#ef4444;">${stats.wrongIds.length || stats.wrongCount} Wrong MCQs</b> in the Mistake Clinic recovers <b style="color:#10b981;">+${(stats.wrongIds.length || stats.wrongCount) * 5} marks</b>!
                                </div>
                                <button type="button" onclick="window.location.hash='#/progress/${encodeURIComponent(activeExam)}'" style="margin-top:8px; width:100%; background:#fdb813; color:#000; border:none; padding:7px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                                    <span>Open Full ${cleanExam} Analytics</span>
                                    <span>&rarr;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const realSubjs = (inv.subjectsByExam && inv.subjectsByExam[activeExam]) || [];
        const totalQuestionsBase = cleanExam.toLowerCase().includes('neet') ? 180 : (cleanExam.toLowerCase().includes('jee') ? 75 : 100);
        const maxMarks = totalQuestionsBase * 4;
        const simCorrect = Math.round((sim1BlueprintTargetAcc / 100) * totalQuestionsBase);
        const simWrong = totalQuestionsBase - simCorrect;
        const simNetScore = (simCorrect * 4) - simWrong;

        const syllabusPreviewHtml = realSubjs.length > 0
            ? realSubjs.slice(0, 3).map(s => {
                const safeSubjPath = s.fullPath.split(' > ').map(encodeURIComponent).join('/');
                return `
                    <div onclick="window.location.hash='#/path/${safeSubjPath}'" style="display:flex; justify-content:space-between; align-items:center; background:#0b0f19; border:1px solid rgba(255,255,255,0.07); padding:6px 10px; border-radius:7px; margin-bottom:4px; cursor:pointer; font-size:11.5px;">
                        <span style="color:#e2e8f0; font-weight:700;">📘 ${s.label}</span>
                        <span style="color:#38bdf8; font-size:10.5px; font-weight:800;">${s.chapterCount > 0 ? `${s.chapterCount} Chapters` : 'Open'} &rarr;</span>
                    </div>
                `;
            }).join('')
            : `<div style="font-size:11px; color:#94a3b8;">Tap below to start practicing ${cleanExam}.</div>`;

        mount.innerHTML = `
            <div class="mcqs-diag-window">
                <div class="mcqs-diag-floating-badge">
                    <span style="color:#fdb813;">✨</span>
                    <span>${cleanExam} Live Diagnostics — Ready to Activate</span>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                    <span style="font-size:10.5px; font-weight:800; color:#fdb813;">⚡ 0 ${cleanExam.toUpperCase()} QUIZZES ATTEMPTED YET</span>
                    <span style="font-size:10px; color:#94a3b8;">Take 1 quiz to unlock your live stats</span>
                </div>

                <div class="mcqs-exam-tab-row">${tabsHtml}</div>

                <div class="mcqs-diag-grid">
                    <div class="mcqs-diag-subcard">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
                                <span style="font-size:10px; color:#94a3b8; font-weight:800; text-transform:uppercase;">🎯 ${cleanExam} Target Calculator:</span>
                                <div style="display:flex; gap:4px;">
                                    ${[75, 85, 95].map(acc => `
                                        <button type="button" onclick="setSim1BlueprintTargetAcc(${acc})" style="background:${sim1BlueprintTargetAcc === acc ? '#fdb813' : '#0b0f19'}; color:${sim1BlueprintTargetAcc === acc ? '#000' : '#94a3b8'}; border:1px solid ${sim1BlueprintTargetAcc === acc ? '#fdb813' : '#334155'}; border-radius:5px; padding:2px 7px; font-size:10px; font-weight:800; cursor:pointer;">${acc}%</button>
                                    `).join('')}
                                </div>
                            </div>

                            <div style="background:#0b0f19; border:1px solid rgba(255,255,255,0.07); border-radius:9px; padding:8px 10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                                <div>
                                    <div style="font-size:9.5px; color:#94a3b8; font-weight:700;">AT ${sim1BlueprintTargetAcc}% ACCURACY</div>
                                    <div style="font-size:22px; font-weight:900; color:#10b981;">${simNetScore} <span style="font-size:11px; color:#94a3b8;">/ ${maxMarks}</span></div>
                                </div>
                                <div style="font-size:10.5px; text-align:right;">
                                    <div style="color:#10b981; font-weight:800;">✔ ${simCorrect} (+${simCorrect * 4})</div>
                                    <div style="color:#ef4444; font-weight:800;">✖ ${simWrong} (−${simWrong})</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:4px;">${cleanExam} Subjects Ready:</div>
                            ${syllabusPreviewHtml}
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div class="mcqs-diag-subcard" style="padding:10px;">
                            <div style="font-size:10px; color:#38bdf8; font-weight:800; text-transform:uppercase; margin-bottom:3px;">🧬 Zero Fake Data Policy</div>
                            <div style="font-size:11px; color:#cbd5e1; line-height:1.4;">Complete your 1st quiz in <b>${cleanExam}</b> to unlock your real <b>Score Trajectory, Impulse-Trap Speed Autopsy &amp; Weak-Spot Bars</b>.</div>
                        </div>

                        <div class="mcqs-diag-subcard" style="padding:10px;">
                            <div style="font-size:10px; color:#10b981; font-weight:800; text-transform:uppercase; margin-bottom:4px;">🚀 Unlock Your Live Stats</div>
                            <button type="button" onclick="jumpToSection(['${safeExamJs}'])" style="width:100%; background:linear-gradient(135deg, #fdb813, #f59e0b); color:#000; border:none; padding:8px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                                <span>Start 1st ${cleanExam} Quiz</span>
                                <span>&rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // SMART MISTAKE CLINIC
    // ==========================================
    var clinicMode = 'WRONG';

    window.setSmartClinicMode = function(mode) {
        clinicMode = mode;
        renderSmartMistakeClinicCard();
    };

    window.launchSmartMistakeClinicSession = async function() {
        const inv = getLivePlatformInventory();
        const exams = inv.exams.length ? inv.exams : ['NEET'];
        const activeExam = exams[sim1ActiveExamIdx % exams.length];
        const st = realStudentDiagnosticsCache.byExam?.[activeExam];

        const btn = document.getElementById('btnLaunchSmartClinic');
        if (btn) { btn.disabled = true; btn.innerText = '⏳ Building Session...'; }

        try {
            let targetIds = [];
            let sessionTitle = `${formatCleanTopicTitle(activeExam)} > Smart Clinic`;

            if (clinicMode === 'WRONG') {
                targetIds = (st && st.wrongIds && st.wrongIds.length > 0) ? st.wrongIds : realStudentDiagnosticsCache.allWrongIds;
                sessionTitle = `${formatCleanTopicTitle(activeExam)} > Mistake Clinic (Wrong MCQs)`;
            } else if (clinicMode === 'SKIPPED') {
                targetIds = (st && st.skippedIds && st.skippedIds.length > 0) ? st.skippedIds : realStudentDiagnosticsCache.allSkippedIds;
                sessionTitle = `${formatCleanTopicTitle(activeExam)} > Skipped Recovery`;
            } else if (clinicMode === 'BOOKMARKS') {
                targetIds = Array.isArray(userBookmarks) ? [...userBookmarks] : [];
                sessionTitle = `Saved Bookmarks Practice`;
            }

            let questionsToLaunch = [];

            if (clinicMode !== 'SPRINT' && targetIds.length > 0 && typeof db !== 'undefined') {
                const sliceIds = targetIds.slice(0, 30);
                for (let i = 0; i < sliceIds.length; i += 10) {
                    const chunk = sliceIds.slice(i, i + 10);
                    const snap = await db.collection('content').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
                    snap.forEach(doc => {
                        const d = doc.data();
                        if (!d.type || d.type === 'mcq') questionsToLaunch.push({ id: doc.id, ...d });
                    });
                }
            }

            if (questionsToLaunch.length === 0 && typeof db !== 'undefined') {
                sessionTitle = `${formatCleanTopicTitle(activeExam)} > ⚡ 5-Min Rapid Sprint`;
                const snap = await db.collection('content')
                    .where('path', '>=', activeExam)
                    .where('path', '<=', activeExam + '\uf8ff')
                    .limit(40)
                    .get();
                const pool = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    if ((!d.type || d.type === 'mcq') && d.question && d.options && d.options.A) {
                        pool.push({ id: doc.id, ...d });
                    }
                });
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                questionsToLaunch = pool.slice(0, 10);
            }

            if (questionsToLaunch.length === 0) {
                showNotification('⚠️ Select an exam folder to start practicing!');
                jumpToSection([activeExam]);
                return;
            }

            document.body.classList.add('hide-ai-btn');
            document.body.classList.add('mcqs-anti-cheat-active');
            document.body.classList.add('mcqs-quiz-screen-active');
            document.body.classList.add('hide-bottom-bar');
            document.body.classList.remove('mcqs-on-root-home');

            currentQuestions = questionsToLaunch;
            currentQuizPath = sessionTitle;
            currentIndex = 0;
            userAnswers = {};
            timeSpent = {};
            window.location.hash = '#/quiz';
            setTimeout(() => {
                if (typeof renderQuizInterface === 'function') renderQuizInterface();
                if (typeof startQuestionTimer === 'function') startQuestionTimer();
                syncQuizScreenAndAntiCheatState();
            }, 60);
        } catch (e) {
            showNotification('⚠️ Error launching session: ' + e.message);
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = '⚡ Launch Selected Clinic Session'; }
        }
    };

    function renderSmartMistakeClinicCard() {
        const mount = document.getElementById('mcqsSmartClinicMount');
        if (!mount) return;

        const inv = getLivePlatformInventory();
        const exams = inv.exams.length ? inv.exams : ['NEET'];
        const activeExam = exams[sim1ActiveExamIdx % exams.length];
        const cleanExam = formatCleanTopicTitle(activeExam);
        const st = realStudentDiagnosticsCache.byExam?.[activeExam];

        const wrongCnt = (st && st.wrongIds && st.wrongIds.length > 0) ? st.wrongIds.length : realStudentDiagnosticsCache.allWrongIds.length;
        const skipCnt = (st && st.skippedIds && st.skippedIds.length > 0) ? st.skippedIds.length : realStudentDiagnosticsCache.allSkippedIds.length;
        const bmCnt = Array.isArray(userBookmarks) ? userBookmarks.length : 0;

        if (clinicMode === 'WRONG' && wrongCnt === 0 && skipCnt === 0 && bmCnt === 0) {
            clinicMode = 'SPRINT';
        }

        const modes = [
            { id: 'WRONG', icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.16)', title: 'Fix My Wrong MCQs', count: `${wrongCnt} MCQs`, desc: 'Re-attempt questions you got wrong & turn −1 into +4' },
            { id: 'SKIPPED', icon: '⏭️', color: '#eab308', bg: 'rgba(234,179,8,0.16)', title: 'Clear Skipped Queue', count: `${skipCnt} MCQs`, desc: 'Practice questions you left unattempted in past tests' },
            { id: 'BOOKMARKS', icon: '🔖', color: '#c084fc', bg: 'rgba(168,85,247,0.16)', title: 'Saved Bookmarks', count: `${bmCnt} MCQs`, desc: 'Test yourself on your bookmarked high-yield questions' },
            { id: 'SPRINT', icon: '⚡', color: '#38bdf8', bg: 'rgba(56,189,248,0.16)', title: `5-Min ${cleanExam} Sprint`, count: '10 Rapid MCQs', desc: `Instant 10-question reflex booster from ${cleanExam}` }
        ];

        const modeCardsHtml = modes.map(m => {
            const active = clinicMode === m.id;
            return `
                <div onclick="setSmartClinicMode('${m.id}')" style="background:${active ? m.bg : '#0b101d'}; border:1.5px solid ${active ? m.color : 'rgba(255,255,255,0.09)'}; border-radius:10px; padding:10px 12px; cursor:pointer; transition:0.15s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span style="font-size:12.5px; font-weight:800; color:#fff;">${m.icon} ${m.title}</span>
                        <span style="font-size:10.5px; font-weight:900; color:${m.color}; background:${m.bg}; border:1px solid ${m.color}; padding:2px 8px; border-radius:999px;">${m.count}</span>
                    </div>
                    <div style="font-size:11px; color:#94a3b8; margin-top:4px; line-height:1.35;">${m.desc}</div>
                </div>
            `;
        }).join('');

        mount.innerHTML = `
            <div class="mcqs-clinic-box" id="mcqs-mistake-clinic-anchor">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        <span style="background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.45); font-size:10px; font-weight:900; padding:3px 9px; border-radius:999px;">🧬 ZERO-REPEAT MISTAKE CLINIC</span>
                        <span style="font-size:11px; color:#94a3b8; font-weight:700;">Active: <b style="color:#fdb813;">${cleanExam}</b></span>
                    </div>
                    <h3 style="margin:0 0 4px 0; font-size:18px; font-weight:900; color:#ffffff;">Smart Mistake Clinic &amp; Rapid Sprint</h3>
                    <p style="margin:0 0 12px 0; font-size:12.5px; color:#94a3b8;">Convert your personal weak spots into guaranteed marks or run a 5-minute reflex sprint.</p>

                    <div class="mcqs-clinic-modes-grid">
                        ${modeCardsHtml}
                    </div>
                </div>

                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button type="button" id="btnLaunchSmartClinic" onclick="launchSmartMistakeClinicSession()" style="flex:2; min-width:180px; background:linear-gradient(135deg, #38bdf8, #0284c7); color:#fff; border:none; padding:11px 16px; border-radius:10px; font-size:13px; font-weight:900; cursor:pointer; box-shadow:0 6px 20px rgba(56,189,248,0.3);">
                        ⚡ Launch Selected Clinic Session &rarr;
                    </button>
                    <button type="button" onclick="window.location.hash='#/diary'" style="flex:1; min-width:110px; background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.14); padding:11px 12px; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer;">
                        📔 Doubt Diary
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // CUSTOM MOCK STUDIO & EXAM WORKSPACE CARDS
    // ==========================================
    var homeStudioState = {
        exam: '',
        diff: 'Mixed',
        limit: 45
    };

    window.setHomeStudioOption = function(field, val) {
        homeStudioState[field] = val;
        renderCustomMockStudioCard();
    };

    window.launchCustomStudioWithPreselection = function(optionalExamKey) {
        const inv = getLivePlatformInventory();
        const chosenExam = optionalExamKey || homeStudioState.exam || inv.exams[0] || '';
        if (!chosenExam) {
            forceCwStep1();
            return;
        }
        cwPath = chosenExam;
        cwDiff = homeStudioState.diff || 'Mixed';
        cwLimit = Number(homeStudioState.limit) || 45;
        cwSelectedSubjects = [];
        cwSelectedChapters = [];
        window.location.hash = '#/custom-setup';
        setTimeout(() => {
            if (typeof cwStep2 === 'function') {
                cwStep2();
                const diffEl = document.getElementById('cwDiffSelect');
                if (diffEl) diffEl.value = cwDiff;
                const numEl = document.getElementById('cwNum');
                if (numEl) numEl.value = String(cwLimit);
            }
        }, 60);
    };

    function renderCustomMockStudioCard() {
        const mount = document.getElementById('mcqsCustomStudioMount');
        if (!mount) return;

        const inv = getLivePlatformInventory();
        let excludedSet = new Set((window.customPracticeConfig && Array.isArray(window.customPracticeConfig.excludedExams)) ? window.customPracticeConfig.excludedExams : []);
        const validExams = inv.exams.filter(k => !excludedSet.has(k));
        if (!homeStudioState.exam || !validExams.includes(homeStudioState.exam)) {
            homeStudioState.exam = validExams[0] || inv.exams[0] || 'NEET';
        }

        const examPills = validExams.map(ex => {
            const clean = formatCleanTopicTitle(ex);
            const active = homeStudioState.exam === ex;
            const safe = ex.replace(/'/g, "\\'");
            return `<button type="button" class="mcqs-studio-opt-pill ${active ? 'active' : ''}" onclick="setHomeStudioOption('exam', '${safe}')">${clean}</button>`;
        }).join('');

        const diffPills = [
            { id: 'Mixed', lbl: '⚡ Mixed' },
            { id: 'Easy', lbl: '🟢 Easy' },
            { id: 'Medium', lbl: '🟡 Med' },
            { id: 'Hard', lbl: '🔴 Hard' }
        ].map(d => `
            <button type="button" class="mcqs-studio-opt-pill ${homeStudioState.diff === d.id ? 'active' : ''}" onclick="setHomeStudioOption('diff', '${d.id}')">${d.lbl}</button>
        `).join('');

        const countPills = [25, 45, 90, 180, 250].map(n => `
            <button type="button" class="mcqs-studio-opt-pill ${Number(homeStudioState.limit) === n ? 'active' : ''}" onclick="setHomeStudioOption('limit', ${n})">${n}</button>
        `).join('');

        mount.innerHTML = `
            <div class="mcqs-studio-box">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        <span style="background:rgba(253,184,19,0.2); color:#fdb813; border:1px solid rgba(253,184,19,0.5); font-size:10px; font-weight:900; padding:3px 9px; border-radius:999px;">🎯 CUSTOM MOCK BUILDER (20–250 MCQS)</span>
                        <span style="font-size:11px; color:#94a3b8; font-weight:700;">Multi-Chapter</span>
                    </div>
                    <h3 style="margin:0 0 4px 0; font-size:18px; font-weight:900; color:#ffffff;">Build Tailored Multi-Subject Mock Test</h3>
                    <p style="margin:0 0 12px 0; font-size:12.5px; color:#94a3b8;">Pick your exam, difficulty tier, and question count, then select chapters.</p>

                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
                        <div>
                            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase;">1. Target Exam</div>
                            <div class="mcqs-studio-pill-group">${examPills}</div>
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
                            <div>
                                <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase;">2. Difficulty</div>
                                <div class="mcqs-studio-pill-group">${diffPills}</div>
                            </div>
                            <div>
                                <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase;">3. MCQs Count</div>
                                <div class="mcqs-studio-pill-group">${countPills}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="button" class="mcqs-btn-gold" onclick="launchCustomStudioWithPreselection()" style="width:100%;">
                    Select Chapters &amp; Launch (${homeStudioState.limit} MCQs) 🚀
                </button>
            </div>
        `;
    }

    function renderExamWorkspaceCardsGrid() {
        const mount = document.getElementById('mcqsExamWorkspacesMount');
        if (!mount) return;

        const inv = getLivePlatformInventory();
        let usedColors = new Set();
        let usedIcons = new Set();

        const cardsHtml = inv.exams.map((exKey, idx) => {
            const cleanEx = formatCleanTopicTitle(exKey);
            const safeEx = exKey.replace(/'/g, "\\'");
            const topicType = customTopicTypes[exKey];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            const th = getAutoTopicTheme(cleanEx, customIcon, idx, usedColors, '📘', usedIcons, exKey);

            const st = realStudentDiagnosticsCache.byExam?.[exKey];
            const statusBadge = (st && st.hasRealData)
                ? `<span style="font-size:10.5px; font-weight:800; background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:3px 9px; border-radius:999px;">🟢 ${st.totalAttempted} Solved • ${st.overallAccuracy}%</span>`
                : `<span style="font-size:10.5px; font-weight:800; background:${th.bg}; color:${th.c}; border:1px solid ${th.border}; padding:3px 9px; border-radius:999px;">⚡ Open Suite</span>`;

            const directFolders = inv.directChildrenByExam[exKey] || [];
            let folderChipsHtml = '';
            if (directFolders.length > 0) {
                let chipColorSet = new Set();
                folderChipsHtml = directFolders.map((childKey, cIdx) => {
                    const cleanChild = formatCleanTopicTitle(childKey);
                    const childFull = `${exKey} > ${childKey}`;
                    const chipTheme = getAutoTopicTheme(cleanChild, null, cIdx, chipColorSet, '📘', null, childFull);
                    const safeChild = childKey.replace(/'/g, "\\'");
                    return `
                        <span class="mcqs-subfolder-chip" style="border-color:${chipTheme.border}; background:${chipTheme.bg};" onclick="event.stopPropagation(); jumpToSection(['${safeEx}', '${safeChild}'])">
                            <span style="color:${chipTheme.c};">${chipTheme.i}</span> <span>${cleanChild}</span>
                        </span>
                    `;
                }).join('');
            } else {
                folderChipsHtml = `
                    <span class="mcqs-subfolder-chip" style="border-color:rgba(6,182,212,0.5); background:rgba(6,182,212,0.12);" onclick="event.stopPropagation(); jumpToSection(['${safeEx}'])">📝 Practice MCQs</span>
                    <span class="mcqs-subfolder-chip" style="border-color:rgba(253,184,19,0.5); background:rgba(253,184,19,0.12);" onclick="event.stopPropagation(); launchCustomStudioWithPreselection('${safeEx}')">🎯 Custom ${cleanEx} Mock</span>
                    <span class="mcqs-subfolder-chip" style="border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.12);" onclick="event.stopPropagation(); window.location.hash='#/progress/${encodeURIComponent(exKey)}'">📊 ${cleanEx} Analytics</span>
                `;
            }

            const subjCount = (inv.subjectsByExam[exKey] || []).length;

            return `
                <div class="mcqs-modern-exam-card" style="--exam-color:${th.c}; --exam-bg:${th.bg}; --exam-border:${th.border}; --exam-glow:${th.glow};" onclick="jumpToSection(['${safeEx}'])">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                                ${th.i === 'NONE' ? '' : `<div style="width:40px; height:40px; border-radius:11px; background:${th.bg}; border:1px solid ${th.border}; color:${th.c}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${th.i}</div>`}
                                <div style="min-width:0;">
                                    <h4 style="margin:0; font-size:16.5px; font-weight:900; color:#ffffff;">${cleanEx}</h4>
                                    <div style="font-size:11px; color:#94a3b8; margin-top:1px;">${subjCount > 0 ? `${subjCount} Subjects • ` : ''}${directFolders.length || 'Complete'} Suite</div>
                                </div>
                            </div>
                            ${statusBadge}
                        </div>

                        <div style="margin-bottom:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">Direct Jump Inside ${cleanEx}:</div>
                            <div class="mcqs-subfolder-chip-row">${folderChipsHtml}</div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.07); padding-top:9px; font-size:12px; font-weight:800; color:${th.c};">
                        <span>Open ${cleanEx} Workspace</span>
                        <span>&rarr;</span>
                    </div>
                </div>
            `;
        }).join('');

        mount.innerHTML = `<div class="mcqs-exam-cards-grid">${cardsHtml}</div>`;
    }

    function buildRemadeQuickLinksAndEssentialHtml() {
        const quickLinksList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.quickLinks)) ? window.sidebarConfig.quickLinks : [];
        const essentialList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.essentialPractice)) ? window.sidebarConfig.essentialPractice : [];
        const streakVal = verifiedStreakData.trueStreak || 0;

        let usedColorsQ = new Set();
        const qHtml = quickLinksList.map((item, idx) => {
            const displayTitle = formatCleanTopicTitle(item.title || item.path.split(' > ').pop() || '');
            const encodedPath = encodeURIComponent(item.path);
            const th = getAutoTopicTheme(displayTitle, item.icon || null, idx, usedColorsQ, '📚', null, item.path);
            return `
                <div class="mcqs-modern-link-item" style="--link-color:${th.c}; --link-bg:${th.bg}; --link-border:${th.border}; --link-glow:${th.glow};" onclick="openSidebarItem('${encodedPath}')">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <span style="width:32px; height:32px; border-radius:8px; background:${th.bg}; border:1px solid ${th.border}; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">${th.i}</span>
                        <div style="font-size:13px; font-weight:800; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayTitle}</div>
                    </div>
                    <span style="color:${th.c}; font-weight:900; font-size:14px; flex-shrink:0;">&rsaquo;</span>
                </div>
            `;
        }).join('');

        let usedColorsE = new Set(['#fdb813']);
        let eHtml = `
            <div class="mcqs-modern-link-item" style="--link-color:#fdb813; --link-bg:rgba(253,184,19,0.16); --link-border:rgba(253,184,19,0.55); --link-glow:rgba(253,184,19,0.25);" onclick="jumpToSection(['Daily Quiz Challenge'])">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <span style="width:32px; height:32px; border-radius:8px; background:rgba(253,184,19,0.2); border:1px solid rgba(253,184,19,0.55); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">📅</span>
                    <div style="min-width:0;">
                        <div style="font-size:13px; font-weight:900; color:#fdb813;">Daily Quiz Challenge</div>
                        <div style="font-size:10.5px; color:#cbd5e1;">🔥 <span id="mcqsHomeDailyStreakNum">${streakVal}</span> Day Streak</div>
                    </div>
                </div>
                <span style="color:#fdb813; font-weight:900; font-size:14px; flex-shrink:0;">&rsaquo;</span>
            </div>
        `;

        essentialList.forEach((item, idx) => {
            if (item.path === 'Daily Quiz Challenge') return;
            const displayTitle = formatCleanTopicTitle(item.title || item.path.split(' > ').pop() || '');
            const encodedPath = encodeURIComponent(item.path);
            const th = getAutoTopicTheme(displayTitle, item.icon || null, idx + 4, usedColorsE, '📝', null, item.path);
            eHtml += `
                <div class="mcqs-modern-link-item" style="--link-color:${th.c}; --link-bg:${th.bg}; --link-border:${th.border}; --link-glow:${th.glow};" onclick="openSidebarItem('${encodedPath}')">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <span style="width:32px; height:32px; border-radius:8px; background:${th.bg}; border:1px solid ${th.border}; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">${th.i}</span>
                        <div style="font-size:13px; font-weight:800; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayTitle}</div>
                    </div>
                    <span style="color:${th.c}; font-weight:900; font-size:14px; flex-shrink:0;">&rsaquo;</span>
                </div>
            `;
        });

        return `
            <div style="background:#0d121f; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:16px; height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; gap:16px;">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; font-size:13.5px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.5px; border-left:3px solid #a855f7; padding-left:8px;">📚 Quick Links</h3>
                        <span style="font-size:10.5px; color:#c084fc; font-weight:800;">Instant Access</span>
                    </div>
                    <div class="mcqs-links-list-grid">${qHtml || '<span style="color:#64748b; font-size:12px;">No quick links added.</span>'}</div>
                </div>

                <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; font-size:13.5px; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.5px; border-left:3px solid #fdb813; padding-left:8px;">⚡ Essential Practice</h3>
                        <span style="font-size:10.5px; color:#fdb813; font-weight:800;">Daily &amp; PYQs</span>
                    </div>
                    <div class="mcqs-links-list-grid">${eHtml}</div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MODERNIZED INNER FOLDER VIEW
    // ==========================================
    function classifySubtopicModuleBadge(cleanName, fullCheckPath, typeValue, childKeys) {
        const lower = cleanName.toLowerCase();
        if (lower === 'easy') return { badge: '🟢 Warmup Tier', desc: 'NCERT direct & foundational concepts' };
        if (lower === 'medium') return { badge: '🟡 Standard Tier', desc: 'Exam-level conceptual & statement MCQs' };
        if (lower === 'hard') return { badge: '🔴 Rank Booster', desc: 'Multi-concept, assertion & analytical MCQs' };
        if (lower === 'mixed') return { badge: '⚡ Shuffled Mix', desc: 'Balanced combination of Easy, Medium & Hard' };

        if (typeValue === 'pdf' || /ncert book|ebook|textbook|notes|syllabus|formula/.test(lower)) {
            return { badge: '📚 PDF Library', desc: 'Read in-app or download high-res study material' };
        }
        if (/pyq|previous year|past paper|archive/.test(lower)) {
            return { badge: '📜 Past Papers', desc: 'Authentic exam-wise & year-wise solved questions' };
        }
        if (/mock test|test series|all india test|grand test|full test/.test(lower)) {
            return { badge: '⏱️ Test Series', desc: 'Full-syllabus & part-syllabus timed mock exams' };
        }
        if (/practice paper|sample paper|model paper|guess paper/.test(lower)) {
            return { badge: '📋 Practice Papers', desc: 'Curated exam-pattern practice question sets' };
        }
        if (/mcqs practice|mcq practice|question bank/.test(lower)) {
            return { badge: '📝 Chapter-Wise MCQs', desc: 'Subject & chapter-wise NCERT line-by-line practice' };
        }
        if (childKeys.length > 0) {
            const hasDiffChildren = childKeys.some(k => ['easy', 'medium', 'hard', 'mixed'].includes(formatCleanTopicTitle(k).toLowerCase()));
            if (hasDiffChildren) {
                return { badge: '🎯 Chapter Practice', desc: 'Tap a difficulty pill below or open chapter' };
            }
            return { badge: `📂 ${childKeys.length} Subtopics`, desc: `Explore ${childKeys.length} modules inside ${cleanName}` };
        }
        return { badge: '📝 Practice Module', desc: `Launch ${cleanName} practice questions` };
    }

    function renderModernizedInnerFolderView() {
        const mc = document.getElementById('dynamic-content');
        if (!mc) return false;

        const checkPath = currentPath.join(' > ');
        const keysArr = getDirectChildrenOfPath(currentPath);

        if (keysArr.length === 0) {
            return false;
        }

        const folderRaw = currentPath[currentPath.length - 1];
        const folderClean = formatCleanTopicTitle(folderRaw);
        const rootExam = currentPath[0];
        const cleanRootExam = formatCleanTopicTitle(rootExam);
        const safeRootExamJs = rootExam.replace(/'/g, "\\'");

        const folderTheme = getAutoTopicTheme(folderClean, (customTopicTypes[checkPath]?.icon || null), 0, null, '📂', null, checkPath);
        const pathStats = getRealStatsForPathPrefix(checkPath);

        let crumbsHtml = `<span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>`;
        currentPath.forEach((seg, idx) => {
            const cleanSeg = formatCleanTopicTitle(seg);
            const isLast = idx === currentPath.length - 1;
            const subTrail = currentPath.slice(0, idx + 1).map(s => `'${s.replace(/'/g, "\\'")}'`).join(', ');
            crumbsHtml += `<span style="color:#475569; font-size:12px;">›</span>`;
            crumbsHtml += `<span class="mcqs-crumb-pill ${isLast ? 'active' : ''}" onclick="jumpToSection([${subTrail}])">${cleanSeg}</span>`;
        });

        let subSearchHtml = '';
        if (isSubtopicSearchEnabledForPath(checkPath, keysArr.length)) {
            const placeholderText = getSubtopicSearchPlaceholder(checkPath, folderClean).replace(/"/g, '&quot;');
            subSearchHtml = `
                <div class="subtopic-search-container" style="margin:14px 0 0 0;">
                    <div class="subtopic-search-box" style="background:#0c111d; border-color:rgba(253,184,19,0.4);">
                        <span class="subtopic-search-icon">🔍</span>
                        <input type="text" id="subtopicSearchInput" class="subtopic-search-input" placeholder="${placeholderText}" oninput="handleSubtopicLiveSearch()" onfocus="handleSubtopicLiveSearch()" onblur="setTimeout(() => { const d = document.getElementById('subtopicSearchDropdown'); if(d) d.style.display='none'; }, 220)">
                        <button type="button" id="subtopicSearchClearBtn" class="subtopic-search-clear" onclick="clearSubtopicLiveSearch()" title="Clear search">✕</button>
                    </div>
                    <div id="subtopicSearchDropdown" class="subtopic-search-dropdown"></div>
                </div>
            `;
        }

        let colorIdx = 0;
        let usedColors = new Set();
        let usedIcons = new Set();

        const cardsHtml = keysArr.map(key => {
            const fullChildPath = `${checkPath} > ${key}`;
            const topicMeta = customTopicTypes[fullChildPath];
            const typeValue = topicMeta ? (typeof topicMeta === 'object' ? topicMeta.type : topicMeta) : null;
            const customIcon = topicMeta ? (typeof topicMeta === 'object' ? topicMeta.icon : null) : null;
            const rawDisplay = (topicMeta && topicMeta.displayName) ? topicMeta.displayName : key;
            const displayKey = formatCleanTopicTitle(rawDisplay);
            const safeAttrTitle = displayKey.replace(/"/g, '&quot;');
            const safeKey = key.replace(/'/g, "\\'");

            const fallbackIcon = typeValue === 'pdf' ? '📄' : (typeValue === 'mcq' ? '📝' : null);
            const iconData = getAutoTopicTheme(displayKey, customIcon, colorIdx++, usedColors, fallbackIcon, usedIcons, fullChildPath);

            const grandChildren = getDirectChildrenOfPath([...currentPath, key]);
            const info = classifySubtopicModuleBadge(displayKey, fullChildPath, typeValue, grandChildren);
            const childStats = getRealStatsForPathPrefix(fullChildPath);

            const topRightBadge = childStats.solved > 0
                ? `<span style="font-size:10.5px; font-weight:800; background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); padding:3px 9px; border-radius:999px; white-space:nowrap;">🟢 ${childStats.solved} Solved • ${childStats.acc}%</span>`
                : `<span style="font-size:10.5px; font-weight:800; background:${iconData.bg}; color:${iconData.c}; border:1px solid ${iconData.border}; padding:3px 9px; border-radius:999px; white-space:nowrap;">${info.badge}</span>`;

            let nestedChipsHtml = '';
            if (grandChildren.length > 0) {
                const isDifficultySet = grandChildren.every(gk => ['easy', 'medium', 'hard', 'mixed'].includes(formatCleanTopicTitle(gk).toLowerCase()));
                const currentTrailJs = currentPath.map(s => `'${s.replace(/'/g, "\\'")}'`).join(', ');

                if (isDifficultySet) {
                    const diffColors = { easy: '#10b981', medium: '#eab308', hard: '#f43f5e', mixed: '#a855f7' };
                    const pills = grandChildren.map(gk => {
                        const cleanG = formatCleanTopicTitle(gk);
                        const dCol = diffColors[cleanG.toLowerCase()] || '#38bdf8';
                        const safeGk = gk.replace(/'/g, "\\'");
                        return `
                            <span onclick="event.stopPropagation(); jumpToSection([${currentTrailJs}, '${safeKey}', '${safeGk}'])" style="background:rgba(255,255,255,0.05); border:1px solid ${dCol}; color:#fff; padding:4px 9px; border-radius:7px; font-size:10.5px; font-weight:800; cursor:pointer;">
                                ${cleanG} &rarr;
                            </span>
                        `;
                    }).join('');
                    nestedChipsHtml = `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">${pills}</div>`;
                } else {
                    let subChipColors = new Set();
                    const previewChips = grandChildren.slice(0, 4).map((gk, gIdx) => {
                        const cleanG = formatCleanTopicTitle(gk);
                        const gTheme = getAutoTopicTheme(cleanG, null, gIdx, subChipColors, '📘', null, `${fullChildPath} > ${gk}`);
                        const safeGk = gk.replace(/'/g, "\\'");
                        return `
                            <span class="mcqs-subfolder-chip" style="border-color:${gTheme.border}; background:${gTheme.bg};" onclick="event.stopPropagation(); jumpToSection([${currentTrailJs}, '${safeKey}', '${safeGk}'])">
                                <span style="color:${gTheme.c};">${gTheme.i}</span> <span>${cleanG}</span>
                            </span>
                        `;
                    }).join('');
                    const moreCount = grandChildren.length > 4 ? `<span style="font-size:10.5px; color:#94a3b8; align-self:center; font-weight:700;">+${grandChildren.length - 4} more</span>` : '';
                    nestedChipsHtml = `<div class="mcqs-subfolder-chip-row" style="margin-top:10px;">${previewChips}${moreCount}</div>`;
                }
            }

            return `
                <div class="category-tile mcqs-modern-subtopic-card" data-tile-title="${safeAttrTitle}" style="--topic-color:${iconData.c}; --topic-bg:${iconData.bg}; --topic-border:${iconData.border}; --topic-glow:${iconData.glow};" onclick="navigateTo('${safeKey}')">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                            <div style="display:flex; align-items:center; gap:11px; min-width:0;">
                                ${iconData.i === 'NONE' ? '' : `<div style="width:42px; height:42px; border-radius:12px; background:${iconData.bg}; border:1px solid ${iconData.border}; color:${iconData.c}; display:flex; align-items:center; justify-content:center; font-size:21px; flex-shrink:0; box-shadow:0 0 12px ${iconData.glow};">${iconData.i}</div>`}
                                <div style="min-width:0;">
                                    <div style="font-size:16px; font-weight:900; color:#ffffff; line-height:1.25;">${displayKey}</div>
                                    <div style="font-size:11.5px; color:#94a3b8; margin-top:3px;">${info.desc}</div>
                                </div>
                            </div>
                            ${topRightBadge}
                        </div>
                        ${nestedChipsHtml}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:9px; margin-top:12px; font-size:12px; font-weight:800; color:${iconData.c};">
                        <span>${grandChildren.length > 0 ? `${grandChildren.length} Modules Inside` : 'Open &amp; Practice'}</span>
                        <span>Explore &rarr;</span>
                    </div>
                </div>
            `;
        }).join('');

        mc.innerHTML = `
            <div class="page-transition">
                <div class="mcqs-inner-command-header">
                    <div class="mcqs-crumb-bar">${crumbsHtml}</div>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                            <div style="width:48px; height:48px; border-radius:14px; background:${folderTheme.bg}; border:1.5px solid ${folderTheme.border}; color:${folderTheme.c}; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; box-shadow:0 0 18px ${folderTheme.glow};">
                                ${folderTheme.i === 'NONE' ? '📂' : folderTheme.i}
                            </div>
                            <div style="min-width:0;">
                                <h1 style="margin:0; font-size:clamp(20px, 2.6vw, 28px); font-weight:900; color:#ffffff; line-height:1.15;">${folderClean}</h1>
                                <div style="font-size:12.5px; color:#94a3b8; margin-top:3px;">
                                    <b style="color:#fdb813;">${keysArr.length} Modules</b> available${pathStats.solved > 0 ? ` • Your Progress: <b style="color:#10b981;">✔ ${pathStats.solved} Solved (${pathStats.acc}% Accuracy)</b>` : ''}
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            ${rootExam !== 'Daily Quiz Challenge' ? `
                                <button type="button" onclick="launchCustomStudioWithPreselection('${safeRootExamJs}')" style="background:linear-gradient(135deg, #fdb813, #f59e0b); color:#000; border:none; padding:8px 14px; border-radius:10px; font-size:12px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 15px rgba(253,184,19,0.3);">
                                    🎯 Custom ${cleanRootExam} Mock
                                </button>
                                <button type="button" onclick="window.location.hash='#/progress/${encodeURIComponent(rootExam)}'" style="background:rgba(56,189,248,0.14); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:8px 13px; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer;">
                                    📊 ${cleanRootExam} Stats
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    ${subSearchHtml}
                </div>

                <div class="mcqs-inner-subtopics-grid" id="activeSubtopicCategoryGrid">
                    ${cardsHtml}
                </div>
            </div>
        `;
        return true;
    }

    // ==========================================
    // MODERNIZED ANALYTICS SELECTION & DASHBOARD (#/progress — FIXES IMAGE 3)
    // ==========================================
    _renderProgressSelection = function() {
        const mc = document.getElementById('dynamic-content');
        if (!mc) return;

        if (!currentUser) {
            mc.innerHTML = `
                <div class="mcqs-arch-surface page-transition" style="text-align:center; max-width:540px; margin:20px auto;">
                    <div style="font-size:44px; margin-bottom:10px;">📊</div>
                    <h2 style="margin:0 0 8px 0; color:#fff; font-size:22px; font-weight:900;">Sign In to View Personal Analytics</h2>
                    <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin-bottom:22px;">Track your subject-wise mastery, speed-vs-accuracy autopsy, and longitudinal score trajectory across all exams.</p>
                    <button class="mcqs-btn-gold" onclick="showAuthModal()">🔑 Sign In with Google</button>
                </div>`;
            return;
        }

        document.getElementById('breadcrumb-text').innerText = 'Home / Profile / Track Progress';
        syncRealStudentDiagnostics(false);

        const rootKeys = getLiveActiveExamCategories();
        let usedColors = new Set();
        let usedIcons = new Set();

        const cardsHtml = rootKeys.map((k, idx) => {
            const cleanKey = formatCleanTopicTitle(k);
            const topicType = customTopicTypes[k];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            const th = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, '📊', usedIcons, k);
            const st = realStudentDiagnosticsCache.byExam?.[k] || computeExamStatsFromRealSources(k, realStudentDiagnosticsCache.rawFirestoreDocs || []);

            return `
                <div class="mcqs-modern-subtopic-card" style="--topic-color:${th.c}; --topic-bg:${th.bg}; --topic-border:${th.border}; --topic-glow:${th.glow};" onclick="window.location.hash='#/progress/${encodeURIComponent(k)}'">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:12px; background:${th.bg}; border:1px solid ${th.border}; color:${th.c}; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 0 14px ${th.glow};">${th.i === 'NONE' ? '📊' : th.i}</div>
                                <div>
                                    <div style="font-size:17px; font-weight:900; color:#fff;">${cleanKey} Analytics</div>
                                    <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">${st.hasRealData ? `📋 ${st.quizzesPlayed} Quizzes • 📝 ${st.totalAttempted} MCQs` : '0 Quizzes Attempted Yet'}</div>
                                </div>
                            </div>
                            ${st.hasRealData
                                ? `<span style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); font-size:11px; font-weight:900; padding:3px 10px; border-radius:999px;">🎯 ${st.overallAccuracy}% Acc</span>`
                                : `<span style="background:rgba(255,255,255,0.06); color:#94a3b8; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:999px;">Ready to Activate</span>`
                            }
                        </div>

                        ${st.hasRealData ? `
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; background:#090d16; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:8px; text-align:center;">
                                <div><div style="font-size:14px; font-weight:900; color:#fdb813;">${st.totalScore} pts</div><div style="font-size:9.5px; color:#94a3b8;">Net Score</div></div>
                                <div><div style="font-size:14px; font-weight:900; color:#10b981;">✔ ${st.correctCount}</div><div style="font-size:9.5px; color:#94a3b8;">Correct</div></div>
                                <div><div style="font-size:14px; font-weight:900; color:#ef4444;">✖ ${st.wrongCount}</div><div style="font-size:9.5px; color:#94a3b8;">Wrong</div></div>
                            </div>
                        ` : `<div style="font-size:12px; color:#94a3b8;">Complete 1 quiz in ${cleanKey} to unlock deep performance diagnostics.</div>`}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; margin-top:12px; font-size:12px; font-weight:800; color:${th.c};">
                        <span>Open Diagnostic Report</span>
                        <span>&rarr;</span>
                    </div>
                </div>
            `;
        }).join('');

        mc.innerHTML = `
            <div class="page-transition">
                <div class="mcqs-inner-command-header">
                    <div class="mcqs-crumb-bar">
                        <span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>
                        <span style="color:#475569;">›</span>
                        <span class="mcqs-crumb-pill active">📊 Analytics Command Center</span>
                    </div>
                    <h1 style="margin:0; font-size:clamp(20px, 2.6vw, 28px); font-weight:900; color:#fff;">📊 Select Exam Analytics Dashboard</h1>
                    <p style="margin:4px 0 0 0; font-size:13px; color:#94a3b8;">Choose an exam suite below to inspect your subject-wise mastery, weak-spot alerts (&lt;50%), speed autopsy, and accuracy trajectory.</p>
                </div>
                <div class="mcqs-inner-subtopics-grid">${cardsHtml}</div>
            </div>
        `;
    };

    _renderProgressDashboard = async function(category) {
        if (!currentUser) { _renderProgressSelection(); return; }
        const displayCategory = formatCleanTopicTitle(category);
        const safeCatJs = category.replace(/'/g, "\\'");
        document.getElementById('breadcrumb-text').innerText = `Home / Profile / Progress / ${displayCategory}`;
        const mc = document.getElementById('dynamic-content');
        mc.innerHTML = `<div class="mcqs-arch-surface page-transition" style="text-align:center; padding:45px;"><h2>📊 Compiling ${displayCategory} Diagnostics...</h2></div>`;

        try {
            const snap = await db.collection('leaderboards').where('userId', '==', currentUser.uid).get();
            const tempDocs = [];
            snap.forEach(doc => tempDocs.push(doc.data()));
            tempDocs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

            const st = computeExamStatsFromRealSources(category, tempDocs);

            if (!st.hasRealData) {
                mc.innerHTML = `
                    <div class="mcqs-arch-surface page-transition" style="text-align:center; max-width:560px; margin:20px auto; padding:40px 24px;">
                        <div style="font-size:46px; margin-bottom:10px;">📈</div>
                        <h2 style="margin:0 0 8px 0; color:#fff;">No ${displayCategory} Quizzes Attempted Yet</h2>
                        <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin-bottom:24px;">Complete your first practice quiz in <b>${displayCategory}</b> to unlock your live score trajectory, weak-spot detection, and speed-vs-accuracy autopsy.</p>
                        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                            <button class="mcqs-btn-glass" onclick="window.location.hash='#/progress'">❮ Back to Analytics</button>
                            <button class="mcqs-btn-gold" onclick="jumpToSection(['${safeCatJs}'])">🚀 Start First ${displayCategory} Quiz</button>
                        </div>
                    </div>
                `;
                return;
            }

            const weakSubjects = st.subjectList.filter(s => s.isWeak).map(s => `${s.name} (${s.pct}%)`);
            const weakBannerHtml = weakSubjects.length > 0
                ? `<div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.4); border-left:4px solid #ef4444; border-radius:12px; padding:14px 16px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <div style="font-size:11px; font-weight:900; color:#ef4444; text-transform:uppercase;">🚨 Priority Weak-Spot Alert (&lt;50% Accuracy)</div>
                            <div style="font-size:13.5px; color:#f1f5f9; font-weight:700; margin-top:3px;">${weakSubjects.join(' • ')}</div>
                        </div>
                        <button type="button" onclick="launchCustomStudioWithPreselection('${safeCatJs}')" style="background:#ef4444; color:#fff; border:none; padding:8px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer;">🎯 Practice Weak Chapters</button>
                   </div>`
                : `<div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.4); border-left:4px solid #10b981; border-radius:12px; padding:12px 16px; margin-bottom:18px; font-size:13px; color:#d1fae5; font-weight:700;">
                        ✅ Strong Mastery! All practiced subjects in ${displayCategory} are at 50% accuracy or above.
                   </div>`;

            const subjectBarsHtml = st.subjectList.length > 0
                ? st.subjectList.map(s => {
                    const col = s.pct >= 70 ? '#10b981' : (s.pct >= 50 ? '#fdb813' : '#ef4444');
                    const sIcon = getAutomaticIconForName(s.name, null, `${category} > ${s.name}`);
                    return `
                        <div style="background:#0d1322; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:11px 14px; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:13px; font-weight:800;">
                                <span style="color:#fff;">${sIcon} ${s.name}</span>
                                <span style="color:${col};">${s.pct}% <span style="color:#cbd5e1; font-size:11px; font-weight:700;">(<span style="color:#10b981;">✔ ${s.correct}</span> / ${s.attempts})</span></span>
                            </div>
                            <div style="width:100%; height:8px; background:#070a12; border-radius:4px; overflow:hidden;">
                                <div style="width:${s.pct}%; height:100%; background:${col}; border-radius:4px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')
                : `<p style="color:#94a3b8; font-size:13px;">Complete chapter-wise quizzes to generate subject breakdown bars.</p>`;

            mc.innerHTML = `
                <div class="page-transition">
                    <div class="mcqs-inner-command-header">
                        <div class="mcqs-crumb-bar">
                            <span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>
                            <span style="color:#475569;">›</span>
                            <span class="mcqs-crumb-pill" onclick="window.location.hash='#/progress'">📊 Analytics</span>
                            <span style="color:#475569;">›</span>
                            <span class="mcqs-crumb-pill active">${displayCategory}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                            <div>
                                <h1 style="margin:0; font-size:clamp(20px, 2.6vw, 28px); font-weight:900; color:#fff;">📊 ${displayCategory} Diagnostic Command Center</h1>
                                <div style="font-size:12.5px; color:#94a3b8; margin-top:3px;">Compiled from <b style="color:#fdb813;">${st.quizzesPlayed} completed quizzes</b> and <b style="color:#38bdf8;">${st.totalAttempted} attempted MCQs</b></div>
                            </div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button type="button" class="mcqs-btn-gold" onclick="launchCustomStudioWithPreselection('${safeCatJs}')" style="padding:9px 15px; font-size:12px;">🎯 Custom ${displayCategory} Mock</button>
                                <button type="button" class="mcqs-btn-glass" onclick="window.location.hash='#/board/${encodeURIComponent(category)}'" style="padding:9px 14px; font-size:12px;">🏆 ${displayCategory} Leaderboard</button>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:18px;">
                        <div style="background:#0d1322; border:1px solid rgba(56,189,248,0.35); border-radius:14px; padding:16px; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase;">📝 Attempted</div>
                            <div style="font-size:28px; font-weight:900; color:#38bdf8; margin-top:4px;">${st.totalAttempted}</div>
                        </div>
                        <div style="background:#0d1322; border:1px solid rgba(16,185,129,0.4); border-radius:14px; padding:16px; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase;">✔ Correct (+4)</div>
                            <div style="font-size:28px; font-weight:900; color:#10b981; margin-top:4px;">✔ ${st.correctCount}</div>
                        </div>
                        <div style="background:#0d1322; border:1px solid rgba(239,68,68,0.4); border-radius:14px; padding:16px; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase;">✖ Wrong (−1)</div>
                            <div style="font-size:28px; font-weight:900; color:#ef4444; margin-top:4px;">✖ ${st.wrongCount}</div>
                        </div>
                        <div style="background:#0d1322; border:1px solid rgba(253,184,19,0.45); border-radius:14px; padding:16px; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase;">⭐ Net Score</div>
                            <div style="font-size:28px; font-weight:900; color:#fdb813; margin-top:4px;">${st.totalScore}</div>
                        </div>
                        <div style="background:#0d1322; border:1px solid rgba(168,85,247,0.4); border-radius:14px; padding:16px; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase;">🎯 Accuracy</div>
                            <div style="font-size:28px; font-weight:900; color:#c084fc; margin-top:4px;">${st.overallAccuracy}%</div>
                        </div>
                    </div>

                    ${weakBannerHtml}

                    <div style="background:#0c111d; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:18px; margin-bottom:18px;">
                        <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:900; color:#fff; display:flex; align-items:center; gap:8px;">
                            <span>⏱️</span> <span>Time-to-Accuracy Behavioral Autopsy</span>
                        </h3>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
                            <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.4); border-radius:12px; padding:14px; text-align:center;">
                                <div style="font-size:26px; font-weight:900; color:#10b981;">✔ ${st.avgTimeCorrect}s</div>
                                <div style="font-size:12px; color:#cbd5e1; font-weight:700; margin-top:4px;">Avg Time on Correct Answers</div>
                            </div>
                            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.4); border-radius:12px; padding:14px; text-align:center;">
                                <div style="font-size:26px; font-weight:900; color:#ef4444;">✖ ${st.avgTimeWrong}s</div>
                                <div style="font-size:12px; color:#cbd5e1; font-weight:700; margin-top:4px;">Avg Time on Wrong Answers</div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:18px;">
                        <div style="background:#0c111d; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:18px;">
                            <h3 style="margin:0 0 14px 0; font-size:15px; font-weight:900; color:#fff;">📚 Subject-Wise Mastery</h3>
                            ${subjectBarsHtml}
                        </div>
                        <div style="background:#0c111d; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:18px;">
                            <h3 style="margin:0 0 14px 0; font-size:15px; font-weight:900; color:#fff;">📈 Accuracy Trajectory (Last ${st.recentTrend.length} Tests)</h3>
                            <canvas id="accuracyChart" style="width:100%; height:180px;"></canvas>
                        </div>
                    </div>
                </div>
            `;

            setTimeout(() => { if (typeof drawAccuracyChart === 'function') drawAccuracyChart(st.recentTrend); }, 60);
        } catch (e) {
            mc.innerHTML = `<div class="card"><p style="color:#ef4444;">Error loading analytics: ${e.message}</p></div>`;
        }
    };

    // ==========================================
    // MODERNIZED GLOBAL LEADERBOARDS (#/leaderboard & #/board/... — FIXES IMAGE 2)
    // ==========================================
    _renderLeaderboardOptions = function() {
        document.getElementById('breadcrumb-text').innerText = 'Home / Leaderboard';
        const mc = document.getElementById('dynamic-content');
        if (!mc) return;

        if (!currentUser) {
            mc.innerHTML = `
                <div class="mcqs-arch-surface page-transition" style="text-align:center; max-width:520px; margin:20px auto; padding:42px 24px;">
                    <div style="font-size:44px; margin-bottom:10px;">🏆</div>
                    <h2 style="margin:0 0 8px 0; color:#fff;">Sign In to View All-India Leaderboards</h2>
                    <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin-bottom:24px;">Only signed-in aspirants with at least <b>100 MCQs attempted</b> in an exam category can unlock official national rankings.</p>
                    <button class="mcqs-btn-gold" onclick="showAuthModal()">🔑 Sign In with Google</button>
                </div>`;
            return;
        }

        syncRealStudentDiagnostics(false);
        const rootKeys = getLiveActiveExamCategories();
        let usedColors = new Set();
        let usedIcons = new Set();

        const cardsHtml = rootKeys.map((k, idx) => {
            const cleanKey = formatCleanTopicTitle(k);
            const topicType = customTopicTypes[k];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            const th = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, '🏆', usedIcons, k);
            const st = realStudentDiagnosticsCache.byExam?.[k] || { totalAttempted: 0 };
            const attempted = st.totalAttempted || 0;
            const pct = Math.min(100, Math.round((attempted / 100) * 100));
            const unlocked = attempted >= 100;

            return `
                <div class="mcqs-modern-subtopic-card" style="--topic-color:${th.c}; --topic-bg:${th.bg}; --topic-border:${th.border}; --topic-glow:${th.glow};" onclick="window.location.hash='#/board/${encodeURIComponent(k)}'">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:12px; background:${th.bg}; border:1px solid ${th.border}; color:${th.c}; display:flex; align-items:center; justify-content:center; font-size:22px;">${th.i === 'NONE' ? '🏆' : th.i}</div>
                                <div>
                                    <div style="font-size:17px; font-weight:900; color:#fff;">${cleanKey} Leaderboard</div>
                                    <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">100-MCQ Qualification Benchmark</div>
                                </div>
                            </div>
                            ${unlocked
                                ? `<span style="background:rgba(16,185,129,0.16); color:#10b981; border:1px solid rgba(16,185,129,0.4); font-size:10.5px; font-weight:900; padding:3px 9px; border-radius:999px;">🔓 Unlocked</span>`
                                : `<span style="background:rgba(253,184,19,0.14); color:#fdb813; border:1px solid rgba(253,184,19,0.4); font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:999px;">🔒 ${attempted}/100 MCQs</span>`
                            }
                        </div>

                        <div style="background:#090d16; border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:9px 11px;">
                            <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; margin-bottom:5px;">
                                <span style="color:#cbd5e1;">Your Eligibility Progress</span>
                                <span style="color:${unlocked ? '#10b981' : '#fdb813'};">${pct}%</span>
                            </div>
                            <div style="width:100%; height:6px; background:#161e31; border-radius:3px; overflow:hidden;">
                                <div style="width:${pct}%; height:100%; background:${unlocked ? '#10b981' : '#fdb813'};"></div>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; margin-top:12px; font-size:12px; font-weight:800; color:${th.c};">
                        <span>${unlocked ? 'View National Rankings' : `Solve ${Math.max(0, 100 - attempted)} More MCQs to Unlock`}</span>
                        <span>&rarr;</span>
                    </div>
                </div>
            `;
        }).join('');

        mc.innerHTML = `
            <div class="page-transition">
                <div class="mcqs-inner-command-header">
                    <div class="mcqs-crumb-bar">
                        <span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>
                        <span style="color:#475569;">›</span>
                        <span class="mcqs-crumb-pill active">🏆 Global Leaderboards</span>
                    </div>
                    <h1 style="margin:0; font-size:clamp(20px, 2.6vw, 28px); font-weight:900; color:#fff;">🏆 All-India Exam Leaderboards</h1>
                    <p style="margin:4px 0 0 0; font-size:13px; color:#94a3b8;">Complete 100+ MCQs in any exam category to unlock your live national rank and compete with top performers.</p>
                </div>
                <div class="mcqs-inner-subtopics-grid">${cardsHtml}</div>
            </div>
        `;
    };

    const _origFetchLiveLeaderboardV10 = fetchLiveLeaderboard;
    fetchLiveLeaderboard = async function(category) {
        await _origFetchLiveLeaderboardV10(category);
        const mc = document.getElementById('dynamic-content');
        if (!mc) return;
        const cleanCategory = formatCleanTopicTitle(category);
        const card = mc.querySelector('.card');
        if (card && !card.querySelector('.mcqs-crumb-bar')) {
            card.style.background = '#0b0f1a';
            card.style.border = '1px solid rgba(253, 184, 19, 0.3)';
            card.style.borderRadius = '18px';
            card.insertAdjacentHTML('afterbegin', `
                <div class="mcqs-crumb-bar" style="margin-bottom:14px;">
                    <span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>
                    <span style="color:#475569;">›</span>
                    <span class="mcqs-crumb-pill" onclick="window.location.hash='#/leaderboard'">🏆 Leaderboards</span>
                    <span style="color:#475569;">›</span>
                    <span class="mcqs-crumb-pill active">${cleanCategory}</span>
                </div>
            `);
        }
    };

    // ==========================================
    // BODY-LEVEL FLOATING CENTER NAVBAR PILLS & HOME RENDERER
    // ==========================================
    function syncWebsiteNavbarPills() {
        let pillBar = document.getElementById('mcqsWebCenterNavPills');
        if (!pillBar) {
            pillBar = document.createElement('div');
            pillBar.id = 'mcqsWebCenterNavPills';
            pillBar.className = 'web-center-nav-pills';
            document.body.appendChild(pillBar);
        } else if (pillBar.parentElement !== document.body) {
            document.body.appendChild(pillBar);
        }

        const exams = getLiveActiveExamCategories();
        let usedColors = new Set();
        let usedIcons = new Set();

        const dropdownItemsHtml = exams.map((exKey, idx) => {
            const clean = formatCleanTopicTitle(exKey);
            const safeKey = exKey.replace(/'/g, "\\'");
            const tMeta = (typeof customTopicTypes !== 'undefined' && customTopicTypes[exKey]) || null;
            const cIcon = tMeta ? tMeta.icon : null;
            const th = getAutoTopicTheme(clean, cIcon, idx, usedColors, '📘', usedIcons, exKey);
            return `
                <div class="web-course-drop-item" onclick="jumpToSection(['${safeKey}'])">
                    <span>${th.i === 'NONE' ? '📘' : th.i} ${clean}</span>
                    <span style="font-size:11px; opacity:0.75;">Open &rarr;</span>
                </div>
            `;
        }).join('');

        pillBar.innerHTML = `
            <div class="web-courses-dropdown-wrap" id="webCoursesDropWrap">
                <button type="button" class="web-nav-pill-btn" onclick="document.getElementById('webCoursesDropWrap').classList.toggle('open')">
                    Courses &amp; Exams <span style="font-size:10px;">▾</span>
                </button>
                <div class="web-courses-dropdown-menu">
                    <div style="font-size:10.5px; font-weight:800; color:#94a3b8; text-transform:uppercase; padding:4px 10px 6px 10px; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:4px;">Live Exam Categories</div>
                    ${dropdownItemsHtml}
                    <div class="web-course-drop-item" style="border-top:1px solid rgba(255,255,255,0.08); margin-top:4px; color:#fdb813;" onclick="forceCwStep1(event)">
                        <span>🎯 Custom Mock Builder</span>
                        <span style="font-size:11px;">20–250 MCQs</span>
                    </div>
                </div>
            </div>
            <button type="button" class="web-nav-pill-btn" onclick="scrollToWebsiteSection('mcqs-mistake-clinic-anchor')">🧬 Mistake Clinic</button>
            <button type="button" class="web-nav-pill-btn" onclick="window.location.hash='#/progress'">📊 Analytics</button>
            <button type="button" class="web-nav-pill-btn" onclick="showLeaderboardOptions()">🏆 Leaderboard</button>
            <button type="button" class="web-nav-pill-btn web-nav-pill-cta" onclick="scrollToWebsiteSection('mcqs-home-categories-anchor')">Start Practicing</button>
        `;

        setTimeout(alignFloatingCenterPillBar, 15);
    }

    window.scrollToWebsiteSection = function(anchorId) {
        const rawHash = window.location.hash.replace(/^#\/?/, '');
        if (rawHash && rawHash !== 'home') {
            window.location.hash = '#/home';
            setTimeout(() => {
                const el = document.getElementById(anchorId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 180);
            return;
        }
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    var _heroRotatorInterval = null;
    function startHeroDynamicAnimations(inv) {
        if (_heroRotatorInterval) clearInterval(_heroRotatorInterval);
        let examIdx = 0;

        _heroRotatorInterval = setInterval(() => {
            const rotEl = document.getElementById('mcqsHeroRotatingExam');
            if (rotEl && inv.exams.length > 1) {
                examIdx = (examIdx + 1) % inv.exams.length;
                rotEl.style.opacity = '0';
                rotEl.style.transform = 'translateY(6px)';
                setTimeout(() => {
                    if (rotEl) {
                        rotEl.innerText = `${formatCleanTopicTitle(inv.exams[examIdx])} aspirants.`;
                        rotEl.style.opacity = '1';
                        rotEl.style.transform = 'translateY(0)';
                    }
                }, 240);
            }
        }, 3400);
    }

    function renderPriorityHomeWorkspace() {
        const mc = document.getElementById('dynamic-content');
        if (!mc) return;

        document.getElementById('mcqs-fullwidth-top-band')?.remove();
        document.getElementById('mcqs-fullwidth-bottom-band')?.remove();

        const inv = getLivePlatformInventory();
        const examListText = inv.exams.map(e => formatCleanTopicTitle(e)).join(' • ') || 'NEET • JEE • Boards • GK';
        const firstExamClean = formatCleanTopicTitle(inv.exams[0] || 'NEET');

        mc.innerHTML = `
            <div class="page-transition mcqs-home-master-stack">
                <!-- TIER 1 (PC Top / Mobile 3rd): HERO & LIVE STUDENT DIAGNOSTIC + SPEED AUTOPSY -->
                <section class="mcqs-arch-surface mcqs-tier-hero">
                    <div class="mcqs-hero-grid">
                        <div class="mcqs-hero-left-col">
                            <div>
                                <div class="mcqs-status-pill">
                                    <span class="mcqs-pulse-dot"></span>
                                    <span>Live Exam Suite: <b style="color:#fdb813;">${examListText}</b></span>
                                </div>
                                <h1 class="mcqs-hero-title">
                                    Smart MCQ practice &amp; testing for serious <span id="mcqsHeroRotatingExam" class="mcqs-gold-word">${firstExamClean} aspirants.</span>
                                </h1>
                                <p class="mcqs-hero-desc">
                                    Master line-by-line NCERT &amp; PYQ questions across <b>Easy, Medium, Hard &amp; Mixed</b> tiers, build full-length <b>20–250 MCQ custom mock tests</b>, fix mistakes with our Speed-vs-Accuracy Autopsy, and solve doubts 24/7 with AI Tutor.
                                </p>
                                <div class="mcqs-cta-row">
                                    <button type="button" class="mcqs-btn-gold" onclick="scrollToWebsiteSection('mcqs-home-categories-anchor')">
                                        📂 Explore Workspaces &darr;
                                    </button>
                                    <button type="button" class="mcqs-btn-glass" onclick="scrollToWebsiteSection('mcqs-mistake-clinic-anchor')">
                                        🧬 Mistake Clinic
                                    </button>
                                    <button type="button" class="mcqs-btn-glass" onclick="openAIModal()">
                                        ✨ Ask AI
                                    </button>
                                </div>
                            </div>

                            <div class="mcqs-kpi-strip">
                                <div class="mcqs-kpi-box">
                                    <div class="mcqs-kpi-val" style="color:#fdb813;">${inv.examCount} Exams</div>
                                    <div class="mcqs-kpi-lbl">Active Suites</div>
                                </div>
                                <div class="mcqs-kpi-box">
                                    <div class="mcqs-kpi-val" style="color:#38bdf8;">${inv.totalSubfolders}+</div>
                                    <div class="mcqs-kpi-lbl">Chapters &amp; Topics</div>
                                </div>
                                <div class="mcqs-kpi-box">
                                    <div class="mcqs-kpi-val" style="color:#10b981;">20–250</div>
                                    <div class="mcqs-kpi-lbl">Custom Mock MCQs</div>
                                </div>
                                <div class="mcqs-kpi-box">
                                    <div class="mcqs-kpi-val" style="color:#c084fc;">4 Tiers</div>
                                    <div class="mcqs-kpi-lbl">Easy • Med • Hard • Mixed</div>
                                </div>
                            </div>
                        </div>

                        <div id="mcqsSim1DiagnosticMount"></div>
                    </div>
                </section>

                <!-- TIER 2 (Mobile Priority #1 Top of Screen / PC Middle): EXAM WORKSPACES + QUICK LINKS & ESSENTIAL PRACTICE -->
                <section id="mcqs-home-categories-anchor" class="mcqs-home-workspace-grid mcqs-tier-workspaces">
                    <div style="background:#0d121f; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:16px; box-shadow:0 12px 30px rgba(0,0,0,0.48); min-width:0; max-width:100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:10px;">
                            <div>
                                <h2 style="margin:0; font-size:17px; font-weight:900; color:#ffffff; display:flex; align-items:center; gap:7px;">
                                    <span style="color:#fdb813;">▎</span> Select Exam Workspace
                                </h2>
                                <span style="font-size:11.5px; color:#94a3b8;">Tap any exam card or jump directly to MCQs, NCERT Books &amp; PYQs</span>
                            </div>
                            <button type="button" onclick="window.location.hash='#/progress'" style="background:rgba(56,189,248,0.14); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">📊 My Analytics &rarr;</button>
                        </div>
                        <div id="mcqsExamWorkspacesMount"></div>
                    </div>

                    <div style="min-width:0; max-width:100%;">
                        ${buildRemadeQuickLinksAndEssentialHtml()}
                    </div>
                </section>

                <!-- TIER 3 (Mobile Priority #2 / PC Bottom Split): CUSTOM MOCK STUDIO + SMART MISTAKE CLINIC -->
                <section class="mcqs-studios-split-grid mcqs-tier-studios">
                    <div id="mcqsCustomStudioMount" style="min-width:0;"></div>
                    <div id="mcqsSmartClinicMount" style="min-width:0;"></div>
                </section>
            </div>
        `;

        renderSim1DiagnosticDashboard();
        renderExamWorkspaceCardsGrid();
        renderCustomMockStudioCard();
        renderSmartMistakeClinicCard();
        startHeroDynamicAnimations(inv);
        syncRealStudentDiagnostics(false);
    }

    const _origRenderViewV10 = _renderView;
    _renderView = function() {
        injectCompleteModernSuiteStyles();
        syncWebsiteNavbarPills();
        attachDynamicContentObserver();

        const rawHash = window.location.hash.replace(/^#\/?/, '');
        const isRootHome = (!rawHash || rawHash === 'home') && Array.isArray(currentPath) && currentPath.length === 0;

        if (isRootHome) {
            document.body.classList.add('mcqs-on-root-home');
            document.body.classList.remove('mcqs-on-inner-path');
            document.body.classList.remove('mcqs-quiz-screen-active');
            const bc = document.getElementById('breadcrumb-text');
            if (bc) bc.innerText = 'Home';
            renderPriorityHomeWorkspace();
            syncQuizScreenAndAntiCheatState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        document.body.classList.remove('mcqs-on-root-home');
        document.body.classList.add('mcqs-on-inner-path');
        const bc = document.getElementById('breadcrumb-text');
        if (bc) bc.innerText = 'Home / ' + currentPath.map(s => formatCleanTopicTitle(s)).join(' / ');

        const handledModernFolder = renderModernizedInnerFolderView();
        if (!handledModernFolder) {
            _origRenderViewV10();
        } else {
            document.body.classList.remove('mcqs-quiz-screen-active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setTimeout(syncQuizScreenAndAntiCheatState, 60);
        setTimeout(syncQuizScreenAndAntiCheatState, 400);
    };

    if (typeof updateBottomNav === 'function' && !window._origUpdateBottomNavWrappedV10) {
        window._origUpdateBottomNavWrappedV10 = updateBottomNav;
        updateBottomNav = function(hash) {
            window._origUpdateBottomNavWrappedV10(hash);
            syncQuizScreenAndAntiCheatState();
        };
    }

    if (typeof updateSidebarLinks === 'function' && !window._origUpdateSidebarLinksWrappedV10) {
        window._origUpdateSidebarLinksWrappedV10 = updateSidebarLinks;
        updateSidebarLinks = function() {
            window._origUpdateSidebarLinksWrappedV10();
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar) sidebar.style.display = 'none';
        };
    }

    window.addEventListener('hashchange', () => {
        const rawHash = window.location.hash.replace(/^#\/?/, '');
        const isRootHome = (!rawHash || rawHash === 'home') && Array.isArray(currentPath) && currentPath.length === 0;
        if (!isRootHome) {
            document.body.classList.remove('mcqs-on-root-home');
        }
        syncQuizScreenAndAntiCheatState();
        setTimeout(syncQuizScreenAndAntiCheatState, 200);
        setTimeout(syncQuizScreenAndAntiCheatState, 650);
    });

    window.addEventListener('click', function(e) {
        const drop = document.getElementById('webCoursesDropWrap');
        if (drop && !drop.contains(e.target)) {
            drop.classList.remove('open');
        }
    });

    window.addEventListener('load', () => {
        attachDynamicContentObserver();
        syncQuizScreenAndAntiCheatState();
        alignFloatingCenterPillBar();
    });

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            injectCompleteModernSuiteStyles();
            syncWebsiteNavbarPills();
            attachDynamicContentObserver();
            verifyAndSyncAccurateDailyStreak();
            syncQuizScreenAndAntiCheatState();
            if (typeof _renderView === 'function' && (!window.location.hash || window.location.hash === '#/home' || window.location.hash.startsWith('#/path/'))) {
                _renderView();
            }
        }, 120);
    }
})();

// ==========================================
// 8. INSTALLED MOBILE APP & COMPACT ANALYTICS SUITE:
//    CONTINUOUS EXAM CAROUSEL, SEPARATED QUICK LINKS & ESSENTIAL PRACTICE,
//    COMPACT LIVE-SIMULATION ANALYTICS DASHBOARD & FLOATING ICON DOCK
// ==========================================
(function initStudyInstalledMobileAppV3() {
    if (window._mcqsStudyMobileAppLoadedV3) return;
    window._mcqsStudyMobileAppLoadedV3 = true;

    // Crisp inline SVG badges so Android/iOS never renders dull grey unicode checkmarks
    const SVG_CHECK_GREEN = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const SVG_CROSS_RED = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    function isInstalledMobileAppMode() {
        const isStandalone = document.documentElement.classList.contains('is-standalone-pwa') ||
                             window.matchMedia('(display-mode: standalone)').matches ||
                             window.matchMedia('(display-mode: fullscreen)').matches ||
                             window.navigator.standalone === true ||
                             document.referrer.indexOf('android-app://') !== -1 ||
                             localStorage.getItem('mcqs_preview_mobile_app_ui') === 'true';
        return isStandalone && window.innerWidth <= 860;
    }

    function injectStudyMobileAppStyles() {
        if (document.getElementById('mcqs-study-mobile-app-styles-v3')) return;
        const st = document.createElement('style');
        st.id = 'mcqs-study-mobile-app-styles-v3';
        st.textContent = `
            /* ==========================================
               1. MODERNIZED SEARCH BUTTON & ZERO-BLEED MOBILE SEARCH BAR
               ========================================== */
            .navbar .search-icon-btn {
                background: rgba(255, 255, 255, 0.06) !important;
                border: 1.5px solid rgba(253, 184, 19, 0.38) !important;
                color: #f8fafc !important;
                border-radius: 999px !important;
                padding: 7px 12px !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
                cursor: pointer !important;
                transition: all 0.18s ease !important;
            }
            .navbar .search-icon-btn:hover {
                border-color: #fdb813 !important;
                background: rgba(253, 184, 19, 0.12) !important;
            }

            @media (max-width: 860px) {
                body.mcqs-search-open .navbar .nav-left,
                body.mcqs-search-open .navbar .nav-right {
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
                #searchWrapper.active {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    width: 100vw !important;
                    height: 56px !important;
                    background: #080b12 !important;
                    padding: 8px 12px !important;
                    margin: 0 !important;
                    z-index: 99999 !important;
                    display: flex !important;
                    align-items: center !important;
                    border-bottom: 1px solid rgba(253, 184, 19, 0.35) !important;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.85) !important;
                }
                #searchWrapper.active .search-input-container {
                    width: 100% !important;
                    height: 40px !important;
                    background: #111726 !important;
                    border: 1.5px solid #fdb813 !important;
                    border-radius: 999px !important;
                    padding: 0 8px 0 14px !important;
                    display: flex !important;
                    align-items: center !important;
                    box-shadow: 0 0 16px rgba(253, 184, 19, 0.2) !important;
                }
                #searchWrapper.active #searchInput {
                    font-size: 14px !important;
                    color: #ffffff !important;
                }
                #searchWrapper.active #searchSuggestions {
                    top: 56px !important;
                    left: 8px !important;
                    right: 8px !important;
                    width: calc(100vw - 16px) !important;
                    border-radius: 14px !important;
                }
            }

            /* ==========================================
               2. FLOATING BOTTOM NAVIGATION DOCK WITH GUARANTEED VISIBLE SVG LOGOS
               ========================================== */
            @media (max-width: 860px) {
                #mobileAppDock {
                    position: fixed !important;
                    bottom: max(12px, env(safe-area-inset-bottom)) !important;
                    left: 12px !important;
                    right: 12px !important;
                    width: calc(100vw - 24px) !important;
                    max-width: 460px !important;
                    margin: 0 auto !important;
                    height: 64px !important;
                    background: rgba(14, 19, 32, 0.96) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border: 1.5px solid rgba(253, 184, 19, 0.42) !important;
                    border-radius: 22px !important;
                    padding: 6px 8px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-around !important;
                    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.9), 0 0 22px rgba(253, 184, 19, 0.16) !important;
                    z-index: 9400 !important;
                }
                #mobileAppDock .app-tab {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 3px !important;
                    cursor: pointer !important;
                    padding: 2px 0 !important;
                    color: #94a3b8 !important;
                    min-width: 0 !important;
                }
                #mobileAppDock .app-tab:not(.ai-tab-inner) .app-tab-icon {
                    width: 44px !important;
                    height: 26px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    border-radius: 999px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: transparent !important;
                    transition: all 0.2s ease !important;
                }
                #mobileAppDock .app-tab:not(.ai-tab-inner) .app-tab-icon svg {
                    width: 21px !important;
                    height: 21px !important;
                    min-width: 21px !important;
                    min-height: 21px !important;
                    display: block !important;
                    fill: #94a3b8 !important;
                    transition: fill 0.2s ease, transform 0.2s ease !important;
                }
                #mobileAppDock .app-tab.active:not(.ai-tab-inner) .app-tab-icon {
                    background: rgba(253, 184, 19, 0.2) !important;
                    border: 1px solid rgba(253, 184, 19, 0.45) !important;
                }
                #mobileAppDock .app-tab.active:not(.ai-tab-inner) .app-tab-icon svg {
                    fill: #fdb813 !important;
                    transform: scale(1.06) !important;
                }
                #mobileAppDock .app-tab .app-tab-label {
                    font-size: 10.5px !important;
                    font-weight: 700 !important;
                    color: #94a3b8 !important;
                    line-height: 1 !important;
                    white-space: nowrap !important;
                }
                #mobileAppDock .app-tab.active:not(.ai-tab-inner) .app-tab-label {
                    color: #fdb813 !important;
                    font-weight: 900 !important;
                }
                #mobileAppDock .app-tab.ai-tab-inner {
                    background: linear-gradient(135deg, #fdb813, #f59e0b) !important;
                    color: #000000 !important;
                    border-radius: 16px !important;
                    padding: 6px 12px !important;
                    margin: 0 4px !important;
                    flex: 0 0 auto !important;
                    box-shadow: 0 6px 18px rgba(253, 184, 19, 0.4) !important;
                }
                #mobileAppDock .app-tab.ai-tab-inner .app-tab-icon {
                    width: 22px !important;
                    height: 22px !important;
                    padding: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                #mobileAppDock .app-tab.ai-tab-inner .app-tab-icon svg {
                    width: 20px !important;
                    height: 20px !important;
                    fill: #000000 !important;
                    display: block !important;
                }
                #mobileAppDock .app-tab.ai-tab-inner .app-tab-label {
                    color: #000000 !important;
                    font-weight: 900 !important;
                    font-size: 10.5px !important;
                }
            }

            /* ==========================================
               3. INSTALLED MOBILE APP STUDY WORKSPACE
               ========================================== */
            body.mcqs-study-app-active {
                background-color: #080b12 !important;
            }
            body.mcqs-study-app-active .container {
                padding: 0 0 110px 0 !important;
                max-width: 100vw !important;
            }
            body.mcqs-study-app-active #breadcrumb-text {
                display: none !important;
            }

            .sa-carousel-section {
                padding: 12px 0 6px 0;
            }
            .sa-carousel-track {
                display: flex;
                gap: 12px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                scroll-behavior: smooth;
                padding: 0 14px 8px 14px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            .sa-carousel-track::-webkit-scrollbar { display: none; }
            .sa-exam-slide {
                flex: 0 0 90%;
                max-width: 90%;
                scroll-snap-align: center;
                user-select: none;
            }
            .sa-exam-banner-card {
                position: relative;
                min-height: 210px;
                border-radius: 20px;
                overflow: hidden;
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                border: 1.5px solid var(--sa-border, rgba(253, 184, 19, 0.4));
                background: var(--sa-grad, linear-gradient(140deg, #1e1b4b, #090d16));
                box-shadow: 0 14px 34px rgba(0, 0, 0, 0.7);
            }
            .sa-banner-wave {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 80px;
                pointer-events: none;
                opacity: 0.75;
            }
            .sa-banner-orb {
                position: absolute;
                top: -30px;
                right: -25px;
                width: 130px;
                height: 130px;
                border-radius: 50%;
                background: var(--sa-orb, rgba(253, 184, 19, 0.25));
                filter: blur(24px);
                pointer-events: none;
            }
            .sa-uploaded-chips-wrap {
                position: relative;
                z-index: 2;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin: 10px 0;
            }
            .sa-uploaded-chip {
                background: rgba(9, 13, 22, 0.72);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.18);
                color: #f8fafc;
                padding: 5px 10px;
                border-radius: 9px;
                font-size: 11px;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }
            .sa-uploaded-chip:active {
                transform: scale(0.96);
            }
            .sa-carousel-dots {
                display: flex;
                justify-content: center;
                gap: 6px;
                margin-top: 4px;
            }
            .sa-carousel-dot {
                width: 6px;
                height: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.22);
                transition: all 0.25s ease;
            }
            .sa-carousel-dot.active {
                width: 20px;
                background: #fdb813;
            }

            .sa-section-block {
                margin-top: 16px;
                padding: 0 14px;
            }
            .sa-section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-bottom: 10px;
            }
            .sa-section-title {
                font-size: 16px;
                font-weight: 900;
                color: #ffffff;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 7px;
            }
            .sa-cat-tabs-row {
                display: flex;
                gap: 6px;
                overflow-x: auto;
                padding-bottom: 10px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            .sa-cat-tabs-row::-webkit-scrollbar { display: none; }
            .sa-cat-tab-btn {
                background: #121826;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                padding: 6px 13px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 800;
                white-space: nowrap;
                cursor: pointer;
                flex-shrink: 0;
                transition: 0.18s;
            }
            .sa-cat-tab-btn.active {
                background: rgba(253, 184, 19, 0.18);
                border-color: #fdb813;
                color: #fdb813;
            }

            .sa-modules-Redesign-track {
                display: flex;
                gap: 12px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                padding-bottom: 6px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            .sa-modules-Redesign-track::-webkit-scrollbar { display: none; }
            .sa-module-column {
                flex: 0 0 88%;
                max-width: 88%;
                scroll-snap-align: start;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .sa-module-column-single {
                flex: 0 0 100%;
                max-width: 100%;
            }
            .sa-study-row-card {
                background: linear-gradient(145deg, #131929, #0c101c);
                border: 1px solid rgba(255, 255, 255, 0.09);
                border-left: 4px solid var(--mod-color, #fdb813);
                border-radius: 14px;
                padding: 11px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 11px;
                cursor: pointer;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
            }
            .sa-study-row-icon {
                width: 46px;
                height: 46px;
                border-radius: 12px;
                background: var(--mod-bg, rgba(253, 184, 19, 0.15));
                border: 1px solid var(--mod-border, rgba(253, 184, 19, 0.4));
                color: var(--mod-color, #fdb813);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 22px;
                flex-shrink: 0;
            }

            .sa-feature-full-card {
                background: linear-gradient(155deg, #131a2c 0%, #0b0f1a 100%);
                border: 1.5px solid rgba(255, 255, 255, 0.11);
                border-radius: 18px;
                padding: 16px;
                margin-bottom: 14px;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
            }

            /* Separated Quick Links & Essential Practice Horizontal Tracks */
            .sa-quick-horiz-track {
                display: flex;
                gap: 10px;
                overflow-x: auto;
                scroll-snap-type: x mandatory;
                padding-bottom: 6px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            .sa-quick-horiz-track::-webkit-scrollbar { display: none; }
            .sa-quick-card {
                flex: 0 0 72%;
                max-width: 72%;
                scroll-snap-align: start;
                background: linear-gradient(145deg, #13192a, #0b0f19);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 14px;
                padding: 12px 13px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                cursor: pointer;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
            }
            .sa-quick-card-single {
                flex: 0 0 100%;
                max-width: 100%;
            }

            /* ==========================================
               4. COMPACT LIVE-SIMULATION ANALYTICS DASHBOARD STYLES (FIXES IMAGES 1 & 2)
               ========================================== */
            .ad-compact-shell {
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 1100px;
                margin: 0 auto;
            }
            .ad-top-bar {
                background: linear-gradient(145deg, #111728, #090d16);
                border: 1px solid rgba(253, 184, 19, 0.32);
                border-radius: 16px;
                padding: 13px 15px;
                box-shadow: 0 10px 26px rgba(0, 0, 0, 0.5);
            }
            .ad-telemetry-hero {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 14px;
                align-items: center;
                background: linear-gradient(155deg, #131a2e 0%, #0a0e18 100%);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 14px;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
            }
            .ad-ring-box {
                position: relative;
                width: 96px;
                height: 96px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .ad-kpi-quad-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
                width: 100%;
            }
            .ad-kpi-mini-pill {
                background: #0b0f1a;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 11px;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-width: 0;
            }
            .ad-sim-card {
                background: linear-gradient(150deg, rgba(253, 184, 19, 0.08) 0%, #0d1220 55%);
                border: 1.5px solid rgba(253, 184, 19, 0.38);
                border-radius: 16px;
                padding: 14px;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
            }
            .ad-split-row {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }
            @media (max-width: 680px) {
                .ad-split-row {
                    grid-template-columns: 1fr;
                }
            }
            @media (max-width: 380px) {
                .ad-telemetry-hero {
                    grid-template-columns: 1fr;
                    justify-items: center;
                }
            }
        `;
        document.head.appendChild(st);
    }

    function upgradeNavbarSearchButtonLogo() {
        const searchBtn = document.querySelector('.navbar .search-icon-btn');
        if (!searchBtn || searchBtn.dataset.modernSvgApplied) return;
        searchBtn.dataset.modernSvgApplied = 'true';
        searchBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fdb813" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span class="hide-on-mobile" style="font-size:12.5px; font-weight:800; color:#f8fafc;">Search</span>
        `;
    }

    function repairAndEnhanceMobileAppDock() {
        const dock = document.getElementById('mobileAppDock');
        if (!dock) return;
        const tabs = dock.querySelectorAll('.app-tab');
        const svgPaths = [
            'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
            'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z',
            'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
            'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
            'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z'
        ];
        const tabLabels = ['Home', 'Ranks', 'Ask AI', 'Stats', 'Saved'];

        tabs.forEach((tab, idx) => {
            let iconBox = tab.querySelector('.app-tab-icon');
            if (!iconBox) {
                iconBox = document.createElement('div');
                iconBox.className = 'app-tab-icon';
                tab.prepend(iconBox);
            }
            if (!iconBox.querySelector('svg') && svgPaths[idx]) {
                iconBox.innerHTML = `<svg viewBox="0 0 24 24"><path d="${svgPaths[idx]}"/></svg>`;
            }
            const lbl = tab.querySelector('.app-tab-label');
            if (lbl && tabLabels[idx]) {
                if (idx === 4 && Array.isArray(userBookmarks) && userBookmarks.length > 0) {
                    lbl.innerText = `Saved (${userBookmarks.length})`;
                } else {
                    lbl.innerText = tabLabels[idx];
                }
            }
        });
    }

    // ==========================================
    // STATE & ADMIN-PANEL DATA READERS
    // ==========================================
    var saState = {
        selectedCategory: 'ALL',
        activeSlideIdx: 0,
        carouselTimer: null,
        isTouchingCarousel: false,
        blitzExam: '',
        blitzBestScore: Number(localStorage.getItem('mcqs_app_blitz_best_v1') || 0),
        blitzBestAcc: Number(localStorage.getItem('mcqs_app_blitz_best_acc_v1') || 0),
        // Live Analytics Simulator State
        analyticsSimMode: 'SHIELD', // 'CURRENT' | 'SHIELD' | 'SPEED'
        analyticsSimQuestions: 180,
        lastAnalyticsData: null,
        lastAnalyticsCategory: ''
    };

    function getActiveExamCategoriesFromAdmin() {
        const deletedSet = new Set((typeof topicOverrides !== 'undefined' && topicOverrides && topicOverrides.deletedPaths) || []);
        const keys = new Set(Object.keys(typeof appData !== 'undefined' ? appData : {}));
        if (typeof customTopicTypes !== 'undefined') {
            Object.keys(customTopicTypes).forEach(dbKey => {
                if (deletedSet.has(dbKey)) return;
                const root = dbKey.split(' > ')[0];
                if (root && !deletedSet.has(root)) keys.add(root);
            });
        }
        return Array.from(keys).filter(k => k && k !== 'Daily Quiz Challenge' && !deletedSet.has(k));
    }

    function getDirectChildKeysFromAdmin(pathArr) {
        const deletedSet = new Set((typeof topicOverrides !== 'undefined' && topicOverrides && topicOverrides.deletedPaths) || []);
        const fullPrefix = pathArr.join(' > ');
        let currNode = typeof appData !== 'undefined' ? appData : {};
        for (let seg of pathArr) {
            if (currNode && typeof currNode === 'object' && currNode[seg] !== undefined) {
                currNode = currNode[seg];
            } else {
                currNode = null;
                break;
            }
        }
        const childSet = new Set();
        if (currNode && typeof currNode === 'object' && !Array.isArray(currNode)) {
            Object.keys(currNode).forEach(k => {
                const candidateFull = fullPrefix ? `${fullPrefix} > ${k}` : k;
                if (!deletedSet.has(candidateFull)) childSet.add(k);
            });
        }
        if (typeof customTopicTypes !== 'undefined') {
            const prefixWithArrow = fullPrefix ? (fullPrefix + ' > ') : '';
            Object.keys(customTopicTypes).forEach(dbKey => {
                if (deletedSet.has(dbKey)) return;
                if (!fullPrefix) {
                    const rootSeg = dbKey.split(' > ')[0];
                    if (rootSeg && !deletedSet.has(rootSeg)) childSet.add(rootSeg);
                } else if (dbKey.startsWith(prefixWithArrow)) {
                    const nextSeg = dbKey.slice(prefixWithArrow.length).split(' > ')[0];
                    const nextFull = `${fullPrefix} > ${nextSeg}`;
                    if (nextSeg && !deletedSet.has(nextFull)) childSet.add(nextSeg);
                }
            });
        }
        return Array.from(childSet);
    }

    function getStudentProgressSummaryForApp(examPrefix = '') {
        try {
            const uid = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) ? currentUser.uid : 'guest';
            const localMap = JSON.parse(localStorage.getItem(`mcqsprep_topic_progress_v2_${uid}`) || '{}');
            const corrSet = new Set();
            const wrongSet = new Set();
            const skipSet = new Set();
            let lastActivePath = '';
            let lastActiveTime = 0;

            Object.keys(localMap).forEach(pathKey => {
                const rec = localMap[pathKey] || {};
                if (rec.inProgress && rec.inProgress.updatedAt && rec.inProgress.updatedAt > lastActiveTime) {
                    lastActiveTime = rec.inProgress.updatedAt;
                    lastActivePath = pathKey;
                }
                if (examPrefix && !pathKey.startsWith(examPrefix)) return;
                (rec.correctIds || []).forEach(id => corrSet.add(id));
                (rec.wrongIds || []).forEach(id => { if (!corrSet.has(id)) wrongSet.add(id); });
                (rec.skippedIds || []).forEach(id => { if (!corrSet.has(id) && !wrongSet.has(id)) skipSet.add(id); });
            });

            const solved = corrSet.size + wrongSet.size;
            const acc = solved > 0 ? Math.round((corrSet.size / solved) * 100) : 0;
            return {
                solved,
                correct: corrSet.size,
                wrong: wrongSet.size,
                skipped: skipSet.size,
                acc,
                lastActivePath
            };
        } catch (e) {
            return { solved: 0, correct: 0, wrong: 0, skipped: 0, acc: 0, lastActivePath: '' };
        }
    }

    // ==========================================
    // COMPACT, MODERNIZED ANALYTICS COMMAND CENTER WITH LIVE SIMULATOR (FIXES IMAGES 1 & 2)
    // ==========================================
    function buildPrecisionSvgTrajectoryHtml(trendArr) {
        const pts = (Array.isArray(trendArr) && trendArr.length > 0) ? trendArr.slice(-10) : [100];
        const displayPts = pts.length === 1 ? [pts[0], pts[0]] : pts;

        const svgW = 330;
        const svgH = 118;
        const padLeft = 36; // Dedicated left gutter so 100%, 75%, 50% NEVER touch the green dots!
        const padRight = 16;
        const padTop = 14;
        const padBottom = 22;
        const plotW = svgW - padLeft - padRight;
        const plotH = svgH - padTop - padBottom;

        const coords = displayPts.map((val, idx) => {
            const clamped = Math.min(100, Math.max(0, Number(val) || 0));
            const x = padLeft + (idx / Math.max(1, displayPts.length - 1)) * plotW;
            const y = padTop + (1 - clamped / 100) * plotH;
            return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val: Math.round(clamped), idx };
        });

        // Smooth SVG cubic bezier path
        let pathD = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const p0 = coords[i];
            const p1 = coords[i + 1];
            const midX = ((p0.x + p1.x) / 2).toFixed(1);
            pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        const areaD = `${pathD} L ${coords[coords.length - 1].x} ${padTop + plotH} L ${coords[0].x} ${padTop + plotH} Z`;

        const gridLinesHtml = [100, 75, 50, 25, 0].map(gVal => {
            const gy = (padTop + (1 - gVal / 100) * plotH).toFixed(1);
            return `
                <line x1="${padLeft}" y1="${gy}" x2="${svgW - padRight}" y2="${gy}" stroke="rgba(255,255,255,0.07)" stroke-dasharray="3 3" stroke-width="1"/>
                <text x="${padLeft - 7}" y="${Number(gy) + 3.5}" text-anchor="end" fill="#64748b" font-size="9.5" font-weight="700">${gVal}%</text>
            `;
        }).join('');

        const dotsHtml = coords.map((c, i) => {
            const isFirst = i === 0;
            const isLast = i === coords.length - 1;
            const showLabel = isFirst || isLast || i === Math.floor(coords.length / 2);
            return `
                <circle cx="${c.x}" cy="${c.y}" r="${isLast ? 4.5 : 3.5}" fill="${isLast ? '#10b981' : '#fdb813'}" stroke="#080b12" stroke-width="1.8"/>
                ${showLabel ? `<text x="${c.x}" y="${svgH - 4}" text-anchor="${isFirst ? 'start' : (isLast ? 'end' : 'middle')}" fill="${isLast ? '#10b981' : '#94a3b8'}" font-size="9" font-weight="800">T${i + 1} (${c.val}%)</text>` : ''}
            `;
        }).join('');

        return `
            <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%; height:118px; display:block; overflow:visible;">
                <defs>
                    <linearGradient id="adTrajAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#10b981" stop-opacity="0.32"/>
                        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
                    </linearGradient>
                </defs>
                ${gridLinesHtml}
                <path d="${areaD}" fill="url(#adTrajAreaGrad)"/>
                <path d="${pathD}" fill="none" stroke="#fdb813" stroke-width="2.6" stroke-linecap="round"/>
                ${dotsHtml}
            </svg>
        `;
    }

    window.setAnalyticsLiveSimOption = function(mode, qCount) {
        if (mode) saState.analyticsSimMode = mode;
        if (qCount) saState.analyticsSimQuestions = Number(qCount);
        renderAnalyticsLiveSimulatorBox();
    };

    function renderAnalyticsLiveSimulatorBox() {
        const mount = document.getElementById('adLiveSimulatorMount');
        if (!mount || !saState.lastAnalyticsData) return;

        const st = saState.lastAnalyticsData;
        const catClean = formatCleanTopicTitle(saState.lastAnalyticsCategory || 'Exam');
        const qTotal = saState.analyticsSimQuestions || 180;
        const maxMarks = qTotal * 4;

        const baseAcc = st.overallAccuracy || 0;
        const baseTime = st.avgTimeCorrect || 25;

        let simAcc = baseAcc;
        let simTimePerQ = baseTime;
        let simNote = `At your current ${baseAcc}% accuracy across a ${qTotal}-question ${catClean} paper.`;

        if (saState.analyticsSimMode === 'SHIELD') {
            // Simulates eliminating 50% of wrong answers via Negative-Mark Shield
            const wrongRatio = (100 - baseAcc) / 2;
            simAcc = Math.min(100, Math.round(baseAcc + wrongRatio));
            simNote = `Simulates fixing 50% of your wrong answers (raising accuracy from ${baseAcc}% → ${simAcc}%).`;
        } else if (saState.analyticsSimMode === 'SPEED') {
            simAcc = Math.min(100, baseAcc + 4);
            simTimePerQ = Math.max(5, baseTime - 3);
            const minsSaved = Math.max(1, Math.round((qTotal * 3) / 60));
            simNote = `Simulates shaving 3s per MCQ (${baseTime}s → ${simTimePerQ}s), saving ~${minsSaved} mins for revision!`;
        }

        const projCorrect = Math.round((simAcc / 100) * qTotal);
        const projWrong = qTotal - projCorrect;
        const projScore = (projCorrect * 4) - projWrong;
        const baseProjCorrect = Math.round((baseAcc / 100) * qTotal);
        const baseProjScore = (baseProjCorrect * 4) - (qTotal - baseProjCorrect);
        const scoreGain = Math.max(0, projScore - baseProjScore);
        const estMinutes = Math.max(1, Math.round((qTotal * simTimePerQ) / 60));
        const barPct = Math.min(100, Math.max(5, Math.round((Math.max(0, projScore) / maxMarks) * 100)));

        mount.innerHTML = `
            <div class="ad-sim-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
                    <span style="background:rgba(253,184,19,0.2); color:#fdb813; border:1px solid rgba(253,184,19,0.45); padding:2px 9px; border-radius:999px; font-size:10px; font-weight:900;">🎛️ LIVE SCORE &amp; PACE SIMULATOR</span>
                    <div style="display:flex; gap:4px;">
                        ${[50, 100, 180].map(qNum => `
                            <button type="button" onclick="setAnalyticsLiveSimOption(null, ${qNum})" style="background:${qTotal === qNum ? '#fdb813' : '#090d16'}; color:${qTotal === qNum ? '#000' : '#94a3b8'}; border:1px solid ${qTotal === qNum ? '#fdb813' : 'rgba(255,255,255,0.12)'}; border-radius:6px; padding:2px 7px; font-size:10px; font-weight:800; cursor:pointer;">${qNum} Q</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 3 Interactive Simulation Mode Pills -->
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-bottom:10px;">
                    <button type="button" onclick="setAnalyticsLiveSimOption('CURRENT', null)" style="background:${saState.analyticsSimMode === 'CURRENT' ? 'rgba(56,189,248,0.2)' : '#090d16'}; color:${saState.analyticsSimMode === 'CURRENT' ? '#38bdf8' : '#94a3b8'}; border:1px solid ${saState.analyticsSimMode === 'CURRENT' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}; border-radius:8px; padding:6px 4px; font-size:10.5px; font-weight:800; cursor:pointer;">📊 Current Pace</button>
                    <button type="button" onclick="setAnalyticsLiveSimOption('SHIELD', null)" style="background:${saState.analyticsSimMode === 'SHIELD' ? 'rgba(16,185,129,0.2)' : '#090d16'}; color:${saState.analyticsSimMode === 'SHIELD' ? '#10b981' : '#94a3b8'}; border:1px solid ${saState.analyticsSimMode === 'SHIELD' ? '#10b981' : 'rgba(255,255,255,0.1)'}; border-radius:8px; padding:6px 4px; font-size:10.5px; font-weight:800; cursor:pointer;">🛡️ Mistake Shield</button>
                    <button type="button" onclick="setAnalyticsLiveSimOption('SPEED', null)" style="background:${saState.analyticsSimMode === 'SPEED' ? 'rgba(253,184,19,0.2)' : '#090d16'}; color:${saState.analyticsSimMode === 'SPEED' ? '#fdb813' : '#94a3b8'}; border:1px solid ${saState.analyticsSimMode === 'SPEED' ? '#fdb813' : 'rgba(255,255,255,0.1)'}; border-radius:8px; padding:6px 4px; font-size:10.5px; font-weight:800; cursor:pointer;">⚡ Speed Boost</button>
                </div>

                <div style="background:#080b12; border:1px solid rgba(255,255,255,0.08); border-radius:11px; padding:10px 12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                        <div>
                            <div style="font-size:9.5px; color:#94a3b8; font-weight:800; text-transform:uppercase;">PROJECTED ${qTotal}-Q SCORE</div>
                            <div style="display:flex; align-items:baseline; gap:6px;">
                                <span style="font-size:24px; font-weight:900; color:#fdb813;">${projScore}</span>
                                <span style="font-size:11px; color:#64748b; font-weight:700;">/ ${maxMarks} pts</span>
                                ${scoreGain > 0 ? `<span style="background:rgba(16,185,129,0.18); color:#10b981; padding:1px 6px; border-radius:5px; font-size:10px; font-weight:900;">↑ +${scoreGain} Lift</span>` : ''}
                            </div>
                        </div>
                        <div style="text-align:right; font-size:10.5px;">
                            <div style="color:#10b981; font-weight:800;">${SVG_CHECK_GREEN} ${projCorrect} Right • <span style="color:#ef4444;">${SVG_CROSS_RED} ${projWrong} Wrong</span></div>
                            <div style="color:#38bdf8; font-weight:700; margin-top:2px;">⏱️ Est. Completion: ${estMinutes} mins (${simTimePerQ}s/Q)</div>
                        </div>
                    </div>

                    <div style="width:100%; height:6px; background:#141b2d; border-radius:3px; overflow:hidden; margin-bottom:6px;">
                        <div style="width:${barPct}%; height:100%; background:linear-gradient(90deg, #fdb813, #10b981); border-radius:3px; transition:width 0.35s ease;"></div>
                    </div>
                    <div style="font-size:10.5px; color:#cbd5e1; line-height:1.35;">💡 ${simNote}</div>
                </div>
            </div>
        `;
    }

    // Override _renderProgressDashboard globally so Analytics is ultra-compact, modern & has live simulation!
    _renderProgressDashboard = async function(category) {
        if (!currentUser) { _renderProgressSelection(); return; }
        const displayCategory = formatCleanTopicTitle(category);
        const safeCatJs = category.replace(/'/g, "\\'");
        const bc = document.getElementById('breadcrumb-text');
        if (bc) bc.innerText = `Home / Profile / Progress / ${displayCategory}`;

        const mc = document.getElementById('dynamic-content');
        if (!mc) return;
        mc.innerHTML = `<div class="mcqs-arch-surface page-transition" style="text-align:center; padding:32px;"><h3>📊 Loading ${displayCategory} Diagnostics...</h3></div>`;

        try {
            const snap = await db.collection('leaderboards').where('userId', '==', currentUser.uid).get();
            const tempDocs = [];
            snap.forEach(doc => tempDocs.push(doc.data()));
            tempDocs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

            // Compute stats for this category
            let totalScore = 0, totalAttempted = 0, correctCount = 0, wrongCount = 0, quizzesPlayed = 0;
            let accuracyTrend = [], totalAvgTimeC = 0, countC = 0, totalAvgTimeW = 0, countW = 0;
            const subjectMap = {};

            tempDocs.forEach(d => {
                const matches = (d.examCategory === category) ||
                    (d.quizPath && (d.quizPath.startsWith(category) || d.quizPath.startsWith('Daily Quiz Challenge > ' + category)));
                if (!matches) return;
                quizzesPlayed++;
                totalScore += Number(d.score) || 0;
                const qAtt = d.attemptedQuestions !== undefined ? Number(d.attemptedQuestions) : ((Number(d.correctCount) || 0) + (Number(d.wrongCount) || 0));
                totalAttempted += qAtt;
                const c = d.correctCount !== undefined ? Number(d.correctCount) : Math.round(((Number(d.accuracy) || 0) / 100) * qAtt);
                const w = d.wrongCount !== undefined ? Number(d.wrongCount) : Math.max(0, qAtt - c);
                correctCount += c;
                wrongCount += w;
                accuracyTrend.push(Number(d.accuracy) || 0);
                if (d.avgTimeCorrect) { totalAvgTimeC += Number(d.avgTimeCorrect); countC++; }
                if (d.avgTimeWrong) { totalAvgTimeW += Number(d.avgTimeWrong); countW++; }
                if (d.subjectBreakdown && typeof d.subjectBreakdown === 'object') {
                    Object.keys(d.subjectBreakdown).forEach(sKey => {
                        const cleanS = formatCleanTopicTitle(sKey);
                        if (!subjectMap[cleanS]) subjectMap[cleanS] = { attempts: 0, correct: 0 };
                        subjectMap[cleanS].attempts += Number(d.subjectBreakdown[sKey].attempts) || 0;
                        subjectMap[cleanS].correct += Number(d.subjectBreakdown[sKey].correct) || 0;
                    });
                }
            });

            const exams = getActiveExamCategoriesFromAdmin();
            const examTabsHtml = exams.map(ex => {
                const cleanEx = formatCleanTopicTitle(ex);
                const isAct = ex === category;
                return `
                    <button type="button" class="sa-cat-tab-btn ${isAct ? 'active' : ''}" onclick="window.location.hash='#/progress/${encodeURIComponent(ex)}'">
                        ${cleanEx}
                    </button>
                `;
            }).join('');

            if (quizzesPlayed === 0 && totalAttempted === 0) {
                mc.innerHTML = `
                    <div class="ad-compact-shell page-transition">
                        <div class="ad-top-bar">
                            <div class="sa-cat-tabs-row" style="padding-bottom:6px;">${examTabsHtml}</div>
                            <h2 style="margin:4px 0 0 0; font-size:18px; font-weight:900; color:#fff;">📊 ${displayCategory} Diagnostics</h2>
                        </div>
                        <div class="ad-top-bar" style="text-align:center; padding:32px 18px;">
                            <div style="font-size:40px; margin-bottom:8px;">📈</div>
                            <h3 style="margin:0 0 6px 0; color:#fff; font-size:18px;">No ${displayCategory} Quizzes Completed Yet</h3>
                            <p style="color:#94a3b8; font-size:12.5px; margin:0 0 18px 0;">Complete 1 quiz in ${displayCategory} to activate your live telemetry ring, speed radar, and score simulator.</p>
                            <button class="mcqs-btn-gold" onclick="jumpToSection(['${safeCatJs}'])">🚀 Start First ${displayCategory} Quiz</button>
                        </div>
                    </div>
                `;
                return;
            }

            const overallAccuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;
            const avgTimeCorrect = countC > 0 ? Math.round(totalAvgTimeC / countC) : 0;
            const avgTimeWrong = countW > 0 ? Math.round(totalAvgTimeW / countW) : 0;
            const recentTrend = accuracyTrend.slice(-10);

            const subjectList = Object.keys(subjectMap)
                .filter(k => subjectMap[k].attempts > 0)
                .map(k => {
                    const s = subjectMap[k];
                    const pct = Math.round((s.correct / s.attempts) * 100);
                    return { name: k, attempts: s.attempts, correct: s.correct, pct, isWeak: pct < 50 };
                })
                .sort((a, b) => b.pct - a.pct);

            saState.lastAnalyticsData = {
                quizzesPlayed, totalScore, totalAttempted, correctCount, wrongCount,
                overallAccuracy, avgTimeCorrect, avgTimeWrong, recentTrend, subjectList
            };
            saState.lastAnalyticsCategory = category;
            saState.analyticsSimQuestions = displayCategory.toLowerCase().includes('neet') ? 180 : (displayCategory.toLowerCase().includes('jee') ? 75 : 100);
            if (wrongCount === 0 && saState.analyticsSimMode === 'SHIELD') {
                saState.analyticsSimMode = 'SPEED';
            }

            // Circular SVG Accuracy Ring math
            const ringCircum = 238;
            const ringOffset = Math.round(ringCircum - (overallAccuracy / 100) * ringCircum);
            const ringColor = overallAccuracy >= 75 ? '#10b981' : (overallAccuracy >= 50 ? '#fdb813' : '#ef4444');

            // Weak-Spot / Mastery Banner (Ultra-compact 1-line bar)
            const weakSubjs = subjectList.filter(s => s.isWeak);
            const statusBannerHtml = weakSubjs.length > 0
                ? `<div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); border-left:4px solid #ef4444; border-radius:12px; padding:9px 12px; font-size:12px; color:#fecaca; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <span>🚨 <b>Weak Spot (&lt;50%):</b> ${weakSubjs.map(w => `${w.name} (${w.pct}%)`).join(', ')}</span>
                        <button type="button" onclick="launchCustomStudioWithPreselection('${safeCatJs}')" style="background:#ef4444; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; flex-shrink:0;">Fix Now</button>
                   </div>`
                : `<div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.38); border-left:4px solid #10b981; border-radius:12px; padding:9px 12px; font-size:12px; color:#d1fae5; font-weight:700; display:flex; align-items:center; gap:7px;">
                        ${SVG_CHECK_GREEN} <span><b>Strong Mastery!</b> All practiced subjects in ${displayCategory} are ≥ 50% accuracy.</span>
                   </div>`;

            // Compact Subject Mastery Rows
            const subjectRowsHtml = subjectList.length > 0
                ? subjectList.map(s => {
                    const col = s.pct >= 70 ? '#10b981' : (s.pct >= 50 ? '#fdb813' : '#ef4444');
                    const sIcon = getAutomaticIconForName(s.name, null, `${category} > ${s.name}`);
                    return `
                        <div style="background:#080b12; border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:8px 11px; margin-bottom:7px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:800; margin-bottom:4px;">
                                <span style="color:#f8fafc;">${sIcon} ${s.name}</span>
                                <span style="display:inline-flex; align-items:center; gap:6px;">
                                    <span style="color:${col}; font-weight:900;">${s.pct}%</span>
                                    <span style="background:rgba(16,185,129,0.14); color:#cbd5e1; border:1px solid rgba(16,185,129,0.35); padding:1px 6px; border-radius:6px; font-size:10px;">
                                        ${SVG_CHECK_GREEN} ${s.correct}/${s.attempts}
                                    </span>
                                </span>
                            </div>
                            <div style="width:100%; height:5px; background:#141c2e; border-radius:3px; overflow:hidden;">
                                <div style="width:${s.pct}%; height:100%; background:${col}; border-radius:3px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')
                : `<div style="font-size:12px; color:#94a3b8;">Practice chapter quizzes to populate subject mastery bars.</div>`;

            // Speed Autopsy diagnosis line
            let speedDiagText = '⚡ Optimal Pacing: Zero time wasted on wrong options.';
            if (avgTimeWrong > 0) {
                speedDiagText = avgTimeWrong < avgTimeCorrect
                    ? `⚠️ Impulse Alert: You spent ${avgTimeWrong}s on Wrong vs ${avgTimeCorrect}s on Correct. Pause +5s before locking!`
                    : `🧠 Time Sink: You spent ${avgTimeWrong}s on Wrong answers. Skip tough MCQs on 1st pass!`;
            }

            mc.innerHTML = `
                <div class="ad-compact-shell page-transition">
                    <!-- 1. COMPACT COMMAND HEADER WITH 1-TAP EXAM TABS -->
                    <div class="ad-top-bar">
                        <div class="mcqs-crumb-bar" style="margin-bottom:8px;">
                            <span class="mcqs-crumb-pill" onclick="goHome()">🏠 Home</span>
                            <span style="color:#475569;">›</span>
                            <span class="mcqs-crumb-pill" onclick="window.location.hash='#/progress'">📊 Analytics</span>
                            <span style="color:#475569;">›</span>
                            <span class="mcqs-crumb-pill active">${displayCategory}</span>
                        </div>

                        <div class="sa-cat-tabs-row" style="padding-bottom:8px; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.07);">
                            ${examTabsHtml}
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div>
                                <h1 style="margin:0; font-size:18px; font-weight:900; color:#ffffff;">📊 ${displayCategory} Diagnostic Center</h1>
                                <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">
                                    Compiled from <b style="color:#fdb813;">${quizzesPlayed} Quiz${quizzesPlayed === 1 ? '' : 'zes'}</b> • <b style="color:#38bdf8;">${totalAttempted} MCQs</b>
                                </div>
                            </div>
                            <div style="display:flex; gap:6px;">
                                <button type="button" onclick="launchCustomStudioWithPreselection('${safeCatJs}')" style="background:#fdb813; color:#000; border:none; padding:7px 12px; border-radius:9px; font-size:11.5px; font-weight:900; cursor:pointer;">🎯 Custom Mock</button>
                                <button type="button" onclick="window.location.hash='#/board/${encodeURIComponent(category)}'" style="background:rgba(255,255,255,0.06); color:#fff; border:1px solid rgba(255,255,255,0.15); padding:7px 11px; border-radius:9px; font-size:11.5px; font-weight:800; cursor:pointer;">🏆 Rank</button>
                            </div>
                        </div>
                    </div>

                    <!-- 2. COMPACT TELEMETRY HERO (ANIMATED RING + 2x2 KPI GRID IN ONE CARD!) -->
                    <div class="ad-telemetry-hero">
                        <div class="ad-ring-box">
                            <svg width="96" height="96" viewBox="0 0 96 96" style="transform:rotate(-90deg);">
                                <circle cx="48" cy="48" r="38" fill="none" stroke="#161f33" stroke-width="8"/>
                                <circle cx="48" cy="48" r="38" fill="none" stroke="${ringColor}" stroke-width="8" stroke-dasharray="${ringCircum}" stroke-dashoffset="${ringOffset}" stroke-linecap="round" style="transition:stroke-dashoffset 0.8s ease;"/>
                            </svg>
                            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <span style="font-size:20px; font-weight:900; color:#ffffff; line-height:1;">${overallAccuracy}%</span>
                                <span style="font-size:9px; font-weight:800; color:${ringColor}; text-transform:uppercase; margin-top:2px;">Accuracy</span>
                            </div>
                        </div>

                        <div class="ad-kpi-quad-grid">
                            <div class="ad-kpi-mini-pill" style="border-color:rgba(253,184,19,0.35);">
                                <span style="font-size:9.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">⭐ Net Score</span>
                                <span style="font-size:20px; font-weight:900; color:#fdb813; margin-top:1px;">${totalScore} <small style="font-size:10px; color:#94a3b8;">pts</small></span>
                            </div>
                            <div class="ad-kpi-mini-pill" style="border-color:rgba(56,189,248,0.35);">
                                <span style="font-size:9.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">📝 Attempted</span>
                                <span style="font-size:20px; font-weight:900; color:#38bdf8; margin-top:1px;">${totalAttempted} <small style="font-size:10px; color:#94a3b8;">MCQs</small></span>
                            </div>
                            <div class="ad-kpi-mini-pill" style="border-color:rgba(16,185,129,0.4);">
                                <span style="font-size:9.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Correct (+4)</span>
                                <span style="font-size:18px; font-weight:900; color:#10b981; margin-top:1px; display:inline-flex; align-items:center; gap:4px;">${SVG_CHECK_GREEN} ${correctCount}</span>
                            </div>
                            <div class="ad-kpi-mini-pill" style="border-color:rgba(239,68,68,0.4);">
                                <span style="font-size:9.5px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Wrong (−1)</span>
                                <span style="font-size:18px; font-weight:900; color:#ef4444; margin-top:1px; display:inline-flex; align-items:center; gap:4px;">${SVG_CROSS_RED} ${wrongCount}</span>
                            </div>
                        </div>
                    </div>

                    ${statusBannerHtml}

                    <!-- 3. INTERACTIVE LIVE SCORE & PACE SIMULATOR -->
                    <div id="adLiveSimulatorMount"></div>

                    <!-- 4. SIDE-BY-SIDE SPEED AUTOPSY + SUBJECT MASTERY & SVG TRAJECTORY -->
                    <div class="ad-split-row">
                        <!-- Left Card: Compact Side-by-Side Speed Autopsy + Subject Mastery -->
                        <div class="ad-top-bar" style="display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-size:12.5px; font-weight:900; color:#ffffff;">⏱️ Speed-vs-Accuracy Radar</span>
                                    <span style="font-size:10px; color:#fdb813; font-weight:800;">Live Pacing</span>
                                </div>
                                <!-- Always Side-by-Side 2 Columns even on Mobile! -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:7px;">
                                    <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.4); border-radius:10px; padding:8px; text-align:center;">
                                        <div style="font-size:18px; font-weight:900; color:#10b981; display:inline-flex; align-items:center; gap:4px;">${SVG_CHECK_GREEN} ${avgTimeCorrect}s</div>
                                        <div style="font-size:10px; color:#cbd5e1; font-weight:700; margin-top:2px;">Avg on Correct</div>
                                    </div>
                                    <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.4); border-radius:10px; padding:8px; text-align:center;">
                                        <div style="font-size:18px; font-weight:900; color:#ef4444; display:inline-flex; align-items:center; gap:4px;">${SVG_CROSS_RED} ${avgTimeWrong}s</div>
                                        <div style="font-size:10px; color:#cbd5e1; font-weight:700; margin-top:2px;">Avg on Wrong</div>
                                    </div>
                                </div>
                                <div style="font-size:10.5px; color:#94a3b8; line-height:1.35;">${speedDiagText}</div>
                            </div>

                            <div style="border-top:1px solid rgba(255,255,255,0.07); padding-top:10px;">
                                <div style="font-size:12.5px; font-weight:900; color:#ffffff; margin-bottom:8px;">📚 Subject-Wise Mastery</div>
                                ${subjectRowsHtml}
                            </div>
                        </div>

                        <!-- Right Card: Precision Non-Overlapping SVG Accuracy Trajectory -->
                        <div class="ad-top-bar" style="display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                    <span style="font-size:12.5px; font-weight:900; color:#ffffff;">📈 Accuracy Trajectory (Last ${recentTrend.length} Tests)</span>
                                    <span style="background:rgba(16,185,129,0.16); color:#10b981; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:900;">Now: ${overallAccuracy}%</span>
                                </div>
                                <div style="background:#080b12; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:10px 8px 6px 6px;">
                                    ${buildPrecisionSvgTrajectoryHtml(recentTrend)}
                                </div>
                            </div>
                            <div style="font-size:10.5px; color:#94a3b8; margin-top:8px; display:flex; justify-content:space-between;">
                                <span>● First Recorded: <b style="color:#fdb813;">${recentTrend[0] || overallAccuracy}%</b></span>
                                <span>● Peak Accuracy: <b style="color:#10b981;">${Math.max(...recentTrend, overallAccuracy)}%</b></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            renderAnalyticsLiveSimulatorBox();
        } catch (e) {
            mc.innerHTML = `<div class="card"><p style="color:#ef4444;">Error loading analytics: ${e.message}</p></div>`;
        }
    };

    // ==========================================
    // ADMIN-DRIVEN SLIDES & MODULES FOR INSTALLED MOBILE APP
    // ==========================================
    function getAdminDrivenExamSlideData(examKey, idx) {
        const clean = formatCleanTopicTitle(examKey);
        const tMeta = (typeof customTopicTypes !== 'undefined' && customTopicTypes[examKey]) || null;
        const cIcon = tMeta ? tMeta.icon : null;
        const th = getAutoTopicTheme(clean, cIcon, idx, null, '📘', null, examKey);

        const directModules = getDirectChildKeysFromAdmin([examKey]);
        const subTopicsList = [];
        directModules.forEach(mKey => {
            const children = getDirectChildKeysFromAdmin([examKey, mKey]);
            children.forEach(ch => {
                const cleanCh = formatCleanTopicTitle(ch);
                if (!['easy', 'medium', 'hard', 'mixed'].includes(cleanCh.toLowerCase())) {
                    subTopicsList.push(cleanCh);
                }
            });
        });

        const uniqueSubTopics = Array.from(new Set(subTopicsList));
        const prog = getStudentProgressSummaryForApp(examKey);

        const bannerGradients = [
            'linear-gradient(140deg, #271352 0%, #0d1324 58%, #073b32 100%)',
            'linear-gradient(140deg, #0c3b5e 0%, #0d1324 58%, #341056 100%)',
            'linear-gradient(140deg, #430a22 0%, #0d1324 58%, #172e6e 100%)',
            'linear-gradient(140deg, #113e28 0%, #0d1324 58%, #5b2210 100%)'
        ];

        return {
            examKey,
            cleanName: clean,
            icon: th.i === 'NONE' ? '📘' : th.i,
            color: th.c,
            bg: th.bg,
            border: th.border,
            grad: bannerGradients[idx % bannerGradients.length],
            directModules,
            uniqueSubTopics,
            prog
        };
    }

    function collectUploadedStudyModules(selectedCat) {
        const exams = getActiveExamCategoriesFromAdmin();
        const targetExams = (selectedCat && selectedCat !== 'ALL') ? [selectedCat] : exams;
        const items = [];
        let colorCounter = 0;

        targetExams.forEach(exKey => {
            const cleanEx = formatCleanTopicTitle(exKey);
            const directChildren = getDirectChildKeysFromAdmin([exKey]);

            directChildren.forEach(childKey => {
                const fullPath = `${exKey} > ${childKey}`;
                const cleanChild = formatCleanTopicTitle(childKey);
                const tMeta = (typeof customTopicTypes !== 'undefined' && customTopicTypes[fullPath]) || null;
                const th = getAutoTopicTheme(cleanChild, tMeta?.icon || null, colorCounter++, null, '📘', null, fullPath);
                const grandChildren = getDirectChildKeysFromAdmin([exKey, childKey]);
                const modProg = getStudentProgressSummaryForApp(fullPath);

                items.push({
                    title: selectedCat === 'ALL' ? `${cleanChild} (${cleanEx})` : cleanChild,
                    subtitle: grandChildren.length > 0
                        ? grandChildren.slice(0, 4).map(g => formatCleanTopicTitle(g)).join(' • ')
                        : `${cleanEx} Uploaded Module`,
                    statusBadge: modProg.solved > 0
                        ? `${SVG_CHECK_GREEN} ${modProg.solved} Solved (${modProg.acc}%)`
                        : (grandChildren.length > 0 ? `● ${grandChildren.length} Sections` : '● Open Module'),
                    statusColor: modProg.solved > 0 ? '#10b981' : th.c,
                    icon: th.i === 'NONE' ? '📘' : th.i,
                    color: th.c,
                    bg: th.bg,
                    border: th.border,
                    pathArr: [exKey, childKey]
                });

                grandChildren.slice(0, 6).forEach(gKey => {
                    const gFull = `${fullPath} > ${gKey}`;
                    const cleanG = formatCleanTopicTitle(gKey);
                    if (['easy', 'medium', 'hard', 'mixed'].includes(cleanG.toLowerCase())) return;
                    const gMeta = (typeof customTopicTypes !== 'undefined' && customTopicTypes[gFull]) || null;
                    const gTh = getAutoTopicTheme(cleanG, gMeta?.icon || null, colorCounter++, null, '📘', null, gFull);
                    const leafChildren = getDirectChildKeysFromAdmin([exKey, childKey, gKey])
                        .filter(lk => !['easy', 'medium', 'hard', 'mixed'].includes(formatCleanTopicTitle(lk).toLowerCase()));
                    const gProg = getStudentProgressSummaryForApp(gFull);

                    items.push({
                        title: cleanG,
                        subtitle: `${cleanEx} › ${cleanChild}${leafChildren.length > 0 ? ` • ${leafChildren.slice(0, 2).map(l => formatCleanTopicTitle(l)).join(', ')}` : ''}`,
                        statusBadge: gProg.solved > 0
                            ? `${SVG_CHECK_GREEN} ${gProg.solved} Solved (${gProg.acc}%)`
                            : (leafChildren.length > 0 ? `● ${leafChildren.length} Chapters` : '● Practice MCQs'),
                        statusColor: gProg.solved > 0 ? '#10b981' : gTh.c,
                        icon: gTh.i === 'NONE' ? '📘' : gTh.i,
                        color: gTh.c,
                        bg: gTh.bg,
                        border: gTh.border,
                        pathArr: [exKey, childKey, gKey]
                    });
                });
            });
        });

        return items;
    }

    function startStudyHeroCarousel() {
        if (saState.carouselTimer) clearInterval(saState.carouselTimer);
        saState.carouselTimer = setInterval(() => {
            if (saState.isTouchingCarousel) return;
            const track = document.getElementById('saHeroCarouselTrack');
            if (!track) return;
            const slides = track.querySelectorAll('.sa-exam-slide');
            if (slides.length <= 1) return;

            saState.activeSlideIdx = (saState.activeSlideIdx + 1) % slides.length;
            const targetSlide = slides[saState.activeSlideIdx];
            if (targetSlide) {
                track.scrollTo({ left: targetSlide.offsetLeft - 14, behavior: 'smooth' });
            }
            updateSaCarouselDots(saState.activeSlideIdx);
        }, 3600);
    }

    function updateSaCarouselDots(activeIdx) {
        const dots = document.querySelectorAll('.sa-carousel-dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
    }

    window.saSelectModuleCategory = function(catKey) {
        saState.selectedCategory = catKey;
        renderStudyMobileAppHome();
    };

    window.saSelectBlitzExam = function(examKey) {
        saState.blitzExam = examKey;
        renderStudyMobileAppHome();
    };

    window.saJumpToPathEncoded = function(encodedJsonArr, ev) {
        if (ev) ev.stopPropagation();
        try {
            const arr = JSON.parse(decodeURIComponent(encodedJsonArr));
            if (Array.isArray(arr) && arr.length > 0) {
                jumpToSection(arr);
            }
        } catch (e) {}
    };

    // ==========================================
    // ORGANIZED 60-SECOND SPEED BLITZ ENGINE
    // ==========================================
    var saBlitzGame = {
        questions: [],
        examName: '',
        idx: 0,
        score: 0,
        correct: 0,
        attempted: 0,
        streak: 0,
        timeLeft: 60,
        timer: null
    };

    window.launchOrganized60sBlitz = async function() {
        const exams = getActiveExamCategoriesFromAdmin();
        const targetExam = saState.blitzExam || exams[0] || 'NEET';
        const cleanEx = formatCleanTopicTitle(targetExam);

        const btn = document.getElementById('btnStartOrganizedBlitz');
        if (btn) { btn.disabled = true; btn.innerText = `⏳ Loading ${cleanEx} Blitz...`; }

        let pool = [];
        try {
            if (typeof db !== 'undefined') {
                const snap = await db.collection('content')
                    .where('path', '>=', targetExam)
                    .where('path', '<=', targetExam + '\uf8ff')
                    .limit(45)
                    .get();
                snap.forEach(doc => {
                    const d = doc.data();
                    if ((!d.type || d.type === 'mcq') && d.question && d.options && d.options.A) {
                        pool.push({ id: doc.id, ...d });
                    }
                });
            }
        } catch (e) {}

        if (btn) { btn.disabled = false; btn.innerText = `⚡ Start 60s ${cleanEx} Blitz Now`; }

        if (pool.length === 0) {
            showNotification(`⚠️ Open ${cleanEx} workspace to practice!`);
            jumpToSection([targetExam]);
            return;
        }

        saBlitzGame.questions = pool.sort(() => Math.random() - 0.5);
        saBlitzGame.examName = cleanEx;
        saBlitzGame.idx = 0;
        saBlitzGame.score = 0;
        saBlitzGame.correct = 0;
        saBlitzGame.attempted = 0;
        saBlitzGame.streak = 0;
        saBlitzGame.timeLeft = 60;

        let modal = document.getElementById('saRapidBlitzModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'saRapidBlitzModal';
            modal.style.cssText = 'position:fixed; inset:0; background:rgba(7,10,18,0.98); z-index:99999; display:flex; flex-direction:column; justify-content:space-between; padding:16px; box-sizing:border-box;';
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        renderSaBlitzFrame();

        if (saBlitzGame.timer) clearInterval(saBlitzGame.timer);
        saBlitzGame.timer = setInterval(() => {
            saBlitzGame.timeLeft--;
            const tEl = document.getElementById('saBlitzClockPill');
            if (tEl) tEl.innerText = `⏱️ ${saBlitzGame.timeLeft}s`;
            if (saBlitzGame.timeLeft <= 0) {
                finishSaBlitzGame();
            }
        }, 1000);
    };

    window.closeSaBlitzModal = function() {
        if (saBlitzGame.timer) clearInterval(saBlitzGame.timer);
        const modal = document.getElementById('saRapidBlitzModal');
        if (modal) modal.style.display = 'none';
        renderStudyMobileAppHome();
    };

    function finishSaBlitzGame() {
        if (saBlitzGame.timer) clearInterval(saBlitzGame.timer);
        const acc = saBlitzGame.attempted > 0 ? Math.round((saBlitzGame.correct / saBlitzGame.attempted) * 100) : 0;
        if (saBlitzGame.score > saState.blitzBestScore) {
            saState.blitzBestScore = saBlitzGame.score;
            localStorage.setItem('mcqs_app_blitz_best_v1', String(saBlitzGame.score));
        }
        if (acc > saState.blitzBestAcc) {
            saState.blitzBestAcc = acc;
            localStorage.setItem('mcqs_app_blitz_best_acc_v1', String(acc));
        }

        const modal = document.getElementById('saRapidBlitzModal');
        if (!modal) return;
        modal.innerHTML = `
            <div style="margin:auto; width:100%; max-width:360px; background:#121828; border:1.5px solid #fdb813; border-radius:20px; padding:24px 18px; text-align:center;">
                <div style="font-size:44px; margin-bottom:6px;">🏆</div>
                <h2 style="margin:0; color:#fff; font-size:21px; font-weight:900;">${saBlitzGame.examName} 60s Blitz Complete!</h2>
                <div style="font-size:36px; font-weight:900; color:#fdb813; margin:10px 0;">${saBlitzGame.score} pts</div>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; background:#090d16; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px; margin-bottom:18px;">
                    <div><div style="font-size:15px; font-weight:900; color:#10b981;">${SVG_CHECK_GREEN} ${saBlitzGame.correct}</div><div style="font-size:10px; color:#94a3b8;">Correct</div></div>
                    <div><div style="font-size:15px; font-weight:900; color:#38bdf8;">${acc}%</div><div style="font-size:10px; color:#94a3b8;">Accuracy</div></div>
                    <div><div style="font-size:15px; font-weight:900; color:#fdb813;">${saState.blitzBestScore}</div><div style="font-size:10px; color:#94a3b8;">Best Score</div></div>
                </div>

                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="launchOrganized60sBlitz()" style="flex:1; background:#fdb813; color:#000; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13px;">🔄 Play Again</button>
                    <button type="button" onclick="closeSaBlitzModal()" style="flex:1; background:#1e293b; color:#fff; border:none; padding:11px; border-radius:12px; font-weight:800; font-size:13px;">✓ Done</button>
                </div>
            </div>
        `;
    }

    window.answerSaBlitzOption = function(letter) {
        const q = saBlitzGame.questions[saBlitzGame.idx % saBlitzGame.questions.length];
        const corr = Array.isArray(q.correctAnswers) ? q.correctAnswers : ['A'];
        saBlitzGame.attempted++;
        if (corr.includes(letter)) {
            saBlitzGame.correct++;
            saBlitzGame.streak++;
            const mult = saBlitzGame.streak >= 3 ? 2 : 1;
            saBlitzGame.score += (10 * mult);
        } else {
            saBlitzGame.streak = 0;
            saBlitzGame.score = Math.max(0, saBlitzGame.score - 2);
        }
        saBlitzGame.idx++;
        renderSaBlitzFrame();
    };

    function renderSaBlitzFrame() {
        const modal = document.getElementById('saRapidBlitzModal');
        if (!modal) return;
        const q = saBlitzGame.questions[saBlitzGame.idx % saBlitzGame.questions.length];
        const multBadge = saBlitzGame.streak >= 3
            ? `<span style="background:#f59e0b; color:#000; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:900;">🔥 2x COMBO</span>`
            : `<span style="background:rgba(56,189,248,0.15); color:#38bdf8; padding:3px 9px; border-radius:999px; font-size:11px; font-weight:800;">${SVG_CHECK_GREEN} ${saBlitzGame.correct}/${saBlitzGame.attempted}</span>`;

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span id="saBlitzClockPill" style="background:#ef4444; color:#fff; padding:5px 11px; border-radius:999px; font-size:13px; font-weight:900;">⏱️ ${saBlitzGame.timeLeft}s</span>
                    <span style="color:#fdb813; font-size:15px; font-weight:900;">⚡ ${saBlitzGame.score} pts</span>
                    ${multBadge}
                </div>
                <button type="button" onclick="closeSaBlitzModal()" style="background:rgba(255,255,255,0.1); color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:15px; font-weight:800;">✕</button>
            </div>

            <div style="flex:1; overflow-y:auto; padding:14px 0;">
                <div style="font-size:11px; color:#fdb813; font-weight:800; text-transform:uppercase; margin-bottom:6px;">${saBlitzGame.examName} Speed Challenge • Q #${saBlitzGame.idx + 1}</div>
                <div style="font-size:15px; color:#fff; font-weight:700; line-height:1.5; margin-bottom:14px; background:#111728; border-left:3px solid #fdb813; padding:12px; border-radius:10px;">${q.question}</div>
                <div style="display:flex; flex-direction:column; gap:9px;">
                    ${['A', 'B', 'C', 'D'].map(letKey => q.options?.[letKey] ? `
                        <button type="button" onclick="answerSaBlitzOption('${letKey}')" style="background:#151c2e; border:1.5px solid rgba(255,255,255,0.14); color:#f8fafc; padding:12px 14px; border-radius:12px; text-align:left; font-size:13.5px; font-weight:600; display:flex; align-items:center; gap:10px;">
                            <span style="width:26px; height:26px; border-radius:7px; background:rgba(253,184,19,0.18); color:#fdb813; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; flex-shrink:0;">${letKey}</span>
                            <span style="flex:1;">${q.options[letKey]}</span>
                        </button>
                    ` : '').join('')}
                </div>
            </div>

            <div style="text-align:center; font-size:11px; color:#64748b; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06);">Tap the correct option • 3 Correct in a row activates 🔥 2x Points!</div>
        `;

        if (typeof renderMathInElement === 'function') {
            renderMathInElement(modal, {
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

    // ==========================================
    // MAIN STUDY-OPTIMIZED INSTALLED MOBILE APP RENDERER
    // ==========================================
    function renderStudyMobileAppHome() {
        if (!isInstalledMobileAppMode()) return false;
        const mc = document.getElementById('dynamic-content');
        if (!mc) return false;

        document.body.classList.add('mcqs-study-app-active');
        upgradeNavbarSearchButtonLogo();
        repairAndEnhanceMobileAppDock();

        const exams = getActiveExamCategoriesFromAdmin();
        const activeCat = saState.selectedCategory || 'ALL';
        if (!saState.blitzExam || !exams.includes(saState.blitzExam)) {
            saState.blitzExam = exams[0] || 'NEET';
        }

        // 1. CONTINUOUS SLIDING EXAM CATEGORY BANNERS (100% Driven by Admin Panel Uploads)
        const heroSlidesHtml = exams.map((exKey, idx) => {
            const slide = getAdminDrivenExamSlideData(exKey, idx);
            const encodedExArr = encodeURIComponent(JSON.stringify([exKey]));

            const uploadedChipsHtml = slide.directModules.slice(0, 6).map(mKey => {
                const cleanM = formatCleanTopicTitle(mKey);
                const mIcon = getAutomaticIconForName(cleanM, null, `${exKey} > ${mKey}`);
                const encodedModArr = encodeURIComponent(JSON.stringify([exKey, mKey]));
                return `
                    <span class="sa-uploaded-chip" onclick="saJumpToPathEncoded('${encodedModArr}', event)">
                        <span>${mIcon}</span>
                        <span>${cleanM}</span>
                    </span>
                `;
            }).join('');

            const subTopicsLine = slide.uniqueSubTopics.length > 0
                ? slide.uniqueSubTopics.slice(0, 5).join(' • ')
                : (slide.directModules.map(m => formatCleanTopicTitle(m)).join(' • ') || 'Complete Study & Practice Suite');

            const progressPill = slide.prog.solved > 0
                ? `<span style="background:rgba(16,185,129,0.22); color:#10b981; border:1px solid rgba(16,185,129,0.5); padding:4px 10px; border-radius:999px; font-size:10.5px; font-weight:900; display:inline-flex; align-items:center; gap:4px;">${SVG_CHECK_GREEN} ${slide.prog.solved} Solved • ${slide.prog.acc}%</span>`
                : `<span style="background:rgba(255,255,255,0.1); color:#f8fafc; border:1px solid rgba(255,255,255,0.2); padding:4px 10px; border-radius:999px; font-size:10.5px; font-weight:800;">📂 ${slide.directModules.length} Uploaded Sections</span>`;

            return `
                <div class="sa-exam-slide" onclick="saJumpToPathEncoded('${encodedExArr}', event)">
                    <div class="sa-exam-banner-card" style="--sa-grad:${slide.grad}; --sa-border:${slide.border}; --sa-orb:${slide.bg};">
                        <div class="sa-banner-orb"></div>

                        <svg class="sa-banner-wave" viewBox="0 0 320 80" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="saWave_${idx}" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="${slide.color}" stop-opacity="0.38"/>
                                    <stop offset="100%" stop-color="${slide.color}" stop-opacity="0.0"/>
                                </linearGradient>
                            </defs>
                            <path d="M 0 62 Q 80 24, 160 46 T 320 14 L 320 80 L 0 80 Z" fill="url(#saWave_${idx})"/>
                            <path d="M 0 62 Q 80 24, 160 46 T 320 14" fill="none" stroke="${slide.color}" stroke-width="2.5" stroke-linecap="round"/>
                        </svg>

                        <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                                <div style="width:44px; height:44px; border-radius:13px; background:rgba(9,13,22,0.75); border:1.5px solid ${slide.border}; color:${slide.color}; display:flex; align-items:center; justify-content:center; font-size:23px; flex-shrink:0; box-shadow:0 6px 16px rgba(0,0,0,0.5);">
                                    ${slide.icon}
                                </div>
                                <div style="min-width:0;">
                                    <h2 style="margin:0; font-size:19px; font-weight:900; color:#ffffff; line-height:1.15;">${slide.cleanName}</h2>
                                    <div style="font-size:11px; color:#cbd5e1; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${subTopicsLine}</div>
                                </div>
                            </div>
                            ${progressPill}
                        </div>

                        <div class="sa-uploaded-chips-wrap">
                            ${uploadedChipsHtml}
                        </div>

                        <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.12); padding-top:8px; font-size:12px; font-weight:800; color:${slide.color};">
                            <span>Tap any module above or open ${slide.cleanName}</span>
                            <span>Explore &rarr;</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const dotsHtml = exams.map((_, i) => `<span class="sa-carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('');

        // 2. ORGANISED CATEGORY-WISE STUDY MODULES SHELF
        const catTabsHtml = [
            `<button type="button" class="sa-cat-tab-btn ${activeCat === 'ALL' ? 'active' : ''}" onclick="saSelectModuleCategory('ALL')">All Categories</button>`,
            ...exams.map(exKey => {
                const clean = formatCleanTopicTitle(exKey);
                const safeEx = exKey.replace(/'/g, "\\'");
                return `<button type="button" class="sa-cat-tab-btn ${activeCat === exKey ? 'active' : ''}" onclick="saSelectModuleCategory('${safeEx}')">${clean}</button>`;
            })
        ].join('');

        const allModules = collectUploadedStudyModules(activeCat);
        const moduleColumns = [];
        const colClass = allModules.length <= 3 ? 'sa-module-column sa-module-column-single' : 'sa-module-column';
        for (let i = 0; i < allModules.length; i += 3) {
            const slice = allModules.slice(i, i + 3);
            const rowsHtml = slice.map(item => {
                const encodedArr = encodeURIComponent(JSON.stringify(item.pathArr));
                return `
                    <div class="sa-study-row-card" style="--mod-color:${item.color}; --mod-bg:${item.bg}; --mod-border:${item.border};" onclick="saJumpToPathEncoded('${encodedArr}', event)">
                        <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                            <div class="sa-study-row-icon">${item.icon}</div>
                            <div style="min-width:0; flex:1;">
                                <div style="font-size:14.5px; font-weight:800; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.title}</div>
                                <div style="font-size:11.5px; color:#94a3b8; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.subtitle}</div>
                                <div style="font-size:10.5px; font-weight:800; color:${item.statusColor}; margin-top:3px; display:inline-flex; align-items:center; gap:4px;">${item.statusBadge}</div>
                            </div>
                        </div>
                        <span style="color:${item.color}; font-size:18px; font-weight:900; flex-shrink:0;">&rsaquo;</span>
                    </div>
                `;
            }).join('');
            moduleColumns.push(`<div class="${colClass}">${rowsHtml}</div>`);
        }

        // 3. SMART REVISION & WEAK-SPOT DOCTOR + 60s SPEED BLITZ
        const globalProg = getStudentProgressSummaryForApp('');
        const bmCount = Array.isArray(userBookmarks) ? userBookmarks.length : 0;
        const lastPathClean = globalProg.lastActivePath
            ? globalProg.lastActivePath.split(' > ').map(s => formatCleanTopicTitle(s)).slice(-2).join(' › ')
            : '';
        const lastPathEncoded = globalProg.lastActivePath
            ? encodeURIComponent(JSON.stringify(globalProg.lastActivePath.split(' > ').filter(Boolean)))
            : '';

        const blitzExamPillsHtml = exams.map(exKey => {
            const clean = formatCleanTopicTitle(exKey);
            const isSel = saState.blitzExam === exKey;
            const safeEx = exKey.replace(/'/g, "\\'");
            return `
                <button type="button" onclick="saSelectBlitzExam('${safeEx}')" style="background:${isSel ? '#fdb813' : '#0b0f19'}; color:${isSel ? '#000' : '#cbd5e1'}; border:1px solid ${isSel ? '#fdb813' : 'rgba(255,255,255,0.14)'}; padding:5px 11px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;">
                    ${clean}
                </button>
            `;
        }).join('');
        const cleanBlitzExam = formatCleanTopicTitle(saState.blitzExam);

        // 4. SEPARATED QUICK LINKS & ESSENTIAL PRACTICE SECTIONS (Fixes Point 2 & Image 3!)
        const quickLinksList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.quickLinks)) ? window.sidebarConfig.quickLinks : [];
        const essentialList = (window.sidebarConfig && Array.isArray(window.sidebarConfig.essentialPractice)) ? window.sidebarConfig.essentialPractice : [];
        const streakNum = document.getElementById('nav-streak-display')?.innerText || '0';

        // Build Part A: Quick Links (Strictly from Admin Panel Quick Links)
        let usedColorsQ = new Set();
        const qCardCls = quickLinksList.length <= 1 ? 'sa-quick-card sa-quick-card-single' : 'sa-quick-card';
        const quickLinksCardsHtml = quickLinksList.map((item, idx) => {
            const displayTitle = formatCleanTopicTitle(item.title || item.path.split(' > ').pop() || '');
            const parentExam = formatCleanTopicTitle(item.path.split(' > ')[0] || 'Resource');
            const encodedPath = encodeURIComponent(item.path);
            const th = getAutoTopicTheme(displayTitle, item.icon || null, idx, usedColorsQ, '📚', null, item.path);
            return `
                <div class="${qCardCls}" style="border-left:4px solid ${th.c};" onclick="openSidebarItem('${encodedPath}')">
                    <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                        <span style="width:42px; height:42px; border-radius:11px; background:${th.bg}; border:1px solid ${th.border}; color:${th.c}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${th.i}</span>
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:14px; font-weight:800; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayTitle}</div>
                            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${parentExam} • Quick Link</div>
                        </div>
                    </div>
                    <span style="color:${th.c}; font-weight:900; font-size:18px; flex-shrink:0;">&rsaquo;</span>
                </div>
            `;
        }).join('');

        // Build Part B: Essential Practice (Daily Quiz Challenge + Strictly Admin Panel Essential Practice)
        let usedColorsE = new Set(['#fdb813']);
        const essentialItemsFiltered = essentialList.filter(e => e.path !== 'Daily Quiz Challenge');
        const eCardCls = essentialItemsFiltered.length === 0 ? 'sa-quick-card sa-quick-card-single' : 'sa-quick-card';

        let essentialCardsHtml = `
            <div class="${eCardCls}" style="border-left:4px solid #fdb813;" onclick="jumpToSection(['Daily Quiz Challenge'])">
                <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                    <span style="width:42px; height:42px; border-radius:11px; background:rgba(253,184,19,0.18); border:1px solid rgba(253,184,19,0.5); color:#fdb813; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">📅</span>
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:14px; font-weight:900; color:#fdb813; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Daily Quiz Challenge</div>
                        <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">🔥 ${streakNum} Day Streak • Play Daily</div>
                    </div>
                </div>
                <span style="color:#fdb813; font-weight:900; font-size:18px; flex-shrink:0;">&rsaquo;</span>
            </div>
        `;

        essentialItemsFiltered.forEach((item, idx) => {
            const displayTitle = formatCleanTopicTitle(item.title || item.path.split(' > ').pop() || '');
            const parentExam = formatCleanTopicTitle(item.path.split(' > ')[0] || 'Practice');
            const encodedPath = encodeURIComponent(item.path);
            const th = getAutoTopicTheme(displayTitle, item.icon || null, idx + 4, usedColorsE, '📝', null, item.path);
            essentialCardsHtml += `
                <div class="sa-quick-card" style="border-left:4px solid ${th.c};" onclick="openSidebarItem('${encodedPath}')">
                    <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                        <span style="width:42px; height:42px; border-radius:11px; background:${th.bg}; border:1px solid ${th.border}; color:${th.c}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${th.i}</span>
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:14px; font-weight:800; color:#ffffff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayTitle}</div>
                            <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${parentExam} • Essential Practice</div>
                        </div>
                    </div>
                    <span style="color:${th.c}; font-weight:900; font-size:18px; flex-shrink:0;">&rsaquo;</span>
                </div>
            `;
        });

        mc.innerHTML = `
            <div class="page-transition">
                <!-- 1. CONTINUOUS SLIDING EXAM SUITE CAROUSEL -->
                <div class="sa-carousel-section">
                    <div class="sa-carousel-track" id="saHeroCarouselTrack">
                        ${heroSlidesHtml}
                    </div>
                    <div class="sa-carousel-dots">${dotsHtml}</div>
                </div>

                <!-- 2. ORGANISED CATEGORY-WISE STUDY MODULES -->
                <div class="sa-section-block">
                    <div class="sa-section-header">
                        <h3 class="sa-section-title">
                            <span style="color:#fdb813;">▎</span> Explore Study Modules
                        </h3>
                        <button type="button" onclick="document.getElementById('saModulesSwipeTrack')?.scrollBy({left: 280, behavior: 'smooth'})" style="background:#151c2c; color:#fdb813; border:1px solid rgba(253,184,19,0.35); border-radius:999px; padding:4px 11px; font-size:11px; font-weight:800;">Swipe &rarr;</button>
                    </div>
                    <div class="sa-cat-tabs-row">${catTabsHtml}</div>
                    <div class="sa-modules-Redesign-track" id="saModulesSwipeTrack">
                        ${moduleColumns.join('')}
                    </div>
                </div>

                <!-- 3. SMART REVISION & WEAK-SPOT DOCTOR + 60-SECOND SPEED BLITZ -->
                <div class="sa-section-block">
                    <div class="sa-feature-full-card" style="border-color:rgba(56,189,248,0.42);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="background:rgba(56,189,248,0.16); color:#38bdf8; border:1px solid rgba(56,189,248,0.45); padding:3px 9px; border-radius:999px; font-size:10px; font-weight:900;">🩺 PERSONAL WEAK-SPOT DOCTOR</span>
                            <span style="font-size:11px; font-weight:800; color:#10b981; display:inline-flex; align-items:center; gap:4px;">${SVG_CHECK_GREEN} ${globalProg.solved} Solved (${globalProg.acc}%)</span>
                        </div>

                        <h3 style="margin:0 0 4px 0; font-size:16.5px; font-weight:900; color:#ffffff;">Smart Mistake Recovery &amp; Revision Hub</h3>
                        <p style="margin:0 0 12px 0; font-size:12px; color:#94a3b8; line-height:1.4;">Automatically isolates your wrong, skipped, and bookmarked questions so you never repeat the same mistake in the real exam.</p>

                        ${lastPathClean ? `
                            <div onclick="saJumpToPathEncoded('${lastPathEncoded}', event)" style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.4); border-radius:11px; padding:9px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:8px; cursor:pointer;">
                                <div style="min-width:0;">
                                    <div style="font-size:10px; font-weight:900; color:#10b981; text-transform:uppercase;">▶️ Continue Last Active Chapter</div>
                                    <div style="font-size:13px; font-weight:800; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${lastPathClean}</div>
                                </div>
                                <span style="background:#10b981; color:#000; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:900; flex-shrink:0;">Resume &rarr;</span>
                            </div>
                        ` : ''}

                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:12px;">
                            <div onclick="if(typeof setSmartClinicMode==='function'){setSmartClinicMode('WRONG'); launchSmartMistakeClinicSession();}" style="background:#0b0f19; border:1px solid rgba(239,68,68,0.4); border-radius:11px; padding:9px 6px; text-align:center; cursor:pointer;">
                                <div style="font-size:16px; font-weight:900; color:#ef4444; display:inline-flex; align-items:center; gap:4px;">${SVG_CROSS_RED} ${globalProg.wrong}</div>
                                <div style="font-size:10.5px; font-weight:800; color:#e2e8f0; margin-top:2px;">Wrong MCQs</div>
                                <div style="font-size:9.5px; color:#ef4444; margin-top:2px;">Tap to Fix &rarr;</div>
                            </div>
                            <div onclick="if(typeof setSmartClinicMode==='function'){setSmartClinicMode('SKIPPED'); launchSmartMistakeClinicSession();}" style="background:#0b0f19; border:1px solid rgba(234,179,8,0.4); border-radius:11px; padding:9px 6px; text-align:center; cursor:pointer;">
                                <div style="font-size:16px; font-weight:900; color:#eab308;">⏭️ ${globalProg.skipped}</div>
                                <div style="font-size:10.5px; font-weight:800; color:#e2e8f0; margin-top:2px;">Skipped</div>
                                <div style="font-size:9.5px; color:#eab308; margin-top:2px;">Retry &rarr;</div>
                            </div>
                            <div onclick="window.location.hash='#/bookmarks'" style="background:#0b0f19; border:1px solid rgba(168,85,247,0.4); border-radius:11px; padding:9px 6px; text-align:center; cursor:pointer;">
                                <div style="font-size:16px; font-weight:900; color:#c084fc;">🔖 ${bmCount}</div>
                                <div style="font-size:10.5px; font-weight:800; color:#e2e8f0; margin-top:2px;">Bookmarks</div>
                                <div style="font-size:9.5px; color:#c084fc; margin-top:2px;">Revise &rarr;</div>
                            </div>
                        </div>

                        <div style="display:flex; gap:8px;">
                            <button type="button" onclick="forceCwStep1(event)" style="flex:1.2; background:linear-gradient(135deg, #fdb813, #f59e0b); color:#000; border:none; padding:10px 12px; border-radius:11px; font-size:12px; font-weight:900; cursor:pointer;">🎯 Custom Mock (20–250 Q)</button>
                            <button type="button" onclick="window.location.hash='#/progress'" style="flex:1; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.4); padding:10px 12px; border-radius:11px; font-size:12px; font-weight:800; cursor:pointer;">📊 Full Analytics</button>
                        </div>
                    </div>

                    <!-- ORGANIZED FULL-WIDTH 60-SECOND SPEED BLITZ CARD -->
                    <div class="sa-feature-full-card" style="border-color:rgba(253,184,19,0.42); margin-bottom:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="background:rgba(253,184,19,0.18); color:#fdb813; border:1px solid rgba(253,184,19,0.45); padding:3px 9px; border-radius:999px; font-size:10px; font-weight:900;">⚡ 60-SECOND SPEED CHALLENGE</span>
                            <span style="font-size:11px; font-weight:900; color:#fdb813;">🏆 Best: ${saState.blitzBestScore} pts (${saState.blitzBestAcc}% Acc)</span>
                        </div>

                        <h3 style="margin:0 0 4px 0; font-size:16.5px; font-weight:900; color:#ffffff;">60-Second Rapid Reflex Blitz</h3>
                        <p style="margin:0 0 10px 0; font-size:12px; color:#94a3b8; line-height:1.4;">Select your target exam below and solve as many MCQs as you can in 60 seconds. 3 correct answers in a row unlocks 🔥 2x Combo Points!</p>

                        <div style="margin-bottom:12px;">
                            <div style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:6px;">Select Exam for 60s Blitz:</div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">${blitzExamPillsHtml}</div>
                        </div>

                        <button type="button" id="btnStartOrganizedBlitz" onclick="launchOrganized60sBlitz()" style="width:100%; background:linear-gradient(135deg, #fdb813, #f59e0b); color:#000; border:none; padding:11px 16px; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; box-shadow:0 6px 18px rgba(253,184,19,0.3);">
                            ⚡ Start 60s ${cleanBlitzExam} Blitz Now &rarr;
                        </button>
                    </div>
                </div>

                <!-- 4. PART A: QUICK LINKS (Strictly Separated as per Admin Panel!) -->
                <div class="sa-section-block">
                    <div class="sa-section-header">
                        <h3 class="sa-section-title">
                            <span style="color:#a855f7;">▎</span> 📚 Quick Links
                        </h3>
                        <span style="font-size:10.5px; color:#c084fc; font-weight:800;">Direct Study Material</span>
                    </div>
                    <div class="sa-quick-horiz-track">
                        ${quickLinksCardsHtml || '<div style="color:#64748b; font-size:12px; padding:6px;">No quick links configured in Admin Panel.</div>'}
                    </div>
                </div>

                <!-- 5. PART B: ESSENTIAL PRACTICE (Strictly Separated as per Admin Panel!) -->
                <div class="sa-section-block">
                    <div class="sa-section-header">
                        <h3 class="sa-section-title">
                            <span style="color:#fdb813;">▎</span> ⚡ Essential Practice
                        </h3>
                        <span style="font-size:10.5px; color:#fdb813; font-weight:800;">Daily Quiz &amp; PYQs</span>
                    </div>
                    <div class="sa-quick-horiz-track">
                        ${essentialCardsHtml}
                    </div>
                </div>
            </div>
        `;

        const track = document.getElementById('saHeroCarouselTrack');
        if (track) {
            track.addEventListener('touchstart', () => { saState.isTouchingCarousel = true; }, { passive: true });
            track.addEventListener('touchend', () => {
                setTimeout(() => { saState.isTouchingCarousel = false; }, 1400);
            }, { passive: true });
            track.addEventListener('scroll', () => {
                const slideW = track.querySelector('.sa-exam-slide')?.offsetWidth || 290;
                const idx = Math.round(track.scrollLeft / (slideW + 12));
                saState.activeSlideIdx = idx;
                updateSaCarouselDots(idx);
            }, { passive: true });
        }

        startStudyHeroCarousel();
        return true;
    }

    const _origRenderViewBeforeStudyAppV3 = _renderView;
    _renderView = function() {
        injectStudyMobileAppStyles();
        upgradeNavbarSearchButtonLogo();
        repairAndEnhanceMobileAppDock();

        const rawHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).trim();
        const isRootHome = (!rawHash || rawHash === 'home') && (!Array.isArray(currentPath) || currentPath.length === 0);

        if (isInstalledMobileAppMode() && isRootHome) {
            renderStudyMobileAppHome();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        document.body.classList.remove('mcqs-study-app-active');
        if (saState.carouselTimer) clearInterval(saState.carouselTimer);
        _origRenderViewBeforeStudyAppV3();
        repairAndEnhanceMobileAppDock();
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            injectStudyMobileAppStyles();
            upgradeNavbarSearchButtonLogo();
            repairAndEnhanceMobileAppDock();
            if (isInstalledMobileAppMode()) {
                const rawHash = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).trim();
                if ((!rawHash || rawHash === 'home') && (!Array.isArray(currentPath) || currentPath.length === 0)) {
                    _renderView();
                }
            }
        }, 140);
    }
})();
