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
    if (!container) return; 

    // Sicherheitsfunktion gegen Cross-Site-Scripting (XSS)
    const escapeHTML = (str) => {
        if (!str) return "";
        return str.toString().replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
        );
    };

    try {
        const response = await fetch('/data/events.json');
        if (!response.ok) throw new Error("Netzwerkantwort war nicht ok");
        const events = await response.json();

        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="terminal-loader">
                    > NO_EVENTS_SCHEDULED...
                </div>`;
            return;
        }

        let htmlContent = '';
        let jsonLdData = [];

        events.forEach(event => {
            // Datum und Zeiten parsen
            const startObj = new Date(event.start);
            const endObj = new Date(event.end);
            
            const month = startObj.toLocaleString('de-DE', { month: 'short' }).toUpperCase();
            const day = startObj.getDate();
            const timeOptions = { hour: '2-digit', minute: '2-digit' };
            const startTime = startObj.toLocaleTimeString('de-DE', timeOptions);
            const endTime = endObj.toLocaleTimeString('de-DE', timeOptions);

            const highlightClass = event.highlight ? 'highlight-row' : '';
            const colorStyle = event.highlight ? 'style="color: var(--secondary);"' : '';
            const borderStyle = event.highlight ? 'style="border-color: var(--secondary); color: var(--secondary);"' : '';

            // 1. UI HTML Generierung
            htmlContent += `
                <div class="event-row ${highlightClass}">
                    <div class="event-meta">
                        <span class="event-type" ${colorStyle}>${escapeHTML(event.type)}</span>
                        <div class="event-date">${month} ${day}</div>
                        <div class="event-time">${startTime} - ${endTime}</div>
                    </div>
                    <div class="event-details">
                        <h4>${escapeHTML(event.name)}</h4>
                        <p>${escapeHTML(event.description)}</p>
                    </div>
                    <div class="event-action">
                        <a target="_blank" href="${escapeHTML(event.location)}" class="btn-glass" ${borderStyle} aria-label="Details zu ${escapeHTML(event.name)}">
                            <span class="btn-icon">→</span>
                        </a>
                    </div>
                </div>
            `;

            // 2. SEO Schema.org Aufbau
            const schemaType = event.type === "ORGANIZATION" ? "Event" : "SportsEvent";
            
            let eventSchema = {
                "@type": schemaType,
                "name": event.name,
                "startDate": event.start,
                "endDate": event.end,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
                "description": event.description,
                "image": event.image ? [event.image] : ["https://ultrainstinctcrew.com/assets/default-match-banner.jpg"],
                "organizer": {
                    "@type": "Organization",
                    "name": "Ultra Instinct Crew",
                    "url": "https://discord.gg/ultrainstinctcrew"
                },
                "location": {
                    "@type": "VirtualLocation",
                    "url": event.location // Exakt EINE Location, behebt den Parser-Fehler
                },
                "offers": {
                    "@type": "Offer",
                    "url": event.streamUrl ? event.streamUrl : event.location, // Twitch-Link Priorität
                    "price": "0",
                    "priceCurrency": "EUR",
                    "availability": "https://schema.org/InStock",
                    "description": "Kostenloser Online-Zugang"
                }
            };

            // 3. Teams & "Markup potentially missing" Fix (Performer)
            if (schemaType === "SportsEvent" && event.competitors && event.competitors.length >= 2) {
                const team1 = { "@type": "SportsTeam", "name": event.competitors[0] };
                const team2 = { "@type": "SportsTeam", "name": event.competitors[1] };
                
                eventSchema.competitor = [team1, team2];
                eventSchema.performer = [team1, team2]; // Behebt die Warnung für eSports Matches
            } else {
                eventSchema.performer = {
                    "@type": "Organization",
                    "name": "Ultra Instinct Crew" // Behebt die Warnung für Orga-Versammlungen
                };
            }

            jsonLdData.push(eventSchema);
        });

        // HTML in den DOM injizieren
        container.innerHTML = htmlContent;

        // JSON-LD Skript in den Head injizieren (Duplikat-Schutz)
        let oldScript = document.getElementById('seo-events-schema');
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.id = 'seo-events-schema';
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": jsonLdData
        });
        document.head.appendChild(script);

    } catch (error) {
        console.error("Fehler beim Laden der Events:", error);
        container.innerHTML = `
            <div class="terminal-loader">
                > SYNC_FAILED... RETRY LATER.
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
