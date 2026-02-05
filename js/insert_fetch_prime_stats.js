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
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("JSON missing");
        const data = await response.json();
        
        const teamsOrder = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        
        let html = '';

        teamsOrder.forEach(key => {
            const t = data[key];
            if (!t) return;

            // 1. Form Dots
            const formHTML = t.stats.form.map(r => {
                let c = r === 'W' ? 'win' : (r === 'D' ? 'draw' : 'loss');
                return `<div class="form-dot ${c}"></div>`;
            }).join('');

            // 2. HEADER INFO: Next Match Link (Clickable)
            let headerNextMatch = '<span class="tm-next-empty">KEIN MATCH GEPLANT</span>';
            
            if (t.next_match) {
                const d = new Date(t.next_match.date);
                const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' });
                const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                
                // Logic: Entire block is a link
                headerNextMatch = `
                    <a href="${t.next_match.link}" target="_blank" class="tm-next-link" title="Zum Matchroom">
                        <span class="next-label">NÄCHSTES MATCH</span>
                        <div class="next-details">
                            <span class="accent">VS ${escapeHTML(t.next_match.tag)}</span>
                            <span class="next-time">// ${dateStr} ${timeStr}</span>
                        </div>
                    </a>`;
            }

            // 3. BODY INFO: Last Match Detail
            let lastMatchHTML = '<div class="last-match-box dimmed">KEINE DATEN</div>';
            if (t.last_match) {
                const ld = new Date(t.last_match.date);
                const lDate = ld.toLocaleDateString('de-DE', { day: '2-digit', month:'2-digit' });
                const resClass = t.last_match.result === 'SIEG' ? 'text-win' : (t.last_match.result === 'NIEDERLAGE' ? 'text-loss' : 'text-draw');
                
                lastMatchHTML = `
                    <div class="last-match-box">
                        <div class="lm-header">LETZTES ERGEBNIS // ${lDate}</div>
                        <div class="lm-content">
                            <span class="lm-vs">VS ${escapeHTML(t.last_match.enemy)}</span>
                            <span class="lm-score ${resClass}">${t.last_match.score}</span>
                            <span class="lm-result ${resClass}">${t.last_match.result}</span>
                        </div>
                    </div>`;
            }

            // 4. Roster
            const rosterHTML = t.roster.length > 0 ? t.roster.map(p => 
                `<div class="mini-chip ${p.is_captain ? 'captain' : ''}">${escapeHTML(p.summoner)}</div>`
            ).join('') : '<div class="mini-chip dimmed">ROSTER NICHT VERFÜGBAR</div>';

            // 5. Build HTML
            html += `
            <div class="telemetry-unit" id="unit-${key}">
                
                <div class="telemetry-header" onclick="toggleTelemetry(event, '${key}')">
                    
                    <div class="tm-identity">
                        <div class="tm-logo-wrapper">
                            <img src="${t.logo || 'assets/profile/placeholder.png'}" class="tm-logo" alt="">
                        </div>
                        <div class="tm-info">
                            <h4>UIC ${escapeHTML(key.toUpperCase())}</h4>
                            <span class="tm-division">${escapeHTML(t.meta.div)}</span>
                        </div>
                    </div>

                    <div class="tm-section tm-next-match mobile-hidden">
                        ${headerNextMatch}
                    </div>

                    <div class="tm-section tm-form mobile-hidden" title="Aktuelle Form">
                        ${formHTML}
                    </div>

                    <div class="tm-section tm-stat">
                        <span class="value highlight">${t.stats.points} <span class="label-inline">PKT</span></span>
                    </div>

                    <div class="tm-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                </div>

                <div class="telemetry-body">
                    <div class="tb-content">
                        
                        <div class="tb-col">
                            <h5 class="tb-title">SPIELBERICHT</h5>
                            ${lastMatchHTML}
                            
                            <div class="stats-mini-row">
                                <div class="stat-pill">
                                    <span class="sp-label">BILANZ (MAPS)</span>
                                    <span class="sp-value">${t.stats.wins}W - ${t.stats.losses}L</span>
                                </div>
                                <div class="stat-pill">
                                    <span class="sp-label">WIN RATE</span>
                                    <span class="sp-value text-primary">${t.stats.win_rate}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="tb-col">
                            <div class="tb-header-row">
                                <h5 class="tb-title">AKTIVES ROSTER</h5>
                                <a href="${t.team_link}" target="_blank" class="link-external">PRIME LEAGUE ↗</a>
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

    } catch (e) { console.error("Telemetry Error:", e); }
}

window.toggleTelemetry = function(e, key) {
    // Prevent triggering if clicking the "Next Match" link
    if(e.target.closest('.tm-next-link')) return;

    const unit = document.getElementById(`unit-${key}`);
    document.querySelectorAll('.telemetry-unit.active').forEach(el => {
        if(el !== unit) el.classList.remove('active');
    });
    if(unit) unit.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);