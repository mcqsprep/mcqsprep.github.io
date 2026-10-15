// ==========================================
// 1. SYSTEM INITIALIZATION, 3D PWA SPLASH & CONFIGURATION
// ==========================================

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const btn1 = document.getElementById('installAppBtn');
    const btn2 = document.getElementById('installAppBtnMobile');
    
    if (!window.matchMedia('(display-mode: standalone)').matches && window.navigator.standalone !== true) {
        if (btn1) btn1.style.display = 'inline-flex';
        if (btn2) btn2.style.display = 'inline-flex';
    }
});

function installPWA() {
    if (!deferredPrompt) {
        showNotification("📲 To install: Tap your browser menu (⋮ or Share) and select 'Install App' or 'Add to Home Screen'.");
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

// ==========================================
// PREMIUM 3D OPENING ANIMATION (INSTALLED MOBILE APP ONLY)
// ==========================================
function isInstalledMobileApp() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
}

function launch3DInstalledAppSplash() {
    // Only run inside the installed mobile app (and once per app launch session)
    if (!isInstalledMobileApp()) return;
    if (sessionStorage.getItem('mcqs_3d_splash_played')) return;
    sessionStorage.setItem('mcqs_3d_splash_played', 'true');

    const mountSplash = () => {
        if (document.getElementById('pwa-3d-splash-screen')) return;

        const splash = document.createElement('div');
        splash.id = 'pwa-3d-splash-screen';
        splash.innerHTML = `
            <div class="splash-ambient-glow"></div>
            <div class="splash-3d-stage">
                <div class="splash-3d-assembly">
                    <div class="splash-gyro-ring ring-gold"></div>
                    <div class="splash-gyro-ring ring-cyan"></div>
                    <div class="splash-gyro-ring ring-rose"></div>
                    <div class="splash-3d-core-card">
                        <div class="splash-core-sheen"></div>
                        <img src="/icon-192.png" alt="MCQsPrep" class="splash-3d-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="splash-3d-fallback-icon" style="display:none;">🩺</div>
                    </div>
                </div>

                <div class="splash-brand-block">
                    <h1 class="splash-brand-title">MCQs<span>Prep</span><b class="splash-dot">.</b></h1>
                    <div class="splash-brand-subtitle">SMART COMPETITIVE EXAM ENGINE</div>
                    <div class="splash-loader-track">
                        <div class="splash-loader-fill"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(splash);

        // Trigger smooth 3D camera zoom-out exit after animation completes
        setTimeout(() => {
            splash.classList.add('splash-exit-3d');
            setTimeout(() => {
                if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
            }, 650);
        }, 2350);
    };

    if (document.body) {
        mountSplash();
    } else {
        window.addEventListener('DOMContentLoaded', mountSplash);
    }
}
launch3DInstalledAppSplash();

// Upper Back Button Visibility & Smart Action Logic + Clean Install Button Upgrade
function handlePCBackButton() {
    const backBtn = document.querySelector('.pc-back-btn');
    if (backBtn) {
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

    const mobInstall = document.getElementById('installAppBtnMobile');
    if (mobInstall && !mobInstall.dataset.upgraded) {
        mobInstall.dataset.upgraded = 'true';
        mobInstall.innerHTML = `<span style="font-size:13px;">⬇</span> <span>Install App</span>`;
    }
    const pcInstall = document.getElementById('installAppBtn');
    if (pcInstall && !pcInstall.dataset.upgraded) {
        pcInstall.dataset.upgraded = 'true';
        pcInstall.innerHTML = `<span style="font-size:13px;">⬇</span> <span>Install App</span>`;
    }
}
window.addEventListener('hashchange', handlePCBackButton);
window.addEventListener('DOMContentLoaded', handlePCBackButton);

const styleSheet = document.createElement('style');
styleSheet.innerHTML = `
    @keyframes fadeSlideUp { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    .page-transition { animation: fadeSlideUp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

    /* =====================================================
       🌌 PREMIUM 3D INSTALLED APP SPLASH SCREEN ANIMATION
       ===================================================== */
    #pwa-3d-splash-screen {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle at 50% 42%, #0e1933 0%, #050811 72%, #020307 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        perspective: 1200px;
        -webkit-user-select: none;
        user-select: none;
        transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #pwa-3d-splash-screen.splash-exit-3d {
        opacity: 0;
        transform: scale(1.18) translateZ(120px);
        pointer-events: none;
    }
    .splash-ambient-glow {
        position: absolute;
        width: 340px;
        height: 340px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(253, 184, 19, 0.22) 0%, rgba(56, 189, 248, 0.14) 45%, transparent 72%);
        filter: blur(28px);
        animation: splashAmbientPulse 2.4s ease-in-out infinite alternate;
    }
    .splash-3d-stage {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transform-style: preserve-3d;
        animation: splashStageEntrance 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .splash-3d-assembly {
        position: relative;
        width: 210px;
        height: 210px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform-style: preserve-3d;
        margin-bottom: 34px;
    }
    /* 3D Gyroscopic Orbital Rings */
    .splash-gyro-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        transform-style: preserve-3d;
        pointer-events: none;
    }
    .splash-gyro-ring.ring-gold {
        border: 2px solid transparent;
        border-top-color: #fdb813;
        border-bottom-color: rgba(253, 184, 19, 0.55);
        box-shadow: 0 0 22px rgba(253, 184, 19, 0.35), inset 0 0 15px rgba(253, 184, 19, 0.2);
        animation: gyroSpinGold 2.6s linear infinite;
    }
    .splash-gyro-ring.ring-cyan {
        inset: 14px;
        border: 2px solid transparent;
        border-left-color: #38bdf8;
        border-right-color: rgba(56, 189, 248, 0.55);
        box-shadow: 0 0 22px rgba(56, 189, 248, 0.35), inset 0 0 15px rgba(56, 189, 248, 0.2);
        animation: gyroSpinCyan 2.2s linear infinite;
    }
    .splash-gyro-ring.ring-rose {
        inset: 28px;
        border: 1.5px dashed rgba(244, 63, 94, 0.65);
        box-shadow: 0 0 16px rgba(244, 63, 94, 0.25);
        animation: gyroSpinRose 3.2s linear infinite;
    }
    /* Central 3D Floating Glass Medallion */
    .splash-3d-core-card {
        position: relative;
        width: 112px;
        height: 112px;
        border-radius: 28px;
        background: linear-gradient(145deg, rgba(28, 39, 68, 0.92) 0%, rgba(9, 14, 28, 0.98) 100%);
        border: 1.5px solid rgba(253, 184, 19, 0.75);
        box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.85),
            0 0 30px rgba(253, 184, 19, 0.35),
            inset 0 2px 12px rgba(255, 255, 255, 0.22);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transform: translateZ(45px);
        animation: splashCoreFloat3D 2.4s ease-in-out infinite;
    }
    .splash-core-sheen {
        position: absolute;
        top: -60%;
        left: -120%;
        width: 80%;
        height: 220%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
        transform: rotate(30deg);
        animation: splashLightSweep 1.8s ease-in-out infinite;
    }
    .splash-3d-logo {
        width: 84px;
        height: 84px;
        border-radius: 20px;
        object-fit: cover;
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7));
    }
    .splash-3d-fallback-icon {
        font-size: 52px;
        filter: drop-shadow(0 0 14px rgba(253, 184, 19, 0.6));
    }
    .splash-brand-block {
        text-align: center;
        transform: translateZ(30px);
    }
    .splash-brand-title {
        margin: 0;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 1px;
        color: #ffffff;
        text-shadow: 0 8px 25px rgba(0, 0, 0, 0.8), 0 0 18px rgba(255, 255, 255, 0.15);
        animation: splashTitleReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .splash-brand-title span {
        color: #fdb813;
        text-shadow: 0 0 20px rgba(253, 184, 19, 0.55);
    }
    .splash-brand-title .splash-dot {
        color: #38bdf8;
    }
    .splash-brand-subtitle {
        margin-top: 8px;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 3.2px;
        color: #94a3b8;
        text-transform: uppercase;
        opacity: 0;
        animation: splashSubReveal 0.7s ease 0.25s forwards;
    }
    .splash-loader-track {
        width: 190px;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        margin: 22px auto 0 auto;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .splash-loader-fill {
        height: 100%;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #fdb813 0%, #38bdf8 55%, #10b981 100%);
        box-shadow: 0 0 14px rgba(253, 184, 19, 0.8);
        animation: splashProgressFill 2.15s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    @keyframes splashStageEntrance {
        0% { opacity: 0; transform: scale(0.72) rotateX(22deg) translateY(25px); }
        100% { opacity: 1; transform: scale(1) rotateX(0deg) translateY(0px); }
    }
    @keyframes gyroSpinGold {
        0% { transform: rotateX(64deg) rotateY(18deg) rotateZ(0deg); }
        100% { transform: rotateX(64deg) rotateY(18deg) rotateZ(360deg); }
    }
    @keyframes gyroSpinCyan {
        0% { transform: rotateX(22deg) rotateY(66deg) rotateZ(360deg); }
        100% { transform: rotateX(22deg) rotateY(66deg) rotateZ(0deg); }
    }
    @keyframes gyroSpinRose {
        0% { transform: rotateX(-52deg) rotateY(-35deg) rotateZ(0deg); }
        100% { transform: rotateX(-52deg) rotateY(-35deg) rotateZ(360deg); }
    }
    @keyframes splashCoreFloat3D {
        0%, 100% { transform: translateZ(45px) rotateY(-10deg) rotateX(8deg) translateY(0px); }
        50% { transform: translateZ(65px) rotateY(12deg) rotateX(-8deg) translateY(-6px); }
    }
    @keyframes splashLightSweep {
        0% { left: -120%; }
        55%, 100% { left: 160%; }
    }
    @keyframes splashAmbientPulse {
        0% { transform: scale(0.9); opacity: 0.65; }
        100% { transform: scale(1.15); opacity: 1; }
    }
    @keyframes splashTitleReveal {
        0% { opacity: 0; transform: translateY(14px) scale(0.92); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes splashSubReveal {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes splashProgressFill {
        0% { width: 0%; }
        35% { width: 45%; }
        75% { width: 84%; }
        100% { width: 100%; }
    }
    
    /* Permanently hide duplicate bottom back button container */
    #dynamic-back-container { display: none !important; }

    /* Hide Ask AI Floating Button on Custom Practice & Active Quiz screens */
    body.hide-ai-btn #ai-floating-btn { display: none !important; }

    /* Keep upper back button accessible on both desktop and mobile when inside pages */
    .pc-back-btn.hide-on-mobile { display: flex; }

    /* 🔆 FIX DARK BUTTONS EVERYWHERE (Authenticate, + Create Folder, Submit, Upload, Modals) */
    #loginBtn,
    #submitFeedbackBtn,
    .btn-yellow-glow,
    .btn-exam[style*="background-color: var(--primary-yellow)"],
    .btn-exam[style*="background-color:var(--primary-yellow)"],
    .btn-exam[style*="background: var(--primary-yellow)"],
    .btn-exam[style*="background:var(--primary-yellow)"] {
        background: linear-gradient(135deg, #fdb813 0%, #f59e0b 100%) !important;
        color: #050811 !important;
        font-weight: 800 !important;
        border: 1px solid rgba(253, 184, 19, 0.85) !important;
        box-shadow: 0 4px 18px rgba(253, 184, 19, 0.38) !important;
        opacity: 1 !important;
    }
    #loginBtn:hover,
    #submitFeedbackBtn:hover,
    .btn-yellow-glow:hover,
    .btn-exam[style*="background-color: var(--primary-yellow)"]:hover,
    .btn-exam[style*="background-color:var(--primary-yellow)"]:hover,
    .btn-exam[style*="background: var(--primary-yellow)"]:hover,
    .btn-exam[style*="background:var(--primary-yellow)"]:hover {
        background: linear-gradient(135deg, #ffc738 0%, #fdb813 100%) !important;
        box-shadow: 0 6px 24px rgba(253, 184, 19, 0.58) !important;
        transform: translateY(-1px) !important;
    }

    #uploadBtn,
    .btn-green-glow,
    .btn-exam[style*="background-color: var(--correct-green)"],
    .btn-exam[style*="background-color:var(--correct-green)"],
    .btn-exam[style*="background: var(--correct-green)"],
    .btn-exam[style*="background:var(--correct-green)"] {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        border: 1px solid rgba(16, 185, 129, 0.8) !important;
        box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35) !important;
        opacity: 1 !important;
    }

    /* 🟢 CLEAN, COLORED & GLOWING INSTALL BUTTON (Mobile Web & PC) */
    @keyframes installPulseGlow {
        0% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.45), 0 0 20px rgba(6, 182, 212, 0.25); }
        50% { box-shadow: 0 0 18px rgba(16, 185, 129, 0.85), 0 0 30px rgba(6, 182, 212, 0.5); }
        100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.45), 0 0 20px rgba(6, 182, 212, 0.25); }
    }
    .install-btn, #installAppBtn, #installAppBtnMobile {
        background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%) !important;
        color: #04131a !important;
        border: 1px solid rgba(167, 243, 208, 0.75) !important;
        border-radius: 999px !important;
        padding: 6px 15px !important;
        font-size: 11.5px !important;
        font-weight: 800 !important;
        letter-spacing: 0.4px !important;
        text-transform: uppercase !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        cursor: pointer !important;
        animation: installPulseGlow 2.4s infinite ease-in-out !important;
        transition: transform 0.2s ease !important;
        white-space: nowrap !important;
    }
    .install-btn:hover, #installAppBtn:hover, #installAppBtnMobile:hover {
        transform: translateY(-1px) scale(1.03) !important;
    }
    .install-btn:active, #installAppBtn:active, #installAppBtnMobile:active {
        transform: scale(0.96) !important;
    }

    /* 🟡 GLOWING CUSTOM PRACTICE HERO CARD */
    .card.setup-hero-card {
        border: 1.5px solid rgba(253, 184, 19, 0.7) !important;
        border-left: 5px solid #fdb813 !important;
        background: linear-gradient(145deg, rgba(253, 184, 19, 0.16) 0%, rgba(13, 21, 39, 0.96) 75%) !important;
        box-shadow: 0 0 24px rgba(253, 184, 19, 0.24), inset 0 0 24px rgba(253, 184, 19, 0.07) !important;
    }

    /* 🌈 AUTOMATIC COLORED & GLOWING TOPIC BOXES FOR ALL CURRENT & FUTURE TOPICS */
    .category-tile,
    .category-tile.colored-tile {
        background: linear-gradient(155deg, var(--topic-bg, rgba(253,184,19,0.15)) 0%, rgba(12, 19, 34, 0.95) 82%) !important;
        border: 1.5px solid var(--topic-border, rgba(253,184,19,0.65)) !important;
        box-shadow: 0 4px 20px var(--topic-glow, rgba(253,184,19,0.25)), inset 0 0 16px var(--topic-bg, rgba(253,184,19,0.1)) !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
        position: relative;
        overflow: hidden;
    }
    .category-tile:hover,
    .category-tile:active,
    .category-tile.colored-tile:hover,
    .category-tile.colored-tile:active {
        border-color: var(--topic-color, #fdb813) !important;
        box-shadow: 0 6px 28px var(--topic-glow, rgba(253,184,19,0.45)), 0 0 12px var(--topic-border, rgba(253,184,19,0.6)), inset 0 0 22px var(--topic-bg, rgba(253,184,19,0.16)) !important;
        transform: translateY(-2px) !important;
    }
    .category-tile .cat-icon,
    .category-tile.colored-tile .cat-icon {
        background: var(--topic-bg, rgba(253,184,19,0.2)) !important;
        color: var(--topic-color, #fdb813) !important;
        border: 1px solid var(--topic-border, rgba(253,184,19,0.5)) !important;
        box-shadow: 0 0 14px var(--topic-glow, rgba(253,184,19,0.32)) !important;
    }
    .category-tile .cat-text,
    .category-tile.colored-tile .cat-text {
        color: #ffffff !important;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65) !important;
    }

    /* 🌟 COLORED & GLOWING QUICK LINKS / ESSENTIAL PRACTICE CARDS */
    .action-link,
    .action-link.colored-link {
        background: linear-gradient(135deg, var(--topic-bg, rgba(168,85,247,0.16)) 0%, rgba(12, 19, 34, 0.96) 85%) !important;
        border: 1.5px solid var(--topic-border, rgba(168,85,247,0.6)) !important;
        border-left: 4px solid var(--topic-color, #a855f7) !important;
        border-radius: 14px !important;
        margin-bottom: 12px !important;
        box-shadow: 0 4px 16px var(--topic-glow, rgba(168,85,247,0.24)), inset 0 0 12px var(--topic-bg, rgba(168,85,247,0.08)) !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
    }
    .action-link:hover,
    .action-link:active,
    .action-link.colored-link:hover,
    .action-link.colored-link:active {
        border-color: var(--topic-color, #a855f7) !important;
        box-shadow: 0 6px 24px var(--topic-glow, rgba(168,85,247,0.42)), 0 0 10px var(--topic-border, rgba(168,85,247,0.5)) !important;
        transform: translateX(3px) !important;
    }
    
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
    .cw-check-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: linear-gradient(145deg, var(--topic-bg, rgba(255,255,255,0.03)) 0%, #0d1527 85%); border: 1px solid var(--topic-border, var(--border-color)); box-shadow: 0 2px 10px var(--topic-glow, transparent); border-radius: 10px; cursor: pointer; font-size: 13.5px; font-weight: 600; color: #d1d5db; transition: 0.2s; user-select: none; box-sizing: border-box; }
    .cw-check-card:hover { border-color: var(--topic-color, rgba(253, 184, 19, 0.6)); color: #fff; background: #111d35; }
    .cw-check-card.selected { background: linear-gradient(145deg, var(--topic-bg, rgba(253,184,19,0.18)) 0%, rgba(17, 29, 53, 0.95) 85%); border-color: var(--topic-color, var(--primary-yellow)); color: #fff; box-shadow: 0 0 14px var(--topic-glow, rgba(253, 184, 19, 0.25)); }
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
        .cw-exam-grid { grid-template-columns: 1fr; gap: 12px; }
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
    "General Knowledge": {} 
};

let appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
let customTopicTypes = {};
let topicOverrides = { deletedPaths: [], editedPaths: {} };

window.sidebarConfig = {
    quickLinks: [],
    essentialPractice: []
};

window.customPracticeConfig = {
    exams: {}
};

let currentUser = null; 
window.currentUser = null;
let currentPath = []; 
let dataLoaded = false; 
let userBookmarks = [];
window.activeHubSection = null;

let notifTimer = null;
function showNotification(message) { 
    const notif = document.getElementById('notification'); 
    if (!notif) return;
    notif.innerText = message; 
    notif.style.display = 'block'; 
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = setTimeout(() => { notif.style.display = 'none'; }, 4000); 
}
