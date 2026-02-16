// ==UserScript==
// @name         YouTube Mouse Master
// @namespace    https://github.com/navishachiku/youtube-mouse-master
// @version      0.2
// @description  High-performance YouTube player interaction script: support three-zone control, progress seek, prevent event penetration, high-frequency wheel filtering, and fix OSD timer conflicts.
// @author       navishachiku & Gemini
// @match        *://www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    /**
     * [Global Settings] SETTINGS
     * Centralized management of script behavior parameters
     */
    const SETTINGS = {
        DEBUG: false,                  // Whether to output debug messages to the console
        ZONE_TOGGLE_KEY: 'F9',         // Hotkey to toggle zone visibility

        // OSD prompt settings
        OSD_DURATION: 800,             // Time OSD prompt stays on screen (ms)
        OSD_FADE_OUT: 150,             // Duration of OSD fade-out animation (ms)
        OSD_FONT_SIZE: '28px',         // Font size of OSD prompt text (supports px, em, rem, etc.)

        // Wheel filtering settings
        // Optimization for Mac/MOS/Trackpad or software like Smooth Scroll (Mos, Logitech Options+)
        USE_WHEEL_COUNT_FIXED: true,   // Whether to enable fixed wheel count filtering
        WHEEL_DELAY: 1,                // Debounce delay time for wheel events (ms)
        WHEEL_COUNT_THRESHOLD: 14,     // Wheel count trigger threshold: how many wheel events to accumulate before performing an action
    };

    function log(...args) {
        if (SETTINGS.DEBUG) console.log('[YTM Debug]', ...args);
    }

    log('Script loaded, preparing for initialization...');

    /**
     * [Configuration] CONFIG
     * Define interaction zones and actions inside the player
     */
    const CONFIG = [
        // Default configuration, you can modify it as you like
        {
            name: "Left_Area",
            color: "rgba(255, 0, 0, 0.2)", // Red: Volume area
            size: { width: "30%", height: "100%" },
            offset: { x: "0%", y: "0%" },
            mouse_action: {
                left_click: { action: "volume_set", value: 0 },   // Left click: Volume 0
                right_click: { action: "volume_set", value: 100 }, // Right click: Volume 100
                middle_click: { action: "none" },
                wheel_up: { action: "volume_up", value: 5 },
                wheel_down: { action: "volume_down", value: 5 }
            }
        },
        {
            name: "Middle_Area",
            color: "rgba(0, 255, 0, 0.2)", // Green: Progress area
            size: { width: "40%", height: "100%" },
            offset: { x: "30%", y: "0%" },
            mouse_action: {
                left_click: { action: "toggle_play_pause" },     // Left click: Play/Pause
                right_click: { action: "none" },                  // Right click: Allow (Native menu)
                middle_click: { action: "none" },
                wheel_up: { action: "seek", value: -5 },          // Wheel up: Seek back 5s
                wheel_down: { action: "seek", value: 5 }          // Wheel down: Seek forward 5s
            }
        },
        {
            name: "Right_Area",
            color: "rgba(0, 0, 255, 0.2)", // Blue: Speed area
            size: { width: "30%", height: "100%" },
            offset: { x: "70%", y: "0%" },
            mouse_action: {
                left_click: { action: "speed_set", value: 2.0 },   // Left click: 2x
                right_click: { action: "speed_set", value: 1.0 },  // Right click: 1x
                middle_click: { action: "none" },
                wheel_up: { action: "speed_up", value: 0.25 },
                wheel_down: { action: "speed_down", value: 0.25 }
            }
        }
    ];

    // State variables
    let lastWheelTime = 0;
    let wheelCount = 0;
    let player = null;
    let osdTimer = null;      // Timer for handling fade-out
    let osdHideTimer = null;  // Timer for handling display: none
    let isZonesVisible = false; // Controls visibility of the debug zones

    // --- Helper functions ---

    const parseCoord = (val, total) => {
        if (typeof val === 'string' && val.includes('%')) {
            return parseFloat(val) / 100;
        }
        return parseFloat(val) / total;
    };

    // Format seconds to mm:ss or hh:mm:ss
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const parts = [m.toString().padStart(2, '0'), s.toString().padStart(2, '0')];
        if (h > 0) parts.unshift(h.toString());
        return parts.join(':');
    };

    const createOSD = () => {
        let el = document.getElementById('yt-mouse-master-osd');
        if (!el) {
            el = document.createElement('div');
            el.id = 'yt-mouse-master-osd';
            Object.assign(el.style, {
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: SETTINGS.OSD_FONT_SIZE,
                fontWeight: 'bold',
                zIndex: '2147483647',
                pointerEvents: 'none',
                display: 'none',
                fontFamily: 'Roboto, Arial, sans-serif',
                transition: `opacity ${SETTINGS.OSD_FADE_OUT / 1000}s ease`,
                whiteSpace: 'nowrap'
            });
            document.body.appendChild(el);
        } else {
            // If already exists but settings changed, sync font size
            el.style.fontSize = SETTINGS.OSD_FONT_SIZE;
        }
        return el;
    };

    /**
     * Show OSD message
     */
    const showOSD = (text) => {
        const el = createOSD();
        el.textContent = text;

        clearTimeout(osdTimer);
        clearTimeout(osdHideTimer);

        el.style.display = 'block';
        el.style.opacity = '1';

        // Start fade-out sequence
        osdTimer = setTimeout(() => {
            el.style.opacity = '0';
            // Start hide sequence
            osdHideTimer = setTimeout(() => {
                el.style.display = 'none';
            }, SETTINGS.OSD_FADE_OUT);
        }, SETTINGS.OSD_DURATION);
    };

    function updateZoneVisuals() {
        const existing = document.querySelectorAll('.ytm-debug-zone');
        existing.forEach(el => el.remove());

        if (!isZonesVisible || !player) return;

        // Helper: Convert action config to readable label
        const getActionLabel = (type, config) => {
            if (!config || config.action === 'none') return null;
            
            let icon = '';
            let label = '';

            // Icon Mapping
            if (type === 'left_click') icon = '🖱️L';
            else if (type === 'right_click') icon = '🖱️R';
            else if (type === 'middle_click') icon = '🖱️M';
            else if (type === 'wheel_up') icon = '🔼';
            else if (type === 'wheel_down') icon = '🔽';

            // Action Mapping
            switch (config.action) {
                case 'volume_set': 
                    label = config.value === 0 ? 'Mute' : `Vol ${config.value}%`; break;
                case 'volume_up': label = `Vol +${config.value}%`; break;
                case 'volume_down': label = `Vol -${config.value}%`; break;
                case 'seek': 
                    label = config.value > 0 ? `Forward ${config.value}s` : `Back ${Math.abs(config.value)}s`; break;
                case 'toggle_play_pause': label = 'Play/Pause'; break;
                case 'speed_set': label = `Speed ${config.value}x`; break;
                case 'speed_up': label = `Speed +${config.value}`; break;
                case 'speed_down': label = `Speed -${config.value}`; break;
                default: label = config.action;
            }

            return { icon, label };
        };

        CONFIG.forEach(zone => {
            const visual = document.createElement('div');
            visual.className = 'ytm-debug-zone';
            Object.assign(visual.style, {
                position: 'absolute',
                left: zone.offset.x,
                top: zone.offset.y,
                width: zone.size.width,
                height: zone.size.height,
                backgroundColor: zone.color || 'rgba(255, 255, 0, 0.2)',
                border: '1px dashed rgba(255,255,255,0.4)',
                boxSizing: 'border-box',
                zIndex: '2147483646',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '13px',
                fontFamily: 'Consolas, monospace, sans-serif',
                overflow: 'hidden',
                padding: '10px'
            });

            // Container for action list
            const infoBox = document.createElement('div');
            Object.assign(infoBox.style, {
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(3px)',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left',
                boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                minWidth: '140px'
            });

            // Title
            const title = document.createElement('div');
            title.textContent = zone.name;
            Object.assign(title.style, {
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                paddingBottom: '4px',
                fontSize: '14px',
                color: '#ffeb3b' // Yellow highlight title
            });
            infoBox.appendChild(title);

            // Action Items
            const actionsToDisplay = ['left_click', 'right_click', 'middle_click', 'wheel_up', 'wheel_down'];
            actionsToDisplay.forEach(key => {
                const info = getActionLabel(key, zone.mouse_action[key]);
                if (info) {
                    const row = document.createElement('div');
                    Object.assign(row.style, {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '3px',
                        fontSize: '12px'
                    });
                    
                    const iconSpan = document.createElement('span');
                    iconSpan.textContent = info.icon;
                    iconSpan.style.opacity = '0.8';
                    iconSpan.style.marginRight = '10px';

                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = info.label;
                    labelSpan.style.fontWeight = '500';

                    row.appendChild(iconSpan);
                    row.appendChild(labelSpan);
                    infoBox.appendChild(row);
                }
            });

            visual.appendChild(infoBox);
            player.appendChild(visual);
        });
    }

    function getTargetZone(e) {
        if (!player) return null;

        const target = e.target;
        const validSurface = target.closest('.html5-main-video, .ytp-player-content, .html5-video-player, .ytp-iv-video-content, .ytp-upnext, #movie_player');
        const isNativeUI = target.closest('.ytp-chrome-bottom, .ytp-settings-menu, .ytp-top-share-button, .ytp-ad-overlay-container, .ytp-playlist-menu');

        if (!validSurface || isNativeUI) return null;

        const rect = player.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        if (mouseX < 0 || mouseX > 1 || mouseY < 0 || mouseY > 1) return null;

        for (const zone of CONFIG) {
            const zX = parseCoord(zone.offset.x, 1);
            const zY = parseCoord(zone.offset.y, 1);
            const zW = parseCoord(zone.size.width, 1);
            const zH = parseCoord(zone.size.height, 1);

            if (mouseX >= zX && mouseX <= (zX + zW) && mouseY >= zY && mouseY <= (zY + zH)) {
                return zone;
            }
        }
        return null;
    }

    /**
     * Action Mapping Engine
     */
    const Actions = {
        volume_up: (val) => {
            if (typeof player.getVolume !== 'function') return;
            const next = Math.min(100, player.getVolume() + val);
            player.setVolume(next);
            showOSD(`🔊 ${next}%`);
        },
        volume_down: (val) => {
            if (typeof player.getVolume !== 'function') return;
            const next = Math.max(0, player.getVolume() - val);
            player.setVolume(next);
            showOSD(`🔉 ${next}%`);
        },
        volume_set: (val) => {
            if (typeof player.setVolume !== 'function') return;
            player.setVolume(val);
            showOSD(val === 0 ? ` Mute (0%)` : `🔊 ${val}%`);
        },
        seek: (delta) => {
            if (typeof player.getCurrentTime !== 'function' || typeof player.getDuration !== 'function') return;
            const current = player.getCurrentTime();
            const duration = player.getDuration();
            const next = Math.max(0, Math.min(duration, current + delta));
            player.seekTo(next, true);
            showOSD(`${delta > 0 ? '⏩' : '⏪'} ${formatTime(next)} / ${formatTime(duration)}`);
        },
        toggle_play_pause: () => {
            if (typeof player.getPlayerState !== 'function') return;
            const state = player.getPlayerState();
            if (state === 1) player.pauseVideo();
            else player.playVideo();
        },
        speed_up: (val) => {
            if (typeof player.getPlaybackRate !== 'function') return;
            const next = player.getPlaybackRate() + val;
            player.setPlaybackRate(next);
            showOSD(`🚀 ${next.toFixed(2)}x`);
        },
        speed_down: (val) => {
            if (typeof player.getPlaybackRate !== 'function') return;
            const next = Math.max(0.25, player.getPlaybackRate() - val);
            player.setPlaybackRate(next);
            showOSD(`🐢 ${next.toFixed(2)}x`);
        },
        speed_set: (val) => {
            if (typeof player.setPlaybackRate !== 'function') return;
            player.setPlaybackRate(val);
            showOSD(`🐾 ${val.toFixed(2)}x`);
        }
    };

    // --- Event Handlers ---

    function onWheel(e) {
        const zone = getTargetZone(e);
        if (!zone) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        if (SETTINGS.USE_WHEEL_COUNT_FIXED) {
            wheelCount++;
            if (wheelCount < SETTINGS.WHEEL_COUNT_THRESHOLD) return;
            wheelCount = 0;
        } else {
            const now = Date.now();
            if (now - lastWheelTime < SETTINGS.WHEEL_DELAY) return;
            lastWheelTime = now;
        }

        const actionKey = e.deltaY < 0 ? 'wheel_up' : 'wheel_down';
        const cfg = zone.mouse_action[actionKey];
        if (cfg && Actions[cfg.action]) {
            log(`[Action] Wheel trigger: ${cfg.action}`);
            Actions[cfg.action](cfg.value);
            if (player.showControls) player.showControls();
        }
    }

    function onMouse(e) {
        const zone = getTargetZone(e);
        if (!zone) return;

        let actionKey = "";
        if (e.button === 0) actionKey = 'left_click';
        else if (e.button === 1) actionKey = 'middle_click';
        else if (e.type === 'contextmenu') actionKey = 'right_click';

        const cfg = zone.mouse_action[actionKey];

        if (cfg && cfg.action !== "none") {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (e.type === 'mousedown' || e.type === 'contextmenu') {
                log(`[Action] Mouse trigger: ${cfg.action} (${e.type})`);
                Actions[cfg.action](cfg.value);
            }
        }
    }

    function init() {
        player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (!player) return;

        const osd = createOSD();
        if (!player.contains(osd)) player.appendChild(osd);

        updateZoneVisuals();
        log('Interaction layer bound globally, target:', player.id || player.className);
    }

    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    document.addEventListener('mousedown', onMouse, { capture: true });
    document.addEventListener('click', onMouse, { capture: true });
    document.addEventListener('dblclick', onMouse, { capture: true });
    document.addEventListener('contextmenu', onMouse, { capture: true });

    // Hotkey listener for Zone Visibility
    document.addEventListener('keydown', (e) => {
        if (e.key === SETTINGS.ZONE_TOGGLE_KEY) {
            isZonesVisible = !isZonesVisible;
            updateZoneVisuals();
            showOSD(isZonesVisible ? "🕵️ Zones Visible" : "🕵️ Zones Hidden");
        }
    });

    window.addEventListener('yt-navigate-finish', () => {
        log('SPA navigation completed, updating references...');
        init();
    });

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

    const observer = new MutationObserver(() => {
        const currentPlayer = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
        if (currentPlayer && currentPlayer !== player) {
            player = currentPlayer;
            init();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();