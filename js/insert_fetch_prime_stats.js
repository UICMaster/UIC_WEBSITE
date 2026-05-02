async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        const data = await response.json();
        
        // 1. Update Global Stats
        document.getElementById('stat-matches').innerText = data.global.matches;
        document.getElementById('stat-wr').innerText = data.global.wr + '%';
        document.getElementById('stat-players').innerText = data.global.players;

        // 2. Render Teams in Config Order
        let html = '';
        data.config.teamsOrder.forEach(key => {
            const t = data.teams[key];
            if (!t) return;

            const formHTML = t.stats.form.map(r => `<div class="form-dot ${r === 'W' ? 'win' : 'loss'}"></div>`).join('');
            
            html += `
            <div class="telemetry-unit" id="unit-${key}">
                <div class="telemetry-header" onclick="toggleTelemetry(event, '${key}')">
                    <div class="tm-identity">
                        <img src="${t.logo || 'assets/placeholder.png'}" class="tm-logo">
                        <div class="tm-info">
                            <h4>UIC ${key.toUpperCase()}</h4>
                            <span class="tm-division">${t.meta.div || 'Division ?'}</span>
                        </div>
                    </div>
                    <div class="tm-section mobile-hidden">
                        ${t.next_match ? `<a href="${t.next_match.link}" target="_blank" class="tm-next-link">VS ${t.next_match.tag} // ${new Date(t.next_match.date).toLocaleDateString('de-DE')}</a>` : 'NO MATCH'}
                    </div>
                    <div class="tm-section tm-form mobile-hidden">${formHTML}</div>
                    <div class="tm-section tm-stat">
                        <span class="value highlight">${t.stats.points} <span class="label-inline">PKT</span></span>
                    </div>
                    <div class="tm-arrow">▼</div>
                </div>
                <div class="telemetry-body">
                    <div class="tb-content">
                        <div class="tb-col">
                            <h5 class="tb-title">SPIELBERICHT // FEARLESS Bo3</h5>
                            ${t.last_match ? `
                                <div class="last-match-box">
                                    <span class="lm-vs">VS ${t.last_match.enemy}</span>
                                    <span class="lm-score ${t.last_match.result === 'SIEG' ? 'text-win' : 'text-loss'}">${t.last_match.score}</span>
                                    <span class="lm-result">${t.last_match.result}</span>
                                </div>
                            ` : 'KEINE DATEN'}
                        </div>
                        <div class="tb-col">
                            <div class="tb-header-row">
                                <h5 class="tb-title">ROSTER</h5>
                                <a href="${t.team_link}" target="_blank" class="link-external">PRIME LEAGUE ↗</a>
                            </div>
                            <div class="roster-strip">
                                ${t.roster.map(p => `<div class="mini-chip ${p.is_captain ? 'captain' : ''}">${p.summoner}</div>`).join('')}
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
