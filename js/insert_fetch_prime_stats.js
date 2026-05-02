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
        if (!response.ok) throw new Error("JSON Missing");
        const data = await response.json();
        
        // 1. Update Global Stats (Defensive check for IDs)
        const sMatches = document.getElementById('stat-matches');
        const sWr = document.getElementById('stat-wr');
        const sPlayers = document.getElementById('stat-players');

        if (data.global) {
            if (sMatches) sMatches.innerText = data.global.matches;
            if (sWr)      sWr.innerText      = data.global.wr + '%';
            if (sPlayers) sPlayers.innerText  = data.global.players;
        }

        // 2. Render Teams
        const teamsOrder = data.config?.teamsOrder || Object.keys(data.teams);
        let html = '';

        teamsOrder.forEach(key => {
            const t = data.teams[key];
            if (!t) return;

            const formHTML = t.stats.form.map(r => `<div class="form-dot ${r === 'W' ? 'win' : 'loss'}"></div>`).join('');
            
            let nextMatchHTML = t.next_match ? `
                <a href="${t.next_match.link}" target="_blank" class="tm-next-link">
                    <span class="next-label">NÄCHSTES MATCH</span>
                    <div class="next-details">
                        <span class="accent">VS ${escapeHTML(t.next_match.tag)}</span>
                        <span class="next-time">// ${new Date(t.next_match.date).toLocaleDateString('de-DE')}</span>
                    </div>
                </a>` : '<span class="tm-next-empty">TBD</span>';

            html += `
            <div class="telemetry-unit" id="unit-${key}">
                <div class="telemetry-header" onclick="toggleTelemetry(event, '${key}')">
                    <div class="tm-identity">
                        <div class="tm-logo-wrapper">
                            <img src="${t.logo || 'assets/placeholder.png'}" class="tm-logo">
                        </div>
                        <div class="tm-info">
                            <h4>UIC ${key.toUpperCase()}</h4>
                            <span class="tm-division">${t.meta.div || 'Division ?'}</span>
                        </div>
                    </div>
                    <div class="tm-section tm-next-match mobile-hidden">${nextMatchHTML}</div>
                    <div class="tm-section tm-form mobile-hidden">${formHTML}</div>
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
                            <h5 class="tb-title">SPIELBERICHT // FEARLESS Bo3</h5>
                            ${t.last_match ? `
                                <div class="last-match-box">
                                    <div class="lm-header">LETZTES ERGEBNIS // ${new Date(t.last_match.date).toLocaleDateString('de-DE')}</div>
                                    <div class="lm-content">
                                        <span class="lm-vs">VS ${escapeHTML(t.last_match.enemy)}</span>
                                        <span class="lm-score ${t.last_match.result === 'SIEG' ? 'text-win' : 'text-loss'}">${t.last_match.score}</span>
                                        <span class="lm-result">${t.last_match.result}</span>
                                    </div>
                                </div>
                            ` : '<div class="last-match-box dimmed">KEINE DATEN</div>'}
                            <div class="stats-mini-row">
                                <div class="stat-pill"><span class="sp-label">MAPS</span><span class="sp-value">${t.stats.wins}W - ${t.stats.losses}L</span></div>
                                <div class="stat-pill"><span class="sp-label">WIN RATE</span><span class="sp-value text-primary">${t.stats.win_rate}%</span></div>
                            </div>
                        </div>
                        <div class="tb-col">
                            <div class="tb-header-row">
                                <h5 class="tb-title">ROSTER</h5>
                                <a href="${t.team_link}" target="_blank" class="link-external">PRIME LEAGUE ↗</a>
                            </div>
                            <div class="roster-strip">
                                ${t.roster.map(p => `<div class="mini-chip ${p.is_captain ? 'captain' : ''}">${escapeHTML(p.summoner)}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    } catch (e) { console.error("Sync Error", e); }
}

window.toggleTelemetry = (e, key) => {
    if(e.target.closest('a')) return;
    const unit = document.getElementById(`unit-${key}`);
    document.querySelectorAll('.telemetry-unit.active').forEach(el => el !== unit && el.classList.remove('active'));
    unit?.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);
