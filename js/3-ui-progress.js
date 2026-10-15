// ==========================================
// 4. MAIN VIEW RENDERER & AUTOMATIC STUDY ICON / COLOR ENGINE
// ==========================================

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
    "#3b82f6", "#d946ef", "#f59e0b", "#2dd4bf"
];

const FALLBACK_TOPIC_ICONS = ["📘", "🧬", "⚛️", "🧪", "🌿", "📐", "🧠", "⚡", "🌍", "🏛️", "📊", "🚀", "🔬", "📖", "🎯", "💡"];

function getPaletteColorForText(text, offset = 0) {
    let str = String(text || "topic");
    let hash = 0;
    for (let idx = 0; idx < str.length; idx++) {
        hash = str.charCodeAt(idx) + ((hash << 5) - hash);
    }
    let index = (Math.abs(hash) + offset) % TOPIC_COLOR_PALETTE.length;
    return TOPIC_COLOR_PALETTE[index];
}

// Comprehensive Study, Subject, Chapter & Exam Icon Rules
// Ordered from specific study materials/chapters/subjects FIRST -> generic exam categories LAST
const STUDY_ICON_RULES = [
    // 1. Difficulty Levels
    { keys: ["easy"], i: "🟢", c: "#10b981" },
    { keys: ["medium"], i: "🟡", c: "#eab308" },
    { keys: ["hard"], i: "🔴", c: "#f43f5e" },
    { keys: ["mixed"], i: "⚡", c: "#a855f7" },

    // 2. Study Materials, Books, Papers & Tests (Checked before exam names so "NCERT Book (NEET)" gets 📚)
    { keys: ["ncert", "textbook", "book"], i: "📚", c: "#a855f7" },
    { keys: ["pyq", "previous year", "past paper", "solved paper"], i: "📄", c: "#ec4899" },
    { keys: ["practice paper", "sample paper", "model paper", "question paper", "guess paper"], i: "📋", c: "#38bdf8" },
    { keys: ["mock test", "mock", "grand test", "full test", "test series", "speed test"], i: "⏱️", c: "#f97316" },
    { keys: ["daily quiz", "daily challenge", "challenge"], i: "📅", c: "#fdb813" },
    { keys: ["formula", "cheat sheet", "handbook"], i: "🧮", c: "#14b8a6" },
    { keys: ["mind map", "flowchart", "diagram"], i: "🗺️", c: "#ec4899" },
    { keys: ["short note", "revision note", "handwritten", "notes", "summary", "flashcard"], i: "📒", c: "#eab308" },
    { keys: ["syllabus", "blueprint", "curriculum"], i: "📌", c: "#38bdf8" },
    { keys: ["mcq", "practice", "quiz", "objective", "question bank", "dpp", "worksheet"], i: "📝", c: "#06b6d4" },
    { keys: ["assertion", "statement", "case study", "match the column"], i: "🔍", c: "#8b5cf6" },

    // 3. Biology — Botany, Zoology & Medical Chapters
    { keys: ["genetics", "inheritance", "variation", "dna", "rna", "molecular basis", "gene", "chromosome", "mutation"], i: "🧬", c: "#f43f5e" },
    { keys: ["cell cycle", "cell division", "mitosis", "meiosis", "cell: the unit", "cell structure", "organelle"], i: "🔬", c: "#ec4899" },
    { keys: ["biomolecule", "enzyme", "protein", "amino acid", "carbohydrate", "lipid", "nucleic acid"], i: "🧪", c: "#14b8a6" },
    { keys: ["photosynthesis", "chloroplast", "pigment", "calvin"], i: "☀️", c: "#22c55e" },
    { keys: ["respiration in plant", "glycolysis", "krebs", "plant growth", "phytohormone", "auxin"], i: "🌱", c: "#10b981" },
    { keys: ["morphology of flowering", "flower", "inflorescence", "pollination", "sexual reproduction in flowering", "angiosperm"], i: "🌸", c: "#ec4899" },
    { keys: ["anatomy of flowering", "xylem", "phloem", "meristem", "vascular", "plant kingdom", "algae", "bryophyte", "pteridophyte", "gymnosperm", "botany", "plant", "transport in plant", "mineral nutrition"], i: "🌿", c: "#22c55e" },
    { keys: ["biological classification", "monera", "protista", "fungi", "virus", "viroid", "lichen", "bacteria", "microbe"], i: "🦠", c: "#84cc16" },
    { keys: ["living world", "taxonomy", "nomenclature", "biodiversity", "conservation"], i: "🌍", c: "#10b981" },
    { keys: ["ecosystem", "organisms and population", "ecology", "environment", "food chain", "biosphere", "pollution"], i: "🌲", c: "#10b981" },
    { keys: ["biotechnology", "recombinant", "pcr", "plasmid", "cloning", "biopiracy"], i: "🧫", c: "#06b6d4" },
    { keys: ["human health", "disease", "immunity", "vaccine", "cancer", "aids", "malaria", "pathology", "pharmacology"], i: "💊", c: "#f43f5e" },
    { keys: ["neural", "brain", "nervous", "neuron", "synapse", "eye", "ear", "sensory"], i: "🧠", c: "#a855f7" },
    { keys: ["body fluid", "circulation", "heart", "blood", "cardiac", "vascular", "ecg"], i: "🫀", c: "#ef4444" },
    { keys: ["breathing", "exchange of gases", "lungs", "respiratory", "alveoli"], i: "🫁", c: "#38bdf8" },
    { keys: ["locomotion", "movement", "skeletal", "muscle", "bone", "joint"], i: "🦴", c: "#eab308" },
    { keys: ["digestion", "absorption", "alimentary", "liver", "stomach", "gut", "nutrition"], i: "🍎", c: "#f97316" },
    { keys: ["excretory", "kidney", "nephron", "urine", "osmoregulation"], i: "💧", c: "#06b6d4" },
    { keys: ["chemical coordination", "endocrine", "hormone", "pituitary", "thyroid", "adrenal", "insulin"], i: "⚗️", c: "#d946ef" },
    { keys: ["human reproduction", "reproductive health", "gametogenesis", "embryo", "fertilisation"], i: "👶", c: "#ec4899" },
    { keys: ["evolution", "darwin", "natural selection", "fossil", "hardy-weinberg", "origin of life"], i: "🦕", c: "#f59e0b" },
    { keys: ["animal kingdom", "chordata", "non-chordata", "arthropoda", "mollusca", "zoology", "animal", "structural organisation", "cockroach", "frog", "earthworm", "epithelial"], i: "🦁", c: "#f59e0b" },
    { keys: ["biology", "life science", "anatomy", "physiology"], i: "🧬", c: "#f43f5e" },

    // 4. Physics & Subtopics
    { keys: ["optics", "ray optics", "wave optics", "lens", "mirror", "prism", "refraction", "interference", "diffraction", "polarization"], i: "🌈", c: "#38bdf8" },
    { keys: ["electrostatics", "electric charge", "electric field", "capacitance", "capacitor", "potentials", "gauss"], i: "⚡", c: "#eab308" },
    { keys: ["current electricity", "ohm", "kirchhoff", "wheatstone", "circuit", "alternating current", "ac circuit", "transformer"], i: "🔌", c: "#f59e0b" },
    { keys: ["magnetism", "magnetic", "moving charge", "biot-savart", "ampere", "solenoid", "electromagnetic induction", "faraday", "lenz", "em wave"], i: "🧲", c: "#ef4444" },
    { keys: ["semiconductor", "diode", "transistor", "logic gate", "electronics", "pn junction", "rectifier", "communication"], i: "💻", c: "#06b6d4" },
    { keys: ["atom", "nuclei", "nuclear", "radioactivity", "bohr", "dual nature", "photoelectric", "de broglie", "x-ray", "modern physics", "quantum"], i: "⚛️", c: "#a855f7" },
    { keys: ["thermodynamics", "thermal", "heat", "calorimetry", "carnot", "kinetic theory", "gas"], i: "🔥", c: "#f97316" },
    { keys: ["gravitation", "kepler", "satellite", "escape velocity", "orbit", "space", "astrophysics"], i: "🪐", c: "#6366f1" },
    { keys: ["oscillation", "shm", "simple harmonic", "pendulum", "wave", "sound", "doppler", "acoustics"], i: "〰️", c: "#14b8a6" },
    { keys: ["fluid", "bernoulli", "viscosity", "surface tension", "hydrostatics", "solid", "elasticity", "young's modulus"], i: "🌊", c: "#0ea5e9" },
    { keys: ["rotational", "torque", "moment of inertia", "rolling", "center of mass", "work energy", "power", "collision", "laws of motion", "newton", "friction", "pulley", "kinematics", "straight line", "projectile", "motion in a plane", "vector", "units and measurement", "dimension", "error", "mechanics", "physics"], i: "⚙️", c: "#a855f7" },

    // 5. Chemistry (Physical, Organic, Inorganic) & Chapters
    { keys: ["organic", "hydrocarbon", "alkane", "alkene", "alkyne", "benzene", "aromatic", "haloalkane", "haloarene", "alcohol", "phenol", "ether", "aldehyde", "ketone", "carboxylic", "amine", "diazonium", "polymer", "isomerism", "iupac", "goc", "reaction mechanism"], i: "⌬", c: "#10b981" },
    { keys: ["inorganic", "periodic table", "periodicity", "s-block", "p-block", "d-block", "f-block", "transition", "lanthanoid", "coordination compound", "ligand", "metallurgy", "isolation of element", "hydrogen", "salt analysis"], i: "💎", c: "#ec4899" },
    { keys: ["electrochemistry", "nernst", "electrolysis", "conductance", "galvanic", "battery"], i: "🔋", c: "#eab308" },
    { keys: ["chemical kinetics", "rate of reaction", "arrhenius", "half-life", "catalysis", "surface chemistry", "colloid", "adsorption"], i: "⏳", c: "#f97316" },
    { keys: ["equilibrium", "ionic equilibrium", "ph", "buffer", "solubility", "le chatelier"], i: "⚖️", c: "#38bdf8" },
    { keys: ["chemical bonding", "hybridisation", "vsepr", "molecular orbital", "dipole", "atomic structure", "structure of atom", "quantum number", "mole concept", "stoichiometry", "redox", "solid state", "crystal", "solution", "colligative", "raoult", "states of matter", "physical chemistry", "chemistry"], i: "🧪", c: "#06b6d4" },

    // 6. Mathematics & Chapters
    { keys: ["calculus", "limit", "derivative", "differentiation", "continuity", "differentiability", "integral", "integration", "differential equation", "area under curve"], i: "∫", c: "#6366f1" },
    { keys: ["trigonometry", "trigonometric", "inverse trig", "triangle", "height and distance"], i: "📐", c: "#38bdf8" },
    { keys: ["geometry", "straight line", "circle", "parabola", "ellipse", "hyperbola", "conic", "coordinate", "3d geometry", "mensuration"], i: "📏", c: "#10b981" },
    { keys: ["matrix", "matrices", "determinant", "complex number", "quadratic", "polynomial", "binomial", "sequence", "series", "progression", "ap", "gp", "set", "relation", "function", "inequality", "algebra", "math"], i: "🔢", c: "#3b82f6" },
    { keys: ["probability", "permutation", "combination", "statistics", "variance", "mean", "median", "data interpretation"], i: "🎲", c: "#ec4899" },

    // 7. General Knowledge, Humanities, Aptitude & Languages
    { keys: ["history", "ancient", "medieval", "modern india", "freedom", "dynasty", "empire", "mughal", "british", "harappa", "vedic"], i: "🏛️", c: "#f97316" },
    { keys: ["geography", "river", "mountain", "climate", "monsoon", "soil", "mineral", "continent", "ocean", "atlas", "map", "solar system", "earth"], i: "🗺️", c: "#10b981" },
    { keys: ["polity", "constitution", "parliament", "president", "fundamental right", "directive", "judiciary", "supreme court", "panchayat", "governance", "amendment", "civics", "politics"], i: "⚖️", c: "#a855f7" },
    { keys: ["economy", "economics", "budget", "gdp", "inflation", "tax", "gst", "rbi", "monetary", "fiscal", "five year plan", "commerce", "finance", "accounting"], i: "💰", c: "#22c55e" },
    { keys: ["current affairs", "news", "headline", "international", "summit", "scheme", "appointment"], i: "📰", c: "#38bdf8" },
    { keys: ["award", "nobel", "ratna", "oscar", "trophy", "medal", "honour"], i: "🏆", c: "#fdb813" },
    { keys: ["sport", "cricket", "olympic", "football", "hockey", "tennis", "chess", "athletics"], i: "🏅", c: "#10b981" },
    { keys: ["art", "culture", "dance", "music", "festival", "temple", "heritage", "painting", "literature"], i: "🎭", c: "#ec4899" },
    { keys: ["assam", "north east", "ahom", "brahmaputra"], i: "🦏", c: "#22c55e" },
    { keys: ["computer", "software", "hardware", "internet", "networking", "cyber", "coding", "programming", "python", "java", "dbms", "operating system", "it", "artificial intelligence"], i: "💻", c: "#38bdf8" },
    { keys: ["reasoning", "logical", "puzzle", "syllogism", "blood relation", "coding-decoding", "seating", "analogy", "series", "direction", "clock", "calendar", "venn", "non-verbal"], i: "🧩", c: "#f97316" },
    { keys: ["aptitude", "quantitative", "percentage", "profit", "loss", "interest", "ratio", "proportion", "time and work", "time and distance", "train", "boat", "mixture", "alligation", "average", "number system", "simplification", "hcf", "lcm"], i: "📈", c: "#14b8a6" },
    { keys: ["english", "grammar", "vocabulary", "synonym", "antonym", "idiom", "phrase", "comprehension", "tense", "voice", "narration", "preposition", "error spotting", "cloze", "para jumble"], i: "📖", c: "#ec4899" },
    { keys: ["hindi", "vyakaran", "sanskrit", "assamese", "bengali", "language"], i: "🔤", c: "#f97316" },
    { keys: ["agriculture", "crop", "farming", "soil science", "horticulture"], i: "🌾", c: "#84cc16" },
    { keys: ["psychology", "pedagogy", "teaching", "child development", "cdp", "education", "sociology", "philosophy", "ethics"], i: "🎓", c: "#8b5cf6" },
    { keys: ["nursing", "bams", "bhms", "ayurveda", "homeopathy", "pharmacy", "dental", "veterinary", "clinical", "surgical", "first aid"], i: "🏥", c: "#f43f5e" },

    // 8. Root Exam Categories (Checked last so specific subtopic names take priority)
    { keys: ["neet", "medical", "aiims", "paramedical", "jipmer", "ssuhs"], i: "🩺", c: "#f43f5e" },
    { keys: ["jee", "iit", "nit", "bitsat", "cee", "wbjee", "mht", "kcet", "engineering"], i: "🚀", c: "#38bdf8" },
    { keys: ["gk", "general knowledge", "static gk", "general awareness", "general studies"], i: "🌍", c: "#10b981" },
    { keys: ["upsc", "ias", "ips", "civil service", "apsc", "psc", "state pcs"], i: "🏛️", c: "#eab308" },
    { keys: ["ssc", "cgl", "chsl", "mts", "gd", "staff selection"], i: "📋", c: "#06b6d4" },
    { keys: ["banking", "ibps", "sbi", "rbi", "po", "clerk"], i: "🏦", c: "#22c55e" },
    { keys: ["railway", "rrb", "ntpc", "group d"], i: "🚂", c: "#f59e0b" },
    { keys: ["defense", "nda", "cds", "afcat", "agniveer", "army", "navy", "air force"], i: "🛡️", c: "#f97316" },
    { keys: ["law", "clat", "ailet", "judiciary", "llb"], i: "⚖️", c: "#a855f7" },
    { keys: ["gate", "net", "csir", "ugc", "iit jam", "cuet", "cat", "mba", "mat", "ctet", "tet"], i: "🎓", c: "#6366f1" }
];

