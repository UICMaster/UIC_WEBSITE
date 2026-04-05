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
                        iconEl.onerror = function() {
                            this.src = 'assets/profile/placeholder.png';
                            this.onerror = null; 
                        };
                        iconEl.src = stats.icon;
                        // Nutze Klasse statt direktem Style für bessere CSS-Kontrolle
                        iconEl.classList.remove('hidden');
                    }
                } else {
                    // Open Spot Logic
                    if (nameEl) nameEl.innerText = "OPEN SPOT";
                    if (rankEl) rankEl.innerText = "RECRUITING";
                    if (wlEl)   wlEl.innerHTML   = "&nbsp;";
                    if (lvlEl)  lvlEl.innerText  = "0";
                    if (iconEl) iconEl.classList.add('hidden');
                }
            });
        });
    } catch (e) {
        console.error("HUD Sync Error:", e);
    }
}

//* =========================================
//  3. INITIALIZER & CORE EVENTS
//  ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    loadData(); // Sync Riot Data

    // Automatically show the first active team grid
    const activeBtn = document.querySelector(".tab-btn.active");
    if (activeBtn) {
        const match = activeBtn.getAttribute('onclick').match(/'([^']+)'/);
        if (match && match[1]) {
            const defaultGrid = document.getElementById(match[1]);
            if (defaultGrid) defaultGrid.classList.add("active");
        }
    }
});

//* =========================================
//  4. NAVIGATION & MOBILE MENU
//  ========================================= */
const navToggle = document.getElementById('nav-toggle');
const body = document.body;

if (navToggle) {
    navToggle.addEventListener('change', function() {
        if (this.checked) {
            body.style.overflow = 'hidden'; // Scroll-Sperre bei offenem Menü
        } else {
            body.style.overflow = '';
        }
    });
}

// Schließt das Menü bei Klick auf einen Link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navToggle) {
            navToggle.checked = false;
            body.style.overflow = '';
        }
    });
});

//* =========================================
//  5. STATS COUNTER ANIMATION (Intersection Observer)
//  ========================================= */
const statsSection = document.querySelector('.stats-section');
const statNumbers = [
    { id: 'stat-matches', endValue: 142, suffix: '' },
    { id: 'stat-wr', endValue: 68, suffix: '%' },
    { id: 'stat-players', endValue: 30, suffix: '+' },
    { id: 'stat-cups', endValue: 12, suffix: '' }
];

let started = false; 

function startCounting() {
    if (started) return; 
    started = true;

    statNumbers.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (!element) return; 

        let startValue = 0;
        let duration = 2000; 
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            element.innerText = Math.floor(progress * stat.endValue) + stat.suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        window.requestAnimationFrame(step);
    });
}

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        startCounting();
    }
}, { threshold: 0.5 });

if (statsSection) {
    observer.observe(statsSection);
}

//* =========================================
//  6. PWA SERVICE WORKER REGISTRATION
//  ========================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('UIC-PWA: Registration successful (Scope: ', registration.scope, ')');
                
                // Lauschen auf Updates vom Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('UIC-System: Neues Update verfügbar. Bitte Seite neu laden.');
                        }
                    });
                });
            })
            .catch(err => {
                console.log('UIC-PWA: Registration failed: ', err);
            });
    });
}

//* =========================================
//  7. DISCORD Events
//  ========================================= */
async function loadEvents() {
    const container = document.getElementById('dynamic-events-list');
    
    try {
        // Pfad angepasst: Sucht vom Hauptverzeichnis aus nach der Datei
        const response = await fetch('/data/events.json');
        const events = await response.json();

        // Wenn keine Termine in Discord geplant sind
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="terminal-loader" style="color: var(--text-muted); font-family: monospace; text-align: center; padding: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                    > NO_EVENTS_FOUND...
                </div>`;
            return;
        }

        let htmlContent = '';
        let jsonLdData = [];

        events.forEach(event => {
            const dateObj = new Date(event.start);
            const month = dateObj.toLocaleString('de-DE', { month: 'short' }).toUpperCase();
            const day = dateObj.getDate();
            
            // 1. Beschreibung holen und analysieren
            const rawDescription = event.description || '';
            
            // 2. Event-Typ anhand des Tags (oder des Namens als Fallback) bestimmen
            const isOrg = rawDescription.includes('[TYPE: ORGA]') || event.name.toLowerCase().includes('versammlung');
            const typeLabel = isOrg ? 'ORGANIZATION' : 'TOURNAMENT';
            const highlightClass = isOrg ? 'highlight-row' : '';
            
            // 3. Tags aus der Beschreibung entfernen, damit das UI sauber bleibt
            let cleanDescription = rawDescription
                .replace('[TYPE: ORGA]', '')
                .replace('[TYPE: MATCH]', '')
                .trim();
                
            // Fallback, falls nach dem Löschen der Tags kein Text mehr übrig ist
            if (!cleanDescription) {
                cleanDescription = 'Keine Beschreibung verfügbar.';
            }

            const actionLink = event.location || 'https://discord.gg/ultrainstinctcrew';

            // HTML für die Anzeige bauen
            htmlContent += `
                <div class="event-row ${highlightClass}">
                    <div class="event-meta">
                        <span class="event-type" ${isOrg ? 'style="color: var(--secondary);"' : ''}>${typeLabel}</span>
                        <div class="event-date">${month} ${day}</div>
                    </div>
                    <div class="event-details">
                        <h4>${event.name}</h4>
                        <p>${cleanDescription}</p>
                    </div>
                    <div class="event-action">
                        <a target="_blank" href="${actionLink}" class="btn-glass" ${isOrg ? 'style="border-color: var(--secondary); color: var(--secondary);"' : ''}>
                            <span class="btn-icon">→</span>
                        </a>
                    </div>
                </div>
            `;

            // JSON-LD Datenpunkt für dieses Event hinzufügen (mit sauberer Beschreibung!)
            jsonLdData.push({
                "@type": "SportsEvent",
                "name": event.name,
                "startDate": event.start,
                "description": cleanDescription,
                "location": {
                    "@type": "VirtualLocation",
                    "url": actionLink
                }
            });
        });

        // UI aktualisieren (Terminal-Loader wird überschrieben)
        container.innerHTML = htmlContent;

        // JSON-LD (SEO) für Google in den <head> einfügen
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": jsonLdData
        });
        document.head.appendChild(script);

    } catch (error) {
        console.error("Fehler beim Laden der Events:", error);
        // Fehlerfall im Terminal-Style
        container.innerHTML = `
            <div class="terminal-loader" style="color: var(--text-muted); font-family: monospace; text-align: center; padding: 20px; border: 1px dashed rgba(255,255,255,0.1);">
                > SYNC_FAILED...
            </div>`;
    }
}

// Script starten, sobald die Seite geladen ist
document.addEventListener('DOMContentLoaded', loadEvents);