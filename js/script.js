//* =========================================
//  1. TEAM TAB SYSTEM (Cyber-Switch)
//  ========================================= */
function openTeam(evt, teamName) {
    // Hide all grids
    const teamGrids = document.getElementsByClassName("team-grid");
    for (let i = 0; i < teamGrids.length; i++) {
        teamGrids[i].classList.remove("active");
    }

    // Deactivate all buttons
    const tabLinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    // Activate selected grid & button
    const selectedTeam = document.getElementById(teamName);
    if (selectedTeam) {
        selectedTeam.classList.add("active");
    }
    evt.currentTarget.classList.add("active");

    // Mobile: Center the button in the scrollable tab bar
    evt.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

//* =========================================
//  2. TACTICAL HUD DATA LOADER
//  ========================================= */
async function loadData() {
    try {
        const res = await fetch('./data.json');
        if (!res.ok) throw new Error("Data file not found");
        const data = await res.json();

        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        const roles = ["top", "jgl", "mid", "bot", "sup", "coach"];

        teams.forEach(team => {
            roles.forEach(role => {
                const key = `${team}_${role}`;
                const stats = data[key];

                const nameEl = document.getElementById(`${key}_name`);
                const rankEl = document.getElementById(`${key}_rank`);
                const wlEl   = document.getElementById(`${key}_wl`);
                const iconEl = document.getElementById(`${key}_icon`);
                const lvlEl  = document.getElementById(`${key}_level`);

                if (stats) {
                    if (nameEl) nameEl.innerText = stats.name;
                    if (rankEl) rankEl.innerText = stats.rank;
                    if (wlEl)   wlEl.innerText   = `W/L: ${stats.wl}`;
                    if (lvlEl)  lvlEl.innerText  = stats.level;

                    if (iconEl) {
                        // Prevents broken icon visuals
                        iconEl.onerror = function() {
                            this.src = 'assets/profile/placeholder.png';
                            this.onerror = null; 
                        };
                        iconEl.src = stats.icon;
                        iconEl.style.display = "block";
                    }
                } else {
                    // Open Spot Logic
                    if (nameEl) nameEl.innerText = "OPEN SPOT";
                    if (rankEl) rankEl.innerText = "RECRUITING";
                    if (wlEl)   wlEl.innerHTML   = "&nbsp;";
                    if (lvlEl)  lvlEl.innerText  = "0";
                    if (iconEl) iconEl.style.display = "none";
                }
            });
        });
    } catch (e) {
        console.error("HUD Sync Error:", e);
    }
}

//* =========================================
//  3. INITIALIZER
//  ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    loadData(); // Sync Riot Data

    // Automatically show the first active team grid
    const activeBtn = document.querySelector(".tab-btn.active");
    if (activeBtn) {
        // Find team name from onclick="openTeam(event, 'TeamID')"
        const match = activeBtn.getAttribute('onclick').match(/'([^']+)'/);
        if (match && match[1]) {
            const defaultGrid = document.getElementById(match[1]);
            if (defaultGrid) defaultGrid.classList.add("active");
        }
    }
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('nav-toggle').checked = false;
    });
});

/* --- STATS COUNTER ANIMATION --- */
const statsSection = document.querySelector('.stats-section');
const statNumbers = [
    { id: 'stat-matches', endValue: 142, suffix: '' },
    { id: 'stat-wr', endValue: 68, suffix: '%' },
    { id: 'stat-players', endValue: 30, suffix: '+' },
    { id: 'stat-cups', endValue: 12, suffix: '' } // Ensure you added this ID in HTML
];

let started = false; // Ensure animation only runs once

function startCounting() {
    if (started) return; // Stop if already ran
    started = true;

    statNumbers.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (!element) return; // Skip if ID not found

        let startValue = 0;
        let duration = 2000; // 2 seconds
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Calculate current number
            element.innerText = Math.floor(progress * stat.endValue) + stat.suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        
        window.requestAnimationFrame(step);
    });
}

// Trigger animation when Stats Section is visible
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        startCounting();
    }
}, { threshold: 0.5 }); // Start when 50% of section is visible

if (statsSection) {
    observer.observe(statsSection);
}

/* --- PWA SERVICE WORKER REGISTRATION --- */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

/* =========================================
    SYSTEM LOGIC: UI INTERACTION
    ========================================= */

// 1. Mobile Scroll Lock
const navToggle = document.getElementById('nav-toggle');
const body = document.body;

if (navToggle) {
    navToggle.addEventListener('change', function() {
        if (this.checked) {
            // Menü offen -> Scrollen verbieten
            body.style.overflow = 'hidden';
        } else {
            // Menü zu -> Scrollen erlauben
            body.style.overflow = '';
        }
    });
}

// Fix: Schließt das Menü, wenn man auf einen Link klickt
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.checked = false;
        body.style.overflow = '';
    });
});

// =========================================
    // 2. LEGAL GATEKEEPER LOGIC (New Version)
    // =========================================
    const legalOverlay = document.getElementById('legal-overlay');
    const legalBtn = document.getElementById('accept-legal');
    const legalCheck = document.getElementById('legal-check');
    const storageKey = 'Zustimmung_DATENSCHUTZ_IMPRESSUM';

    // A. Beim Laden prüfen
    window.addEventListener('load', () => {
        if (!localStorage.getItem(storageKey)) {
            legalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Scroll-Sperre
        }
    });

    // B. Checkbox Logik (Button freischalten)
    if (legalCheck) {
        legalCheck.addEventListener('change', function() {
            if (this.checked) {
                legalBtn.disabled = false; // Button aktivieren
            } else {
                legalBtn.disabled = true;  // Button sperren
            }
        });
    }

    // C. Akzeptieren & Schließen
    if (legalBtn) {
        legalBtn.addEventListener('click', () => {
            localStorage.setItem(storageKey, 'true');
            legalOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Scrollen erlauben
        });
    }