// Automatically returns the best study icon for any topic/subtopic name without requiring user input
function getAutomaticIconForName(name, folderType = null) {
    let t = (name || "").replace(/^\d+\.\s*/, '').trim().toLowerCase();
    for (let rule of STUDY_ICON_RULES) {
        if (rule.keys.some(k => t.includes(k))) {
            return rule.i;
        }
    }
    if (folderType === 'pdf') return "📄";
    if (folderType === 'mcq') return "📝";
    let hash = 0;
    for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
    return FALLBACK_TOPIC_ICONS[Math.abs(hash) % FALLBACK_TOPIC_ICONS.length];
}

function getSmartIcon(text, customIcon = null) {
    let cleanText = (text || "").replace(/^\d+\.\s*/, '').trim();
    // If title has a parenthetical suffix like "NCERT Book (NEET)", prioritize the main title before '(' first
    let primaryPart = cleanText.split('(')[0].trim().toLowerCase();
    let fullLower = cleanText.toLowerCase();

    let matchedRule = null;
    for (let rule of STUDY_ICON_RULES) {
        if (rule.keys.some(k => primaryPart.includes(k))) {
            matchedRule = rule;
            break;
        }
    }
    if (!matchedRule) {
        for (let rule of STUDY_ICON_RULES) {
            if (rule.keys.some(k => fullLower.includes(k))) {
                matchedRule = rule;
                break;
            }
        }
    }

    let finalIcon = (customIcon && String(customIcon).trim() !== "")
        ? String(customIcon).trim()
        : (matchedRule ? matchedRule.i : null);
    let finalColor = matchedRule ? matchedRule.c : getPaletteColorForText(cleanText);

    if (finalIcon) {
        return makeTopicTheme(finalIcon, finalColor);
    }
    return null;
}

