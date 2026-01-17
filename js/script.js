/**
 * 1. TEAM TAB SYSTEM (Cyber-Switch)
 * Handles tab switching and smooth scrolling for mobile.
 */
function openTeam(evt, teamName) {
    // 1. Reset all grids and buttons using modern selectors
    document.querySelectorAll(".team-grid").forEach(grid => grid.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    // 2. Activate target elements
    const selectedTeam = document.getElementById(teamName);
    if (selectedTeam) {
        selectedTeam.classList.add("active");
    }
    
    // Add active class to clicked button
    evt.currentTarget.classList.add("active");

    // 3. Mobile UX: Center the button in the scrollable tab bar
    evt.currentTarget.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
    });
}

/**
 * 2. TACTICAL HUD DATA LOADER
 * Fetches JSON data and injects it into the DOM based on player IDs.
 */
async function loadData() {
    const DATA_PATH = './data.json';
    const PLACEHOLDER = 'assets/profile/placeholder.png';

    try {
        const res = await fetch(DATA_PATH);
        if (!res.ok) throw new Error("Tactical Data file not found");
        
        const data = await res.json();
        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        const roles = ["top", "jgl", "mid", "bot", "sup", "coach"];

        teams.forEach(team => {
            roles.forEach(role => {
                const key = `${team}_${role}`;
                const stats = data[key];

                // Target Elements
                const elements = {
                    name:  document.getElementById(`${key}_name`),
                    rank:  document.getElementById(`${key}_rank`),
                    wl:    document.getElementById(`${key}_wl`),
                    icon:  document.getElementById(`${key}_icon`),
                    level: document.getElementById(`${key}_level`)
                };

                if (stats) {
                    // Inject Active Player Data
                    if (elements.name)  elements.name.textContent = stats.name;
                    if (elements.rank)  elements.rank.textContent = stats.rank;
                    if (elements.wl)    elements.wl.textContent   = `W/L: ${stats.wl}`;
                    if (elements.level) elements.level.textContent  = stats.level;

                    if (elements.icon) {
                        elements.icon.src = stats.icon;
                        elements.icon.style.display = "block";
                        // Error handling for missing local assets
                        elements.icon.onerror = () => {
                            elements.icon.src = PLACEHOLDER;
                            elements.icon.onerror = null;
                        };
                    }
                } else {
                    // Inject Recruitment / Open Spot Logic
                    if (elements.name)  elements.name.textContent = "OPEN SPOT";
                    if (elements.rank)  elements.rank.textContent = "RECRUITING";
                    if (elements.wl)    elements.wl.innerHTML   = "&nbsp;";
                    if (elements.level) elements.level.textContent  = "0";
                    if (elements.icon)  elements.icon.style.display = "none";
                }
            });
        });
        console.log("HUD Data Sync: Complete");
    } catch (error) {
        console.error("Critical HUD Sync Error:", error);
    }
}

/**
 * 3. STATS COUNTER ANIMATION
 * Visual number ticking when section enters the viewport.
 */
function initStatsObserver() {
    const statsSection = document.querySelector('.section-pad'); // Or specific container
    const statConfig = [
        { id: 'stat-matches', endValue: 142, suffix: '' },
        { id: 'stat-wr', endValue: 68, suffix: '%' },
        { id: 'stat-players', endValue: 30, suffix: '+' },
        { id: 'stat-cups', endValue: 12, suffix: '' }
    ];

    const startCounting = () => {
        statConfig.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (!el) return;

            let startTime = null;
            const duration = 2000;

            const animate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                // Ease out quadratic effect for smoother feel
                const easeOut = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.floor(easeOut * stat.endValue) + stat.suffix;

                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            startCounting();
            observer.disconnect(); // Run only once to save resources
        }
    }, { threshold: 0.3 });

    if (statsSection) observer.observe(statsSection);
}

/**
 * 4. SYSTEM INITIALIZER
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Sync Roster Data
    loadData();

    // 2. Init Stats Animation
    initStatsObserver();

    // 3. Handle PWA / Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .catch(err => console.warn('PWA Sync Offline:', err));
    }
});