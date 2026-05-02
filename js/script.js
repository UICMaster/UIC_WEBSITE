//* =========================================
//  1. TACTICAL HUD DATA LOADER (Dynamic)
//  ========================================= */
async function loadDynamicHUD() {
    try {
        const res = await fetch('./data.json');
        if (!res.ok) throw new Error("Data file not found");
        const data = await res.json(); 

        const tabsContainer = document.getElementById('dynamic-tabs');
        const gridsContainer = document.getElementById('dynamic-grids-container');
        
        if (!tabsContainer || !gridsContainer) return; // Prevent errors on other pages

        let isFirstTeam = true;

        for (const [teamName, players] of Object.entries(data)) {
            // --- 1. Generate Tab Button ---
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${isFirstTeam ? 'active' : ''}`;
            tabBtn.innerText = `UIC ${teamName.toUpperCase()}`;
            tabBtn.onclick = (e) => openTeam(e, teamName);
            tabsContainer.appendChild(tabBtn);

            // --- 2. Generate Team Grid ---
            const gridDiv = document.createElement('div');
            gridDiv.id = teamName;
            gridDiv.className = `grid-auto team-grid ${isFirstTeam ? 'active' : ''}`;

            // --- 3. Generate Player Cards ---
            players.forEach(player => {
                // Formatting Win Rate Color
                let wrColor = "inherit";
                if (player.winRate >= 50) wrColor = "#00ff88"; // Success green from your CSS
                if (player.winRate < 50 && player.wins > 0) wrColor = "#ff0055"; // Error red from your CSS

                const iconSrc = player.icon || 'assets/profile/placeholder.png';
                
                // Format Rank and Exact LP
                const rankDisplay = player.tier === "UNRANKED" || player.tier === "RECRUITING" 
                    ? player.tier 
                    : `${player.tier} <span style="font-size: 0.8em; color: var(--text-muted);">(${player.lp} LP)</span>`;
                
                // Format Win/Loss
                const statsDisplay = player.wins > 0 
                    ? `W/L: ${player.wins}/${player.losses} <span style="color:${wrColor}; font-weight:700;">(${player.winRate}%)</span>` 
                    : '&nbsp;';

                // We normalize the role for the image path (e.g., "HEAD COACH" -> "head_coach")
                const safeRoleForImage = player.role.toLowerCase().replace(' ', '_');

                gridDiv.innerHTML += `
                    <div class="card card--interactive card--profile">
                        <div class="role-badge">${player.role}</div>
                        <img src="assets/profile/${teamName}/${teamName}_${safeRoleForImage}.png" 
                             alt="${player.role}" 
                             class="card-img" 
                             onerror="this.src='assets/profile/profile_placeholder.png'">
                        
                        <div class="card-body">
                            <div class="player-identity">
                                <img src="${iconSrc}" class="mini-riot-icon" onerror="this.src='assets/profile/placeholder.png'">
                                <div class="name-box">
                                    <h3 class="card-title">${player.name}</h3>
                                    <span class="player-level">LVL <span>${player.level}</span></span>
                                </div>
                            </div>
                            <div class="player-status">
                                <div class="card-meta">${rankDisplay}</div>
                                <div class="card-stats">${statsDisplay}</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            gridsContainer.appendChild(gridDiv);
            isFirstTeam = false;
        }
        
    } catch (e) {
        console.error("HUD Sync Error:", e);
    }
}

//* =========================================
//  2. TEAM TAB SYSTEM (Cyber-Switch)
//  ========================================= */
function openTeam(evt, teamName) {
    const teamGrids = document.getElementsByClassName("team-grid");
    for (let i = 0; i < teamGrids.length; i++) teamGrids[i].classList.remove("active");

    const tabLinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabLinks.length; i++) tabLinks[i].classList.remove("active");

    const selectedTeam = document.getElementById(teamName);
    if (selectedTeam) selectedTeam.classList.add("active");
    
    evt.currentTarget.classList.add("active");
    evt.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// Initialize HUD on Page Load
document.addEventListener('DOMContentLoaded', loadDynamicHUD);

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