function getAutoTopicTheme(displayKey, customIcon = null, index = 0, usedColorsSet = null, fallbackIcon = null) {
    let baseTheme = getSmartIcon(displayKey, customIcon);
    let chosenIcon = baseTheme ? baseTheme.i : (customIcon || getAutomaticIconForName(displayKey) || fallbackIcon || FALLBACK_TOPIC_ICONS[index % FALLBACK_TOPIC_ICONS.length]);
    let chosenColor = baseTheme ? baseTheme.c : getPaletteColorForText(displayKey, index);

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
            if (d.type === "material" || d.fileUrl) {
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
        let listHtml = items.map((item, idx) => {
            let theme = getAutoTopicTheme(item.title || niceTitle, "📄", idx, usedColors, "📄");
            return `
            <div style="background:linear-gradient(135deg, ${theme.bg} 0%, #090e1a 85%); border:1.5px solid ${theme.border}; box-shadow:0 4px 15px ${theme.glow}; border-radius:12px; padding:16px 20px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="cat-icon" style="background:${theme.bg}; color:${theme.c}; border:1px solid ${theme.border};">📄</div>
                    <div>
                        <div style="font-weight:700; font-size:15px; color:#fff;">${item.title || 'Study Material'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${niceTitle}</div>
                    </div>
                </div>
                <a href="${item.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-exam" style="background:${theme.c}; color:#000; border:none; text-decoration:none; font-weight:800;">Open / Download ↗</a>
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
        if(bc) bc.innerText = currentPath.length === 0 ? "Home" : "Home / " + currentPath.join(" / "); 
        
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
            let niceTitle = topicNameRaw.replace(/^\d+\.\s*/, '');
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
                isContainer = true;
            } else if (!typeValue || typeValue === 'mcq') {
                let pdfTriggers = ["ncert", "book", "pyq", "previous", "pdf", "notes", "material", "syllabus"];
                let isPdf = pdfTriggers.some(t => topicNameLower.includes(t));
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
                    <button class="btn-exam" onclick="forceStartQuiz()" style="background:var(--primary-yellow) !important; color:black !important; width:100%; max-width:250px; font-size:16px; font-weight:bold; border:none !important; box-shadow:0 4px 15px rgba(253,184,19,0.3) !important;">Start Quiz &rarr;</button>
                </div>`;
            }
            return;
        }

        let titleRaw = currentPath.length === 0 ? "Select Exam Category" : currentPath[currentPath.length - 1];
        let title = titleRaw.replace(/^\d+\.\s*/, '');
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

        h += `<div class="card category-section"><h3 class="section-title">${title}</h3><div class="category-grid">`;
        
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
        
        let keysArr = Array.from(keys);
        const difficultyOrder = ["Easy", "Medium", "Hard", "Mixed"];
        
        keysArr.sort((a, b) => {
            let idxA = difficultyOrder.indexOf(a); let idxB = difficultyOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1; if (idxB !== -1) return 1;
            
            let matchA = a.match(/^(\d+)\./); let matchB = b.match(/^(\d+)\./);
            if (matchA && matchB) return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            return a.localeCompare(b);
        });

        let colorIdx = 0;
        let usedColors = new Set();

        for (let key of keysArr) { 
            if (currentPath.length === 0 && key === "Daily Quiz Challenge") continue; 
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
            let displayKey = (topicType && topicType.displayName) ? topicType.displayName : key.replace(/^\d+\.\s*/, '');
            let fallbackIcon = typeLabel === '📄' ? "📄" : (typeLabel === '📝' ? "📝" : null);

            let iconData = getAutoTopicTheme(displayKey, customIcon, colorIdx, usedColors, fallbackIcon);
            colorIdx++;

            h += `<button class="category-tile colored-tile" style="--topic-color:${iconData.c}; --topic-bg:${iconData.bg}; --topic-border:${iconData.border}; --topic-glow:${iconData.glow};" onclick="navigateTo('${safeKey}')">
                    <div class="cat-icon">${iconData.i}</div>
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
        document.getElementById('dynamic-content').innerHTML = `<div class="card page-transition" style="text-align:center;"><h2>⚠ Sign In Required</h2><p style="color:var(--text-muted); margin-bottom:20px;">Please sign in to view your personalized exam analytics.</p><button class="btn-exam" onclick="showAuthModal()" style="background:var(--primary-yellow); color:#000; border:none;">Sign In</button></div>`;
        return;
    }
    document.getElementById('breadcrumb-text').innerText = "Home / Profile / Track Progress";
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    let usedColors = new Set();
    
    rootKeys.forEach((k, idx) => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let iconData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "📊");
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
    
    let displayCategory = category.replace(/^\d+\.\s*/, '');
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
                    let cleanS = s.replace(/^\d+\.\s*/, '');
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
            <button class="btn-exam" onclick="showAuthModal()" style="background:var(--primary-yellow); color:#000; border:none; padding:12px 24px; font-size:14px;">Sign In with Google</button>
        </div>`;
        return;
    }
    
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let optionsHtml = '';
    let usedColors = new Set();
    
    rootKeys.forEach((k, idx) => {
        let cleanKey = k.replace(/^\d+\.\s*/, '');
        const topicType = customTopicTypes[k];
        const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
        let smartData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "🥇");

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
    let cleanCategory = category.replace(/^\d+\.\s*/, '');
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
                <button class="btn-exam" onclick="jumpToSection(['${safeCat}'])" style="background:var(--primary-yellow); color:#000; border:none; padding:12px 24px; font-size:14px;">Practice ${cleanCategory} Now 🚀</button>
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
    let clean = (name || "").replace(/^\d+\.\s*/, '').trim().toLowerCase();
    return CW_DIFFICULTY_FOLDERS.has(clean);
}

function isExcludedSubjectOrPdfFolder(fullKey, name) {
    let tObj = customTopicTypes[fullKey];
    let tVal = tObj ? (typeof tObj === 'object' ? tObj.type : tObj) : null;
    if (tVal === 'pdf') return true;

    let lower = (name || "").replace(/^\d+\.\s*/, '').trim().toLowerCase();
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
    let rootKeys = Object.keys(appData).filter(k => k !== "Daily Quiz Challenge");
    let usedColors = new Set();
    
    let html = `
    <div class="card page-transition cw-wide-card">
        <h2 class="section-title" style="margin-bottom: 12px; color:var(--primary-yellow); justify-content:center; font-size:20px;">⚙️ Custom Practice Setup</h2>
        <p style="color:var(--text-muted); margin-bottom: 28px; text-align:center; font-size:14px;">Step 1: Select your target examination category</p>
        
        <div class="cw-exam-grid">`;
        
        rootKeys.forEach((k, idx) => {
            let cleanKey = k.replace(/^\d+\.\s*/, '');
            let safeKey = k.replace(/'/g, "\\'");
            const topicType = customTopicTypes[k];
            const customIcon = topicType ? (typeof topicType === 'object' ? topicType.icon : null) : null;
            let smartData = getAutoTopicTheme(cleanKey, customIcon, idx, usedColors, "📁");

            html += `
            <button class="category-tile colored-tile" style="width:100%; --topic-color:${smartData.c}; --topic-bg:${smartData.bg}; --topic-border:${smartData.border}; --topic-glow:${smartData.glow};" onclick="cwSetPath('${safeKey}')">
                <div class="cat-icon">${smartData.i}</div>
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
    if (!ignoreManualOverride && window.customPracticeConfig && window.customPracticeConfig.exams && window.customPracticeConfig.exams[examKey] && Array.isArray(window.customPracticeConfig.exams[examKey].subjects) && window.customPracticeConfig.exams[examKey].subjects.length > 0) {
        let manualSubjects = window.customPracticeConfig.exams[examKey].subjects;
        return manualSubjects.map(s => ({
            label: (s.label || s.path.split(' > ').pop() || '').replace(/^\d+\.\s*/, ''),
            fullPath: s.path,
            chapters: Array.isArray(s.chapters)
                ? s.chapters.map(c => ({
                    label: (c.label || c.path.split(' > ').pop() || '').replace(/^\d+\.\s*/, ''),
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
                label: label.replace(/^\d+\.\s*/, ''),
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

                let cleanK = k.replace(/^\d+\.\s*/, '');
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
                let relLabel = validSegments.map(s => s.replace(/^\d+\.\s*/, '')).join(' / ');
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
    let subjectsGridHtml = cwSubjectCatalog.map((s, idx) => {
        let isChecked = cwSelectedSubjects.includes(s.fullPath);
        let iconObj = getAutoTopicTheme(s.label, null, idx, usedSubjColors, "📘");
        return `
        <label class="cw-check-card ${isChecked ? 'selected' : ''}" id="cwSubjCard_${idx}" style="--topic-color:${iconObj.c}; --topic-bg:${iconObj.bg}; --topic-border:${iconObj.border}; --topic-glow:${iconObj.glow}; border-left: 4px solid ${iconObj.c};">
            <input type="checkbox" value="${s.fullPath.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''} onchange="cwToggleSubject(this, ${idx})">
            <span>${iconObj.i} ${s.label}</span>
        </label>`;
    }).join('');

    mc.innerHTML = `
    <div class="card page-transition cw-wide-card">
        <h2 class="section-title" style="margin-bottom: 24px; color:var(--primary-yellow); justify-content:center; font-size:20px;">🎯 Customize Your ${cwPath.replace(/^\d+\.\s*/, '')} Test</h2>
        
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
            <button id="cwLaunchBtn" class="btn-exam" onclick="cwLaunch()" style="flex:2; min-width:200px; background:var(--primary-yellow); color:black; border:none; box-shadow: 0 4px 15px rgba(253,184,19,0.3); font-size:15px;">Launch Practice 🚀</button>
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
    chContainer.innerHTML = listToRender.map((ch, idx) => {
        let isChecked = cwSelectedChapters.includes(ch.fullPath);
        let chapTheme = getAutoTopicTheme(ch.label, null, idx, usedChapColors, "📘");
        return `
        <label class="cw-check-card ${isChecked ? 'selected' : ''}" id="cwChapCard_${idx}" style="--topic-color:${chapTheme.c}; --topic-bg:${chapTheme.bg}; --topic-border:${chapTheme.border}; --topic-glow:${chapTheme.glow}; border-left: 4px solid ${chapTheme.c};">
            <input type="checkbox" value="${ch.fullPath.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''} onchange="cwToggleChapter(this, ${idx})">
            <div style="overflow:hidden; text-overflow:ellipsis;">
                <div style="font-size:10px; color:${chapTheme.c}; font-weight:800; text-transform:uppercase; letter-spacing:0.4px;">${ch.subjLabel}</div>
                <div style="font-size:12.5px;">${ch.label} ${chapTheme.i}</div>
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
                    <span style="color:var(--text-muted); font-size:12px; font-weight:bold;">${(q.path || '').split(' > ').pop()}</span>
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

    let topicMatches = [];
    function scanTopics(obj, pathArr = []) {
        for (let k in obj) {
            if (k === "Daily Quiz Challenge") continue;
            let nextPath = [...pathArr, k];
            if (k.toLowerCase().includes(qLower)) {
                topicMatches.push(nextPath);
            }
            if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
                scanTopics(obj[k], nextPath);
            }
        }
    }
    scanTopics(appData);

    topicMatches.slice(0, 5).forEach(pathArr => {
        let leaf = pathArr[pathArr.length - 1].replace(/^\d+\.\s*/, '');
        let encodedPath = pathArr.map(encodeURIComponent).join('/');
        html += `<div class="search-result-item" onmousedown="window.location.hash='#/path/${encodedPath}'; closeSearch();">
            <div style="font-size:13px; color:var(--primary-yellow); font-weight:700; margin-bottom:2px;">📂 ${leaf}</div>
            <div style="font-size:11px; color:var(--text-muted);">${pathArr.join(' > ')}</div>
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
            const cleanPath = data.path.split(' > ').pop();
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
