/* =========================================
   UI CONTROLLER: Prime League Telemetry
   ========================================= */

// Helper: XSS Prevention
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        // Fetch JSON with timestamp to prevent caching
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("JSON not found");
        
        const data = await response.json();
        
        // Define exact display order
        const teamsOrder = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        
        let html = '';

        teamsOrder.forEach(key => {
            const t = data[key];
            if (!t) return;

            // 1. Form Dots (W=Green, D=Yellow, L=Red)
            const formHTML = t.stats.form.map(r => {
                let className = 'pending';
                if(r === 'W') className = 'win';
                if(r === 'L') className = 'loss';
                if(r === 'D') className = 'draw';
                return `<div class="form-dot ${className}"></div>`;
            }).join('');

            // 2. Next Match Card
            let nextMatchHTML = `<div class="next-match-card" style="opacity:0.5; cursor:default;"><span class="nm-label">NO PENDING MATCHES</span></div>`;
            
            if (t.next_match) {
                const d = new Date(t.next_match.date);
                const dateStr = d.toLocaleDateString('de-DE', { weekday: 'short', hour:'2-digit', minute:'2-digit' });
                nextMatchHTML = `
                    <a href="${t.next_match.link}" target="_blank" class="next-match-card link-hover" style="text-decoration:none;">
                        <div>
                            <span style="display:block; font-size:0.55rem; color:#888;">NEXT OPERATION</span>
                            <span style="color:#fff; font-weight:700;">VS ${escapeHTML(t.next_match.tag)}</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:var(--primary); font-family:monospace; font-size:0.8rem;">${dateStr}</span>
                        </div>
                    </a>
                `;
            }

            // 3. Roster Chips
            const rosterHTML = t.roster.length > 0 ? t.roster.map(p => 
                `<div class="mini-chip ${p.is_captain ? 'captain' : ''}">${escapeHTML(p.summoner)}</div>`
            ).join('') : '<span style="color:#555; font-size:0.7rem;">ROSTER CLASSIFIED</span>';

            // 4. Assemble Unit HTML
            html += `
            <div class="telemetry-unit" id="unit-${key}">
                
                <div class="telemetry-header" onclick="toggleTelemetry('${key}')">
                    <div class="tm-identity">
                        <img src="${t.logo || 'assets/img/default_logo.png'}" class="tm-logo" alt="">
                        <div class="tm-info">
                            <h4>UIC ${escapeHTML(key.toUpperCase())}</h4>
                            <span class="tm-division">${escapeHTML(t.meta.div)}</span>
                        </div>
                    </div>

                    <div class="tm-form" title="Recent Form">
                        ${formHTML}
                    </div>

                    <div class="tm-stat">
                        <span class="label">RECORD</span>
                        <span class="value">${t.stats.wins} - ${t.stats.losses}</span>
                    </div>

                    <div class="tm-stat mobile-hidden">
                        <span class="label">POINTS</span>
                        <span class="value highlight">${t.stats.points}</span>
                    </div>

                    <div class="tm-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>

                <div class="telemetry-body">
                    <div class="tb-content">
                        
                        <div class="tb-col">
                            <h5 class="tb-title">OPERATIONAL STATUS</h5>
                            ${nextMatchHTML}
                            <div style="display:flex; gap:20px; margin-top:15px;">
                                <div>
                                    <span class="label" style="color:#888; font-size:0.6rem;">TOTAL MAPS</span>
                                    <div style="font-size:1.2rem; font-weight:bold;">${t.stats.games}</div>
                                </div>
                                <div>
                                    <span class="label" style="color:#888; font-size:0.6rem;">WIN RATE</span>
                                    <div style="font-size:1.2rem; font-weight:bold; color:var(--primary);">${t.stats.win_rate}%</div>
                                </div>
                            </div>
                        </div>

                        <div class="tb-col">
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:15px;">
                                <h5 class="tb-title" style="border:none; margin:0; padding:0;">ACTIVE UNITS</h5>
                                <a href="${t.team_link}" target="_blank" style="font-size:0.6rem; color:var(--primary); text-decoration:none;">PRIME LEAGUE ↗</a>
                            </div>
                            <div class="roster-strip">
                                ${rosterHTML}
                            </div>
                        </div>

                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;

    } catch (e) { 
        console.error("Telemetry System Failure:", e);
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; border:1px solid rgba(255,0,0,0.2);">
                <span style="color:var(--text-muted);">DATA LINK OFFLINE</span>
            </div>`;
    }
}

// Global Toggle Function
window.toggleTelemetry = function(key) {
    const unit = document.getElementById(`unit-${key}`);
    
    // Auto-close others (Accordion Effect)
    document.querySelectorAll('.telemetry-unit.active').forEach(el => {
        if(el !== unit) el.classList.remove('active');
    });

    if(unit) unit.classList.toggle('active');
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', loadPrimeStats);