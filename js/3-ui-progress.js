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
